package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera
import com.google.android.gms.maps.model.StreetViewSource

class StreetViewActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "StreetViewActivity"
        private const val BUNDLE_KEY = "streetview_bundle"
    }

    private var targetLat = 0.0
    private var targetLng = 0.0
    private var panorama: StreetViewPanorama? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_street_view)

        targetLat = intent.getDoubleExtra("latitude", 0.0)
        targetLng = intent.getDoubleExtra("longitude", 0.0)

        Log.d(TAG, "Opening Street View at $targetLat, $targetLng")

        // Loading indicator
        val loadingText = findViewById<TextView>(R.id.loadingText)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)
        loadingText?.visibility = View.VISIBLE
        progressBar?.visibility = View.VISIBLE

        // Close button
        findViewById<ImageButton>(R.id.btnClose).setOnClickListener {
            finish()
        }

        // Get fragment — use savedInstanceState bundle for proper lifecycle
        val fragment = supportFragmentManager
            .findFragmentById(R.id.streetviewpanorama) as SupportStreetViewPanoramaFragment

        // NEW API: getStreetViewPanoramaAsync with lambda (NOT deprecated interface)
        fragment.getStreetViewPanoramaAsync { svPanorama ->
            panorama = svPanorama
            val location = LatLng(targetLat, targetLng)

            svPanorama.apply {
                // Enable ALL gestures for full navigation
                isPanningGesturesEnabled = true
                isZoomGesturesEnabled = true
                isUserNavigationEnabled = true
                isStreetNamesEnabled = false

                // Set source to OUTDOOR for better street-level coverage
                setPosition(location, 50000, StreetViewSource.OUTDOOR)

                // Random starting angle for variety
                val randomBearing = (Math.random() * 360).toFloat()
                val camera = StreetViewPanoramaCamera.Builder()
                    .bearing(randomBearing)
                    .tilt(0f)
                    .zoom(0f)
                    .build()
                svPanorama.animateTo(camera, 0)

                // Listen for panorama loaded
                setOnStreetViewPanoramaChangeListener { pano ->
                    if (pano != null) {
                        Log.d(TAG, "Panorama loaded: ${pano.location?.position}")
                        loadingText?.visibility = View.GONE
                        progressBar?.visibility = View.GONE
                    } else {
                        Log.w(TAG, "Panorama is null — no coverage here")
                        loadingText?.text = "Kein Street View verfügbar"
                        progressBar?.visibility = View.GONE
                    }
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        // Save panorama state for proper lifecycle
        val bundle = Bundle()
        outState.putBundle(BUNDLE_KEY, bundle)
    }
}
