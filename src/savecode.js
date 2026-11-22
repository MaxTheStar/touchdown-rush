// ============================================================
// TOUCHDOWN FUN — savecode.js: 📋 SAVE CODE (Round 28, pick ⑥)  window.TDSaveCode
// ------------------------------------------------------------
// Your coins, team, season and trophies live in ONE browser on ONE device, so a new phone starts from zero. ⚙️ Settings → 📋 Save code now opens a card:
//   📤 YOUR CODE   a long piece of text for everything saved on this device. Copy it (or select it) and paste it anywhere.
//   📥 PASTE A CODE   put a code from another device here and tap LOAD. It asks you to confirm, then REPLACES this device's game with the code's.
// A code is `TDF1-<checksum>-<data>`: the data is every `tdr-*` save in this browser, base64'd; the checksum is how a mistyped or half-copied code is caught.
// ⚠️ IMPORTING OVERWRITES THE GAME ON THIS DEVICE, so it (1) rejects anything that is not a real, whole code, (2) shows how big the save is and needs a
//    SECOND tap on a red button, and (3) writes ONLY keys named `tdr-<letters/digits/dash/underscore>`, never anything else on this site, and never
//    the private coin-link flag (`tdr-mc`), which is a device matter, not a game save. The old saves are removed only AFTER the whole code has been validated.
// ⚠️ A CODE IS YOUR WHOLE SAVE IN PLAIN TEXT-ISH FORM (not encrypted): anyone you give it to gets your coins and team. Fine for a kids' game; say so on the card.
// ⚠️ NEVER SENT ANYWHERE: nothing is uploaded. It is copy and paste by hand. Hosting a shared save would need a backend this game does not have.
// ============================================================
(function () {
  'use strict';
  const PREFIX = 'TDF1-', MAX_TOTAL = 3 * 1024 * 1024, MAX_ONE = 1024 * 1024, KEY_RE = /^tdr-[a-z0-9_-]{1,48}$/;
  const SKIP = { 'tdr-mc': 1 };                    // the private coin-link flag stays on its own device
  const $ = id => document.getElementById(id);

  const hash = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(36); };
  const b64 = s => btoa(unescape(encodeURIComponent(s)));
  const unb64 = s => decodeURIComponent(escape(atob(s)));

  // every tdr-* save in this browser as { key: rawString }
  function collect() {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && KEY_RE.test(k) && !SKIP[k]) out[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return out;
  }
  function encode(map) {
    const data = b64(JSON.stringify({ v: 1, k: map }));
    return PREFIX + hash(data) + '-' + data;
  }
  // validate a code: returns { ok:true, map } or { ok:false, why }. Writes NOTHING.
  function decode(code) {
    try {
      code = String(code || '').replace(/\s+/g, '');
      if (code.indexOf(PREFIX) !== 0) return { ok: false, why: 'That is not a Touchdown Fun code (it should start with ' + PREFIX + ').' };
      const rest = code.slice(PREFIX.length), dash = rest.indexOf('-');
      if (dash < 1) return { ok: false, why: 'That code looks cut off.' };
      const sum = rest.slice(0, dash), data = rest.slice(dash + 1);
      if (hash(data) !== sum) return { ok: false, why: 'That code is damaged or only partly copied. Copy the whole thing again.' };
      const obj = JSON.parse(unb64(data));
      if (!obj || obj.v !== 1 || !obj.k || typeof obj.k !== 'object') return { ok: false, why: 'That code is from a different version.' };
      const map = {}; let total = 0, n = 0;
      for (const k of Object.keys(obj.k)) {
        const v = obj.k[k];
        if (!KEY_RE.test(k) || SKIP[k] || typeof v !== 'string' || v.length > MAX_ONE) continue;   // anything odd is ignored, never written
        total += v.length; n++;
        if (total > MAX_TOTAL) return { ok: false, why: 'That code is too big.' };
        map[k] = v;
      }
      if (!n) return { ok: false, why: 'That code has no game save in it.' };
      return { ok: true, map, count: n, bytes: total };
    } catch (e) { return { ok: false, why: 'That code could not be read.' }; }
  }
  // replace this device's game with a validated map (the caller already validated it)
  function apply(map) {
    const old = collect();
    try { Object.keys(old).forEach(k => localStorage.removeItem(k)); Object.keys(map).forEach(k => localStorage.setItem(k, map[k])); return true; }
    catch (e) { try { Object.keys(old).forEach(k => localStorage.setItem(k, old[k])); } catch (x) {} return false; }   // a full disk puts the old game back
  }

  // ---- the card ------------------------------------------------------------
  function open() {
    let el = $('sc-modal'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'sc-modal'; el.className = 'ov'; el.style.zIndex = 95; el.style.display = 'flex';
    const code = encode(collect());
    el.innerHTML = '<div class="ov-card" style="text-align:left">' +
      '<div class="ov-title" style="text-align:center">📋 SAVE CODE</div>' +
      '<div class="ov-sub" style="text-align:center">Move your game to another phone or computer.</div>' +
      '<div style="font:800 13px Arial;color:#ffe066;margin:6px 0 3px">📤 YOUR CODE</div>' +
      '<textarea id="sc-out" readonly style="width:100%;height:70px;box-sizing:border-box;font:11px monospace;background:#0b1428;color:#cfe3ff;border:1px solid #2d5a9e;border-radius:8px;padding:6px"></textarea>' +
      '<div style="display:flex;gap:8px;margin:6px 0 4px"><div class="ov-btn" id="sc-copy" style="flex:1;text-align:center">COPY</div></div>' +
      '<div style="font:11px Arial;color:#aab6c8;margin-bottom:8px">This is your whole game (coins, team, trophies). Anyone who has it can load it, so only share it with yourself.</div>' +
      '<div style="font:800 13px Arial;color:#ffe066;margin:8px 0 3px">📥 PASTE A CODE</div>' +
      '<textarea id="sc-in" placeholder="Paste a code from your other device here" style="width:100%;height:70px;box-sizing:border-box;font:11px monospace;background:#0b1428;color:#cfe3ff;border:1px solid #2d5a9e;border-radius:8px;padding:6px"></textarea>' +
      '<div id="sc-msg" style="font:700 12px Arial;color:#ff9a9a;min-height:16px;margin:4px 0"></div>' +
      '<div style="display:flex;gap:8px"><div class="ov-btn yes" id="sc-load" style="flex:1;text-align:center">LOAD</div><div class="ov-btn" id="sc-close" style="flex:1;text-align:center">CLOSE</div></div></div>';
    document.body.appendChild(el);
    $('sc-out').value = code;
    const msg = (t, good) => { const m = $('sc-msg'); m.textContent = t; m.style.color = good ? '#9be7a8' : '#ff9a9a'; };
    const tap = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    tap('sc-close', () => el.remove());
    tap('sc-copy', () => {
      const ta = $('sc-out'); ta.select();
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => msg('Copied!', true), () => { document.execCommand('copy'); msg('Copied!', true); }); else { document.execCommand('copy'); msg('Copied!', true); } }
      catch (e) { msg('Select the text above and copy it by hand.', false); }
    });
    let armed = null;
    tap('sc-load', () => {
      const r = decode($('sc-in').value);
      if (!r.ok) { armed = null; $('sc-load').textContent = 'LOAD'; msg(r.why, false); return; }
      if (!armed) {     // the first tap only checks it and asks
        armed = r; $('sc-load').textContent = '⚠️ YES, REPLACE MY GAME';
        msg('Code OK: ' + r.count + ' saves, ' + Math.max(1, Math.round(r.bytes / 1024)) + ' KB. This REPLACES the game on this device. Tap again to do it.', false);
        return;
      }
      if (apply(armed.map)) { msg('Loaded! Restarting…', true); setTimeout(() => location.reload(), 600); }
      else { armed = null; $('sc-load').textContent = 'LOAD'; msg('Could not save it (storage is full). Your game is unchanged.', false); }
    });
    $('sc-in').addEventListener('input', () => { armed = null; $('sc-load').textContent = 'LOAD'; msg('', true); });
  }
  function init() {
    if (window.TDSettings) TDSettings.register({ id: 'savecode', label: '📋 Save code', type: 'action', button: 'OPEN',
      hint: 'Copy your whole game as a code to move it to another device, or load one here.', onTap: open });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TDSaveCode = { collect, encode, decode, apply, open, hash };
})();
