package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.StreetViewPanoramaOptions
import com.google.android.gms.maps.StreetViewPanoramaView
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewSource

class StreetViewActivityOptions : AppCompatActivity() {

    private var streetViewPanoramaView: StreetViewPanoramaView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val heading = (0..359).random().toFloat()
        Log.d("GeoCheckr", "Options Activity: lat=$lat, lng=$lng")

        // Create with explicit options (like Google's demo)
        val options = StreetViewPanoramaOptions()
            .position(LatLng(lat, lng))
            .streetNamesEnabled(false)
            .userNavigationEnabled(true)
            .zoomGesturesEnabled(true)
            .panningGesturesEnabled(true)
            .source(StreetViewSource.OUTDOOR)

        streetViewPanoramaView = StreetViewPanoramaView(this, options)

        val container = FrameLayout(this).apply { setBackgroundColor(0xFF000000.toInt()) }
        streetViewPanoramaView?.layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        container.addView(streetViewPanoramaView)

        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        container.addView(closeBtn, FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        })

        setContentView(container)
        streetViewPanoramaView?.onCreate(savedInstanceState?.getBundle("sv"))
    }

    override fun onResume() { super.onResume(); streetViewPanoramaView?.onResume() }
    override fun onPause() { streetViewPanoramaView?.onPause(); super.onPause() }
    override fun onDestroy() { streetViewPanoramaView?.onDestroy(); super.onDestroy() }
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        val b = Bundle(); outState.putBundle("sv", b)
        streetViewPanoramaView?.onSaveInstanceState(b)
    }
    override fun onLowMemory() { super.onLowMemory(); streetViewPanoramaView?.onLowMemory() }
}
