# 📖 Family Cookbook (Eleventy / 11ty)

A static, mobile-friendly family cookbook built with **Eleventy**.  
Recipes are stored as JSON in `content/<Category>/…` and rendered into clean pages with **pagination, categories, tags, breadcrumbs, print styles**, and **GitHub Pages** hosting under `/cookbook/`.

---

## ✨ Highlights

- **Stable URLs** for every recipe: `/recipes/<category>/<title>/`
- **Collections-based build** (no duplicate data sources)
- **Robust image resolver** (finds images next to JSON, in `images/`, etc.; handles case/extension differences)
- **Path-prefix safe** links & assets (works at `/cookbook/` on GitHub Pages)
- **Print stylesheet** for nice hard copies
- **Clean dev workflow** with/without a path prefix
- **Yield** and **Source** rendered as full sections (like Ingredients / Directions / Remarks)

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
│  ├─ index.njk                  # Home (optional; adjust as you like)
│  ├─ all-recipes.njk            # Paginated "All Recipes" list
│  ├─ categories-index.njk       # /categories/ index page
│  ├─ categories.njk             # Per-category pages (/category/<slug>/)
│  ├─ tags.njk                   # /tags/ index page
│  ├─ tag.njk                    # Per-tag pages (/tags/<slug>/)
│  ├─ recipe-detail.njk          # One page per recipe (pagination over collections)
│  ├─ layouts/
│  │  └─ base.njk                # Layout; all links use | url (pathPrefix-safe)
│  ├─ style.css                  # Main stylesheet (or src/styles.css)
│  └─ print.css                  # Print stylesheet (optional)
├─ .eleventy.js                  # Config: data loader, collections, passthroughs, prefix
├─ package.json
└─ README.md
```

> **Note:** We no longer rely on a separate `_data/recipes.js`. The single source of truth lives in **`.eleventy.js`** (`loadAllRecipes` + collections).

---

## 🧠 Data Model (normalized)

The loader in `.eleventy.js` reads each `content/<Category>/*.json`, normalizes fields, and produces a collection item with:

- `title` — from `title | Title | name | recipeTitle | meta.title | filename`
- `category` — from folder name or JSON; used for grouping
- `filename` — JSON filename without extension
- `slugCategory`, `slugTitle`, `slugTitleUnique`
- `urlPath` — canonical path `/recipes/<slugCategory>/<slugTitleUnique>/`
- `ingredients` — from `ingredients|Ingredients|…`
- `directions` — from `directions|Directions|instructions|Instructions`
- `remarks` — from `remarks|Remarks|notes|…` (with `Yield:` / `Source:` stripped if they were embedded)
- `yield` — from `yield|Yield|servings|…` or extracted from remarks
- `source` — from `source|Source|attribution|…` or extracted from remarks
- `imageUrl` — resolved to a public URL by scanning likely locations:
  - `content/<Category>/` (next to the JSON)
  - `content/<Category>/images/`
  - `content/images/`
  - `src/images/` → published as `/images/…`
  - `images/` → published as `/images/…`
  - (Absolute `http(s)` or site-absolute `/…` respected as-is)

**Tip:** Filenames on GitHub Pages are **case-sensitive**. Prefer matching case/extension exactly (e.g., `photo.jpg`, not `Photo.JPG`).

---

## 🌐 URL Structure

- **All Recipes (paginated):** `/recipes/page/1/`, `/recipes/page/2/`, …
- **Recipe detail:** `/recipes/<category-slug>/<title-slug>/`
- **Categories index:** `/categories/`
- **Per category:** `/category/<category-slug>/`
- **Tags index:** `/tags/`
- **Per tag:** `/tags/<tag-slug>/`

All internal links use Eleventy’s `| url` filter, so they work under the `/cookbook/` prefix on GitHub Pages.

---

## ➕ Adding a Recipe

1. Create or choose a category folder, e.g. `content/01 - Breakfast/`.
2. Add a JSON file, e.g. `Baking Powder Biscuits.json`:
   ```json
   {
     "Title": "Baking Powder Biscuits",
     "Ingredients": [
       "2 cups flour",
       "1 tbsp baking powder",
       "1 tsp salt",
       "1/3 cup shortening",
       "3/4 cup milk"
     ],
     "Instructions": [
       "Preheat oven to 450°F.",
       "Mix dry ingredients.",
       "Cut in shortening; add milk.",
       "Knead lightly, cut biscuits, bake 10–12 min."
     ],
     "Remarks": "Yield: 10–12 biscuits\nSource: Grandma’s card box",
     "Image": "BakingPowderBiscuits.png",
     "Tags": ["baking", "breakfast"]
   }
   ```
3. Put the image next to the JSON (recommended) or under `src/images/`.

The build will normalize casings, extract **Yield/Source** from remarks if needed, and generate a stable URL.

---

## 🧪 Local Development

```bash
# 1) Install dependencies
npm install

# 2a) Serve with NO prefix (browse at http://localhost:8080/)
# macOS/Linux
PATH_PREFIX=/ npm run serve
# Windows (PowerShell)
$env:PATH_PREFIX="/"; npm run serve
# Windows (cmd)
set PATH_PREFIX=/ & npm run serve

# 2b) OR keep the /cookbook/ prefix locally
npm run serve
# then browse at http://localhost:8080/cookbook/
```

**Why the prefix matters:**  
On GitHub Pages, the site is hosted at `/cookbook/`. Running with `PATH_PREFIX=/` during dev lets you browse without the prefix; running without that environment var means you must open pages under `/cookbook/` locally as well.

---

## 🏗️ Build for Production

```bash
# Build (default pathPrefix is /cookbook/ in .eleventy.js)
npm run build
```

If you keep a CI workflow, ensure it serves `dist/` at `/cookbook/`.

---

## 🧩 Key Templates

- `src/all-recipes.njk` — paginates over `collections.recipes`; links with `recipe.urlPath | url`
- `src/recipe-detail.njk` — paginates over `collections.recipes`; **permalink: `{{ r.urlPath }}`**
- `src/categories-index.njk` — lists `collections.categories`
- `src/categories.njk` — per-category pages (`/category/<slug>/`)
- `src/tags.njk` — tag index; links to `/tags/<slug>/`
- `src/tag.njk` — per-tag pages (`/tags/<slug>/`)
- `src/layouts/base.njk` — all CSS/links pipe through `| url`; wraps content with a `.wrap` container

---

## 🎨 CSS & Layout

- `src/style.css` (or `src/styles.css`) is copied to **`/style.css`** at build time.
- `src/print.css` (optional) is copied to **`/print.css`**.
- Base layout wraps page content in a centered `.wrap` container.
- Images are responsive and capped in width via CSS.

If pages look unstyled:
- Open DevTools → **Network** and confirm `/style.css` returns **200**.
- Make sure you’re browsing under the correct prefix:
  - **No prefix dev:** `/…`
  - **Prefix dev / GitHub Pages:** `/cookbook/…`

---

## 🩺 Troubleshooting

- **Recipe links 404:** ensure `recipe-detail.njk` paginates over `collections.recipes` and uses `permalink: "{{ r.urlPath }}"`.
- **Images don’t show:**
  - Filenames (case/extension) must match on GitHub Pages.
  - Put the image next to the JSON or in `src/images/`.
  - Check the computed `imageUrl` in DevTools.
- **Unstyled pages:** your CSS likely isn’t being copied or you’re on the wrong prefix URL. Confirm `/style.css` is reachable and use the prefix that matches your dev mode.

---

## 🗺️ Optional Debug Pages (during development)

Create, visit, then delete:

- `src/debug/urls.njk` → `/debug/urls/` (click through all recipe URLs)
- `src/debug/images.njk` → `/debug/images/` (thumbnail check of every `imageUrl`)

---

## 📦 Dependencies

- Node.js 18+ recommended
- Eleventy 2.x
- `slugify` for consistent slugs

*(All installed via `npm install`.)*

---

## 📜 License

MIT — use, modify, and share.

---

## 🙌 Credits

Built by **Erick Perales** (GitHub: [peralese](https://github.com/peralese)) with help from the Eleventy community.

