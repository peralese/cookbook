# 📖 Family Cookbook (Eleventy)

A private, static family cookbook built with **Eleventy (11ty)**. Recipes live as JSON under `/content` and are rendered into clean, mobile‑friendly pages with categories, pagination, tags, and a print‑friendly layout.

---

## ✅ What Changed Today

- **Per‑recipe pages fixed (CI):** Added `src/recipe-detail.njk` to paginate over `recipes` and generate **one page per recipe**.
- **`/recipes/` redirect clarified:** `src/recipe.njk` now only redirects `/recipes/` → `/recipes/page/1/`.
- **Eleventy config fixed:** Use `includes: "layouts"` (✅ correct key) so `layout: base.njk` resolves.
- **Data normalization upgraded (`src/_data/recipes.js`):**
  - Normalizes `title`, `tags`, `ingredients`, `instructions`
  - Derives `filename`, `slugCategory`, `slugFilename`
  - Normalizes `remarks`, `yield`, `source` (with common alias keys)
  - **Extracts embedded `Yield:` and `Source:` lines from `remarks`**
- **Detail page content order (as requested):**  
  **Ingredients → Instructions → Remarks → Yield → Source → Image → Tags**
- **Hero title rendering fixed:** Title now renders visibly on page (no pseudo overlay) and prints correctly (black on white).
- **Path prefix safe:** All internal links use Eleventy’s `| url` filter; works under `/cookbook/`.
- **Print stylesheet updated:** Title prints, site chrome hidden, sensible margins.

---

## ✨ Features

- Home, **All Recipes** (paginated), **Categories**, **Tags**
- Clean permalinks: `/recipes/<category-slug>/<recipe-slug>/`
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
│   ├── index.njk                # Home
│   ├── all-recipes.njk          # /recipes/page/1/ (listing)
│   ├── categories-index.njk     # /categories/
│   ├── recipe.njk               # Redirect: /recipes/ → /recipes/page/1/
│   ├── recipe-detail.njk        # ✅ Builds one page per recipe
│   ├── layouts/
│   │   └── base.njk             # Shell (must output {{ content | safe }})
│   ├── styles.css               # Site styles (hero/title sizing, spacing)
│   ├── print.css                # Print styles (title visible in print)
│   ├── search.js                # (optional)
│   └── _data/
│       └── recipes.js           # ✅ Loads & normalizes recipes
├── .eleventy.js                 # ✅ includes/data dirs fixed
├── .github/workflows/deploy.yml # GitHub Pages deploy via Actions
├── package.json
└── README.md
```

---

## 🧠 Data Model (normalized fields)

`src/_data/recipes.js` reads every JSON in `content/<Category>/*.json`, normalizes fields, and returns an **array** used by templates. Normalized keys:

- **title** → from `title | Title | name | recipeTitle | meta.title | filename`
- **category** → folder name in `/content/<Category>/...`
- **filename** → JSON filename (no extension)
- **slugCategory** → slugified category (lowercase)
- **slugFilename** → from `slug | slugFilename | filename | title` (slugified)
- **ingredients** → array (accepts array, CSV string, or newline string)
- **instructions** → array; leading numbers/bullets stripped
- **tags** → array (accepts array or comma‑separated string)
- **remarks** → from `remarks | Remarks | notes | Notes | description | Description`
- **yield** → from `yield | Yield | servings | Makes | Qty | quantity`
- **source** → from `source | Source | author | credit`

**Smart extraction:** If a recipe’s `remarks` includes lines like:

```
Yield: Makes about 14 biscuits. Source: Baking with Julia ...
```

they are **pulled out** and assigned to `yield` and `source`, and removed from `remarks`.

**Permalink (in `recipe-detail.njk`):**

```
/recipes/{{ recipe.slugCategory }}/{{ recipe.slugFilename }}/
```

---

## 🧾 Page Generation

- **List pages:** `/recipes/page/1/` + pagination (from `all-recipes.njk`)
- **Detail pages:** `/recipes/<category>/<slug>/` (from `recipe-detail.njk`)
- **Categories index:** `/categories/`
- **Tags** (if included): `/tags/` or anchors

Detail page content order:

1. Ingredients  
2. Instructions  
3. Remarks  
4. Yield  
5. Source  
6. Image (optional)  
7. Tags

---

## 🖨 Print Behavior

`print.css` ensures:

- Hero background removed; **title prints in black**
- Navigation/breadcrumbs/print button hidden
- `@page { margin: 0.5in; }`
- Remarks (`.notes`) keep line breaks with `white-space: pre-line`
- `header.recipe-hero` is explicitly **shown** in print to avoid blanket `header { display:none }` rules

---

## 🔧 Local Development

```bash
# 1) Install
npm install

# 2) Serve locally with watch/reload
npm run serve
# → http://localhost:8080

# 3) Production build (outputs to dist/)
npm run build
```

> You do **not** commit `dist/`. GitHub Actions builds and deploys it for you.

---

## ⚙️ Eleventy Config (important)

`.eleventy.js` (key bits):

```js
module.exports = function (eleventyConfig) {
  // passthrough copies
  eleventyConfig.addPassthroughCopy("content");
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/print.css");

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "layouts",  // ✅ correct key
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    pathPrefix: process.env.PATH_PREFIX || "/cookbook/",
  };
};
```

**Always** use the `| url` filter for internal links/assets so they work under the `/cookbook/` prefix:

```njk
<a href="{{ '/' | url }}">Home</a>
<link rel="stylesheet" href="{{ '/styles.css' | url }}">
<a href="{{ '/recipes/page/1/' | url }}">All Recipes</a>
```

---

## 🚀 Deploying with GitHub Pages (Actions)

`.github/workflows/deploy.yml` builds with the `PATH_PREFIX`, uploads **`dist/`** as the Pages artifact, and deploys:

```yaml
name: Deploy Eleventy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

env:
  PATH_PREFIX: /cookbook/

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Build site
        run: npm run build
        env:
          PATH_PREFIX: ${{ env.PATH_PREFIX }}
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Repo **Settings → Pages → Build and deployment** must be set to **GitHub Actions**.

---

## 🧰 Troubleshooting

- **404s on per‑recipe URLs after deploy**  
  Check the Pages artifact contains `dist/recipes/<category>/<slug>/index.html`. Ensure upload step uses `path: dist`.

- **Blank page content**  
  `src/layouts/base.njk` must include `{{ content | safe }}`. Also confirm `.eleventy.js` uses `includes: "layouts"`.

- **Title invisible on page**  
  Ensure CSS does **not** overlay a pseudo-title; we remove any `::before` content on the hero and set the `<h1>` color to white.

- **Title missing in print**  
  Print CSS may hide `header`. `print.css` re-enables `header.recipe-hero` and forces black text.

---

## 🗺️ Roadmap (next up)

- **Images**: normalize image fields (`image`, `photo`, `picture`, etc.), resolve paths, render `<figure>` with caption/credit, and add print‑friendly scaling.
- Tag landing improvements & filtering
- Optional nutrition/prep time fields

---

## 📜 License

MIT — use, modify, and share freely.

---

## 👤 Author

**Erick Perales** — IT Architect, Cloud Migration Specialist  
GitHub: https://github.com/peralese





