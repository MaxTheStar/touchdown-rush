// ============================================================
// TOUCHDOWN FUN — settings.js: ⚙️ SETTINGS (Round 22, the home of the Comfort Board)
// ------------------------------------------------------------
// Twenty-one rounds of new football and nothing had ever changed how the game feels to hold, hear or see. Every comfort option lives in
// ONE small panel, opened from the 🛍 Pro Shop (so there is no new chip on the front screen), and every option REGISTERS itself here:
//
//     TDSettings.register({ id, label, hint, type: 'toggle' | 'range' | 'choice', def, options?, onChange? })
//     TDSettings.get(id)  /  TDSettings.set(id, value)
//
// One saved object ('tdr-settings'), one panel, no matter how many options there are. ⚠️ A setting that fails to load (private mode, a
// corrupt save) simply takes its default — the game never depends on it.
// ============================================================
(function () {
  'use strict';
  const KEY = 'tdr-settings';
  const $ = id => document.getElementById(id);
  const items = [];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} }

  function register(it) {
    items.push(it);
    if (saved[it.id] === undefined) saved[it.id] = typeof it.def === 'function' ? it.def() : it.def;
    try { it.onChange && it.onChange(saved[it.id], true); } catch (e) { console.error(e); }
    if ($('settings-body')) render();
  }
  const get = id => { const it = items.find(i => i.id === id); return saved[id] !== undefined ? saved[id] : (it ? (typeof it.def === 'function' ? it.def() : it.def) : undefined); };
  function set(id, v) {
    const it = items.find(i => i.id === id); if (!it) return;
    saved[id] = v; persist();
    try { it.onChange && it.onChange(v, false); } catch (e) { console.error(e); }
    render();
  }

  function render() {
    const body = $('settings-body'); if (!body) return;
    body.innerHTML = items.map(it => {
      const v = get(it.id);
      let ctl = '';
      if (it.type === 'toggle') ctl = '<div class="st-sw' + (v ? ' on' : '') + '" data-id="' + it.id + '" data-act="toggle">' + (v ? 'ON' : 'OFF') + '</div>';
      else if (it.type === 'range') ctl = '<input class="st-rg" type="range" min="0" max="100" value="' + Math.round(v * 100) + '" data-id="' + it.id + '">';
      else if (it.type === 'choice') ctl = '<div class="st-ch">' + it.options.map(o => '<span class="st-op' + (o.v === v ? ' on' : '') + '" data-id="' + it.id + '" data-v="' + o.v + '">' + o.label + '</span>').join('') + '</div>';
      return '<div class="st-row"><div class="st-txt"><b>' + it.label + '</b>' + (it.hint ? '<span>' + it.hint + '</span>' : '') + '</div>' + ctl + '</div>';
    }).join('');
    body.querySelectorAll('[data-act="toggle"]').forEach(el => el.addEventListener('pointerdown', e => { e.preventDefault(); set(el.dataset.id, !get(el.dataset.id)); }));
    body.querySelectorAll('.st-op').forEach(el => el.addEventListener('pointerdown', e => { e.preventDefault(); const it = items.find(i => i.id === el.dataset.id); const raw = el.dataset.v; set(el.dataset.id, it.options.find(o => String(o.v) === raw).v); }));
    body.querySelectorAll('.st-rg').forEach(el => el.addEventListener('input', () => { saved[el.dataset.id] = el.value / 100; persist(); const it = items.find(i => i.id === el.dataset.id); try { it.onChange && it.onChange(saved[el.dataset.id], false); } catch (e) {} }));
  }

  function open() { const m = $('settings-modal'); if (!m) return; render(); m.style.display = 'flex'; }
  function close() { const m = $('settings-modal'); if (m) m.style.display = 'none'; }
  function wire() {
    const tap = (id, fn) => { const el = $(id); if (el) el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); }); };
    tap('open-settings', open); tap('settings-close', close);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  window.TDSettings = { register, get, set, open, close, _items: () => items.map(i => i.id) };
})();
