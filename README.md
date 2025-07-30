# 📖 Family Cookbook Static Site

This project is a private family cookbook website built using [Eleventy (11ty)](https://www.11ty.dev/), with recipes stored in structured JSON files. It supports easy local editing, clean navigation, mobile-friendly design, and personal family notes.

---

## ✅ Features Implemented

✅ Basic site structure with Home, Categories, Recipes  
✅ Command-line recipe add tool (`add_recipe.py`)  
✅ Category pages with dynamic breadcrumbs  
✅ Recipe detail pages with unique permalinks and breadcrumbs  
✅ Improved CSS design and theming with responsive layout  
✅ Search/filtering on the Categories Index page  
✅ Dedicated `/categories/` index page with live filtering  
✅ Updated header navigation: Home | Recipes | Tags  
✅ Breadcrumbs show "Home / Recipes / Category / Recipe"  
✅ Recipe image support  
✅ Print-friendly styling  
✅ All-recipes index page at `/recipes/`  
✅ Tag support with dedicated tag listing pages (`/tags/`)  
✅ Local-only recipe management web tool (`recipe_editor.py`)  
  • Add new recipes via form  
  • Upload image and auto-copy to `src/images/`  
  • Edit existing recipes with category-aware selection  
  • Automatically deletes old recipe JSON files on updates  
  • Tag entry supported as comma-separated input (stored as array)  
  • Handles tags with special characters like apostrophes  
  • Fixed bug rendering tag strings as individual letters  
  • Improved UI: fixed textarea field widths for `Remarks`, `Yield`, `Source`  
  • Fixed rendering bug where `Source`/`Yield` incorrectly displayed `Remarks`

---

## ⚡ Quick Start

### 1️⃣ Install Node dependencies
```bash
npm install
```

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
│   ├── all-recipes.njk       # /recipes/ index
│   ├── categories.njk        # Paginated category pages
│   ├── categories-index.njk  # /categories/ filtering index
│   ├── tag-pages.njk         # Individual tag pages
│   ├── recipe.njk            # Recipe detail pages
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
```

---

## 🚧 Roadmap

⬜ Deployment setup (e.g. GitHub Pages, Netlify)  
⬜ Advanced recipe search (title, ingredients)  
⬜ Pagination for large category lists  
⬜ Mobile navigation enhancements  
✅ Tags or labels for recipes

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




