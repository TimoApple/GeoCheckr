package com.geocheckr.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

/**
 * APPROACH 3: WebView with Maps JavaScript API (fallback)
 * Uses the exact same HTML structure as working test-standalone.html
 * If native doesn't work, this is the guaranteed fallback
 */
class StreetViewActivityWebView : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val lat = intent.getDoubleExtra("latitude", 52.52)
        val lng = intent.getDoubleExtra("longitude", 13.41)
        val heading = (0..359).random()
        Log.d("GeoCheckr", "WebView Activity: lat=$lat, lng=$lng, heading=$heading")

        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d("GeoCheckr", "WebView page finished loading")
                }
            }
        }

        val frame = FrameLayout(this).apply { addView(webView) }
        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(0x80000000.toInt())
            setOnClickListener { finish() }
        }
        frame.addView(closeBtn, FrameLayout.LayoutParams(144, 144).apply {
            gravity = android.view.Gravity.TOP or android.view.Gravity.END
            setMargins(0, 48, 48, 0)
        })
        setContentView(frame)

        // EXACT same HTML as working test-standalone.html
        val apiKey = "AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI"
        val html = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0}html,body,#pano{height:100%;width:100%;overflow:hidden;background:#000}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:18px;z-index:10;font-family:sans-serif}
</style>
</head>
<body>
<div id="pano"></div>
<div id="status">Lade...</div>
<script>
function init(){
  document.getElementById('status').style.display='none';
  try{
    new google.maps.StreetViewPanorama(document.getElementById('pano'),{
      position:{lat:$lat,lng:$lng},
      pov:{heading:$heading,pitch:0},
      zoom:1,
      addressControl:false,showRoadLabels:false,
      linksControl:true,panControl:true,zoomControl:true,
      fullscreenControl:false,scrollwheel:true,clickToGo:true
    });
  }catch(e){
    document.getElementById('status').textContent='Fehler: '+e.message;
    document.getElementById('status').style.color='red';
  }
}
window.initMap=init;
window.gm_authFailure=function(){
  document.getElementById('status').textContent='API KEY ERROR!';
  document.getElementById('status').style.color='red';
};
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=$apiKey&callback=initMap" async defer></script>
</body>
</html>""".trimIndent()

        // Load with base URL to handle relative paths
        webView.loadDataWithBaseURL(
            "https://timoapple.github.io/",
            html,
            "text/html",
            "UTF-8",
            null
        )
    }
}
