package com.geocheckr.app

import android.os.Bundle
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.model.LatLng

class StreetViewActivity : AppCompatActivity(), OnStreetViewPanoramaReadyCallback {

    private var targetLat = 0.0
    private var targetLng = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_street_view)

        // Get coordinates from intent
        targetLat = intent.getDoubleExtra("latitude", 0.0)
        targetLng = intent.getDoubleExtra("longitude", 0.0)

        // Find fragment and request panorama async
        val streetViewFragment = supportFragmentManager
            .findFragmentById(R.id.streetviewpanorama) as SupportStreetViewPanoramaFragment
        streetViewFragment.getStreetViewPanoramaAsync(this)

        // Close button
        findViewById<ImageButton>(R.id.btnClose).setOnClickListener {
            finish()
        }
    }

    override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) {
        val location = LatLng(targetLat, targetLng)

        panorama.apply {
            setPosition(location)
            isStreetNamesEnabled = false
            isUserNavigationEnabled = true
            isZoomGesturesEnabled = true
            isPanningGesturesEnabled = true
        }
    }
}
