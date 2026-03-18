package com.geocheckr.app

import android.os.Bundle
import android.util.Log
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.maps.OnStreetViewPanoramaReadyCallback
import com.google.android.gms.maps.StreetViewPanorama
import com.google.android.gms.maps.SupportStreetViewPanoramaFragment
import com.google.android.gms.maps.model.LatLng

class StreetViewActivity : AppCompatActivity(), OnStreetViewPanoramaReadyCallback {

    private var targetLat = 0.0
    private var targetLng = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_street_view)

        targetLat = intent.getDoubleExtra("latitude", 0.0)
        targetLng = intent.getDoubleExtra("longitude", 0.0)
        Log.d("GeoCheckr", "StreetView: $targetLat, $targetLng")

        // Add fragment into the FrameLayout
        val fragment = SupportStreetViewPanoramaFragment.newInstance()
        supportFragmentManager.beginTransaction()
            .replace(R.id.streetview_root, fragment)
            .commitAllowingStateLoss()

        // Execute pending transactions BEFORE calling async
        supportFragmentManager.executePendingTransactions()
        fragment.getStreetViewPanoramaAsync(this)
    }

    override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) {
        Log.d("GeoCheckr", "Panorama ready")
        panorama.setPosition(LatLng(targetLat, targetLng))
        panorama.isStreetNamesEnabled = false
        panorama.isUserNavigationEnabled = true
        panorama.isZoomGesturesEnabled = true
        panorama.isPanningGesturesEnabled = true
    }
}
