package com.example.airidebooking.ui

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.airidebooking.model.User
import com.example.airidebooking.util.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class LoginActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private var etEmail: EditText? = null
    private var etPassword: EditText? = null
    private var btnLogin: Button? = null
    private var tvRegister: TextView? = null
    private var tvError: TextView? = null
    private var progressBar: ProgressBar? = null

    // Base URL for PHP API backend (10.0.2.2 maps to host localhost in Android Emulator)
    private val loginApiUrl = "http://10.0.2.2:5000/Backend/php/login.php"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)

        // If already logged in with valid session, navigate directly to Dashboard
        if (sessionManager.isLoggedIn()) {
            navigateToDashboard()
            return
        }

        setupViews()

        // Prefill email if coming from successful registration
        intent.getStringExtra("registered_email")?.let { registeredEmail ->
            etEmail?.setText(registeredEmail)
            etPassword?.requestFocus()
        }
    }

    private fun setupViews() {
        val layoutResId = resources.getIdentifier("activity_login", "layout", packageName)
        if (layoutResId != 0) {
            setContentView(layoutResId)
            val emailId = resources.getIdentifier("etEmail", "id", packageName)
            val passId = resources.getIdentifier("etPassword", "id", packageName)
            val btnId = resources.getIdentifier("btnLogin", "id", packageName)
            val regId = resources.getIdentifier("tvRegister", "id", packageName)
            val errId = resources.getIdentifier("tvError", "id", packageName)
            val progId = resources.getIdentifier("progressBar", "id", packageName)

            if (emailId != 0) etEmail = findViewById(emailId)
            if (passId != 0) etPassword = findViewById(passId)
            if (btnId != 0) btnLogin = findViewById(btnId)
            if (regId != 0) tvRegister = findViewById(regId)
            if (errId != 0) tvError = findViewById(errId)
            if (progId != 0) progressBar = findViewById(progId)

            btnLogin?.setOnClickListener { attemptLogin() }
            tvRegister?.setOnClickListener {
                startActivity(Intent(this, RegisterActivity::class.java))
            }
        }
    }

    fun attemptLogin() {
        val rawEmail = etEmail?.text?.toString()?.trim() ?: ""
        val password = etPassword?.text?.toString()?.trim() ?: ""

        if (rawEmail.isEmpty() || password.isEmpty()) {
            showError("Please enter both email and password.")
            return
        }

        val email = rawEmail.lowercase()

        hideError()
        showLoading(true)

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(loginApiUrl)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                    setRequestProperty("Accept", "application/json")
                    doOutput = true
                    doInput = true
                    connectTimeout = 10000
                    readTimeout = 10000
                }

                val jsonBody = JSONObject().apply {
                    put("email", email)
                    put("password", password)
                }

                OutputStreamWriter(conn.outputStream, "UTF-8").use { writer ->
                    writer.write(jsonBody.toString())
                    writer.flush()
                }

                val responseCode = conn.responseCode
                val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
                val responseText = stream?.let {
                    BufferedReader(InputStreamReader(it, "UTF-8")).use { reader -> reader.readText() }
                } ?: ""

                withContext(Dispatchers.Main) {
                    showLoading(false)
                    if (responseCode in 200..299) {
                        parseLoginResponse(responseText, email)
                    } else {
                        val errorJson = runCatching { JSONObject(responseText) }.getOrNull()
                        val msg = errorJson?.optString("msg", errorJson.optString("message", "Login failed ($responseCode)")) ?: "Login failed ($responseCode)"
                        showError(msg)
                    }
                }
            } catch (e: Exception) {
                Log.e("LoginActivity", "Login error", e)
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    showError("Network error: ${e.localizedMessage}")
                }
            }
        }
    }

    /**
     * Parses the PHP response, extracting the authentic database name.
     * Checks both top-level and nested "user" object to ensure robust compatibility.
     */
    fun parseLoginResponse(jsonString: String, loginEmail: String) {
        try {
            val responseObj = JSONObject(jsonString)

            // Extract user object if nested, otherwise fallback to root object
            val userObj = responseObj.optJSONObject("user") ?: responseObj

            // 1. Correctly extract the actual user name from the database response
            val name = when {
                userObj.has("name") && !userObj.isNull("name") -> userObj.getString("name").trim()
                responseObj.has("name") && !responseObj.isNull("name") -> responseObj.getString("name").trim()
                userObj.has("username") && !userObj.isNull("username") -> userObj.getString("username").trim()
                else -> ""
            }

            val email = when {
                userObj.has("email") && !userObj.isNull("email") -> userObj.getString("email").trim()
                responseObj.has("email") && !responseObj.isNull("email") -> responseObj.getString("email").trim()
                else -> loginEmail
            }

            val id = when {
                userObj.has("id") && !userObj.isNull("id") -> userObj.getString("id")
                responseObj.has("id") && !responseObj.isNull("id") -> responseObj.getString("id")
                else -> ""
            }

            val phone = userObj.optString("phone", responseObj.optString("phone", ""))
            val role = userObj.optString("role", responseObj.optString("role", "rider"))
            val token = responseObj.optString("token", id)

            // 2. Build fresh User model with authentic DB details
            val authenticatedUser = User(
                id = id,
                name = name,
                email = email,
                phone = phone,
                role = role
            )

            // 3. Save directly to SessionManager (overwriting any previous user data completely)
            sessionManager.saveUserSession(authenticatedUser, token)

            // 4. Navigate to Dashboard
            Toast.makeText(this, "Welcome, ${authenticatedUser.name.ifBlank { "Rider" }}!", Toast.LENGTH_SHORT).show()
            navigateToDashboard()

        } catch (e: Exception) {
            Log.e("LoginActivity", "Failed to parse login response", e)
            showError("Failed to parse server response.")
        }
    }

    private fun navigateToDashboard() {
        val intent = Intent(this, DashboardActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    private fun showError(msg: String) {
        tvError?.let {
            it.text = msg
            it.visibility = View.VISIBLE
        } ?: Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
    }

    private fun hideError() {
        tvError?.visibility = View.GONE
    }

    private fun showLoading(loading: Boolean) {
        progressBar?.visibility = if (loading) View.VISIBLE else View.GONE
        btnLogin?.isEnabled = !loading
    }
}
