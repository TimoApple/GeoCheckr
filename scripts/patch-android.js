// Patch Android files after expo prebuild for Street View native module
const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');

// 1. Copy Kotlin source files
const srcDir = path.join(androidDir, 'app', 'src', 'main', 'java', 'com', 'geocheckr', 'app');
fs.mkdirSync(srcDir, { recursive: true });

const nativeDir = path.join(__dirname, '..', 'native');
['StreetViewActivity.kt', 'StreetViewModule.kt', 'StreetViewPackage.kt'].forEach(file => {
  fs.copyFileSync(path.join(nativeDir, file), path.join(srcDir, file));
  console.log(`✅ Copied ${file}`);
});

// 2. Copy layout XML
const layoutDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'layout');
fs.mkdirSync(layoutDir, { recursive: true });
fs.copyFileSync(path.join(nativeDir, 'activity_street_view.xml'), path.join(layoutDir, 'activity_street_view.xml'));
console.log('✅ Copied activity_street_view.xml');

// 3. Patch build.gradle - add play-services-maps
const buildGradle = path.join(androidDir, 'app', 'build.gradle');
let bg = fs.readFileSync(buildGradle, 'utf8');
if (!bg.includes('play-services-maps')) {
  bg = bg.replace(/dependencies\s*\{/, `dependencies {\n    implementation 'com.google.android.gms:play-services-maps:20.0.0'`);
  fs.writeFileSync(buildGradle, bg);
  console.log('✅ Added play-services-maps:20.0.0 to build.gradle');
}

// 4. Patch AndroidManifest.xml - add API key + Activity + uses-library
const manifest = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
let mf = fs.readFileSync(manifest, 'utf8');

// Only patch if not already done
if (!mf.includes('com.google.android.geo.API_KEY')) {
  // Add after <application ...> opening tag
  mf = mf.replace(
    /(<application[^>]*>)/,
    `$1\n    <meta-data android:name="com.google.android.geo.API_KEY" android:value="AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI"/>\n    <activity android:name=".StreetViewActivity" android:theme="@style/Theme.AppCompat.NoActionBar" android:exported="false"/>`
  );
  console.log('✅ Added API key + Activity to AndroidManifest.xml');
}

// Add uses-library for play-services-maps 20.x compatibility
if (!mf.includes('org.apache.http.legacy')) {
  mf = mf.replace(
    '</application>',
    '    <uses-library android:name="org.apache.http.legacy" android:required="false"/>\n</application>'
  );
  console.log('✅ Added uses-library org.apache.http.legacy');
}

fs.writeFileSync(manifest, mf);

// 5. Patch MainApplication.kt - register package
const mainApp = path.join(androidDir, 'app', 'src', 'main', 'java', 'com', 'geocheckr', 'app', 'MainApplication.kt');
let ma = fs.readFileSync(mainApp, 'utf8');
if (!ma.includes('StreetViewPackage')) {
  // Add import at top
  if (!ma.includes('import com.geocheckr.app.StreetViewPackage')) {
    const lines = ma.split('\n');
    const lastImportIdx = lines.map((l, i) => l.startsWith('import ') ? i : -1).filter(i => i >= 0).pop() || 0;
    lines.splice(lastImportIdx + 1, 0, 'import com.geocheckr.app.StreetViewPackage');
    ma = lines.join('\n');
  }
  // Add to packages list
  ma = ma.replace(
    /PackageList\(this\)\.packages\.apply\s*\{/,
    'PackageList(this).packages.apply {\n              add(StreetViewPackage())'
  );
  fs.writeFileSync(mainApp, ma);
  console.log('✅ Registered StreetViewPackage in MainApplication.kt');
}

console.log('\n🎉 All patches applied!');
