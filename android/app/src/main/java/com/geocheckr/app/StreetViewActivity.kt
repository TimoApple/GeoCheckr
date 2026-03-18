package com.geocheckr.app

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera

class StreetViewActivity : AppCompatActivity(), OnStreetViewPanoramaReadyCallback {

    private var targetLat = 0.0
    private var targetLng = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_street_view)

        targetLat = intent.getDoubleExtra("latitude", 0.0)
        targetLng = intent.getDoubleExtra("longitude", 0.0)

        findViewById<ImageButton>(R.id.btnClose).setOnClickListener { finish() }

        val loadingText = findViewById<TextView>(R.id.loadingText)

        // Initialize Maps SDK explicitly
        try {
            MapsInitializer.initialize(applicationContext, MapsInitializer.Renderer.LATEST) { result ->
                Log.d("GeoCheckr", "MapsInitializer result: $result")
            }
        } catch (e: Exception) {
            Log.e("GeoCheckr", "MapsInitializer failed", e)
        }

        // Timeout
        Handler(Looper.getMainLooper()).postDelayed({
            loadingText?.text = "Timeout: $targetLat, $targetLng"
        }, 10000)

        // Load fragment
        try {
            val fragment = SupportStreetViewPanoramaFragment.newInstance()
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commitNowAllowingStateLoss()

            fragment.getStreetViewPanoramaAsync(this)
            Log.d("GeoCheckr", "Fragment OK")
        } catch (e: Exception) {
            Log.e("GeoCheckr", "Fragment FAIL", e)
            loadingText?.text = "Error: ${e.message}"
        }
    }

    override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) {
        Log.d("GeoCheckr", "Panorama ready!")
        findViewById<TextView>(R.id.loadingText)?.visibility = TextView.GONE

        val location = LatLng(targetLat, targetLng)
        panorama.setPosition(location)
        panorama.isStreetNamesEnabled = false
        panorama.isUserNavigationEnabled = true
        panorama.isZoomGesturesEnabled = true
        panorama.isPanningGesturesEnabled = true
    }
}
