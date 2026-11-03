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

plist() { /usr/libexec/PlistBuddy "$@" >/dev/null; }

P="$APPEX/Contents/Info.plist"
plist -c "Add :CFBundleDevelopmentRegion string en" \
  -c "Add :CFBundleDisplayName string $APP_NAME" \
  -c "Add :CFBundleExecutable string $APP_NAME Extension" \
  -c "Add :CFBundleIdentifier string $EXT_ID" \
  -c "Add :CFBundleInfoDictionaryVersion string 6.0" \
  -c "Add :CFBundleName string $APP_NAME Extension" \
  -c "Add :CFBundlePackageType string XPC!" \
  -c "Add :CFBundleShortVersionString string $VERSION" \
  -c "Add :CFBundleVersion string $BUILD_NUMBER" \
  -c "Add :CFBundleSupportedPlatforms array" \
  -c "Add :CFBundleSupportedPlatforms:0 string MacOSX" \
  -c "Add :LSMinimumSystemVersion string $MIN_MACOS" \
  -c "Add :NSHumanReadableCopyright string MIT License" \
  -c "Add :NSExtension dict" \
  -c "Add :NSExtension:NSExtensionPointIdentifier string com.apple.Safari.web-extension" \
  -c "Add :NSExtension:NSExtensionPrincipalClass string SafariWebExtensionHandler" \
  "$P"

P="$APP/Contents/Info.plist"
plist -c "Add :CFBundleDevelopmentRegion string en" \
  -c "Add :CFBundleDisplayName string $APP_NAME" \
  -c "Add :CFBundleExecutable string $APP_NAME" \
  -c "Add :CFBundleIconFile string AppIcon" \
  -c "Add :CFBundleIdentifier string $BUNDLE_ID" \
  -c "Add :CFBundleInfoDictionaryVersion string 6.0" \
  -c "Add :CFBundleName string $APP_NAME" \
  -c "Add :CFBundlePackageType string APPL" \
  -c "Add :CFBundleShortVersionString string $VERSION" \
  -c "Add :CFBundleVersion string $BUILD_NUMBER" \
  -c "Add :CFBundleSupportedPlatforms array" \
  -c "Add :CFBundleSupportedPlatforms:0 string MacOSX" \
  -c "Add :LSApplicationCategoryType string public.app-category.music" \
  -c "Add :LSMinimumSystemVersion string $MIN_MACOS" \
  -c "Add :NSPrincipalClass string NSApplication" \
  -c "Add :BSFExtensionBundleIdentifier string $EXT_ID" \
  "$P"

# Ad-hoc sign, inside-out. Safari requires sandboxed extensions.
codesign --force --sign - --timestamp=none --options runtime \
  --entitlements safari-src/sandbox.entitlements "$APPEX"
codesign --force --sign - --timestamp=none --options runtime \
  --entitlements safari-src/sandbox.entitlements "$APP"
codesign --verify --deep --strict "$APP"

echo
echo "Built: $APP"
