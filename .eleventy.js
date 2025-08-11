// .eleventy.js
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const crypto = require("crypto");

module.exports = function (eleventyConfig) {
  // ========== Filters ==========
  eleventyConfig.addFilter("slug", (s) =>
    typeof s === "string" ? slugify(s, { lower: true, strict: true }) : ""
  );
  eleventyConfig.addFilter("flatSlug", (s) =>
    typeof s === "string" ? slugify(s, { lower: true, strict: true }).replace(/-/g, "") : ""
  );
  eleventyConfig.addFilter("keys", (obj) => (obj && typeof obj === "object" ? Object.keys(obj) : []));
  eleventyConfig.addFilter("safeJson", (v) => JSON.stringify(v, null, 2));
  eleventyConfig.addFilter("tagLabel", (s) => String(s || "").replace(/[’'"]/g, ""));
  eleventyConfig.addFilter("tagId", (s) =>
    String(s || "").toLowerCase().replace(/[’'"]/g, "").replace(/\s+/g, "-")
  );

  // ========== Passthrough & Watch (guarded) ==========
  if (fs.existsSync("content")) eleventyConfig.addPassthroughCopy("content");
  if (fs.existsSync("src/styles.css")) eleventyConfig.addPassthroughCopy("src/styles.css");
  if (fs.existsSync("src/_data/categories.json"))
    eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  if (fs.existsSync("src/search.js")) eleventyConfig.addPassthroughCopy("src/search.js");
  if (fs.existsSync("src/images")) eleventyConfig.addPassthroughCopy("src/images");
  if (fs.existsSync("src/print.css")) eleventyConfig.addPassthroughCopy("src/print.css");
  if (fs.existsSync("content")) eleventyConfig.addWatchTarget("content");
  if (fs.existsSync("src/print.css")) eleventyConfig.addWatchTarget("src/print.css");

  // ========== Helpers ==========
  function loadAllRecipes({ excludeDrafts = true } = {}) {
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

    const allRecipes = [];
    // Track used slugs per category to avoid permalink collisions
    const usedByCategory = new Map(); // key: slugCategory, value: Set of used dashed slugs

    for (const category of categories) {
      const categoryPath = path.join(contentRoot, category);
      const files = fs.readdirSync(categoryPath).filter((f) => f.toLowerCase().endsWith(".json"));

      for (const file of files) {
        const recipePath = path.join(categoryPath, file);
        try {
          const raw = fs.readFileSync(recipePath, "utf8");
          const data = JSON.parse(raw);
          if (excludeDrafts && data.draft === true) continue;

          const filename = file.replace(/\.json$/i, "");
          data.category = category;
          data.filename = filename;

          // Category slug (dashed)
          const slugCategory = slugify(category, { lower: true, strict: true });
          data.slugCategory = slugCategory;

          // Base dashed slug from title (fallback to filename)
          const base = data.title ? String(data.title) : String(filename);
          const baseDashed = slugify(base, { lower: true, strict: true });
          const fileDashed = slugify(filename, { lower: true, strict: true });

          if (!usedByCategory.has(slugCategory)) usedByCategory.set(slugCategory, new Set());
          const used = usedByCategory.get(slugCategory);

          // Ensure uniqueness within this category
          let uniqueDashed = baseDashed;
          if (used.has(uniqueDashed)) {
            const candidate = `${baseDashed}-${fileDashed}`;
            if (!used.has(candidate)) {
              uniqueDashed = candidate;
            } else {
              const short = crypto.createHash("md5").update(filename).digest("hex").slice(0, 6);
              uniqueDashed = `${baseDashed}-${short}`;
            }
          }
          used.add(uniqueDashed);

          // Save slugs
          data.slugTitle = baseDashed;                  // dashed (pretty)
          data.slugTitleFlat = baseDashed.replace(/-/g, ""); // flat (if you need it)
          data.slugTitleUnique = uniqueDashed;          // dashed + collision-safe

          data.id = `${category}/${filename}`;

          // ✅ Final URL uses the unique dashed slug (matches existing site links)
          data.urlPath = `/recipes/${slugCategory}/${data.slugTitleUnique}/`;

          // Normalize tags
          if (Array.isArray(data.tags)) {
            data.tags = data.tags.map((t) => String(t || "").trim()).filter((t) => t.length > 0);
          }

          allRecipes.push(data);
        } catch (err) {
          console.error(`❌ Failed to parse ${recipePath}:`, err.message);
        }
      }
    }

    console.log("✅ Loaded recipes:", allRecipes.length);
    return allRecipes;
  }

  // ========== Collections ==========
  eleventyConfig.addCollection("recipes", () => loadAllRecipes());

  eleventyConfig.addCollection("tagged", () => {
    const recipes = loadAllRecipes();
    const tagMap = {};
    recipes.forEach((r) => {
      if (!Array.isArray(r.tags) || r.tags.length === 0) return;
      const seen = new Set();
      r.tags.forEach((raw) => {
        const t = String(raw).trim();
        if (!t) return;
        const keyLC = t.toLowerCase();
        if (seen.has(keyLC)) return;
        seen.add(keyLC);
        const existingKey = Object.keys(tagMap).find((k) => k.toLowerCase() === keyLC) || t;
        (tagMap[existingKey] ||= []).push(r);
      });
    });
    for (const k of Object.keys(tagMap)) {
      tagMap[k].sort((a, b) => (a.title || a.filename || "").localeCompare(b.title || b.filename || "", undefined, { sensitivity: "base" }));
    }
    return tagMap;
  });

  // ========== Eleventy Project Config ==========
  return {
    dir: { input: "src", output: "dist", includes: "layouts", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    // Works with the | url filter to prepend /cookbook/ on GitHub Pages
    // (url filter + pathPrefix are the recommended way to handle subdirectory deploys).
    pathPrefix: process.env.PATH_PREFIX
      ? `/${String(process.env.PATH_PREFIX).replace(/^\/|\/$/g, "")}/`
      : "/cookbook/",
  };
};
