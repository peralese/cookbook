# 📖 Family Cookbook Static Site

This project is a private family cookbook website built using [Eleventy (11ty)](https://www.11ty.dev/), with recipes stored in structured JSON files. It supports easy local editing, clean navigation, mobile-friendly design, and personal family notes.

---

## ✅ Features Implemented

✅ Basic site structure with Home, Categories, Recipes  
✅ Command-line recipe add tool  
✅ Category pages with dynamic breadcrumbs  
✅ Recipe detail pages with unique permalinks and breadcrumbs  
✅ Improved CSS design and theming with responsive layout  
✅ Search/filtering on the Categories Index page  
✅ Dedicated `/categories/` index page with live filtering  
✅ Updated header navigation: Home | Recipes  
✅ Breadcrumbs show "Home / Recipes / Category / Recipe"  
✅ Print-friendly CSS styling  
✅ All-recipes index page `/recipes/`  
✅ Recipe image support (stored in `src/images`)  
✅ Local-only web-based recipe manager (`recipe_editor.py`)  
  • Create and update recipes  
  • Upload and copy images to `src/images/`  
  • View/edit content by category and recipe  
  • Never published with the site build

---

## ⚡ Quick Start

### 1️⃣ Install Node dependencies
```
npm install
```

---

### 2️⃣ Run local development server
```
npm run serve
```
Access at [http://localhost:8080](http://localhost:8080) with automatic rebuilding.

---

### 3️⃣ Build for production
```
npm run build
```
Outputs the static site to the `dist/` folder.

---

## 🥣 Adding New Recipes

Use the included **Python web tool** to create or edit recipes:
```bash
python recipe_editor.py
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

- Select a category and existing recipe to edit, or create a new one  
- Fill in title, ingredients, instructions, optional notes, and upload an image  
- JSON is saved to `content/<category>/...`  
- Uploaded images are saved to `src/images/`  
- Not published or included in site output

You can still use the CLI tool as well:

Use the included Python script to add new recipes interactively:

```
python add_recipe.py
```

Prompts for:
- Title (required)
- Category (required)
- Ingredients (required)
- Instructions (required)
- Optional fields: Requires, Remarks, Yield, Source, Feedback

Generates a new `.json` recipe file in the correct `content/` subfolder.

---

## 📂 Project Structure

``
## 📂 Project Structure

```
/
├── content/                    # All recipe JSON files, organized by category
│   ├── 01 - Breakfast/
│   ├── 02 - Baking/
│   └── ...
├── src/                        # Eleventy templates, assets, and data
│   ├── all-recipes.njk         # Full recipe listing (no pagination)
│   ├── base.njk                # Shared layout (header, footer, breadcrumbs)
│   ├── categories-index.njk    # Categories page with live filtering
│   ├── categories.njk          # Fallback category page (legacy)
│   ├── category-pages.njk      # Paginated category pages
│   ├── index.njk               # Home page (welcome)
│   ├── recipe.njk              # Recipe detail pages
│   ├── styles.css              # All site styling and print formatting
│   ├── search.js               # Client-side live category filter
│   ├── images/                 # Recipe photos (uploaded locally)
│   └── _data/                  # Global data loaders
│       ├── categories.js       # Category list generator
│       ├── recipes.js          # All recipes loader
│       └── categoryMap.js      # Category-to-recipe map (optional)
├── .eleventy.js                # Eleventy config file (pagination, filters)
├── add_recipe.py               # CLI tool to create new recipes
├── recipe_editor.py            # Web form tool to create/edit recipes (local only)
├── package.json                # Build scripts and dependencies
├── dist/                       # Final generated site (do not edit)
└── .gitignore                  # Excludes dist/, images, and local tools from deploy
```

---

## ✅ Roadmap and Progress

## ✅ Roadmap and Progress

✅ Basic site structure with categories and recipes  
✅ Command-line recipe add tool  
✅ Category pages with breadcrumb navigation  
✅ Recipe detail pages with unique permalinks and breadcrumbs  
✅ Improved CSS design and theming  
✅ Search/filtering on the Categories Index page  
✅ Dedicated Categories Index Page (`/categories/`) with live filtering  
✅ Updated header navigation (Home | Recipes)  
✅ Breadcrumbs show "Home / Recipes / Category / Recipe"  
✅ Print-friendly styling  
✅ Recipe image support (stored locally in `src/images/`)  
✅ All-recipes index page (`/recipes/`)  
✅ Local-only recipe editor with web form and image upload  

⬜️ Deployment setup (GitHub Pages / Netlify)  
⬜️ Advanced recipe search (ingredients, title)  
⬜️ Tags or labels for recipes  
⬜️ Pagination for large category lists  
⬜️ Mobile navigation improvements  
⬜️ Optional delete recipe tool in editor


---

## 📌 Notes

- `recipe_editor.py` is **never published**
- `.gitignore` and build process **exclude local data tools**
- Designed for local use only to protect family content

---

## ❤️ Credits

Built for our family to preserve, share, and enjoy our favorite recipes—across generations.

---

## 📜 License

Private/personal project. Feel free to fork and adapt for your own family cookbook!

## Author

Erick Perales  — IT Architect, Cloud Migration Specialist


