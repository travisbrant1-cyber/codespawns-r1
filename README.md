# CODESPAWNS 🔱

**A Scannerz-for-today for the Rabbit R1.**

Scan a product's barcode → a deterministic 8-bit monster spawns, its **name and concept** drawn from the product, its **stats and sprite** seeded by the UPC. Catch it, train it, climb the **boss ladder**.

> Inspired by the early-2000s *Barcode Battler / Scannerz* loop, rebuilt for a pocket device with a camera and an LLM.

## Core loop
1. **Scan** a barcode/QR with the R1 camera (jsQR + `getUserMedia`, confirmed working in the R1 WebView).
2. **Resolve** the product name from Open Food Facts (cached; falls back to a synthesized name offline).
3. **Spawn** — UPC → deterministic seed → stats + procedural 8-bit sprite; product name → creature name + element/vibe concept.
4. **Capture Clash** mini-game sets capture quality (level / rarity).
5. Monster joins your roster → battle, train, evolve.
6. **Boss ladder** gates progression; each boss drops an upgrade.

## Architecture decision (verified)
- The R1's LLM is **text-only** — it does not generate images. We do **not** need it to.
- Monsters are **procedurally drawn** pixel art (canvas, NEAREST-scaled) seeded by the UPC → perfectly deterministic, instant, offline, and crisp at 240×282.
- The LLM is used only for the **concept**: send a product name, get structured JSON (`element`, `body`, `vibe`, `color`) to theme the generated art. Hard stats stay UPC-seeded, so the same product always yields the same monster.

## The 6 epics (see GitHub Milestones)
| Epic | Theme | Story pts |
|------|-------|-----------|
| 1 · Scan & Spawn | camera, UPC, name lookup | 18 |
| 2 · Catalog & Types | stats, species, rarity, schema | 17 |
| 3 · 8-bit Art | procedural sprite renderer + parts + palettes | 21 |
| 4 · LLM Concept | R1 LLM concept call + fallback | 15 |
| 5 · Mini-Games | Capture Clash, Forge, Training, items | 19 |
| 6 · Progression & Meta | boss ladder, battle engine, save | 29 |
| **Total** | | **119** |

## Boss ladder
404 Wyrm → CAPTCHA Colossus → Cookie Titan → Spam Kraken → Paywall Hydra → The Algorithm → Dead-Link Dreadnought → The Singularity → (Abyss endless + co-op summon).

## Repo layout
```
r1/                 # the Rabbit R1 creation (HTML/CSS/JS, 240×282) — shipped artifact
src/                # framework-agnostic game logic (seed, stats, catalog, sprite, battle) — testable in Node
test/               # node harness for deterministic logic
scripts/            # build / verify helpers
```
> Per project rule: the shipped `r1/` creation file is NOT edited without explicit sign-off. Logic lives in `src/` so it can be unit-tested headlessly.

## Status
Planning / scaffolding. See the 31 story-point issues under the 6 epic milestones.
