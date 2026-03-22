package com.geocheckr.app

import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class StreetViewModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "StreetViewModule"

    @ReactMethod
    fun openStreetView(latitude: Double, longitude: Double) {
        val context = reactApplicationContext
        UiThreadUtil.runOnUiThread {
            try {
                // Try native StreetViewPanoramaView first
                val intent = Intent(context, StreetViewActivity::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "Starting native StreetViewActivity...")
                context.startActivity(intent)
                Log.d("GeoCheckr", "startActivity OK")
            } catch (e: Exception) {
                Log.e("GeoCheckr", "Native failed, trying WebView fallback", e)
                // Fallback: WebView with working web approach
                try {
                    val intent = Intent(context, StreetViewActivityWebView::class.java).apply {
                        putExtra("latitude", latitude)
                        putExtra("longitude", longitude)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    Log.d("GeoCheckr", "WebView fallback started")
                } catch (e2: Exception) {
                    Log.e("GeoCheckr", "WebView fallback also failed", e2)
                }
            }
        }
    }
}
