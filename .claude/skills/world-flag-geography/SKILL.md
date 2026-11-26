---
name: world-flag-geography
description: Domain expertise on national flags, country names, alternative and native names, geographic regions, flag symbolism, official flag proportions, visually similar flags, and geographic accuracy for the FlagMaster app's 195-country core set. Use this whenever building, editing or checking country data, flag images, aliases accepted in answers, regions/continents, flag facts or mnemonics, or look-alike flag groups, even if the request just says "add country data", "fix the flag", or "is this name right".
---

# World Flag Geography Expert

Accuracy is the product. A wrong flag or a wrongly rejected answer destroys trust faster than any UI bug. Verify, don't assume.

## The 195-country core set

- 193 UN member states + 2 UN General Assembly observer states: **Vatican City (VAT)** and **Palestine (PSE)**.
- From `mledoze/countries` (npm `world-countries`): take every entry with `unMember === true` **or** `cca3` in `VAT`/`PSE`. Note: `world-countries` 5.1.0 wrongly flags Vatican as `unMember` (194 flagged), so don't assert 193 on that field — assert the final set is exactly 195, cca3 codes are unique, and it matches an explicit expected cca3 list checked into tests. (Verified: all 195 have a `flag-icons` 4x3 SVG via lowercase `cca2`.)
- Excluded from the core set (could appear only in an optional "territories & partially recognised" extra): Kosovo, Taiwan, Western Sahara, Northern Cyprus, Somaliland, and all dependent territories (Greenland, Puerto Rico, Hong Kong, etc.).
- Display names: use common English names learners expect ("Ivory Coast" alias for "Côte d'Ivoire", "Czechia" with alias "Czech Republic", "Eswatini" with alias "Swaziland", "North Macedonia" with alias "Macedonia", "Türkiye" alias "Turkey", "Myanmar" alias "Burma", "Cabo Verde"/"Cape Verde", "Timor-Leste"/"East Timor", "DR Congo"/"Democratic Republic of the Congo" vs "Republic of the Congo"/"Congo-Brazzaville").

## Names and aliases (used by fuzzy search)

Build aliases from: `name.common`, `name.official`, `altSpellings` (filter out 2–3 letter ISO-like codes unless they're genuinely used, e.g. "UK", "USA", "UAE", "DRC"), and English `translations` if useful. Strip diacritics for matching but display the proper spelling.

Dangerous near-collisions — these are *different countries* and must never fuzzy-match each other: Niger/Nigeria, Dominica/Dominican Republic, Guinea/Guinea-Bissau/Equatorial Guinea/Papua New Guinea, Congo/DR Congo, Sudan/South Sudan, Korea (North/South), Austria/Australia, Iran/Iraq, Mali/Malawi, Gambia/Zambia, Slovakia/Slovenia, Samoa (not American Samoa), Mauritania/Mauritius. A bare ambiguous input like "Congo", "Korea" or "Guinea" must not be auto-accepted for the more specific country.

## Flag images

- `flag-icons` ships SVGs in **4x3** and **1x1** viewports only — these are *not* official proportions. For learning, display each flag at its official aspect ratio (store `flagRatio` per country) using `object-fit: contain` on the 4x3 SVG, or source correctly proportioned SVGs. Never stretch.
- Notable official ratios: most 2:3; many 1:2 (e.g. UK, Canada); Switzerland and Vatican **1:1**; Qatar **11:28**; Nepal is **non-rectangular** (double pennant) — render with transparent background, no rectangle border; Belgium 13:15; Monaco 4:5 vs Indonesia 2:3; Denmark 28:37; Norway 8:11; USA 10:19; Iran 4:7. When unsure, check the country's Wikipedia flag infobox and record the source.
- Check current designs: flags change (e.g. Syria adopted the green-white-black three-star flag in 2025; Afghanistan's displayed flag is a contested-recognition case — follow the source dataset and note it). Before shipping, compare every flag against Wikipedia's "Gallery of sovereign state flags".
- Alt text during a question must be neutral ("Flag to identify"), never the country name. Filenames like `fr.svg` leak the answer to anyone reading the DOM; acceptable for casual play, but prefer inlined or hashed assets if feasible.

## Regions

Use the dataset's `region` (Africa, Americas, Asia, Europe, Oceania) and `subregion`. Split Americas into North America (incl. Central America & Caribbean) and South America for learner-friendly continents. Cross-continental cases (Russia, Türkiye, Egypt, Kazakhstan) follow the dataset; don't invent.

## Look-alike flag groups

See `references/similar-flags.md` for the confusable groups and the one-line distinguishing cue for each pair. Use these for distractors, discrimination drills and corrective feedback.

## Symbolism and mnemonics

Keep facts short, verifiable and neutral. Avoid politically loaded claims; when symbolism is disputed, say "commonly said to represent". One concrete visual hook per flag is more useful than a paragraph of history.
