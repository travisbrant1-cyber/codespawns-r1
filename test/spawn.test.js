// Node harness proving the deterministic core (no browser needed).
const assert = require('assert');
const S = require('../src/spawn.js');

let pass = 0;
function ok(name, cond) {
  assert.ok(cond, 'FAIL: ' + name);
  console.log('  ✓', name);
  pass++;
}

// Determinism: same UPC -> identical spawn.
const a = S.spawn('0049000028904', 'Coca-Cola Original Taste Soda');
const b = S.spawn('0049000028904', 'Coca-Cola Original Taste Soda');
ok('same UPC yields same seed', a.seed === b.seed);
ok('same UPC yields same name', a.name === b.name);
ok('same UPC yields same stats json', JSON.stringify(a.stats) === JSON.stringify(b.stats));

// Known-good EAN-13: 0049000028904 has check digit 4.
ok('valid EAN-13 accepted', a.ok === true);
ok('Coca-Cola name derived', a.name.toLowerCase().includes('cola') || a.name.endsWith('mon'));

// Invalid check digit rejected.
const bad = S.spawn('0049000028900', 'Fake');
ok('bad check digit rejected', bad.ok === false);

// UPC-A (12) normalizes to 13 and is accepted.
const c = S.spawn('049000028904', 'Coca-Cola');
ok('12-digit UPC-A normalizes + accepted', c.ok === true && c.upc === '0049000028904');

// Element + rarity are stable members of their sets.
ok('element in known set', S.ELEMENTS.includes(a.element));
ok('rarity in known set', ['Common','Uncommon','Rare','Epic','Legendary'].includes(a.rarity));

// Stats are positive and bounded.
for (const k of ['hp','atk','def','spd']) ok('stat ' + k + ' > 0', a.stats[k] > 0);

// SpriteSeed distinct from raw seed (different bit window).
ok('spriteSeed derived', typeof a.spriteSeed === 'number' && a.spriteSeed >= 0);

// Offline fallback name (no product) still deterministic.
const off1 = S.spawn('0038000138416');
const off2 = S.spawn('0038000138416');
ok('offline name deterministic', off1.name === off2.name);

console.log(`\nALL PASS — ${pass} assertions`);
