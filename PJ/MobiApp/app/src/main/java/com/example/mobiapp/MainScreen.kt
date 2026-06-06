package com.example.mobiapp

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

private val Background = Color(0xFFF8FAFC)
private val SurfaceWhite = Color(0xFFFFFFFF)
private val Border = Color(0xFFE2E8F0)
private val TextPrimary = Color(0xFF0F172A)
private val TextSecondary = Color(0xFF64748B)
private val Accent = Color(0xFF2563EB)
private val AccentDark = Color(0xFF1D4ED8)
private val AccentSoft = Color(0xFFEFF6FF)
private val Success = Color(0xFF059669)
private val SuccessSoft = Color(0xFFECFDF5)
private val Error = Color(0xFFDC2626)
private val ErrorSoft = Color(0xFFFEF2F2)
private val Warning = Color(0xFFD97706)
private val WarningSoft = Color(0xFFFFFBEB)

@Composable
fun MainScreen(
    viewModel: MainViewModel = viewModel(),
    onScanClick: () -> Unit
) {
    val status by viewModel.status.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val history by viewModel.history.collectAsStateWithLifecycle()
    val stats by viewModel.stats.collectAsStateWithLifecycle()
    val pendingOpening by viewModel.pendingOpening.collectAsStateWithLifecycle()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Background
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Header()
            }

            item {
                ActionCard(
                    isLoading = isLoading,
                    status = status,
                    pendingOpening = pendingOpening,
                    onScanClick = onScanClick,
                    onTestClick = { viewModel.openBox(352, 2) },
                    onConfirmOpening = { success -> viewModel.confirmOpening(success) }
                )
            }

            item {
                StatsSection(stats)
            }

            item {
                SectionTitle(
                    title = "Zgodovina odpiranj",
                    subtitle = "Zadnji poskusi z ročno potrjenim rezultatom."
                )
            }

            if (history.isEmpty()) {
                item {
                    EmptyHistory()
                }
            } else {
                items(history, key = { it.id }) { entry ->
                    HistoryItem(entry)
                }
                item {
                    OutlinedButton(
                        onClick = { viewModel.clearHistory() },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        border = BorderStroke(1.dp, Border)
                    ) {
                        Text("Počisti lokalno zgodovino")
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
private fun Header() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceWhite, RoundedCornerShape(8.dp))
            .border(1.dp, Border, RoundedCornerShape(8.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .width(44.dp)
                .height(4.dp)
                .background(Accent, RoundedCornerShape(999.dp))
        )
        Text(
            text = "Pametni paketnik",
            color = TextPrimary,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Direct4me odpiranje, zgodovina, statistika in lokacija prevzema.",
            color = TextSecondary,
            fontSize = 14.sp,
            lineHeight = 20.sp
        )
    }
}

@Composable
private fun ActionCard(
    isLoading: Boolean,
    status: String,
    pendingOpening: PendingOpening?,
    onScanClick: () -> Unit,
    onTestClick: () -> Unit,
    onConfirmOpening: (Boolean) -> Unit
) {
    val canStartOpening = !isLoading && pendingOpening == null

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Border)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Odpiranje paketnika",
                color = TextPrimary,
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Skeniraj QR kodo paketnika, predvajaj zvočni žeton in nato potrdi rezultat.",
                color = TextSecondary,
                fontSize = 14.sp,
                lineHeight = 20.sp
            )

            Button(
                onClick = onScanClick,
                enabled = canStartOpening,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Accent),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Skeniraj QR kodo", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            }

            OutlinedButton(
                onClick = onTestClick,
                enabled = canStartOpening,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, Border),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary)
            ) {
                Text("Testno odpri paketnik #352")
            }

            if (pendingOpening != null) {
                ConfirmationPanel(
                    pendingOpening = pendingOpening,
                    onConfirmOpening = onConfirmOpening
                )
            }

            StatusBox(isLoading = isLoading, status = status)
        }
    }
}

