package com.geocheckr.app

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.model.LatLng

class StreetViewActivity : AppCompatActivity(), OnStreetViewPanoramaReadyCallback {

    private var targetLat = 0.0
    private var targetLng = 0.0
    private val TAG = "GeoCheckrSV"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_street_view)

        targetLat = intent.getDoubleExtra("latitude", 0.0)
        targetLng = intent.getDoubleExtra("longitude", 0.0)
        Log.d(TAG, "onCreate: lat=$targetLat lng=$targetLng")

        // Close button
        findViewById<ImageButton>(R.id.btnClose).setOnClickListener { finish() }

        // Loading text
        val loadingText = findViewById<TextView>(R.id.loadingText)

        // Timeout: if panorama doesn't load in 10s, show error
        Handler(Looper.getMainLooper()).postDelayed({
            if (loadingText?.visibility == TextView.VISIBLE) {
                loadingText.text = "Panorama konnte nicht geladen werden\n(Koordinaten: $targetLat, $targetLng)"
                Log.e(TAG, "Timeout: panorama did not load")
            }
        }, 10000)

        // Load fragment
        try {
            val fragment = SupportStreetViewPanoramaFragment.newInstance()
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commitAllowingStateLoss()

            fragment.getStreetViewPanoramaAsync(this)
            Log.d(TAG, "Fragment initiated OK")
        } catch (e: Exception) {
            Log.e(TAG, "Fragment init failed", e)
            loadingText?.text = "Fehler: ${e.message}"
        }
    }

    override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) {
        Log.d(TAG, "onStreetViewPanoramaReady — setting position")

        val loadingText = findViewById<TextView>(R.id.loadingText)

        try {
            val location = LatLng(targetLat, targetLng)
            panorama.setPosition(location)
            panorama.isStreetNamesEnabled = false
            panorama.isUserNavigationEnabled = true
            panorama.isZoomGesturesEnabled = true
            panorama.isPanningGesturesEnabled = true

            // Hide loading text when panorama is ready
            loadingText?.visibility = TextView.GONE
            Log.d(TAG, "Panorama loaded OK")
        } catch (e: Exception) {
            Log.e(TAG, "setPosition failed", e)
            loadingText?.text = "Position Fehler: ${e.message}"
        }
    }
}
