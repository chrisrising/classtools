#!/usr/bin/env bash
# Builds the Windows zip. Runs on Linux or WSL; needs mingw-w64 for the launcher.
#
#   sudo apt install mingw-w64 zip
#   npm i -g @electron/asar
#
set -e
VERSION=$(node -p "require('../app/package.json').version")
ELECTRON=33.4.11
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(dirname "$HERE")
OUT="$ROOT/dist"
WORK="$OUT/ClassTools"

echo "ClassTools $VERSION  (Electron $ELECTRON)"
rm -rf "$OUT"; mkdir -p "$WORK/app"

# 1. the Electron runtime
if [ ! -d "$ROOT/runtime" ]; then
  echo "Fetching Electron $ELECTRON ..."
  mkdir -p "$ROOT/runtime"
  curl -L -o /tmp/electron.zip \
    "https://github.com/electron/electron/releases/download/v$ELECTRON/electron-v$ELECTRON-win32-x64.zip"
  unzip -q /tmp/electron.zip -d "$ROOT/runtime"
fi
cp -r "$ROOT/runtime/." "$WORK/app/"
mv "$WORK/app/electron.exe" "$WORK/app/ClassTools.exe"

# 2. the app itself, packed into the asar the runtime looks for
npx --yes @electron/asar pack "$ROOT/app" "$WORK/app/resources/app.asar"

# 3. the small launcher that sits at the top of the folder, so teachers see one icon
x86_64-w64-mingw32-windres "$ROOT/launcher/launcher.rc" -O coff -o /tmp/launcher_res.o
x86_64-w64-mingw32-gcc -O2 -s -mwindows -o "$WORK/ClassTools.exe" "$ROOT/launcher/launcher.c" /tmp/launcher_res.o

# 4. the optional setup and removal scripts
cp "$HERE/Install to Start menu.cmd" "$HERE/Remove ClassTools.cmd" "$WORK/app/"

# 5. zip it
cd "$OUT" && zip -r -q -9 "ClassTools-Windows-$VERSION.zip" ClassTools
echo "Done: $OUT/ClassTools-Windows-$VERSION.zip"
