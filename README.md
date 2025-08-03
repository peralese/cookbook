# 📖 Family Cookbook Static Site

This project is a private family cookbook website built using [Eleventy (11ty)](https://www.11ty.dev/), with recipes stored in structured JSON files. It supports easy local editing, clean navigation, mobile-friendly design, and personal family notes.

---

## ✅ Features Implemented

✅ Basic site structure with Home, Categories, Recipes  
✅ Paginated All Recipes list (`/recipes/page/1/`), linked from `/recipes/`  
✅ Category pages with dynamic breadcrumbs  
✅ Recipe detail pages with unique permalinks and breadcrumbs  
✅ Command-line recipe add tool (`add_recipe.py`)  
✅ Category-aware Flask-based recipe editor (`recipe_editor.py`)  
✅ Tag support with slug-safe linking (`/tags/<slug>/`)  
✅ Tag listing pages and per-tag recipe lists  
✅ Recipe detail layout with source, tags, category links, print-friendly format  
✅ Backlinks from recipe pages to All Recipes  
✅ Navigation: Home | Recipes | Categories | Tags  
✅ Consistent link behavior across tag and recipe pages  
✅ Web-safe, slugified URLs for all recipe links  
✅ Custom Eleventy collections to support tag filtering  
✅ Live search/filtering for the Categories Index  
✅ Optional image support for each recipe  
✅ Auto-generated JSON-based page routing  
✅ Local image upload and auto-organized storage

---

## ⚡ Quick Start

### 1️⃣ Install Node dependencies
```bash
npm install

---

### 2️⃣ Run local development server
```bash
npm run serve
```
Visit [http://localhost:8080](http://localhost:8080)

---

### 3️⃣ Build for production
```bash
npm run build
```
Outputs static files to `dist/`

---

## 🥣 Adding New Recipes

### Option A: Command Line
```bash
python add_recipe.py
```

### Option B: Web Editor (local-only)
```bash
python recipe_editor.py
```
Launches a local Flask web app at [http://localhost:5000](http://localhost:5000)

---

## 🏷️ Tagging Recipes

Recipes can include tags in their JSON file like:

```json
"tags": ["Family", "Mom's", "Holiday"]
```

- Tags are comma-separated in the web form and stored as arrays.
- Special characters like apostrophes (`'`) are supported.
- Tags are listed on recipe pages and linked to `/tags/<slugified_tag>/` pages.

---

## 📂 Project Structure

```
/
├── content/                  # Recipe JSON files organized by category
│   ├── 01 - Breakfast/
│   ├── 02 - Baking/
│   └── ...
├── src/
│   ├── index.njk             # Home
│   ├── all-recipes.njk       # Paginated all recipes page
│   ├── recipes.njk           # Redirect /recipes/ → /recipes/page/1/
│   ├── categories.njk        # Paginated category pages
│   ├── categories-index.njk  # /categories/ filtering index
│   ├── tag-pages.njk         # Individual tag pages
│   ├── recipe-pages.njk      # Builds pages per recipe
│   ├── layouts/
│   │   ├── base.njk
│   │   └── recipe.njk        # Layout for recipe detail pages
│   ├── styles.css            # Site CSS
│   ├── search.js             # Category live filtering
│   ├── images/               # Recipe images
│   └── _data/
│       ├── categories.js
│       ├── recipes.js
│       ├── tags.js
│       ├── categoryMap.js
├── dist/                     # Output folder (generated)
├── .eleventy.js              # Eleventy config
├── add_recipe.py             # CLI recipe add tool
├── recipe_editor.py          # Flask-based local recipe editor
├── package.json              # Build config
└── README.md

---

## 🚧 Roadmap

⬜ Deployment (e.g., GitHub Pages or Netlify)
⬜ Print layout improvements
⬜ Advanced Search capabilities
⬜ Mobile navigation enhancements
⬜ Pagination for all Categories
✅ Pagination for All Recipes
✅ Tags, tag linking, tag display pages
✅ Category-structured recipe storage
✅ Local recipe image upload & cleanup

---

## 📌 Notes

- `recipe_editor.py` is intended for local use only—exclude from public hosting.
- JSON files in `content/` are the source of truth.
- `dist/` should not be committed—it's the output only.

---

## ❤️ Credits

Created to preserve and share our family’s favorite recipes—across generations.

---

## 👨‍💻 Author

**Erick Perales**  
IT Architect, Cloud Migration Specialist  
[https://github.com/peralese](https://github.com/peralese)




