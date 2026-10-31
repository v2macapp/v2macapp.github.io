#!/bin/sh
# Renders public/og/*.jpg, one per page, with Chrome. Run again when a page's heading changes; the images are committed.
set -eu
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
cp public/app/icon.webp public/poster.jpg "$TMP/"
while IFS='|' read -r name title sub; do
  cat > "$TMP/$name.html" <<H
<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:radial-gradient(ellipse at 50% 30%,#10264c,#02050c 75%);color:#f5f7fb;font-family:-apple-system,sans-serif}
div{padding:80px 90px}img{width:88px;height:88px;display:block;margin-bottom:60px}
h1{font-size:84px;line-height:1.05;letter-spacing:-.03em;margin:0 0 24px}p{font-size:34px;line-height:1.3;color:rgba(235,240,255,.68);margin:0}
</style><div><img src="icon.webp"><h1>$title</h1><p>$sub</p></div>
H
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 --screenshot="$TMP/$name.png" "file://$TMP/$name.html" >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 80 "$TMP/$name.png" --out "public/og/$name.jpg" >/dev/null
done <<'L'
home|V2Mac|A native macOS client for Xray-core.
sandbox|Secure Sandbox|Every app in its own mini VM, with its own server.
noleaker|Is your browser leaking?|Test WebRTC, time zone, language and QUIC.
v2rayn-for-mac|v2rayN for Mac, and V2Mac|An honest comparison.
v2rayx-alternative|A V2RayX alternative|V2RayX is archived. V2Mac is maintained.
vless-reality-mac|VLESS REALITY on a Mac|Connect with V2Mac in four steps.
hysteria2-mac|Hysteria2 on a Mac|Connect with V2Mac in four steps.
L
