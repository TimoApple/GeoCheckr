package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentContainerView
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera

/**
 * APPROACH 1: Fragment with getStreetViewPanoramaAsync (CORRECT new API)
 * Based on Google's official samples:
 * - StreetViewPanoramaBasicDemoActivity
 * - StreetViewPanoramaNavigationDemoActivity
 * - StreetViewPanoramaOptionsDemoActivity
 *
 * CRITICAL: Uses getStreetViewPanoramaAsync {} NOT deprecated OnStreetViewPanoramaReadyListener
 */
class StreetViewActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(FragmentContainerView(this).apply {
            id = android.R.id.content // Use a valid Android ID
        })

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val location = LatLng(lat, lng)
        val heading = (0..359).random()
        Log.d("GeoCheckr", "StreetView Activity: lat=$lat, lng=$lng, heading=$heading")

        // Create fragment programmatically
        val fragment = SupportStreetViewPanoramaFragment.newInstance()

        supportFragmentManager.beginTransaction()
            .replace(android.R.id.content, fragment)
            .commitNow()

        // CORRECT API: getStreetViewPanoramaAsync (not OnStreetViewPanoramaReadyListener)
        fragment.getStreetViewPanoramaAsync { panorama ->
            Log.d("GeoCheckr", "Panorama async ready!")
            try {
                // Set position
                savedInstanceState ?: panorama.setPosition(location)

                // Configure panorama based on Google's OptionsDemo
                panorama.isPanningGesturesEnabled = true
                panorama.isZoomGesturesEnabled = true
                panorama.isUserNavigationEnabled = true
                panorama.isStreetNamesEnabled = false

                // Set initial camera
                panorama.animateTo(
                    StreetViewPanoramaCamera.Builder()
                        .zoom(1f)
                        .tilt(0f)
                        .bearing(heading.toFloat())
                        .build(),
                    0
                )

                Log.d("GeoCheckr", "Panorama configured successfully")
            } catch (e: Exception) {
                Log.e("GeoCheckr", "Error configuring panorama", e)
            }
        }
    }
}
