package com.example.mobiapp

import org.json.JSONObject
import java.util.UUID

data class HistoryEntry(
    val id: String = UUID.randomUUID().toString(),
    val boxId: Int,
    val timestamp: String,
    val success: Boolean,
    val tokenFormat: Int,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val locationName: String = "",
    val message: String = ""
) {
    fun hasLocation(): Boolean = latitude != null && longitude != null

    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("boxId", boxId)
            put("timestamp", timestamp)
            put("success", success)
            put("tokenFormat", tokenFormat)
            put("latitude", latitude)
            put("longitude", longitude)
            put("locationName", locationName)
            put("message", message)
        }
    }

    fun toFirebaseMap(): Map<String, Any?> {
        return mapOf(
            "id" to id,
            "boxId" to boxId,
            "timestamp" to timestamp,
            "success" to success,
            "tokenFormat" to tokenFormat,
            "latitude" to latitude,
            "longitude" to longitude,
            "locationName" to locationName,
            "message" to message
        )
    }

    companion object {
        fun fromJson(json: JSONObject): HistoryEntry {
            return HistoryEntry(
                id = json.optString("id", UUID.randomUUID().toString()),
                boxId = json.optInt("boxId"),
                timestamp = json.optString("timestamp"),
                success = json.optBoolean("success"),
                tokenFormat = json.optInt("tokenFormat", 6),
                latitude = if (json.isNull("latitude")) null else json.optDouble("latitude"),
                longitude = if (json.isNull("longitude")) null else json.optDouble("longitude"),
                locationName = json.optString("locationName", ""),
                message = json.optString("message", "")
            )
        }
    }
}

data class HistoryStats(
    val total: Int,
    val successful: Int,
    val failed: Int,
    val withLocation: Int,
    val uniqueBoxes: Int
) {
    val successRate: Int
        get() = if (total == 0) 0 else ((successful.toDouble() / total.toDouble()) * 100).toInt()
}
