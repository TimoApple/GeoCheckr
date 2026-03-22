package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.StreetViewPanoramaView
import com.google.android.gms.maps.model.LatLng

class StreetViewActivity : AppCompatActivity() {

    private var streetViewPanoramaView: StreetViewPanoramaView? = null
    private var panorama: StreetViewPanorama? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val heading = (0..359).random().toFloat()
        Log.d("GeoCheckr", "StreetViewActivity: lat=$lat, lng=$lng, heading=$heading")

        // Create layout programmatically (no XML needed)
        val container = FrameLayout(this).apply {
            setBackgroundColor(0xFF000000.toInt())
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        // StreetViewPanoramaView
        streetViewPanoramaView = StreetViewPanoramaView(this)
        streetViewPanoramaView?.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        container.addView(streetViewPanoramaView)

        // Close button
        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        val lp = FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        }
        container.addView(closeBtn, lp)

        setContentView(container)

        // Initialize panorama
        streetViewPanoramaView?.onCreate(savedInstanceState?.getBundle("streetview"))
        streetViewPanoramaView?.getStreetViewPanoramaAsync { pano ->
            panorama = pano
            pano.setPosition(LatLng(lat, lng))
            pano.isStreetNamesEnabled = false
            pano.isUserNavigationEnabled = true
            pano.isZoomGesturesEnabled = true
            pano.isPanningGesturesEnabled = true
            Log.d("GeoCheckr", "StreetViewPanoramaView loaded OK")
        }
    }

    override fun onResume() {
        super.onResume()
        streetViewPanoramaView?.onResume()
    }

    override fun onPause() {
        streetViewPanoramaView?.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        streetViewPanoramaView?.onDestroy()
        super.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        val streetViewBundle = Bundle()
        outState.putBundle("streetview", streetViewBundle)
        streetViewPanoramaView?.onSaveInstanceState(streetViewBundle)
    }

    override fun onLowMemory() {
        super.onLowMemory()
        streetViewPanoramaView?.onLowMemory()
    }
}
