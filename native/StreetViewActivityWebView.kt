package com.geocheckr.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

// Fallback: Use WebView with working web Street View approach
class StreetViewActivityWebView : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val heading = (0..359).random()
        Log.d("GeoCheckr", "StreetViewActivityWebView: lat=$lat, lng=$lng")

        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
        }

        val frame = FrameLayout(this).apply { addView(webView) }
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

        // Same HTML as working test-standalone.html approach
        val apiKey = "AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI"
        val html = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#p{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body>
<div id="p"></div>
<script>
function init(){
  try{
    new google.maps.StreetViewPanorama(document.getElementById('p'),{
      position:{lat:$lat,lng:$lng},
      pov:{heading:$heading,pitch:0},
      zoom:1,
      addressControl:false,showRoadLabels:false,
      linksControl:true,panControl:true,zoomControl:true,
      fullscreenControl:false,scrollwheel:true,clickToGo:true
    });
  }catch(e){document.body.innerHTML='<div style="color:#fff;text-align:center;padding:40px">Error: '+e.message+'</div>';}
}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=$apiKey"></script>
</body></html>""".trimIndent()

        webView.loadDataWithBaseURL("https://timoapple.github.io/", html, "text/html", "UTF-8", null)
    }
}
