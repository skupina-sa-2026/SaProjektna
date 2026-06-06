package com.example.mobiapp

import android.content.Context
import org.json.JSONArray

class HistoryRepository(context: Context) {

    private val preferences = context.getSharedPreferences("opening_history", Context.MODE_PRIVATE)

    fun loadHistory(): List<HistoryEntry> {
        val raw = preferences.getString(KEY_HISTORY, null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    add(HistoryEntry.fromJson(array.getJSONObject(i)))
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun saveHistory(history: List<HistoryEntry>) {
        val array = JSONArray()
        history.take(MAX_LOCAL_ENTRIES).forEach { entry ->
            array.put(entry.toJson())
        }
        preferences.edit().putString(KEY_HISTORY, array.toString()).apply()
    }

    companion object {
        private const val KEY_HISTORY = "history"
        private const val MAX_LOCAL_ENTRIES = 100
    }
}
