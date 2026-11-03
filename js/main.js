// Application bootstrap. Loaded after every game module and before the optional add-ons
// (effects.js, save-load.js), so all functions it calls already exist.
newGame();
applyLang();
applyMode();
setTimeout(() => { try { openQuickStart(); } catch (e) { /* start menu is optional */ } }, 0);
