package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.StreetViewPanoramaOptions
import com.google.android.gms.maps.StreetViewPanoramaView
import com.google.android.gms.maps.model.LatLng

/**
 * APPROACH 2: StreetViewPanoramaView (View, not Fragment)
 * Based on Google's StreetViewPanoramaViewDemoActivity
 *
 * Key differences from Fragment:
 * - View created programmatically with StreetViewPanoramaOptions
 * - Lifecycle must be managed manually
 * - Uses StreetViewPanoramaOptions for initial config
 */
class StreetViewActivityOptions : AppCompatActivity() {

    private lateinit var streetViewPanoramaView: StreetViewPanoramaView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val heading = (0..359).random()
        val location = LatLng(lat, lng)
        Log.d("GeoCheckr", "StreetView Options: lat=$lat, lng=$lng, heading=$heading")

        // Create options (based on Google's ViewDemoActivity)
        val options = StreetViewPanoramaOptions()
            .position(location)
            .panningGesturesEnabled(true)
            .zoomGesturesEnabled(true)
            .userNavigationEnabled(true)
            .streetNamesEnabled(false)

        // Create the View
        streetViewPanoramaView = StreetViewPanoramaView(this, options)

        // FrameLayout with close button
        val frame = FrameLayout(this).apply { addView(streetViewPanoramaView) }
        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        frame.addView(closeBtn, FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        })
        setContentView(frame)

        // CRITICAL: Pass the StreetView-specific bundle to onCreate
        // (from Google's ViewDemoActivity)
        streetViewPanoramaView.onCreate(savedInstanceState?.getBundle(STREETVIEW_BUNDLE_KEY))

        // The View should auto-load the panorama from options.position()
        Log.d("GeoCheckr", "StreetView View created with options")
    }

    override fun onResume() {
        streetViewPanoramaView.onResume()
        super.onResume()
    }

    override fun onPause() {
        streetViewPanoramaView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        streetViewPanoramaView.onDestroy()
        super.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        var streetViewBundle = outState.getBundle(STREETVIEW_BUNDLE_KEY)
        if (streetViewBundle == null) {
            streetViewBundle = Bundle()
            outState.putBundle(STREETVIEW_BUNDLE_KEY, streetViewBundle)
        }
        streetViewPanoramaView.onSaveInstanceState(streetViewBundle)
    }

    companion object {
        private const val STREETVIEW_BUNDLE_KEY = "StreetViewBundleKey"
    }
}
