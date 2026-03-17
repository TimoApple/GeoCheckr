package com.geocheckr.app

import android.content.Intent
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
            val intent = Intent(context, StreetViewActivity::class.java).apply {
                putExtra("latitude", latitude)
                putExtra("longitude", longitude)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }
}
