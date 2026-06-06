package com.example.orvfaceaccess

import android.graphics.Bitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

const val FACE_API_URL = "http://192.168.1.100:8000"

data class FaceVerifyResult(
    val authenticated: Boolean,
    val confidence: Double,
    val reason: String
)

data class BoxAccessResult(
    val allowed: Boolean,
    val reason: String
)

class FaceAuthApi {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend fun enroll(username: String, bitmap: Bitmap): Boolean = withContext(Dispatchers.IO) {
        val json = postImage("/auth/enroll", mapOf("username" to username), bitmap)
        json.optBoolean("success", false)
    }

    suspend fun verify(username: String, bitmap: Bitmap): FaceVerifyResult = withContext(Dispatchers.IO) {
        val json = postImage("/auth/verify", mapOf("username" to username), bitmap)
        FaceVerifyResult(
            authenticated = json.optBoolean("authenticated", false),
            confidence = json.optDouble("confidence", 0.0),
            reason = json.optString("error", json.optString("predicted_user", ""))
        )
    }

    suspend fun checkAccess(username: String, boxId: Int, bitmap: Bitmap): BoxAccessResult = withContext(Dispatchers.IO) {
        val json = postImage("/box/check-access", mapOf("username" to username, "box_id" to boxId.toString()), bitmap)
        BoxAccessResult(
            allowed = json.optBoolean("allowed", false),
            reason = json.optString("reason", "")
        )
    }

    private fun postImage(path: String, fields: Map<String, String>, bitmap: Bitmap): JSONObject {
        val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
        fields.forEach { builder.addFormDataPart(it.key, it.value) }
        builder.addFormDataPart("image", "face.jpg", bitmapToBytes(bitmap).toRequestBody("image/jpeg".toMediaType()))
        val request = Request.Builder().url(FACE_API_URL + path).post(builder.build()).build()
        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: "{}"
            return JSONObject(body)
        }
    }

    private fun bitmapToBytes(bitmap: Bitmap): ByteArray {
        val stream = ByteArrayOutputStream()
        val resized = if (bitmap.width > 900) {
            val ratio = 900f / bitmap.width
            Bitmap.createScaledBitmap(bitmap, 900, (bitmap.height * ratio).toInt(), true)
        } else bitmap
        resized.compress(Bitmap.CompressFormat.JPEG, 88, stream)
        return stream.toByteArray()
    }
}
