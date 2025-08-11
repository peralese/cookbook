// .eleventy.js
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

module.exports = function (eleventyConfig) {
  // =========================
  // Filters
  // =========================
  eleventyConfig.addFilter("slug", (input) => {
    if (typeof input !== "string") return "";
    return slugify(input, { lower: true, strict: true });
  });

  // NEW: "flat" slug filter (removes dashes too)
  // "Mom’s Empanada Dough" -> "momsempanadadough"
  eleventyConfig.addFilter("flatSlug", (input) => {
    if (typeof input !== "string") return "";
    return slugify(input, { lower: true, strict: true }).replace(/-/g, "");
  });

  eleventyConfig.addFilter("keys", (obj) => {
    if (typeof obj !== "object" || obj === null) return [];
    return Object.keys(obj);
  });

  // Handy for debugging in templates
  eleventyConfig.addFilter("safeJson", (value) =>
    JSON.stringify(value, null, 2)
  );
  
  // Clean tag label for display: drop apostrophes/quotes
  eleventyConfig.addFilter("tagLabel", (s) =>
  String(s || "").replace(/[’'"]/g, "")
  );

// Clean tag id for anchors/links
eleventyConfig.addFilter("tagId", (s) =>
  String(s || "").toLowerCase().replace(/[’'"]/g, "").replace(/\s+/g, "-")
);

  // =========================
  // Passthrough & Watch
  // =========================
  // Only copy if the folder exists (prevents the Benchmark error)
  if (fs.existsSync("content")) {
    eleventyConfig.addPassthroughCopy("content");
  }
  if (fs.existsSync("src/styles.css")) eleventyConfig.addPassthroughCopy("src/styles.css");
  if (fs.existsSync("src/_data/categories.json"))
    eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  if (fs.existsSync("src/search.js")) eleventyConfig.addPassthroughCopy("src/search.js");
  if (fs.existsSync("src/images")) eleventyConfig.addPassthroughCopy("src/images");
  if (fs.existsSync("src/print.css")) eleventyConfig.addPassthroughCopy("src/print.css");

  if (fs.existsSync("content")) eleventyConfig.addWatchTarget("content");
  if (fs.existsSync("src/print.css")) eleventyConfig.addWatchTarget("src/print.css");

  // =========================
  // Helpers
  // =========================
  function loadAllRecipes({ excludeDrafts = true } = {}) {
    // If your JSON lives under src/content, use that. Otherwise, set to "content".
    const contentRoot = fs.existsSync(path.join(__dirname, "src", "content"))
      ? path.join(__dirname, "src", "content")
      : path.join(__dirname, "content");

    if (!fs.existsSync(contentRoot)) {
      console.warn("⚠️  content folder not found at src/content or content/, skipping recipe load.");
      return [];
    }

    const categories = fs
      .readdirSync(contentRoot)
      .filter((item) => fs.statSync(path.join(contentRoot, item)).isDirectory());

    /** @type {Array<Object>} */
    const allRecipes = [];

    categories.forEach((category) => {
      const categoryPath = path.join(contentRoot, category);
      const files = fs
        .readdirSync(categoryPath)
        .filter((f) => f.toLowerCase().endsWith(".json"));

      files.forEach((file) => {
        const recipePath = path.join(categoryPath, file);
        try {
          const raw = fs.readFileSync(recipePath, "utf8");
          const data = JSON.parse(raw);

          if (excludeDrafts && data.draft === true) return;

          // Decorate/normalize
          const filename = file.replace(/\.json$/i, "");
          data.category = category;
          data.filename = filename;

          // Slugs
          data.slugCategory = slugify(category, { lower: true, strict: true });
          const titleOrFile = data.title
            ? String(data.title)
            : String(filename);

          // Dashed title slug (kept for compatibility if referenced elsewhere)
          data.slugTitle = slugify(titleOrFile, { lower: true, strict: true });

          // NEW: flat, punctuation-free, lowercased title slug (no dashes)
          data.slugTitleFlat = data.slugTitle.replace(/-/g, "");

          data.id = `${category}/${filename}`;

          // ✅ Use the flat title slug in the URL (fixes %E2%80%99 and underscores)
          data.urlPath = `/recipes/${data.slugCategory}/${data.slugTitleFlat}/`;

          // Tags normalization
          if (Array.isArray(data.tags)) {
            data.tags = data.tags
              .map((t) => (t == null ? "" : String(t).trim()))
              .filter((t) => t.length > 0);
          }

          allRecipes.push(data);
        } catch (err) {
          console.error(`❌ Failed to parse ${recipePath}:`, err.message);
        }
      });
    });

    console.log("✅ Loaded recipes:", allRecipes.length);
    return allRecipes;
  }

  // =========================
  // Collections
  // =========================

  // All recipes (for listing/search/etc.)
  eleventyConfig.addCollection("recipes", function () {
    return loadAllRecipes();
  });

  // Tag map: { "<Tag Name>": [recipe, ...], ... }
  eleventyConfig.addCollection("tagged", function () {
    const recipes = loadAllRecipes();
    /** @type {Record<string, Array<Object>>} */
    const tagMap = {};

    recipes.forEach((recipe) => {
      if (!Array.isArray(recipe.tags) || recipe.tags.length === 0) return;

      const seenForThisRecipe = new Set(); // prevent dupes within a single recipe
      recipe.tags.forEach((rawTag) => {
        const trimmed = String(rawTag).trim();
        if (!trimmed) return;

        const keyLC = trimmed.toLowerCase();
        if (seenForThisRecipe.has(keyLC)) return; // skip dupes within the recipe
        seenForThisRecipe.add(keyLC);

        // Merge keys that differ only by case (keep first-seen casing)
        const existingKey =
          Object.keys(tagMap).find((k) => k.toLowerCase() === keyLC) || trimmed;

        if (!tagMap[existingKey]) tagMap[existingKey] = [];
        tagMap[existingKey].push(recipe);
      });
    });

    // Sort each tag's items by title (if present), then filename
    for (const k of Object.keys(tagMap)) {
      tagMap[k].sort((a, b) => {
        const aKey = (a.title || a.filename || "").toLowerCase();
        const bKey = (b.title || b.filename || "").toLowerCase();
        return aKey.localeCompare(bKey);
      });
    }

    console.log(
      "🏷️  Built tag map:",
      Object.entries(tagMap).map(([k, v]) => `${k}(${v.length})`).join(", ")
    );

    return tagMap;
  });

  // =========================
  // Eleventy Project Config
  // =========================
  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "layouts",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    // If deploying to GitHub Pages under /<repo>/, set PATH_PREFIX='<repo>/'
    pathPrefix: process.env.PATH_PREFIX
      ? `/${String(process.env.PATH_PREFIX).replace(/^\/|\/$/g, "")}/`
      : "/cookbook/",
  };
};

