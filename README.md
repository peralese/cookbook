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
✅ Breadcrumbs now show "Home / Recipes / Category / Recipe"

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

```
/
├── content/             # All recipe JSON files, organized by category
│   ├── 01 - Breakfast/
│   ├── 02 - Baking/
│   └── ...
├── src/                 # Eleventy templates and layouts
│   ├── index.njk        # Home page - welcome / landing
│   ├── categories-index.njk # Dedicated Categories Index page with search
│   ├── categories.njk   # Individual category pages
│   ├── recipe.njk       # Recipe detail pages with breadcrumbs
│   ├── layouts/
│   │   └── base.njk     # Base layout with header, footer, breadcrumbs
│   ├── styles.css       # Site styling
│   ├── search.js        # Client-side live filtering for categories
│   └── _data/
│       ├── categories.js
│       └── recipes.js
├── .eleventy.js         # Eleventy configuration
├── package.json         # Project metadata and build scripts
├── add_recipe.py        # Python CLI for adding recipes
└── dist/                # (Generated) Final site output
```

---

## ✅ Roadmap and Progress

✅ Basic site structure with categories and recipes  
✅ Command-line recipe add tool  
✅ Category pages with breadcrumb navigation  
✅ Recipe detail pages with unique permalinks and breadcrumbs  
✅ Improved CSS design and theming  
✅ Search/filtering on the Categories Index page  
✅ Dedicated Categories Index Page (/categories/) with live filtering  
✅ Updated header navigation (Home | Recipes)  
✅ Breadcrumbs show "Home / Recipes / Category / Recipe"

⬜️ Deployment setup (GitHub Pages / Netlify)  
⬜️ Print-friendly styling  
⬜️ Recipe image support  
⬜️ Personal feedback/notes system  
⭐ Optional “feedback” field in JSON  
⭐ Display on recipe detail pages  
⭐ Capture family memories, tasting notes, planned variations  
⬜️ Advanced recipe search (ingredients, title)  
⬜️ Tags or labels for recipes  
⬜️ All-recipes index page  
⬜️ Pagination for large lists  
⭐ Break long category pages into multiple pages  
⭐ Improve usability for mobile and large collections  
⬜️ Mobile navigation improvements

---

## 📌 Notes

- `content/` is the single source of truth for all recipes.
- `dist/` is generated output—**do not commit** to version control.
- All customization lives in `src/`.
- Easily extendable for new features.

---

## ❤️ Credits

Built for our family to preserve, share, and enjoy our favorite recipes—across generations.

---

## 📜 License

Private/personal project. Feel free to fork and adapt for your own family cookbook!


