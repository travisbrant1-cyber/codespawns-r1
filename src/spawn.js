// CODESPAWNS core spawn logic — framework-agnostic, runs in Node and the R1 WebView.
// UPC -> deterministic 32-bit seed -> stats + species + element + spriteSeed.

const ELEMENTS = ['Fire', 'Water', 'Grass', 'Tech', 'Ghost', 'Astro'];

// Simple deterministic 32-bit hash (FNV-1a) of a string.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

// Normalize UPC-A (12) / EAN-13 (13) to a 13-char string.
function normalizeUpc(upc) {
  let s = String(upc).replace(/\D/g, '');
  if (s.length === 12) s = '0' + s;          // UPC-A -> EAN-13
  if (s.length !== 13) return { ok: false, upc: s };
  // EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = +s[i];
    sum += (i % 2 === 0) ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== +s[12]) return { ok: false, upc: s };
  return { ok: true, upc: s };
}

// Deterministic seed from a (assumed normalized) UPC.
function seedFromUpc(upc) {
  return fnv1a(upc);
}

// Derive stats from seed. Each stat pulls from distinct bit ranges.
function statsFromSeed(seed, rarityMul = 1) {
  const atk = 30 + (seed & 0x3f) + Math.floor((seed >>> 6 & 0x3f) / 2);
  const def = 30 + (seed >>> 12 & 0x3f) + Math.floor((seed >>> 18 & 0x3f) / 2);
  const spd = 20 + (seed >>> 24 & 0x3f);
  const hp  = 80 + ((seed >>> 3 & 0x7f) * 2);
  const scale = (v) => Math.round(v * rarityMul);
  return { hp: scale(hp), atk: scale(atk), def: scale(def), spd: scale(spd) };
}

const PREFIX = ['Volt', 'Grim', 'Pyro', 'Aqua', 'Toxi', 'Lumi', 'Kryo', 'Zeph', 'Maga', 'Brum'];
const SUFFIX = ['igor', 'ax', 'ion', 'ulus', 'ech', 'orn', 'yx', 'ara', 'oth', 'ix'];

// Name from product text (optional) or from seed syllables (offline).
function nameFromProduct(productName, seed) {
  if (productName && productName.trim()) {
    // Derive a creature-ish name from the first meaningful word.
    const word = productName.trim().split(/\s+/)[0].replace(/[^A-Za-z]/g, '');
    if (word.length >= 3) {
      return word.slice(0, 1).toUpperCase() + word.slice(1, 5).toLowerCase() + 'mon';
    }
  }
  const p = PREFIX[seed & 0xf];
  const s = SUFFIX[(seed >>> 4) & 0xf];
  return p + s;
}

function elementFromSeed(seed) {
  return ELEMENTS[(seed >>> 8) % ELEMENTS.length];
}

function spriteSeedFromSeed(seed) {
  return ((seed >>> 16) ^ (seed << 3)) >>> 0;
}

// Rarity from seed bits (weighted common).
function rarityFromSeed(seed) {
  const r = (seed >>> 20) % 100;
  if (r < 50) return 'Common';
  if (r < 78) return 'Uncommon';
  if (r < 92) return 'Rare';
  if (r < 98) return 'Epic';
  return 'Legendary';
}

const RARITY_MUL = { Common: 1, Uncommon: 1.1, Rare: 1.25, Epic: 1.45, Legendary: 1.7 };

// Full spawn from a raw UPC (optionally with resolved product name).
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

module.exports = {
  ELEMENTS, fnv1a, normalizeUpc, seedFromUpc, statsFromSeed,
  nameFromProduct, elementFromSeed, spriteSeedFromSeed, rarityFromSeed, spawn, RARITY_MUL,
};
