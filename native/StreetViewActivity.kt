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
        val heading = (0..359).random()
        Log.d("GeoCheckr", "StreetViewActivity: lat=$lat, lng=$lng, heading=$heading")

        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d("GeoCheckr", "WebView page loaded: $url")
                    // Make fullscreen
                    view?.evaluateJavascript("""
                        (function(){
                            var s=document.createElement('style');
                            s.innerHTML='html,body{margin:0;padding:0;overflow:hidden}';
                            document.head.appendChild(s);
                        })();
                    """.trimIndent(), null)
                }

                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    Log.e("GeoCheckr", "WebView error $errorCode: $description at $failingUrl")
                }
            }
        }

        // Frame with close button
        val frame = FrameLayout(this).apply {
            addView(webView)
        }

        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        val lp = FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        }
        frame.addView(closeBtn, lp)
        setContentView(frame)

        // Maps Embed API: sauber, kein Cookie-Consent, unbegrenzt kostenlos
        val apiKey = "AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI"
        val embedUrl = "https://www.google.com/maps/embed/v1/streetview?key=$apiKey&location=$lat,$lng&heading=$heading&pitch=0&fov=90"
        Log.d("GeoCheckr", "Loading Embed API: $embedUrl")
        webView.loadUrl(embedUrl)
    }
}
