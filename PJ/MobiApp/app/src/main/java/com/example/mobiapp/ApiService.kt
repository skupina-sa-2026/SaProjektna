package com.example.mobiapp

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit
import java.util.zip.ZipInputStream

object ApiService {

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    private const val API_URL = "https://api-d4me-stage.direct4.me/sandbox/v1/Access/openbox"
    private const val API_KEY = "9ea96945-3a37-4638-a5d4-22e89fbc998f"

    suspend fun openBox(boxId: Int, tokenFormat: Int): Result<File> {
        return withContext(Dispatchers.IO) {
            try {
                val bodyJson = JSONObject().apply {
                    put("boxId", boxId)
                    put("tokenFormat", tokenFormat)
                }

                val body = bodyJson.toString().toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url(API_URL)
                    .addHeader("Authorization", "Bearer $API_KEY")
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string()
                        ?: return@withContext Result.failure(Exception("API je vrnil prazen odgovor."))

                    if (!response.isSuccessful) {
                        return@withContext Result.failure(Exception("HTTP napaka ${response.code}: $responseBody"))
                    }

                    val jsonResponse = JSONObject(responseBody)
                    val result = jsonResponse.optInt("result", -1)
                    val errorNumber = jsonResponse.optInt("errorNumber", -1)

                    if (result != 0) {
                        return@withContext Result.failure(Exception("Direct4me API napaka: $errorNumber"))
                    }

                    val base64Data = jsonResponse.optString("data")
                    if (base64Data.isBlank()) {
                        return@withContext Result.failure(Exception("API ni vrnil zvočnega žetona."))
                    }

                    Result.success(decodeTokenToWav(base64Data))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    private fun decodeTokenToWav(base64Data: String): File {
        val cleanBase64 = base64Data
            .substringAfter(",", base64Data)
            .replace("\n", "")
            .replace("\r", "")
            .replace(" ", "")

        val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)

        if (isWavFile(decodedBytes)) {
            return saveTempWav(decodedBytes)
        }

        if (!isZipFile(decodedBytes)) {
            throw Exception("API je vrnil podatke, ki niso ZIP in niso WAV. Preveri tokenFormat, boxId in API odgovor.")
        }

        val entryNames = mutableListOf<String>()

        ZipInputStream(ByteArrayInputStream(decodedBytes)).use { zipInput ->
            var entry = zipInput.nextEntry
            while (entry != null) {
                if (!entry.isDirectory) {
                    val entryName = entry.name
                    val entryBytes = zipInput.readBytes()
                    entryNames.add(entryName)

                    if (entryName.lowercase().endsWith(".wav") || isWavFile(entryBytes)) {
                        zipInput.closeEntry()
                        return saveTempWav(entryBytes)
                    }
                }

                zipInput.closeEntry()
                entry = zipInput.nextEntry
            }
        }

        val filesText = if (entryNames.isEmpty()) {
            "ZIP je bil prazen."
        } else {
            "Najdene datoteke v ZIP-u: ${entryNames.joinToString(", ")}."
        }

        throw Exception("V odgovoru API-ja ni bilo zvočne WAV datoteke. $filesText Poskusi tokenFormat 2, ker ta običajno vrne zvočni žeton.")
    }

    private fun saveTempWav(bytes: ByteArray): File {
        val wavFile = File.createTempFile("direct4me_token_", ".wav")
        FileOutputStream(wavFile).use { output ->
            output.write(bytes)
        }
        return wavFile
    }

    private fun isZipFile(bytes: ByteArray): Boolean {
        return bytes.size >= 4 &&
                bytes[0] == 'P'.code.toByte() &&
                bytes[1] == 'K'.code.toByte()
    }

    private fun isWavFile(bytes: ByteArray): Boolean {
        return bytes.size >= 12 &&
                bytes[0] == 'R'.code.toByte() &&
                bytes[1] == 'I'.code.toByte() &&
                bytes[2] == 'F'.code.toByte() &&
                bytes[3] == 'F'.code.toByte() &&
                bytes[8] == 'W'.code.toByte() &&
                bytes[9] == 'A'.code.toByte() &&
                bytes[10] == 'V'.code.toByte() &&
                bytes[11] == 'E'.code.toByte()
    }
}
