package com.example.mobiapp

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import com.example.mobiapp.ui.theme.MobiAppTheme
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] == true
        if (cameraGranted) {
            startScan()
        } else {
            viewModel.showError("Napaka: za skeniranje QR kode moraš dovoliti uporabo kamere.")
        }
    }

    private val scanLauncher = registerForActivityResult(ScanContract()) { result ->
        val scannedText = result.contents
        if (scannedText.isNullOrBlank()) {
            viewModel.showError("Napaka: QR koda ni bila skenirana.")
            return@registerForActivityResult
        }

        val boxId = extractBoxId(scannedText)

        if (boxId != null) {
            viewModel.openBox(boxId = boxId, tokenFormat = 2)
        } else {
            viewModel.showError("Napaka: QR koda ne vsebuje veljavnega ID-ja paketnika.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MobiAppTheme {
                MainScreen(
                    viewModel = viewModel,
                    onScanClick = { requestScanPermissions() }
                )
            }
        }
    }

    private fun requestScanPermissions() {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }

    private fun startScan() {
        val options = ScanOptions().apply {
            setPrompt("Skeniraj QR kodo paketnika")
            setBeepEnabled(true)
            setOrientationLocked(false)
            setBarcodeImageEnabled(true)
        }
        scanLauncher.launch(options)
    }

    private fun extractBoxId(scannedText: String): Int? {
        val allowedBoxIds = setOf(352, 358, 359, 529, 530, 537, 538, 539, 540, 541, 542)
        val numbers = Regex("\\d+")
            .findAll(scannedText)
            .mapNotNull { match -> match.value.trimStart('0').toIntOrNull() }
            .toList()

        return numbers.firstOrNull { it in allowedBoxIds }
            ?: numbers.firstOrNull { it in 1..999999 }
    }
}
