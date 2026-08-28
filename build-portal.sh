#!/bin/bash
# ============================================================
# TOUCHDOWN FUN — build the CrazyGames (portal) package 🏈
# ------------------------------------------------------------
# Game portals want a game that is 100% SELF-CONTAINED: it may not call
# out to the internet at all. Our normal GitHub Pages version does two
# things a portal won't allow — it loads Phaser from a CDN, and it talks
# to a couple of free web services for the 🌍 world tracker.
#
# So this script makes a COPY with three changes, and never touches the
# real game:
#   1. Phaser is downloaded and bundled into the folder
#   2. src/stats.js is swapped for a quiet stand-in that makes no
#      network calls (same shape, so nothing else breaks)
#   3. the world-tracker panel and the developer dashboard link are
#      removed, along with the social tags that point at our own site
#
# Run it:   bash build-portal.sh
# Result:   build/portal/            <- drag THESE files into CrazyGames
#           build/touchdown-fun.zip  <- the same thing zipped
#
# ⚠️ CrazyGames does NOT accept zip files in their upload box — open the
# folder, select all, and drag the FILES in. The zip is just a backup.
# ============================================================
set -e
cd "$(dirname "$0")"

OUT="build/portal"
PHASER_URL="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"

echo "🧹 clearing old build…"
rm -rf build
mkdir -p "$OUT"

echo "📦 copying the game…"
cp index.html "$OUT/"
cp -R src "$OUT/"
# the browser-tab icon and the sharing picture (real files, kept local)
for img in favicon.png apple-touch-icon.png icon-512.png share.png; do
  [ -f "$img" ] && cp "$img" "$OUT/"
done

echo "⬇️  bundling Phaser…"
curl -sSL -o "$OUT/phaser.min.js" "$PHASER_URL"
grep -q "Phaser" "$OUT/phaser.min.js" || { echo "❌ Phaser download looks wrong"; exit 1; }

echo "🔌 cutting the outside connections…"
# 1) Phaser from the CDN -> the copy sitting right next to index.html
perl -pi -e 's{<script src="https://cdn\.jsdelivr\.net/npm/phaser\@3\.87\.0/dist/phaser\.min\.js"></script>}{<script src="phaser.min.js"></script>}' "$OUT/index.html"
# 2) the 🌍 world-tracker panel (it uses the counter services + links to the dev dashboard)
perl -0pi -e 's{  <!-- \xF0\x9F\x8C\x8D The world tracker.*?</aside>\n}{  <!-- World tracker removed for the portal build (it needs outside services). -->\n}s' "$OUT/index.html"
# 3) social tags that point at our own website -> keep the words, drop the links
perl -pi -e 's{content="https://maxthestar\.github\.io/touchdown-rush/share\.png\?v=\d+"}{content="share.png"}g' "$OUT/index.html"
perl -pi -e 's{content="https://maxthestar\.github\.io/touchdown-rush/"}{content=""}g' "$OUT/index.html"
# 4) the no-network stand-in for the world counters
cat > "$OUT/src/stats.js" <<'STUB'
// ============================================================
// TOUCHDOWN FUN — stats.js  (PORTAL BUILD — no-network stand-in)
// ------------------------------------------------------------
// The real stats.js talks to two free web services to power the 🌍 world
// tracker and the review pop-up. Game portals want a game that makes NO
// outside calls, so this quiet stand-in takes its place for that build.
//
// It keeps the exact same window.TDStats shape the rest of the game
// expects, so nothing breaks — the calls simply don't go anywhere.
// Your normal GitHub Pages version still has the full world tracker.
// ============================================================
(function () {
  'use strict';
  function store(k, v) { try { localStorage.setItem('tdr-' + k, JSON.stringify(v)); } catch (e) {} }
  function load(k, f) {
    try { var r = localStorage.getItem('tdr-' + k); return r === null ? f : JSON.parse(r); }
    catch (e) { return f; }
  }
  function recordGameStart() { /* no world counter in this build */ }
  function recordGameEnd() { store('games', load('games', 0) + 1); }   // still counts YOUR games
  function openReview() {}
  function refreshTracker() {}
  var zero = function () { return Promise.resolve(0); };
  window.TDStats = {
    recordGameStart: recordGameStart, recordGameEnd: recordGameEnd,
    openReview: openReview, refreshTracker: refreshTracker,
    shared: {
      API: '', NS: '', DEV: false, ALL_COUNTRIES: [],
      peek: zero, peekCareful: function () { return Promise.resolve({ n: 0 }); },
      bump: function () { return Promise.resolve(false); },
      flagOf: function (c) { return c; }, nameOf: function (c) { return c; },
      load: load, store: store,
      sleep: function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    }
  };
})();
STUB

echo "🔎 checking nothing reaches outside…"
BAD=$(grep -rEo "https?://[^\"' )]+" "$OUT/index.html" "$OUT/src/" | grep -vE "w3\.org|xmlns" || true)
if [ -n "$BAD" ]; then echo "❌ still reaching outside:"; echo "$BAD"; exit 1; fi
NET=$(grep -rE "fetch\(|XMLHttpRequest|WebSocket|sendBeacon" "$OUT/index.html" "$OUT/src/" || true)
if [ -n "$NET" ]; then echo "❌ network calls left:"; echo "$NET"; exit 1; fi
[ -f "$OUT/index.html" ] || { echo "❌ index.html missing"; exit 1; }
grep -q 'src="phaser.min.js"' "$OUT/index.html" || { echo "❌ Phaser not bundled"; exit 1; }

echo "🗜  zipping a backup…"
find "$OUT" -name ".DS_Store" -delete 2>/dev/null || true
( cd "$OUT" && zip -rqX ../touchdown-fun.zip . -x "*.DS_Store" )

echo ""
echo "✅ portal build ready"
echo "   folder : $OUT   ($(find "$OUT" -type f | wc -l | tr -d ' ') files, $(du -sh "$OUT" | cut -f1))"
echo "   backup : build/touchdown-fun.zip"
echo ""
echo "   Upload: open $OUT, select everything inside (⌘A), drag into CrazyGames."
