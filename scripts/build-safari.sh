#!/usr/bin/env bash
# Build the extension and wrap it in a macOS Safari Web Extension app.
#
# Requires macOS with Xcode installed (for `xcrun safari-web-extension-converter`
# and `xcodebuild`). Output:
#   safari/Better SoundCloud Feed/           generated Xcode project (gitignored)
#   safari/build/Build/Products/Release/Better SoundCloud Feed.app
#
# Env vars:
#   CONFIGURATION=Debug|Release   (default Release)
#   SKIP_XCODEBUILD=1             only generate the Xcode project
#   BUNDLE_ID=...                 app bundle id (default com.sjurgis.bettersoundcloudfeed)
set -euo pipefail

cd "$(dirname "$0")/.."

APP_NAME="Better SoundCloud Feed"
BUNDLE_ID="${BUNDLE_ID:-com.sjurgis.bettersoundcloudfeed}"
CONFIGURATION="${CONFIGURATION:-Release}"
OUT_DIR="safari"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "build:safari must run on macOS with Xcode installed" >&2
  exit 1
fi

pnpm build

rm -rf "$OUT_DIR/$APP_NAME" "$OUT_DIR/build"
mkdir -p "$OUT_DIR"

# --copy-resources copies dist/ into the Xcode project so it is self-contained.
xcrun safari-web-extension-converter dist \
  --project-location "$OUT_DIR" \
  --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" \
  --macos-only \
  --swift \
  --copy-resources \
  --no-open \
  --no-prompt \
  --force

if [[ "${SKIP_XCODEBUILD:-}" == "1" ]]; then
  echo "Xcode project generated in $OUT_DIR/$APP_NAME"
  exit 0
fi

# Ad-hoc signed ("-") build: no Apple Developer account needed. Safari will only
# load it with Develop > Allow Unsigned Extensions enabled (resets on Safari quit).
xcodebuild \
  -project "$OUT_DIR/$APP_NAME/$APP_NAME.xcodeproj" \
  -scheme "$APP_NAME" \
  -configuration "$CONFIGURATION" \
  -derivedDataPath "$OUT_DIR/build" \
  CODE_SIGN_IDENTITY="-" \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM="" \
  build

APP_PATH="$OUT_DIR/build/Build/Products/$CONFIGURATION/$APP_NAME.app"
echo
echo "Built: $APP_PATH"
echo "Copy it to ~/Applications (or /Applications), open it once, then enable it in Safari > Settings > Extensions."
