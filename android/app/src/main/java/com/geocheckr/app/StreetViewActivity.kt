package com.geocheckr.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class StreetViewActivity : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        Log.d("GeoCheckr", "WebView: $lat, $lng")

        // WebView
        val webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()

        // Frame with close button
        val frame = FrameLayout(this)
        frame.addView(webView)

        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        val lp = FrameLayout.LayoutParams(144, 144)
        lp.gravity = android.view.Gravity.TOP or android.view.Gravity.END
        lp.setMargins(0, 48, 48, 0)
        frame.addView(closeBtn, lp)

        setContentView(frame)

        // Load Street View
        val url = "https://www.google.com/maps/@$lat,$lng,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192"
        Log.d("GeoCheckr", "Loading: $url")
        webView.loadUrl(url)
    }
}
