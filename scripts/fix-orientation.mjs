/**
 * Post-sync script: Fixes screen orientation to allow rotation on iOS and Android.
 * Run after `npx cap sync`: node scripts/fix-orientation.mjs
 * Or add to package.json scripts: "capsync": "npx cap sync && node scripts/fix-orientation.mjs"
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ── Android: AndroidManifest.xml ──
const androidManifest = join("android", "app", "src", "main", "AndroidManifest.xml");
if (existsSync(androidManifest)) {
  let xml = readFileSync(androidManifest, "utf-8");
  // Replace any fixed screenOrientation with fullSensor (allows all rotations)
  if (xml.includes('android:screenOrientation="portrait"')) {
    xml = xml.replace(
      /android:screenOrientation="portrait"/g,
      'android:screenOrientation="fullSensor"'
    );
    writeFileSync(androidManifest, xml, "utf-8");
    console.log("✅ Android: orientação alterada para fullSensor (rotação livre)");
  } else if (!xml.includes('android:screenOrientation')) {
    // Add fullSensor to main activity
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
  console.log("⚠️  Android: pasta não encontrada (rode npx cap add android primeiro)");
}

// ── iOS: Info.plist ──
const iosPlist = join("ios", "App", "App", "Info.plist");
if (existsSync(iosPlist)) {
  let plist = readFileSync(iosPlist, "utf-8");

  // iPhone orientations
  const iphoneOrientations = `<key>UISupportedInterfaceOrientations</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t\t<string>UIInterfaceOrientationLandscapeLeft</string>
\t\t<string>UIInterfaceOrientationLandscapeRight</string>
\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>
\t</array>`;

  // iPad orientations
  const ipadOrientations = `<key>UISupportedInterfaceOrientations~ipad</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t\t<string>UIInterfaceOrientationLandscapeLeft</string>
\t\t<string>UIInterfaceOrientationLandscapeRight</string>
\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>
\t</array>`;

  // Replace existing iPhone orientations
  plist = plist.replace(
    /<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/,
    iphoneOrientations
  );

  // Replace or add iPad orientations
  if (plist.includes("UISupportedInterfaceOrientations~ipad")) {
    plist = plist.replace(
      /<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/,
      ipadOrientations
    );
  } else {
    // Add before closing </dict>
    plist = plist.replace(
      /<\/dict>\s*<\/plist>/,
      `\t${ipadOrientations}\n</dict>\n</plist>`
    );
  }

  writeFileSync(iosPlist, plist, "utf-8");
  console.log("✅ iOS: todas as orientações habilitadas (iPhone + iPad)");
} else {
  console.log("⚠️  iOS: pasta não encontrada (rode npx cap add ios primeiro)");
}

console.log("\n🎉 Correção de orientação concluída!");
