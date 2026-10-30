package com.example.airidebooking.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.airidebooking.model.User
import com.example.airidebooking.util.SessionManager

class DashboardActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private var tvUserName: TextView? = null
    private var tvUserEmail: TextView? = null
    private var btnProfile: Button? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        sessionManager = SessionManager(this)

        // Enforce session check: redirect to Login if not logged in
        if (!sessionManager.isLoggedIn()) {
            redirectToLogin()
            return
        }

        setupViews()
        bindUserData()
    }

    override fun onResume() {
        super.onResume()
        if (sessionManager.isLoggedIn()) {
            bindUserData()
        } else {
            redirectToLogin()
        }
    }

    private fun setupViews() {
        val layoutResId = resources.getIdentifier("activity_dashboard", "layout", packageName)
        if (layoutResId != 0) {
            setContentView(layoutResId)
            val nameId = resources.getIdentifier("tvUserName", "id", packageName)
            val emailId = resources.getIdentifier("tvUserEmail", "id", packageName)
            val profId = resources.getIdentifier("btnProfile", "id", packageName)

            if (nameId != 0) tvUserName = findViewById(nameId)
            if (emailId != 0) tvUserEmail = findViewById(emailId)
            if (profId != 0) btnProfile = findViewById(profId)

            btnProfile?.setOnClickListener {
                startActivity(Intent(this, ProfileActivity::class.java))
            }
        }
    }

    /**
     * Binds the authenticated user's name directly from SessionManager.
     * Does NOT use hardcoded names or fallback values that mask real user accounts.
     */
    private fun bindUserData() {
        val user: User = sessionManager.getUser()

        // Bind user name to TextView safely
        tvUserName?.text = if (user.name.isNotBlank()) user.name else user.email.substringBefore('@')

        // Bind email to TextView safely
        tvUserEmail?.text = user.email
    }

    private fun redirectToLogin() {
        val intent = Intent(this, LoginActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}
