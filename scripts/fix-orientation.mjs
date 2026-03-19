/**
 * Post-sync script: Fixes orientation + SDK versions for iOS and Android.
 * Run after `npx cap sync`: node scripts/fix-orientation.mjs
 * Or use: npm run capsync
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ═══════════════════════════════════════════
// ── Android ──
// ═══════════════════════════════════════════

// 1. Orientação: AndroidManifest.xml
const androidManifest = join("android", "app", "src", "main", "AndroidManifest.xml");
if (existsSync(androidManifest)) {
  let xml = readFileSync(androidManifest, "utf-8");
  if (xml.includes('android:screenOrientation="portrait"')) {
    xml = xml.replace(
      /android:screenOrientation="portrait"/g,
      'android:screenOrientation="fullSensor"'
    );
    writeFileSync(androidManifest, xml, "utf-8");
    console.log("✅ Android: orientação → fullSensor");
  } else if (!xml.includes('android:screenOrientation')) {
    xml = xml.replace(
      /<activity[\s\S]*?android:name="[^"]*MainActivity"/,
      (match) => `${match}\n            android:screenOrientation="fullSensor"`
    );
    writeFileSync(androidManifest, xml, "utf-8");
    console.log("✅ Android: orientação fullSensor adicionada");
  } else {
    console.log("ℹ️  Android: orientação já configurada");
  }
} else {
  console.log("⚠️  Android: pasta não encontrada");
}

// 2. SDK Versions: build.gradle
const androidBuildGradle = join("android", "app", "build.gradle");
if (existsSync(androidBuildGradle)) {
  let gradle = readFileSync(androidBuildGradle, "utf-8");
  let changed = false;

  // minSdkVersion → 24 (Android 7.0+, suporta até Android 15)
  if (gradle.match(/minSdkVersion\s+\d+/)) {
    gradle = gradle.replace(/minSdkVersion\s+\d+/, "minSdkVersion 24");
    changed = true;
  }

  // targetSdkVersion → 35 (Android 15 — exigência Google Play 2025)
  if (gradle.match(/targetSdkVersion\s+\d+/)) {
    gradle = gradle.replace(/targetSdkVersion\s+\d+/, "targetSdkVersion 35");
    changed = true;
  }

  // compileSdkVersion → 35
  if (gradle.match(/compileSdkVersion\s+\d+/)) {
    gradle = gradle.replace(/compileSdkVersion\s+\d+/, "compileSdkVersion 35");
    changed = true;
  }

  if (changed) {
    writeFileSync(androidBuildGradle, gradle, "utf-8");
    console.log("✅ Android: minSdk=24, targetSdk=35, compileSdk=35");
  } else {
    console.log("ℹ️  Android: versões SDK já configuradas");
  }
} else {
  console.log("⚠️  Android: build.gradle não encontrado");
}

// ═══════════════════════════════════════════
// ── iOS ──
// ═══════════════════════════════════════════

const iosPlist = join("ios", "App", "App", "Info.plist");
if (existsSync(iosPlist)) {
  let plist = readFileSync(iosPlist, "utf-8");

  // 1. Orientações
  const iphoneOrientations = `<key>UISupportedInterfaceOrientations</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t\t<string>UIInterfaceOrientationLandscapeLeft</string>
\t\t<string>UIInterfaceOrientationLandscapeRight</string>
\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>
\t</array>`;

  const ipadOrientations = `<key>UISupportedInterfaceOrientations~ipad</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t\t<string>UIInterfaceOrientationLandscapeLeft</string>
\t\t<string>UIInterfaceOrientationLandscapeRight</string>
\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>
\t</array>`;

  plist = plist.replace(
    /<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/,
    iphoneOrientations
  );

  if (plist.includes("UISupportedInterfaceOrientations~ipad")) {
    plist = plist.replace(
      /<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/,
      ipadOrientations
    );
  } else {
    plist = plist.replace(
      /<\/dict>\s*<\/plist>/,
      `\t${ipadOrientations}\n</dict>\n</plist>`
    );
  }

  writeFileSync(iosPlist, plist, "utf-8");
  console.log("✅ iOS: todas as orientações habilitadas");
} else {
  console.log("⚠️  iOS: pasta não encontrada");
}

// 2. iOS deployment target: Podfile
const iosPodfile = join("ios", "App", "Podfile");
if (existsSync(iosPodfile)) {
  let podfile = readFileSync(iosPodfile, "utf-8");
  // Set minimum iOS version to 16.0
  if (podfile.match(/platform :ios, '[\d.]+'/)) {
    podfile = podfile.replace(/platform :ios, '[\d.]+'/, "platform :ios, '16.0'");
    writeFileSync(iosPodfile, podfile, "utf-8");
    console.log("✅ iOS: deployment target → 16.0 (suporta até iOS 18)");
  } else {
    console.log("ℹ️  iOS: Podfile platform já configurada");
  }
} else {
  console.log("⚠️  iOS: Podfile não encontrado");
}

// 3. iOS project.pbxproj deployment target
const iosProject = join("ios", "App", "App.xcodeproj", "project.pbxproj");
if (existsSync(iosProject)) {
  let pbx = readFileSync(iosProject, "utf-8");
  if (pbx.match(/IPHONEOS_DEPLOYMENT_TARGET = [\d.]+/)) {
    pbx = pbx.replace(
      /IPHONEOS_DEPLOYMENT_TARGET = [\d.]+/g,
      "IPHONEOS_DEPLOYMENT_TARGET = 16.0"
    );
    writeFileSync(iosProject, pbx, "utf-8");
    console.log("✅ iOS: Xcode deployment target → 16.0");
  }
} else {
  console.log("⚠️  iOS: project.pbxproj não encontrado");
}

console.log("\n🎉 Correções de orientação e versão concluídas!");
console.log("   Android: minSdk 24 (7.0+) → targetSdk 35 (Android 15)");
console.log("   iOS: deployment target 16.0 → suporta até iOS 18");
