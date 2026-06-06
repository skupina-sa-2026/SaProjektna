package com.example.mobiapp

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore

class FirebaseHistoryRepository(private val context: Context) {

    private fun database(): FirebaseFirestore? {
        return try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
            }
            FirebaseFirestore.getInstance()
        } catch (_: Exception) {
            null
        }
    }

    fun saveOpening(entry: HistoryEntry) {
        val db = database() ?: return
        db.collection("openingHistory")
            .document(entry.id)
            .set(entry.toFirebaseMap())
    }
}
