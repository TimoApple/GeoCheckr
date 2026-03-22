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
                    Log.d("GeoCheckr", "WebView page loaded")
                }
                override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    Log.e("GeoCheckr", "WebView error $errorCode: $description")
                }
            }
        }

        // Frame with close button
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

        // Maps JavaScript API — interactive with navigation, click-to-go, pan, zoom
        val apiKey = "AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI"
        val html = """
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#p{width:100%;height:100%;overflow:hidden;background:#0e0e0e}
#s{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#c6c5d7;text-align:center;font-family:sans-serif}
#s .e{font-size:48px;margin-bottom:16px}
#s.hide{display:none}</style>
</head><body>
<div id="p"></div>
<div id="s"><div class="e">🔍</div><div>Lade Street View...</div></div>
<script>
function init(){
  var sv=new google.maps.StreetViewService();
  sv.getPanorama({
    location:{lat:$lat,lng:$lng},
    radius:50000,
    preference:google.maps.StreetViewPreference.NEAREST,
    source:google.maps.StreetViewSource.OUTDOOR
  },function(d,s){
    if(s===google.maps.StreetViewStatus.OK){
      document.getElementById('s').className='hide';
      new google.maps.StreetViewPanorama(document.getElementById('p'),{
        pano:d.location.pano,
        pov:{heading:$heading,pitch:0},
        zoom:1,
        addressControl:false,
        showRoadLabels:false,
        linksControl:true,
        panControl:false,
        zoomControl:true,
        fullscreenControl:false,
        motionTracking:false,
        motionTrackingControl:false,
        enableCloseButton:false,
        scrollwheel:true,
        clickToGo:true
      });
    }else{
      document.getElementById('s').innerHTML='<div class="e">📷</div><div>Kein Street View hier</div>';
    }
  });
}
window.gm_authFailure=function(){
  document.getElementById('s').innerHTML='<div class="e" style="color:#ff3333">⚠️</div><div>API Key Fehler</div>';
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=$apiKey&callback=init"></script>
</body></html>
""".trimIndent()

        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
    }
}
