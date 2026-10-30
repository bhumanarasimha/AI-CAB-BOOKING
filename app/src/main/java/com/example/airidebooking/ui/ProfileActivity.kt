package com.example.airidebooking.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.airidebooking.model.User
import com.example.airidebooking.util.SessionManager

class ProfileActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private var tvProfileName: TextView? = null
    private var tvProfileEmail: TextView? = null
    private var tvProfilePhone: TextView? = null
    private var btnLogout: Button? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)

        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        setupViews()
        bindProfileData()
    }

    private fun setupViews() {
        val layoutResId = resources.getIdentifier("activity_profile", "layout", packageName)
        if (layoutResId != 0) {
            setContentView(layoutResId)
            val nameId = resources.getIdentifier("tvProfileName", "id", packageName)
            val emailId = resources.getIdentifier("tvProfileEmail", "id", packageName)
            val phoneId = resources.getIdentifier("tvProfilePhone", "id", packageName)
            val logoutId = resources.getIdentifier("btnLogout", "id", packageName)

            if (nameId != 0) tvProfileName = findViewById(nameId)
            if (emailId != 0) tvProfileEmail = findViewById(emailId)
            if (phoneId != 0) tvProfilePhone = findViewById(phoneId)
            if (logoutId != 0) btnLogout = findViewById(logoutId)

            btnLogout?.setOnClickListener {
                performLogout()
            }
        }
    }

    private fun bindProfileData() {
        val user: User = sessionManager.getUser()

        tvProfileName?.text = if (user.name.isNotBlank()) user.name else user.email.substringBefore('@')
        tvProfileEmail?.text = user.email
        tvProfilePhone?.text = if (user.phone.isNotBlank()) user.phone else "Not specified"
    }

    /**
     * Clears user-specific session data and navigates to LoginActivity with a clean task stack.
     */
    private fun performLogout() {
        sessionManager.logout()
        redirectToLogin()
    }

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}
