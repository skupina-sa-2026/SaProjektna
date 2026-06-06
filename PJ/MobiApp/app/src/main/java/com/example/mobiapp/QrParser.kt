package com.example.mobiapp

object QrParser {
    private val allowedBoxIds = setOf(352, 358, 359, 529, 530, 537, 538, 539, 540, 541, 542)

    fun extractBoxId(scannedText: String): Int? {
        val numbers = Regex("\\d+")
            .findAll(scannedText)
            .mapNotNull { match -> match.value.trimStart('0').ifBlank { "0" }.toIntOrNull() }
            .toList()

        return numbers.firstOrNull { it in allowedBoxIds }
            ?: numbers.firstOrNull { it in 1..999999 }
    }
}
