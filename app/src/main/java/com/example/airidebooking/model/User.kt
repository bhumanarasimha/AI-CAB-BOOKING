package com.example.airidebooking.model

import org.json.JSONObject

/**
 * Data model representing the authenticated user.
 */
data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val role: String = "rider"
) {
    companion object {
        /**
         * Safely parse a User from a PHP JSON response.
         * Handles both nested ("user": {...}) and flat root-level JSON representations.
         */
        fun fromJson(json: JSONObject): User {
            val userObj = json.optJSONObject("user") ?: json
            return User(
                id = userObj.optString("id", json.optString("id", "")),
                name = userObj.optString("name", json.optString("name", "")),
                email = userObj.optString("email", json.optString("email", "")),
                phone = userObj.optString("phone", json.optString("phone", "")),
                role = userObj.optString("role", json.optString("role", "rider"))
            )
        }
    }
}
