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
            // Try 1: Native StreetViewPanoramaView
            try {
                val intent = Intent(context, StreetViewActivity::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying native View...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "Native View failed", e) }

            // Try 2: Options approach
            try {
                val intent = Intent(context, StreetViewActivityOptions::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying options...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "Options failed", e) }

            // Try 3: WebView with callback
            try {
                val intent = Intent(context, StreetViewActivityWebView::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying WebView callback...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "WebView callback failed", e) }

            // Try 4: WebView with local file approach (exact test-standalone pattern)
            try {
                val intent = Intent(context, StreetViewActivityLocalFile::class.java).apply {
                    putExtra("latitude", latitude)
                    putExtra("longitude", longitude)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                Log.d("GeoCheckr", "→ Trying local file WebView...")
                context.startActivity(intent)
                return@runOnUiThread
            } catch (e: Exception) { Log.e("GeoCheckr", "Local file failed", e) }

            Log.e("GeoCheckr", "ALL APPROACHES FAILED!")
        }
    }
}
