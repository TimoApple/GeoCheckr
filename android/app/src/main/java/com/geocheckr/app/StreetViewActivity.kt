package com.geocheckr.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class StreetViewActivity : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)

        // Create WebView programmatically
        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    Log.d("GeoCheckr", "WebView loaded: $url")
                }
            }
        }
        setContentView(webView)

        // Add close button
        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        val closeParams = android.widget.FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        }
        val frame = android.widget.FrameLayout(this)
        frame.addView(webView)
        frame.addView(closeBtn, closeParams)
        setContentView(frame)

        // Load Google Street View via Embed URL
        val url = "https://www.google.com/maps/@$lat,$lng,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192"
        Log.d("GeoCheckr", "Loading: $url")
        webView.loadUrl(url)
    }
}
