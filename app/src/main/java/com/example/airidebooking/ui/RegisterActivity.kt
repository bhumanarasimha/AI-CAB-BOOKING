package com.example.airidebooking.ui

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.util.Patterns
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
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

class RegisterActivity : AppCompatActivity() {

    private var etName: EditText? = null
    private var etEmail: EditText? = null
    private var etPassword: EditText? = null
    private var etPhone: EditText? = null
    private var btnRegister: Button? = null
    private var tvLogin: TextView? = null
    private var tvError: TextView? = null
    private var progressBar: ProgressBar? = null

    // Base URL for PHP API backend (10.0.2.2 maps to host localhost in Android Emulator)
    private val registerApiUrl = "http://10.0.2.2:5000/Backend/php/register.php"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setupViews()
    }

    private fun setupViews() {
        val layoutResId = resources.getIdentifier("activity_register", "layout", packageName)
        if (layoutResId != 0) {
            setContentView(layoutResId)
            val nameId = resources.getIdentifier("etName", "id", packageName)
            val emailId = resources.getIdentifier("etEmail", "id", packageName)
            val passId = resources.getIdentifier("etPassword", "id", packageName)
            val phoneId = resources.getIdentifier("etPhone", "id", packageName)
            val btnId = resources.getIdentifier("btnRegister", "id", packageName)
            val loginId = resources.getIdentifier("tvLogin", "id", packageName)
            val errId = resources.getIdentifier("tvError", "id", packageName)
            val progId = resources.getIdentifier("progressBar", "id", packageName)

            if (nameId != 0) etName = findViewById(nameId)
            if (emailId != 0) etEmail = findViewById(emailId)
            if (passId != 0) etPassword = findViewById(passId)
            if (phoneId != 0) etPhone = findViewById(phoneId)
            if (btnId != 0) btnRegister = findViewById(btnId)
            if (loginId != 0) tvLogin = findViewById(loginId)
            if (errId != 0) tvError = findViewById(errId)
            if (progId != 0) progressBar = findViewById(progId)

            btnRegister?.setOnClickListener { attemptRegister() }
            tvLogin?.setOnClickListener { finish() }
        }
    }

    fun attemptRegister() {
        val name = etName?.text?.toString()?.trim() ?: ""
        val rawEmail = etEmail?.text?.toString()?.trim() ?: ""
        val password = etPassword?.text?.toString()?.trim() ?: ""
        val phone = etPhone?.text?.toString()?.trim() ?: ""

        // 1. Validate fields
        if (name.isEmpty() || rawEmail.isEmpty() || password.isEmpty()) {
            showError("Valid Name, Email, and Password are required.")
            return
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(rawEmail).matches()) {
            showError("Please enter a valid email address")
            return
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters long.")
            return
        }

        // 2. Prevent concurrent / duplicate submissions
        hideError()
        showLoading(true)

        val email = rawEmail.lowercase()

        // 3. Execute network registration call in Coroutine IO
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL(registerApiUrl)
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
                    put("name", name)
                    put("email", email)
                    put("password", password)
                    put("phone", phone)
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
                    handleRegisterResponse(responseCode, responseText, name, email)
                }
            } catch (e: Exception) {
                Log.e("RegisterActivity", "Network error during registration", e)
                withContext(Dispatchers.Main) {
                    showLoading(false)
                    showError("Network error: ${e.localizedMessage}")
                }
            }
        }
    }

    private fun handleRegisterResponse(statusCode: Int, responseText: String, registeredName: String, registeredEmail: String) {
        val json = runCatching { JSONObject(responseText) }.getOrNull()

        when (statusCode) {
            201, 200 -> {
                // Success: Navigate to Login screen only after successful registration
                Toast.makeText(this, "Registration successful! Please log in.", Toast.LENGTH_LONG).show()
                val intent = Intent(this, LoginActivity::class.java).apply {
                    putExtra("registered_email", registeredEmail)
                    putExtra("registered_name", registeredName)
                }
                startActivity(intent)
                finish()
            }
            409 -> {
                // Duplicate email error: Do NOT navigate to login
                val message = json?.optString("msg", json.optString("message", "Email is already registered")) ?: "Email is already registered"
                showError(message)
            }
            400 -> {
                // Validation error: Do NOT navigate to login
                val message = json?.optString("msg", json.optString("message", "Please enter a valid email address")) ?: "Please enter a valid email address"
                showError(message)
            }
            else -> {
                // Other server failure: Do NOT navigate to login
                val message = json?.optString("msg", json.optString("message", "Registration failed ($statusCode)")) ?: "Registration failed ($statusCode)"
                showError(message)
            }
        }
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
        btnRegister?.isEnabled = !loading
    }
}
