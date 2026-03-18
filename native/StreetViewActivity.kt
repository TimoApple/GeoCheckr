package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.StreetViewPanoramaFragment
import com.google.android.gms.maps.model.LatLng

class StreetViewActivity : AppCompatActivity(), OnStreetViewPanoramaReadyCallback {

    private var targetLat = 0.0
    private var targetLng = 0.0
    private val TAG = "GeoCheckr"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Get coordinates FIRST — before any Google Play Services code
            targetLat = intent.getDoubleExtra("latitude", 0.0)
            targetLng = intent.getDoubleExtra("longitude", 0.0)
            Log.d(TAG, "StreetViewActivity: lat=$targetLat lng=$targetLng")

            // Create layout programmatically — no XML dependencies
            val frame = FrameLayout(this).apply {
                id = android.R.id.content
                setBackgroundColor(0xFF000000.toInt())
            }
            setContentView(frame)

            // Add close button
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

            // Try to load Street View Fragment programmatically
            try {
                val fragment = StreetViewPanoramaFragment()
                supportFragmentManager.beginTransaction()
                    .add(android.R.id.content, fragment)
                    .commitAllowingStateLoss()
                fragment.getStreetViewPanoramaAsync(this)
                Log.d(TAG, "Fragment loaded successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Fragment failed, trying Support fragment", e)
                // Fallback: try SupportStreetViewPanoramaFragment
                try {
                    val supportFragment = com.google.android.gms.maps.SupportStreetViewPanoramaFragment.newInstance()
                    supportFragmentManager.beginTransaction()
                        .add(android.R.id.content, supportFragment)
                        .commitAllowingStateLoss()
                    supportFragment.getStreetViewPanoramaAsync(this)
                    Log.d(TAG, "Support fragment loaded successfully")
                } catch (e2: Exception) {
                    Log.e(TAG, "Both fragments failed", e2)
                    showError("Street View nicht verfügbar: ${e2.message}")
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "StreetViewActivity onCreate failed completely", e)
            showError("Fehler: ${e.message}")
        }
    }

    private fun showError(msg: String) {
        try {
            val tv = TextView(this).apply {
                text = msg
                setTextColor(0xFFFFFFFF.toInt())
                textSize = 16f
                setPadding(48, 200, 48, 48)
            }
            setContentView(tv)
        } catch (e: Exception) {
            Log.e(TAG, "Even showing error failed", e)
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
            Log.d(TAG, "Panorama ready at $targetLat, $targetLng")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set panorama", e)
            showError("Panorama Fehler: ${e.message}")
        }
    }
}
