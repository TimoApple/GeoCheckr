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
            // Try 1: StreetViewPanoramaView (programmatic)
            try {
                val intent = Intent(context, StreetViewActivity::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "Trying native StreetViewActivity...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) {
                Log.e("GeoCheckr", "Native failed", e)
            }

            // Try 2: StreetViewActivityOptions (explicit options)
            try {
                val intent = Intent(context, StreetViewActivityOptions::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "Trying options activity...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) {
                Log.e("GeoCheckr", "Options failed", e)
            }

            // Try 3: WebView fallback
            try {
                val intent = Intent(context, StreetViewActivityWebView::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "Trying WebView fallback...")
                context.startActivity(intent)
            } catch (e: Exception) {
                Log.e("GeoCheckr", "All approaches failed!", e)
            }
        }
    }
}
