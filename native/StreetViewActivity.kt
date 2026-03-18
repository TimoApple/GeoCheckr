package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
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
        Log.d(TAG, "onCreate START")

        // Get coordinates
        targetLat = intent.getDoubleExtra("latitude", 0.0)
        targetLng = intent.getDoubleExtra("longitude", 0.0)
        Log.d(TAG, "Coords: $targetLat, $targetLng")

        // Create simple layout
        val containerId = 0x7F100001 // Custom ID, avoids XML resource dependency
        val frame = FrameLayout(this).apply {
            id = containerId
            setBackgroundColor(0xFF000000.toInt())
        }
        setContentView(frame)

        // Loading text
        val loading = TextView(this).apply {
            text = "Lade Street View..."
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 16f
            setPadding(48, 48, 48, 48)
        }
        frame.addView(loading)

        // Close button
        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        val closeParams = FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        }
        frame.addView(closeBtn, closeParams)

        // Load fragment with proper transaction handling
        try {
            Log.d(TAG, "Creating fragment...")
            val fragment = SupportStreetViewPanoramaFragment.newInstance()

            supportFragmentManager.beginTransaction()
                .add(containerId, fragment, "streetview")
                .commitNowAllowingStateLoss()

            Log.d(TAG, "Fragment committed, requesting panorama...")

            fragment.getStreetViewPanoramaAsync(this)
            Log.d(TAG, "getStreetViewPanoramaAsync called OK")

        } catch (e: Exception) {
            Log.e(TAG, "Fragment error", e)
            loading.text = "Street View Fehler:\n${e.message}"
        }
    }

    override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) {
        Log.d(TAG, "Panorama ready!")
        try {
            val location = LatLng(targetLat, targetLng)
            panorama.apply {
                setPosition(location)
                isStreetNamesEnabled = false
                isUserNavigationEnabled = true
                isZoomGesturesEnabled = true
                isPanningGesturesEnabled = true
            }
            Log.d(TAG, "Position set: $targetLat, $targetLng")
        } catch (e: Exception) {
            Log.e(TAG, "Position error", e)
        }
    }
}
