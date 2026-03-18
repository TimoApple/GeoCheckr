package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.widget.ImageButton
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.ConnectionResult

class StreetViewActivity : AppCompatActivity(), OnStreetViewPanoramaReadyCallback {

    private var targetLat = 0.0
    private var targetLng = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check Google Play Services availability
        val availability = GoogleApiAvailability.getInstance()
        val result = availability.isGooglePlayServicesAvailable(this)
        if (result != ConnectionResult.SUCCESS) {
            Log.e("GeoCheckr", "Google Play Services not available: $result")
            Toast.makeText(this, "Google Play Services erforderlich für Street View", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        try {
            setContentView(R.layout.activity_street_view)

            // Get coordinates from intent
            targetLat = intent.getDoubleExtra("latitude", 0.0)
            targetLng = intent.getDoubleExtra("longitude", 0.0)

            if (targetLat == 0.0 && targetLng == 0.0) {
                Log.e("GeoCheckr", "Invalid coordinates: $targetLat, $targetLng")
                finish()
                return
            }

            // Find fragment and request panorama async
            val streetViewFragment = supportFragmentManager
                .findFragmentById(R.id.streetviewpanorama) as? SupportStreetViewPanoramaFragment
            if (streetViewFragment == null) {
                Log.e("GeoCheckr", "StreetView fragment not found")
                finish()
                return
            }
            streetViewFragment.getStreetViewPanoramaAsync(this)

            // Close button
            findViewById<ImageButton>(R.id.btnClose)?.setOnClickListener {
                finish()
            }
        } catch (e: Exception) {
            Log.e("GeoCheckr", "StreetViewActivity onCreate failed", e)
            Toast.makeText(this, "Street View konnte nicht geladen werden", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) {
        try {
            val location = LatLng(targetLat, targetLng)

            panorama.apply {
                setPosition(location)
                isStreetNamesEnabled = false
                isUserNavigationEnabled = true
                isZoomGesturesEnabled = true
                isPanningGesturesEnabled = true
            }
        } catch (e: Exception) {
            Log.e("GeoCheckr", "Failed to set panorama position", e)
        }
    }
}
