#!/usr/bin/env bash
# Build the Safari app WITHOUT an Xcode project, using swiftc + codesign only.
#
# Use this when `xcrun safari-web-extension-converter` is unavailable (for
# example "A required plugin failed to load ... xcodebuild -runFirstLaunch").
# Produces an ad-hoc signed app (needs Develop > Allow Unsigned Extensions):
#   safari/manual/Better SoundCloud Feed.app
set -euo pipefail
cd "$(dirname "$0")/.."

APP_NAME="Better SoundCloud Feed"
BUNDLE_ID="${BUNDLE_ID:-com.sjurgis.bettersoundcloudfeed}"
EXT_ID="$BUNDLE_ID.Extension"
VERSION="$(node -p 'require("./package.json").version')"
BUILD_NUMBER="${BUILD_NUMBER:-$(git rev-list --count HEAD 2>/dev/null || echo 1)}"
MIN_MACOS="${MIN_MACOS:-13.0}"
ARCH="$(uname -m)"
OUT="safari/manual"
APP="$OUT/$APP_NAME.app"
APPEX="$APP/Contents/PlugIns/$APP_NAME Extension.appex"

[[ "$(uname)" == "Darwin" ]] || { echo "macOS only" >&2; exit 1; }

if [[ "${SKIP_WEB_BUILD:-}" != "1" ]]; then pnpm build; fi

SDK="$(xcrun --sdk macosx --show-sdk-path)"
TARGET="$ARCH-apple-macos$MIN_MACOS"

rm -rf "$OUT"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" "$APPEX/Contents/MacOS" "$APPEX/Contents/Resources"

# Web extension files (no source maps).
rsync -a --exclude '*.map' dist/ "$APPEX/Contents/Resources/"

# App icon from public/icon.svg.
ICONSET="$OUT/AppIcon.iconset"
mkdir -p "$ICONSET"
node -e '
const sharp = require("sharp");
const out = process.argv[1];
const sizes = [16, 32, 128, 256, 512];
Promise.all(sizes.flatMap((s) => [
  sharp("public/icon.svg").resize(s, s).png().toFile(`${out}/icon_${s}x${s}.png`),
  sharp("public/icon.svg").resize(s * 2, s * 2).png().toFile(`${out}/icon_${s}x${s}@2x.png`),
])).catch((e) => { console.error(e); process.exit(1); });
' "$ICONSET"
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"
rm -rf "$ICONSET"

# Extension binary (entry point is NSExtensionMain).
xcrun swiftc -O -sdk "$SDK" -target "$TARGET" -module-name BSFExtension \
  -application-extension \
  safari-src/SafariWebExtensionHandler.swift \
  -framework SafariServices \
  -Xlinker -e -Xlinker _NSExtensionMain \
  -o "$APPEX/Contents/MacOS/$APP_NAME Extension"

# Container app binary.
xcrun swiftc -O -sdk "$SDK" -target "$TARGET" -module-name BSFApp \
  safari-src/App.swift -framework Cocoa -framework SafariServices \
  -o "$APP/Contents/MacOS/$APP_NAME"

# Info.plists, written as XML (values are plain ASCII, no escaping needed).
write_plist() { # file, then key/type/value triples (type: string|array1)
  local f="$1"; shift
  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
    echo '<plist version="1.0"><dict>'
    while [[ $# -gt 0 ]]; do
      echo "  <key>$1</key><string>$2</string>"
      shift 2
    done
    echo '  <key>CFBundleSupportedPlatforms</key><array><string>MacOSX</string></array>'
    if [[ "$f" == *.appex/* ]]; then
      echo '  <key>NSExtension</key><dict>'
      echo '    <key>NSExtensionPointIdentifier</key><string>com.apple.Safari.web-extension</string>'
      echo '    <key>NSExtensionPrincipalClass</key><string>SafariWebExtensionHandler</string>'
      echo '  </dict>'
    fi
    echo '</dict></plist>'
  } > "$f"
  plutil -lint "$f" >/dev/null
}

write_plist "$APPEX/Contents/Info.plist" \
  CFBundleDevelopmentRegion en \
  CFBundleDisplayName "$APP_NAME" \
  CFBundleExecutable "$APP_NAME Extension" \
  CFBundleIdentifier "$EXT_ID" \
  CFBundleInfoDictionaryVersion 6.0 \
  CFBundleName "$APP_NAME Extension" \
  CFBundlePackageType 'XPC!' \
  CFBundleShortVersionString "$VERSION" \
  CFBundleVersion "$BUILD_NUMBER" \
  LSMinimumSystemVersion "$MIN_MACOS" \
  NSHumanReadableCopyright "MIT License"

write_plist "$APP/Contents/Info.plist" \
  CFBundleDevelopmentRegion en \
  CFBundleDisplayName "$APP_NAME" \
  CFBundleExecutable "$APP_NAME" \
  CFBundleIconFile AppIcon \
  CFBundleIdentifier "$BUNDLE_ID" \
  CFBundleInfoDictionaryVersion 6.0 \
  CFBundleName "$APP_NAME" \
  CFBundlePackageType APPL \
  CFBundleShortVersionString "$VERSION" \
  CFBundleVersion "$BUILD_NUMBER" \
  LSApplicationCategoryType public.app-category.music \
  LSMinimumSystemVersion "$MIN_MACOS" \
  NSPrincipalClass NSApplication \
  BSFExtensionBundleIdentifier "$EXT_ID"

# Ad-hoc sign, inside-out. Safari requires sandboxed extensions.
codesign --force --sign - --timestamp=none --options runtime \
  --entitlements safari-src/sandbox.entitlements "$APPEX"
codesign --force --sign - --timestamp=none --options runtime \
  --entitlements safari-src/sandbox.entitlements "$APP"
codesign --verify --deep --strict "$APP"

echo
echo "Built: $APP"
