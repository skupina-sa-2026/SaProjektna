package com.example.mobiapp

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.*
import java.util.zip.ZipInputStream

object ApiService {

    private val client = OkHttpClient()
    private const val API_URL = "https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox"
    private const val API_KEY = "9ea96945-3a37-4638-a5d4-22e89fbc998f"

    suspend fun openBox(boxId: Int, tokenFormat: Int = 2): Result<File> {
        return withContext(Dispatchers.IO) {
            try {
                val json = JSONObject().apply {
                    put("boxId", boxId)
                    put("tokenFormat", tokenFormat)
                }

                val body = json.toString()
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url(API_URL)
                    .addHeader("Authorization", "Bearer $API_KEY")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                val responseBody = response.body?.string()
                    ?: return@withContext Result.failure(Exception("Prazen odgovor"))

                val jsonResponse = JSONObject(responseBody)
                val result = jsonResponse.getInt("result")

                if (result != 0) {
                    return@withContext Result.failure(
                        Exception("API napaka: ${jsonResponse.getInt("errorNumber")}")
                    )
                }

                val base64Data = jsonResponse.getString("data")
                val wavFile = decodeTokenToWav(base64Data)
                Result.success(wavFile)

            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    private fun decodeTokenToWav(base64Data: String): File {
        val zipBytes = Base64.decode(base64Data, Base64.DEFAULT)
        val zipInput = ZipInputStream(ByteArrayInputStream(zipBytes))

        var entry = zipInput.nextEntry
        while (entry != null) {
            if (!entry.isDirectory) {
                val wavFile = File.createTempFile("token", ".wav")
                FileOutputStream(wavFile).use { out ->
                    zipInput.copyTo(out)
                }
                zipInput.closeEntry()
                zipInput.close()
                return wavFile
            }
            zipInput.closeEntry()
            entry = zipInput.nextEntry
        }
        zipInput.close()
        throw Exception("Datoteka ni najdena v ZIP-u")
    }
}