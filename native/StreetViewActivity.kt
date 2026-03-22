package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.StreetViewPanoramaCamera

class StreetViewActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_street_view)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val heading = (0..359).random().toFloat()
        Log.d("GeoCheckr", "StreetViewActivity: lat=$lat, lng=$lng, heading=$heading")

        // Close button
        findViewById<ImageButton>(R.id.close_btn).setOnClickListener { finish() }

        // Native Street View Panorama (Google Maps SDK — full interactivity)
        val streetViewFragment =
            supportFragmentManager.findFragmentById(R.id.streetviewpanorama) as SupportStreetViewPanoramaFragment?

        streetViewFragment?.getStreetViewPanoramaAsync { panorama ->
            panorama.setPosition(LatLng(lat, lng))
            panorama.pov = StreetViewPanoramaCamera.Builder()
                .bearing(heading)
                .tilt(0f)
                .zoom(1f)
                .build()
            panorama.isStreetNamesEnabled = false
            panorama.isUserNavigationEnabled = true
            panorama.isZoomGesturesEnabled = true
            panorama.isPanningGesturesEnabled = true
            Log.d("GeoCheckr", "Native Street View loaded OK")
        }
    }
}
