# 📖 Family Cookbook (Eleventy / 11ty)

A static, mobile-friendly family cookbook built with **Eleventy**.  
Recipes are stored as JSON in `content/<Category>/…` and rendered into clean pages with **pagination, categories, tags, breadcrumbs, print styles**, **client‑side search**, and **GitHub Pages** hosting under `/cookbook/`.

---

## ✨ Highlights

- **Stable URLs** for every recipe: `/recipes/<category>/<title>/`
- **Collections-based build** (single source of truth from `content/`)
- **Robust image resolver** (finds images next to JSON, in `images/`, etc.; handles case/extension differences)
- **Path‑prefix safe** links & assets (works at `/cookbook/` on GitHub Pages)
- **Print stylesheet** for nice hard copies
- **Clean dev workflow** with or without a path prefix
- **Yield** and **Source** rendered as full sections (like Ingredients / Directions / Remarks)
- **Client‑side search** using Fuse.js with fuzzy matching
- **Footer “Search” link** for quick access
- **JSON Schema validation** on every recipe at build time (Ajv 2020‑12)

---

## 🧱 Project Structure

```
/
├─ content/                      # Recipe JSON by category (also where images may live)
│  ├─ 01 - Breakfast/
│  │  ├─ Baking Powder Biscuits.json
│  │  └─ BakingPowderBiscuits.png
│  └─ …
├─ src/
│  ├─ index.njk                  # Home
│  ├─ all-recipes.njk            # Paginated "All Recipes" list
│  ├─ categories-index.njk       # /categories/ index page
│  ├─ categories.njk             # Per-category pages (/category/<slug>/)
│  ├─ tags.njk                   # /tags/ index page
│  ├─ tag.njk                    # Per-tag pages (/tags/<slug>/)
│  ├─ recipe-detail.njk          # One page per recipe
│  ├─ search/                    # Search page template (/search/)
│  │  └─ index.njk
│  ├─ search-index.njk           # Generates /search-index.json for Fuse.js
│  ├─ assets/
│  │  └─ js/fuse-search.js       # Client-side search logic
│  ├─ layouts/
│  │  └─ base.njk                # Layout; all links use | url (pathPrefix-safe)
│  ├─ style.css                  # Main stylesheet
│  └─ print.css                  # Print stylesheet
├─ .eleventy.js                  # Config: data loader, collections, passthroughs, prefix, schema validation
├─ package.json
└─ README.md
```

---

## 🧠 Data Model (normalized)

The loader in `.eleventy.js` reads each `content/<Category>/*.json`, normalizes fields, and produces a collection item with:

- `title` — from `title | Title | name | recipeTitle | meta.title | filename`
- `category` — from folder name or JSON; used for grouping
- `filename` — JSON filename without extension
- `slugCategory`, `slugTitle`, `slugTitleUnique`, `slugTitleFlat`
- `urlPath` — canonical path `/recipes/<slugCategory>/<slugTitleUnique>/`
- `ingredients` — from `ingredients|Ingredients|…`
- `directions` — from `directions|Directions|instructions|Instructions`
- `remarks` — from `remarks|Remarks|notes|…` (with `Yield:` / `Source:` stripped if embedded)
- `yield` — from `yield|Yield|servings|…` or extracted from remarks
- `source` — from `source|Source|attribution|…` or extracted from remarks
- `imageUrl` — resolved to a public URL by scanning likely locations
- `tags` — normalized to a simple string array

> The build **fails** if a recipe doesn’t conform to the schema (see “Schema Validation” below).

---

## 🌐 URL Structure

- **All Recipes (paginated):** `/recipes/page/1/`, `/recipes/page/2/`, …
- **Recipe detail:** `/recipes/<category-slug>/<title-slug>/`
- **Categories index:** `/categories/`
- **Per category:** `/category/<category-slug>/`
- **Tags index:** `/tags/`
- **Per tag:** `/tags/<tag-slug>/`
- **Search:** `/search/` (powered by Fuse.js)

---

## 🔍 Search

- `/search-index.json` built at compile time with all recipes (title, tags, category, URL)
- `/search/` page uses Fuse.js for fuzzy matching
- Debounced input for instant results
- Displays matched recipe title, category, tags, and optional match score

---

## ✅ Schema Validation (JSON Schema 2020‑12)

We validate each recipe JSON against `src/_data/recipe.schema.json` during the Eleventy build using **Ajv**.

