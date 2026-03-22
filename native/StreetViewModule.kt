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
            // Try 1: Fragment with getStreetViewPanoramaAsync (CORRECT API)
            try {
                val intent = Intent(context, StreetViewActivity::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying Fragment (getStreetViewPanoramaAsync)...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "Fragment failed", e) }

            // Try 2: StreetViewPanoramaView with Options (proper lifecycle)
            try {
                val intent = Intent(context, StreetViewActivityOptions::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying View with Options...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "Options failed", e) }

            // Try 3: WebView fallback (guaranteed to work if API key has JS API)
            try {
                val intent = Intent(context, StreetViewActivityWebView::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying WebView fallback...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "WebView failed", e) }

            Log.e("GeoCheckr", "ALL APPROACHES FAILED!")
        }
    }
}
