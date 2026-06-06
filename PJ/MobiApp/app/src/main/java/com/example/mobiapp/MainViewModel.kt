package com.example.mobiapp

import android.app.Application
import android.media.MediaPlayer
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class PendingOpening(
    val boxId: Int,
    val tokenFormat: Int,
    val location: LocationInfo?,
    val message: String
)

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val localRepository = HistoryRepository(application.applicationContext)
    private val firebaseRepository = FirebaseHistoryRepository(application.applicationContext)

    private val _status = MutableStateFlow("Pripravljeno za skeniranje.")
    val status: StateFlow<String> = _status

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _history = MutableStateFlow(localRepository.loadHistory())
    val history: StateFlow<List<HistoryEntry>> = _history

    private val _stats = MutableStateFlow(calculateStats(_history.value))
    val stats: StateFlow<HistoryStats> = _stats

    private val _pendingOpening = MutableStateFlow<PendingOpening?>(null)
    val pendingOpening: StateFlow<PendingOpening?> = _pendingOpening

    private var isProcessing = false

    fun showError(message: String) {
        _status.value = message
        _isLoading.value = false
        _pendingOpening.value = null
        isProcessing = false
    }

    fun openBox(boxId: Int, tokenFormat: Int = 2) {
        if (isProcessing) return

        isProcessing = true
        _pendingOpening.value = null
        viewModelScope.launch {
            _isLoading.value = true
            _status.value = "Kličem Direct4me API za paketnik #$boxId ..."

            val location = withContext(Dispatchers.IO) {
                LocationProvider.getLastKnownLocation(getApplication<Application>().applicationContext)
            }
            var usedTokenFormat = tokenFormat
            var result = ApiService.openBox(boxId, usedTokenFormat)

            if (result.isFailure && usedTokenFormat != 2) {
                val message = result.exceptionOrNull()?.message.orEmpty()
                if (message.contains("WAV", ignoreCase = true) || message.contains(".wav", ignoreCase = true)) {
                    _status.value = "Format $usedTokenFormat ni vrnil WAV žetona. Poskušam še tokenFormat 2 ..."
                    usedTokenFormat = 2
                    result = ApiService.openBox(boxId, usedTokenFormat)
                }
            }

            result.onSuccess { wavFile ->
                _status.value = "Žeton je prejet. Predvajam zvočni token ..."
                playWav(
                    file = wavFile,
                    onComplete = {
                        _pendingOpening.value = PendingOpening(
                            boxId = boxId,
                            tokenFormat = usedTokenFormat,
                            location = location,
                            message = "API je vrnil zvočni žeton. Rezultat je ročno potrjen."
                        )
                        _status.value = "Preveri paketnik #$boxId in potrdi, ali se je odprl."
                        _isLoading.value = false
                        isProcessing = false
                    },
                    onError = { message ->
                        addToHistory(
                            boxId = boxId,
                            tokenFormat = usedTokenFormat,
                            success = false,
                            location = location,
                            message = message
                        )
                    }
                )
            }.onFailure { error ->
                addToHistory(
                    boxId = boxId,
                    tokenFormat = usedTokenFormat,
                    success = false,
                    location = location,
                    message = error.message ?: "Neznana napaka."
                )
                _status.value = "Odpiranje ni uspelo: ${error.message}"
                _isLoading.value = false
                isProcessing = false
            }
        }
    }

    fun confirmOpening(success: Boolean) {
        val pending = _pendingOpening.value ?: return
        val resultText = if (success) {
            "Paketnik uspešno odprt."
        } else {
            "Paketnik se ni odprl."
        }

        addToHistory(
            boxId = pending.boxId,
            tokenFormat = pending.tokenFormat,
            success = success,
            location = pending.location,
            message = "${pending.message} $resultText"
        )

        _pendingOpening.value = null
        _isLoading.value = false
        isProcessing = false
        _status.value = if (success) {
            "Potrjeno: paketnik #${pending.boxId} je odprt."
        } else {
            "Zabeleženo: paketnik #${pending.boxId} se ni odprl."
        }
    }

    fun clearHistory() {
        _history.value = emptyList()
        localRepository.saveHistory(emptyList())
        _stats.value = calculateStats(emptyList())
        _status.value = "Zgodovina je očiščena."
    }

    private fun playWav(
        file: java.io.File,
        onComplete: () -> Unit,
        onError: (String) -> Unit
    ) {
        try {
            val player = MediaPlayer()
            player.setDataSource(file.absolutePath)
            player.prepare()
            player.setOnCompletionListener {
                it.release()
                file.delete()
                onComplete()
            }
            player.setOnErrorListener { mediaPlayer, _, _ ->
                mediaPlayer.release()
                file.delete()
                val message = "Žetona ni bilo mogoče predvajati."
                onError(message)
                _status.value = message
                _isLoading.value = false
                isProcessing = false
                true
            }
            player.start()
        } catch (e: Exception) {
            file.delete()
            val message = "Napaka pri predvajanju žetona: ${e.message}"
            onError(message)
            _status.value = message
            _isLoading.value = false
            isProcessing = false
        }
    }

    private fun addToHistory(
        boxId: Int,
        tokenFormat: Int,
        success: Boolean,
        location: LocationInfo?,
        message: String
    ) {
        val timestamp = SimpleDateFormat("dd.MM.yyyy HH:mm:ss", Locale.getDefault()).format(Date())
        val entry = HistoryEntry(
            boxId = boxId,
            timestamp = timestamp,
            success = success,
            tokenFormat = tokenFormat,
            latitude = location?.latitude,
            longitude = location?.longitude,
            locationName = location?.locationName.orEmpty(),
            message = message
        )

        val updatedHistory = listOf(entry) + _history.value
        _history.value = updatedHistory
        _stats.value = calculateStats(updatedHistory)
        localRepository.saveHistory(updatedHistory)
        firebaseRepository.saveOpening(entry)
    }

    private fun calculateStats(history: List<HistoryEntry>): HistoryStats {
        return HistoryStats(
            total = history.size,
            successful = history.count { it.success },
            failed = history.count { !it.success },
            withLocation = history.count { it.hasLocation() },
            uniqueBoxes = history.map { it.boxId }.distinct().size
        )
    }
}
