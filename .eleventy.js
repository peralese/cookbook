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

  eleventyConfig.addFilter("keys", (obj) => {
    if (typeof obj !== "object" || obj === null) return [];
    return Object.keys(obj);
  });

  // Handy for debugging in templates
  eleventyConfig.addFilter("safeJson", (value) =>
    JSON.stringify(value, null, 2)
  );

  // =========================
  // Passthrough & Watch
  // =========================
  eleventyConfig.addPassthroughCopy("content");
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  eleventyConfig.addPassthroughCopy("src/search.js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/print.css");

  eleventyConfig.addWatchTarget("content");
  eleventyConfig.addWatchTarget("src/print.css");

  // =========================
  // Helpers
  // =========================
  function loadAllRecipes({ excludeDrafts = true } = {}) {
    const contentRoot = path.join(__dirname, "content");
    if (!fs.existsSync(contentRoot)) {
      console.warn("⚠️  content/ folder not found, skipping recipe load.");
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
          data.slugCategory = slugify(category, { lower: true, strict: true });
          data.slugTitle = data.title
            ? slugify(data.title, { lower: true, strict: true })
            : slugify(filename, { lower: true, strict: true });
          data.id = `${category}/${filename}`;

          // Ensure tags is an array if present
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
  // Patch notes:
  //  - ignores draft:true
  //  - normalizes whitespace in tags
  //  - prevents duplicate tags per recipe (case-insensitive)
  //  - merges keys that differ only by case (keeps first-seen casing)
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

        // Find if we already have this tag under a different case
        const existingKey =
          Object.keys(tagMap).find((k) => k.toLowerCase() === keyLC) || trimmed;

        if (!tagMap[existingKey]) tagMap[existingKey] = [];
        tagMap[existingKey].push(recipe);
      });
    });

    // Optional: sort each tag's items by title (if present), then filename
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
