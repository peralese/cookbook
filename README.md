# 📖 Family Cookbook (Eleventy / 11ty)

A static, mobile-friendly family cookbook built with **Eleventy**.  
Recipes are stored as JSON in `content/<Category>/…` and rendered into clean pages with **pagination, categories, tags, breadcrumbs, print styles**, **client-side search**, and **GitHub Pages** hosting under `/cookbook/`.

---

## ✨ Highlights

- **Stable URLs** for every recipe: `/recipes/<category>/<title>/`
- **Collections-based build** (no duplicate data sources)
- **Robust image resolver** (finds images next to JSON, in `images/`, etc.; handles case/extension differences)
- **Path-prefix safe** links & assets (works at `/cookbook/` on GitHub Pages)
- **Print stylesheet** for nice hard copies
- **Clean dev workflow** with/without a path prefix
- **Yield** and **Source** rendered as full sections (like Ingredients / Directions / Remarks)
- **Client-side search** using Fuse.js with fuzzy matching
- **Footer Search link** for quick access

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
├─ .eleventy.js                  # Config: data loader, collections, passthroughs, prefix
├─ package.json
└─ README.md
```

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
- `remarks` — from `remarks|Remarks|notes|…` (with `Yield:` / `Source:` stripped if embedded)
- `yield` — from `yield|Yield|servings|…` or extracted from remarks
- `source` — from `source|Source|attribution|…` or extracted from remarks
- `imageUrl` — resolved to a public URL by scanning likely locations

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

## ➕ Adding a Recipe

1. Create or choose a category folder under `content/`, e.g. `content/01 - Breakfast/`.
2. Add a JSON file with required fields (`Title`, `Ingredients`, `Instructions`) and optional fields (`Remarks`, `Image`, `Tags`).
3. Place the image next to the JSON or in `src/images/`.

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

---

## 🏗️ Build for Production

```bash
npm run build
```

Outputs to `/dist/`, ready for GitHub Pages at `/cookbook/`.

---

## 📜 License

MIT — use, modify, and share.

---

## 🙌 Credits

Built by **Erick Perales** (GitHub: [peralese](https://github.com/peralese)) with help from the Eleventy community.