- Draft: **2020‑12** (`$schema: "https://json-schema.org/draft/2020-12/schema"`)
- Runtime: **Ajv 8 (2020 build)** + **ajv-formats**

If validation fails, Eleventy logs which file failed and why, and the build stops.

### Install (dev dependencies)

```bash
npm i -D ajv@^8 ajv-formats@^2
```

### Implementation (in `.eleventy.js`)

```js
// Use the 2020 build of Ajv for draft 2020-12 schemas
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const recipeSchema = require("./src/_data/recipe.schema.json");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateRecipe = ajv.compile(recipeSchema);

// ...when loading each recipe object:
const ok = validateRecipe(data);
if (!ok) {
  const details = validateRecipe.errors.map(e => `• ${e.instancePath || "(root)"} ${e.message}`).join("\\n");
  throw new Error(`Recipe schema validation failed for ${where}\\n${details}`);
}
```

### Troubleshooting

- **Error:** `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`  
  **Fix:** Ensure you’re importing `ajv/dist/2020` (not the default Ajv export), then reinstall deps:
  ```bash
  rm -rf node_modules package-lock.json
  npm i
  ```

---

## 🧪 Local Development

```bash
# Install dependencies
npm install

# Serve without prefix (browse at http://localhost:8080/)
PATH_PREFIX=/ npm run serve

# Serve with /cookbook/ prefix (browse at http://localhost:8080/cookbook/)
npm run serve
```

> The dev server respects `PATH_PREFIX` at runtime so you can test GitHub Pages behavior locally.

---

## 🏗️ Build & Deploy (GitHub Pages)

```bash
npm run build
```

- Output goes to `dist/`.
- Default `pathPrefix` is `/cookbook/`; override by setting `PATH_PREFIX` (e.g., `/` for root).

**GitHub Pages tip:** If publishing from `dist/` via Actions, make sure your action copies `./dist` to the Pages artifact and **does not** strip the subfolder structure.

---

## ⚙️ Configuration

Environment variable(s):

- `PATH_PREFIX` — overrides the site prefix. Examples:
  - `PATH_PREFIX=/` → site at domain root
  - `PATH_PREFIX=/cookbook/` → site under `/cookbook/` (default behavior in code)

The config auto‑detects and passthrough‑copies the following if they exist:
- `src/style.css` → `/style.css`
- `src/print.css` → `/print.css`
- `src/images/**` → `/images/**`
- `src/assets/js/fuse-search.js` → `/assets/js/fuse-search.js`
- `content/**` (or `src/content/**`) → `/content/**`

---

## ➕ Adding a Recipe

1. Create or choose a category folder under `content/`, e.g. `content/01 - Breakfast/`.
2. Add a JSON file with required fields (**Title**, **Ingredients**, **Instructions**) and optional fields (**Image**, **Tags**, **Remarks**, **Yield**, **Source**).
3. Place the image next to the JSON or in `src/images/`.
4. Run the dev server; schema validation will catch any issues.

---

## 🧭 Roadmap (next steps)

**Near‑term**  
- 🔒 Finalize `recipe.schema.json` field definitions (tighten types, require non‑empty arrays for `ingredients`/`directions`).  
- 🧪 Add a lightweight CI task (GitHub Actions) that runs `npm ci && npm run build` to validate schema and links.  
- 🔍 Enhance search UX (highlighted matches, keyboard navigation, “no results” state).  
- 🖼️ Image improvements: responsive `<img srcset>` and basic lazy‑loading.  
- 🧾 Print view: “Print Recipe” button confirmed; add a print‑friendly header with title/yield/source.  

**Medium‑term**  
- 🧰 “Add Recipe” helper (local form or Netlify CMS) that writes valid JSON per schema.  
- 🗂️ Category & tag housekeeping: optional lints to normalize capitalization and dedupe tags.  
- ♿ Accessibility audit (focus order, contrast, skip links, landmarks).  
- 🌐 i18n scaffolding (labels and headings via data files).  
- 🗺️ Sitemap & RSS/JSON feed for recipe updates.  

**Nice‑to‑have**  
- 🧮 Nutrition/notes optional sections with schema support.  
- 🧷 Per‑recipe assets folder convention (e.g., `content/<Cat>/<Recipe>/images/*`).  
- 🧰 Dev script to migrate old JSON formats to the normalized schema automatically.

---

## 📜 License

MIT — use, modify, and share.

---

## 🙌 Credits

Built by **Erick Perales** (GitHub: [peralese](https://github.com/peralese)) with help from the Eleventy community.

