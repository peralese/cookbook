# 📖 Family Cookbook (Eleventy)

A private, static family cookbook built with **Eleventy (11ty)**. Recipes live as JSON under `/content` and are rendered into clean, mobile-friendly pages with categories, pagination, tags, and a print-friendly layout.

---

## ✅ What Changed Today

- **Clean permalinks for recipes**: Added `recipes.11tydata.js` so every recipe page URL uses a flat, lowercase, punctuation-free slug (e.g., `/recipes/02-baking/momsempanadadough/`).
- **Slug handling in `.eleventy.js`**:
  - Added `slugTitleFlat` to remove dashes and punctuation from recipe titles.
  - Updated `urlPath` to use `slugTitleFlat`.
  - Guarded `addPassthroughCopy` calls with `fs.existsSync` to avoid missing folder errors.
- **Tags page overhaul (`tags.njk`)**:
  - Links now use `recipe.urlPath | url` so tag recipe links point to the new clean permalinks.
  - Cleaned display of tag names and anchor IDs (removed apostrophes for anchor IDs).
  - Tag index and per-tag lists styled consistently with the rest of the site.
- **Support for GitHub Pages pathPrefix**: All internal links use `| url` so `/cookbook/` works correctly in production.

---

## ✨ Features

- Home, **All Recipes** (paginated), **Categories**, **Tags**
- Clean permalinks: `/recipes/<category-slug>/<flat-title-slug>/`
- Breadcrumbs and **Print** button on each recipe
- GitHub Actions → GitHub Pages (no need to commit `dist/`)

---

## 📂 Project Structure

```
/
├── content/                     # Recipe JSON by category (passthrough copied)
│   ├── 01-breakfast/
│   ├── 02-baking/
│   └── ...
├── src/
│   ├── index.njk
│   ├── all-recipes.njk
│   ├── categories-index.njk
│   ├── recipe.njk
│   ├── recipe-detail.njk
│   ├── tags.njk                 # Updated tag index page
│   ├── layouts/
│   │   └── base.njk
│   ├── styles.css
│   ├── print.css
│   ├── search.js
│   ├── _data/
│   │   └── recipes.js           # Loads & normalizes recipes
│   └── recipes.11tydata.js      # NEW: sets computed permalink per recipe
├── .eleventy.js                  # Config with slug fixes and safe passthroughs
├── .github/workflows/deploy.yml  # GitHub Pages deploy via Actions
├── package.json
└── README.md
```

---

## 🧠 Data Model (normalized fields)

`src/_data/recipes.js` reads every JSON in `content/<Category>/*.json`, normalizes fields, and returns an **array** used by templates.

Key normalized fields:
- **title** → from `title | Title | name | recipeTitle | meta.title | filename`
- **category** → folder name in `/content/<Category>/...`
- **filename** → JSON filename (no extension)
- **slugCategory** → slugified category (lowercase)
- **slugTitleFlat** → flat, lowercase slug without punctuation/dashes (used for URLs)
- **tags** → array, normalized and trimmed
- Other recipe fields (`ingredients`, `instructions`, `remarks`, `yield`, `source`) normalized

---

## 🧾 Page Generation

- **List pages:** `/recipes/page/1/` + pagination
- **Detail pages:** `/recipes/<category>/<flat-slug>/` (from `recipes.11tydata.js`)
- **Categories index:** `/categories/`
- **Tags:** `/tags/` index page, clean anchors, and links to per-tag listings

---

## 🖨 Print Behavior

`print.css` ensures:
- Title prints in black
- Navigation/breadcrumbs/print button hidden
- Sensible print margins
- Hero image removed for print clarity

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Serve locally
npm run serve
# → http://localhost:8080

# Production build
npm run build
```

---

## ⚙️ Eleventy Config (key points)

- Guards passthrough copies with `fs.existsSync`
- Adds `slug` and `flatSlug` filters
- Computes `urlPath` for recipes using `slugTitleFlat`
- Always use `| url` filter for internal links so GitHub Pages `pathPrefix` works

---

## 🚀 Deploying with GitHub Pages

- Deploy via `.github/workflows/deploy.yml`
- Ensure `PATH_PREFIX` is set to `/cookbook/` for GitHub Pages
- Artifact path: `dist`

---

## 🗺️ Roadmap

- Normalize tag slugs site-wide (match per-tag pages and tag index)
- Add per-tag pages automatically from tag list
- Improve tag sorting and filtering

---

## 📜 License

MIT License — use, modify, and share freely.

---

## 👤 Author

**Erick Perales** — IT Architect, Cloud Migration Specialist  
GitHub: [peralese](https://github.com/peralese)




