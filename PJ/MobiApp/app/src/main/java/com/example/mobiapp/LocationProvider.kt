package com.example.mobiapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import androidx.core.content.ContextCompat
import java.util.Locale

data class LocationInfo(
    val latitude: Double,
    val longitude: Double,
    val locationName: String
)

object LocationProvider {

    fun getLastKnownLocation(context: Context): LocationInfo? {
        val fineGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val coarseGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!fineGranted && !coarseGranted) return null

        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)

        val location = providers
            .mapNotNull { provider -> getLocationSafely(manager, provider) }
            .maxByOrNull { it.time }
            ?: return null

        return LocationInfo(
            latitude = location.latitude,
            longitude = location.longitude,
            locationName = resolveLocationName(context, location)
        )
    }

    private fun resolveLocationName(context: Context, location: Location): String {
        return try {
            val geocoder = Geocoder(context, Locale.getDefault())
            val address = geocoder.getFromLocation(location.latitude, location.longitude, 1)
                ?.firstOrNull()
                ?: return "Lokacija zabeležena"

            val city = address.locality
                ?: address.subAdminArea
                ?: address.adminArea

            val country = address.countryName

            when {
                !city.isNullOrBlank() && !country.isNullOrBlank() -> "$city, $country"
                !city.isNullOrBlank() -> city
                !country.isNullOrBlank() -> country
                !address.featureName.isNullOrBlank() -> address.featureName
                else -> "Lokacija zabeležena"
            }
        } catch (_: Exception) {
            "Lokacija zabeležena"
        }
    }

    private fun getLocationSafely(manager: LocationManager, provider: String): Location? {
        return try {
            if (manager.isProviderEnabled(provider)) manager.getLastKnownLocation(provider) else null
        } catch (_: SecurityException) {
            null
        } catch (_: Exception) {
            null
        }
    }
}
