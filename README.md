# Family Cookbook Static Site

This project is a static website for hosting our family recipes.  
Built using [Eleventy (11ty)](https://www.11ty.dev/) as a static site generator, with recipe data in JSON format.

---

## 📂 Project Structure

```
/
├── content/             # All recipe JSON files, organized by categories
│   ├── 01 - Breakfast/
│   ├── 02 - Baking/
│   └── ...
├── src/                 # Eleventy templates and layouts
│   ├── index.njk        # Homepage - lists categories
│   ├── categories.njk   # Category pages - lists recipes in that category
│   ├── recipe.njk       # Recipe detail pages with breadcrumbs
│   ├── layouts/
│   │   └── base.njk     # Base layout with site-wide navigation and breadcrumbs
│   ├── styles.css       # Site styling
│   └── _data/
│       ├── categories.js  # Reads all category folders
│       └── recipes.js     # Reads all recipes, adds slugs for category/filenames
├── .eleventy.js         # Eleventy configuration
├── package.json         # Node project metadata and build scripts
├── add_recipe.py        # Python CLI to add new recipes as JSON
└── dist/                # (Generated) Final site output
```

---

## ⚡️ Quick Start

### 1️⃣ Install Node Dependencies

```
npm install
```

---

### 2️⃣ Run Local Development Server

```
npm run serve
```

Opens at [http://localhost:8080](http://localhost:8080).  
Automatically rebuilds on changes.

---

### 3️⃣ Build for Production

```
npm run build
```

Outputs the full static site to the `dist/` folder.

---

## 🥣 Adding New Recipes

Use the included Python script to add new recipes interactively:

```
python add_recipe.py
```

Prompts you for:
- Title (required)
- Category (required)
- Ingredients (required)
- Instructions (required)
- Optional fields: Requires, Remarks, Yield, Source

Generates a new `.json` recipe file in the correct `content/` subfolder.

---

## 🌐 Deployment

The `dist/` folder contains the complete static site.  

You can deploy it anywhere static HTML is supported:

- GitHub Pages
- Netlify (recommended for ease of use)
- Vercel
- AWS S3 static hosting
- Or even just served locally

---

## ✅ Features Implemented

✅ Home page listing all categories automatically from `content/`  
✅ Dynamic category pages listing recipes in that category  
✅ Recipe detail pages generated automatically from JSON  
✅ Unique permalinks including **slugified** category and recipe:
```
/categories/01-breakfast/
/recipes/01-breakfast/baking-powder-biscuits/
```
✅ Slugs computed in `_data/recipes.js` to ensure consistent URLs  
✅ Dynamic breadcrumbs for clear navigation:

- On category pages:
  ```
  Home / 01 - Breakfast
  ```
- On recipe pages:
  ```
  Home / 01 - Breakfast / Baking Powder Biscuits
  ```

✅ Site-wide navigation header with links to Home and Categories  
✅ Fully responsive, clean CSS styling

---

## ⚙️ Notes

- The `content/` folder is the single source of truth for all recipes.  
- The `dist/` folder is generated—**do not commit** it to version control.  
- All design/layout customization lives in `src/`.

---

## 🚀 Roadmap / TODO

✅ Basic site structure with categories and recipes  
✅ Command-line recipe add tool  
✅ Category pages with breadcrumb navigation  
✅ Recipe detail pages with unique permalinks and breadcrumbs  
✅ Improve CSS design and theming
⬜️ Deployment setup (GitHub Pages / Netlify)
⬜️ Optional search/filtering
⬜️ Print-friendly styling

---

## ❤️ Credits

Built for our family to preserve and share our favorite recipes—across generations.

---

## 📜 License

This project is private/personal. Feel free to fork and adapt for your own family cookbook!

