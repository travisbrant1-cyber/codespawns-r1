// CODESPAWNS core spawn logic — UMD: works in Node (require) and the R1 WebView (window.CSP).
// UPC -> deterministic 32-bit seed -> stats + species + element + spriteSeed.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CSP = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const ELEMENTS = ['Fire', 'Water', 'Grass', 'Tech', 'Ghost', 'Astro'];

  // Simple deterministic 32-bit hash (FNV-1a) of a string.
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  // Normalize UPC-A (12) / EAN-13 (13) to a 13-char string.
  function normalizeUpc(upc) {
    let s = String(upc).replace(/\D/g, '');
    if (s.length === 12) s = '0' + s;
    if (s.length !== 13) return { ok: false, upc: s };
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = +s[i];
      sum += (i % 2 === 0) ? d : d * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    if (check !== +s[12]) return { ok: false, upc: s };
    return { ok: true, upc: s };
  }

  function seedFromUpc(upc) { return fnv1a(upc); }

  function statsFromSeed(seed, rarityMul) {
    const atk = 30 + (seed & 0x3f) + Math.floor((seed >>> 6 & 0x3f) / 2);
    const def = 30 + (seed >>> 12 & 0x3f) + Math.floor((seed >>> 18 & 0x3f) / 2);
    const spd = 20 + (seed >>> 24 & 0x3f);
    const hp  = 80 + ((seed >>> 3 & 0x7f) * 2);
    const scale = (v) => Math.round(v * (rarityMul || 1));
    return { hp: scale(hp), atk: scale(atk), def: scale(def), spd: scale(spd) };
  }

  const PREFIX = ['Volt','Grim','Pyro','Aqua','Toxi','Lumi','Kryo','Zeph','Maga','Brum'];
  const SUFFIX = ['igor','ax','ion','ulus','ech','orn','yx','ara','oth','ix'];

  function nameFromProduct(productName, seed) {
    if (productName && productName.trim()) {
      const word = productName.trim().split(/[^A-Za-z]+/).filter(Boolean)[0] || '';
      if (word.length >= 3) return word.slice(0, 1).toUpperCase() + word.slice(1, 5).toLowerCase() + 'mon';
    }
    const p = PREFIX[seed & 0xf];
    const s = SUFFIX[(seed >>> 4) & 0xf];
    return p + s;
  }

  function elementFromSeed(seed) { return ELEMENTS[(seed >>> 8) % ELEMENTS.length]; }
  function spriteSeedFromSeed(seed) { return ((seed >>> 16) ^ (seed << 3)) >>> 0; }

  function rarityFromSeed(seed) {
    const r = (seed >>> 20) % 100;
    if (r < 50) return 'Common';
    if (r < 78) return 'Uncommon';
    if (r < 92) return 'Rare';
    if (r < 98) return 'Epic';
    return 'Legendary';
  }

  const RARITY_MUL = { Common: 1, Uncommon: 1.1, Rare: 1.25, Epic: 1.45, Legendary: 1.7 };

  function spawn(upc, productName) {
    const norm = normalizeUpc(upc);
    if (!norm.ok) return { ok: false, reason: 'invalid UPC', upc: norm.upc };
    const seed = seedFromUpc(norm.upc);
    const rarity = rarityFromSeed(seed);
    return {
      ok: true,
      upc: norm.upc,
      seed,
      name: nameFromProduct(productName, seed),
      element: elementFromSeed(seed),
      rarity,
      stats: statsFromSeed(seed, RARITY_MUL[rarity]),
      spriteSeed: spriteSeedFromSeed(seed),
    };
  }

  // mulberry32 PRNG — for procedural sprite generation from a seed.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  return {
    ELEMENTS, fnv1a, normalizeUpc, seedFromUpc, statsFromSeed,
    nameFromProduct, elementFromSeed, spriteSeedFromSeed, rarityFromSeed,
    spawn, RARITY_MUL, rng,
  };
});
