package com.example.mobiapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class QrParserTest {
    @Test
    fun extractBoxIdFromDirect4meLikeUrl() {
        val result = QrParser.extractBoxId("https://example.com/open/000539?token=abc")
        assertEquals(539, result)
    }

    @Test
    fun extractAllowedBoxIdBeforeOtherNumbers() {
        val result = QrParser.extractBoxId("reservation=2026&box=000352")
        assertEquals(352, result)
    }

    @Test
    fun invalidQrReturnsNull() {
        val result = QrParser.extractBoxId("brez stevilk")
        assertNull(result)
    }
}