@Composable
private fun ConfirmationPanel(
    pendingOpening: PendingOpening,
    onConfirmOpening: (Boolean) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(WarningSoft, RoundedCornerShape(8.dp))
            .border(1.dp, Warning.copy(alpha = 0.28f), RoundedCornerShape(8.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Ali se je paketnik #${pendingOpening.boxId} uspešno odprl?",
            color = TextPrimary,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold
        )
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(
                onClick = { onConfirmOpening(true) },
                modifier = Modifier
                    .weight(1f)
                    .height(46.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Success),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Da", fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = { onConfirmOpening(false) },
                modifier = Modifier
                    .weight(1f)
                    .height(46.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Error),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Ne", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun StatusBox(isLoading: Boolean, status: String) {
    val statusColor = when {
        status.contains("Napaka", ignoreCase = true) ||
                status.contains("ni uspelo", ignoreCase = true) ||
                status.contains("se ni odprl", ignoreCase = true) -> Error
        status.contains("Potrjeno", ignoreCase = true) ||
                status.contains("odprt", ignoreCase = true) -> Success
        else -> Accent
    }
    val statusBackground = when (statusColor) {
        Success -> SuccessSoft
        Error -> ErrorSoft
        else -> AccentSoft
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(statusBackground, RoundedCornerShape(8.dp))
            .border(1.dp, Border, RoundedCornerShape(8.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                strokeWidth = 2.5.dp,
                color = AccentDark
            )
        } else {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(statusColor, RoundedCornerShape(3.dp))
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = status,
            color = TextPrimary,
            fontSize = 14.sp,
            lineHeight = 19.sp
        )
    }
}

@Composable
private fun StatsSection(stats: HistoryStats) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionTitle(
            title = "Statistika",
            subtitle = "Pregled potrjenih odpiranj."
        )
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard("Skupaj", stats.total.toString(), Modifier.weight(1f))
            StatCard("Uspešno", stats.successful.toString(), Modifier.weight(1f), Success)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard("Neuspešno", stats.failed.toString(), Modifier.weight(1f), Error)
            StatCard("Uspešnost", "${stats.successRate}%", Modifier.weight(1f), AccentDark)
        }
    }
}

@Composable
private fun StatCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: Color = TextPrimary
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Border)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(label, color = TextSecondary, fontSize = 13.sp)
            Text(value, color = valueColor, fontSize = 26.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SectionTitle(title: String, subtitle: String) {
    Column(
        modifier = Modifier.padding(top = 2.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(title, color = TextPrimary, fontSize = 19.sp, fontWeight = FontWeight.Bold)
        Text(subtitle, color = TextSecondary, fontSize = 13.sp, lineHeight = 18.sp)
    }
}

@Composable
private fun EmptyHistory() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Border)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text("Ni še zapisov", color = TextPrimary, fontWeight = FontWeight.SemiBold)
            Text(
                "Ko odpreš paketnik, se bo tukaj prikazal zapis z datumom, uspehom in lokacijo.",
                color = TextSecondary,
                fontSize = 14.sp
            )
        }
    }
}

@Composable
fun HistoryItem(entry: HistoryEntry) {
    val statusColor = if (entry.success) Success else Error
    val statusText = if (entry.success) "ODPRTO" else "NI ODPRTO"
    val statusBackground = if (entry.success) SuccessSoft else ErrorSoft

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(8.dp),
        border = BorderStroke(1.dp, Border)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(statusColor, CircleShape)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Paketnik #${entry.boxId}",
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(entry.timestamp, color = TextSecondary, fontSize = 12.sp)
                }
                Box(
                    modifier = Modifier
                        .background(statusBackground, RoundedCornerShape(4.dp))
                        .border(1.dp, statusColor.copy(alpha = 0.18f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = statusText,
                        color = statusColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Divider(color = Border)

            Text(
                text = "tokenFormat: ${entry.tokenFormat}",
                color = TextSecondary,
                fontSize = 13.sp
            )

            if (entry.hasLocation()) {
                val locationText = entry.locationName.ifBlank { "Lokacija zabeležena" }
                Text(
                    text = "Lokacija: $locationText",
                    color = TextSecondary,
                    fontSize = 13.sp
                )
            } else {
                Text(
                    text = "Lokacija ni bila zabeležena. Dovoli lokacijo pri skeniranju.",
                    color = TextSecondary,
                    fontSize = 13.sp
                )
            }

            if (entry.message.isNotBlank()) {
                Text(
                    text = entry.message,
                    color = TextSecondary,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            }
        }
    }
}
