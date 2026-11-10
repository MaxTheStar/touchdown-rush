// ============================================================
// TOUCHDOWN FUN — throwback.js: 🏷 THROWBACK JERSEYS (Round 25, pick ①)
// ------------------------------------------------------------
// Your team wore the same kit every week. Real teams pull out a throwback once a season.
// Once a season, in ONE home game, your players wear a retro kit: your jersey colour faded toward cream, and the helmet in your
// jersey's own colour (the helmet and jersey swap roles, as the old kits did).
//
// WHICH GAME: the first HOME game of the regular season from week 3 on (the road whites of 👕 homeaway.js are for away games, so a throwback
// can only be a home one); if there is no home game that late, the first home game of the year. Pure function of the schedule: nothing saved.
// ⚠️ COSMETIC ONLY: it changes two colours handed to `makeChibiTexture`, nothing else. It never touches a team code (the Round 11 kit-code
// bug), the opponent, the crowd or any number. Season games only, never a playoff, a quick game or an away game.
// main.js: `homeaway.js kitFor()` asks `TDThrowback.kit(team)`; beginGame says one line on the day.
// ============================================================
(function () {
  'use strict';
  const CREAM = 0xF0E2B8, FADE = 0.55, FIRST_WEEK = 3;
  const G = () => (window.__td ? window.__td.G : null);

  // lerp two Phaser colour ints
  function mix(a, b, t) {
    const ch = s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }
  // the season week that is throwback day for the current season (null when there is no home game)
  function week() {
    try {
      if (!window.TDSeason || !TDSeason.homeAway) return null;
      for (let w = FIRST_WEEK; w <= 6; w++) if (TDSeason.homeAway(w) === 'home') return w;
      for (let w = 1; w < FIRST_WEEK; w++) if (TDSeason.homeAway(w) === 'home') return w;
    } catch (e) {}
    return null;
  }
  function on() {
    const g = G();
    if (!g || !g.seasonGame || g.playoffGame || g.awayGame) return false;
    try { const t = TDSeason.table(); return !!(t && t.phase === 'regular' && t.week === week()); } catch (e) { return false; }
  }
  // the retro kit for this team (pure)
  function kit(team) {
    if (!team) return team;
    return { jersey: mix(team.jersey, CREAM, FADE), helmet: team.jersey };
  }
  window.TDThrowback = { CREAM, FADE, FIRST_WEEK, mix, week, on, kit };
})();
