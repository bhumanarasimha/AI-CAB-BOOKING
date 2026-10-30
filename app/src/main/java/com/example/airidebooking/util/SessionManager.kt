package com.example.airidebooking.util

import android.content.Context
import android.content.SharedPreferences
import com.example.airidebooking.model.User

/**
 * Manages user session state and authentication tokens using SharedPreferences.
 * Ensures consistent key usage and prevents stale user data leakage between sessions.
 */
class SessionManager(context: Context) {

    companion object {
        private const val PREF_NAME = "smartride_user_session"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_PHONE = "user_phone"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_AUTH_TOKEN = "auth_token"
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    /**
     * Saves the authenticated user's session data.
     * Always called on successful login or registration to overwrite any prior data.
     */
    fun saveUserSession(user: User, token: String) {
        val editor = prefs.edit()
        editor.putBoolean(KEY_IS_LOGGED_IN, true)
        editor.putString(KEY_USER_ID, user.id)
        editor.putString(KEY_USER_NAME, user.name)
        editor.putString(KEY_USER_EMAIL, user.email)
        editor.putString(KEY_USER_PHONE, user.phone)
        editor.putString(KEY_USER_ROLE, user.role)
        editor.putString(KEY_AUTH_TOKEN, token)
        editor.apply()
    }

    /**
     * Checks whether a valid user session is currently active.
     */
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false) && !getUserEmail().isNullOrEmpty()
    }

    /**
     * Returns the currently authenticated User model.
     */
    fun getUser(): User {
        return User(
            id = prefs.getString(KEY_USER_ID, "") ?: "",
            name = prefs.getString(KEY_USER_NAME, "") ?: "",
            email = prefs.getString(KEY_USER_EMAIL, "") ?: "",
            phone = prefs.getString(KEY_USER_PHONE, "") ?: "",
            role = prefs.getString(KEY_USER_ROLE, "rider") ?: "rider"
        )
    }

    fun getUserName(): String {
        return prefs.getString(KEY_USER_NAME, "") ?: ""
    }

    fun getUserEmail(): String {
        return prefs.getString(KEY_USER_EMAIL, "") ?: ""
    }

    fun getAuthToken(): String {
        return prefs.getString(KEY_AUTH_TOKEN, "") ?: ""
    }

    /**
     * Clears user-specific session data during logout.
     * Prevents old user details from being displayed when a new or different user signs in.
     */
    fun logout() {
        val editor = prefs.edit()
        editor.clear()
        editor.apply()
    }
}
