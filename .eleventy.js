// .eleventy.js
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

module.exports = function (eleventyConfig) {
  // -------- Filters --------
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

  // -------- Passthroughs (guarded) --------
  if (fs.existsSync("content")) eleventyConfig.addPassthroughCopy("content");
  if (fs.existsSync("src/styles.css")) eleventyConfig.addPassthroughCopy("src/styles.css");
  if (fs.existsSync("src/_data/categories.json"))
    eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  if (fs.existsSync("src/search.js")) eleventyConfig.addPassthroughCopy("src/search.js");
  if (fs.existsSync("src/images")) eleventyConfig.addPassthroughCopy("src/images");
  if (fs.existsSync("src/print.css")) eleventyConfig.addPassthroughCopy("src/print.css");
  if (fs.existsSync("content")) eleventyConfig.addWatchTarget("content");
  if (fs.existsSync("src/print.css")) eleventyConfig.addWatchTarget("src/print.css");

  // -------- Loader --------
  function loadAllRecipes({ excludeDrafts = true } = {}) {
    const contentRoot = fs.existsSync(path.join(__dirname, "src", "content"))
      ? path.join(__dirname, "src", "content")
      : path.join(__dirname, "content");
    if (!fs.existsSync(contentRoot)) {
      console.warn("⚠️ content folder not found at src/content or content/, skipping recipe load.");
      return [];
    }

    const categories = fs
      .readdirSync(contentRoot)
      .filter((item) => fs.statSync(path.join(contentRoot, item)).isDirectory());

    const all = [];
    // Track used dashed slugs per category to avoid duplicate permalinks
    const usedByCategory = new Map(); // key: dashed category, val: Set of dashed slugs

    for (const category of categories) {
      const categoryPath = path.join(contentRoot, category);
      const files = fs.readdirSync(categoryPath).filter((f) => f.toLowerCase().endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          const raw = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(raw);
          if (excludeDrafts && data.draft === true) continue;

          const filename = file.replace(/\.json$/i, "");
          data.category = category;
          data.filename = filename;

          // Slugify category and title (dashed)
          const slugCategory = slugify(category, { lower: true, strict: true });
          data.slugCategory = slugCategory;

          const baseTitle = data.title ? String(data.title) : String(filename);
          const titleDashed = slugify(baseTitle, { lower: true, strict: true });
          const fileDashed = slugify(filename, { lower: true, strict: true });

          if (!usedByCategory.has(slugCategory)) usedByCategory.set(slugCategory, new Set());
          const usedSet = usedByCategory.get(slugCategory);

          // Ensure a unique dashed slug within the category
          let uniqueDashed = titleDashed;
          if (usedSet.has(uniqueDashed)) {
            const candidate = `${titleDashed}-${fileDashed}`;
            uniqueDashed = usedSet.has(candidate) ? `${titleDashed}-${fileDashed.slice(-6)}` : candidate;
          }
          usedSet.add(uniqueDashed);

          data.slugTitle = titleDashed;          // base dashed slug
          data.slugTitleUnique = uniqueDashed;   // dashed + collision-safe
          data.slugTitleFlat = titleDashed.replace(/-/g, ""); // (optional)

          data.id = `${category}/${filename}`;
          // Final URL (dashed, collision‑safe)
          data.urlPath = `recipes/${slugCategory}/${uniqueDashed}/`;

          // Normalize tags
          if (Array.isArray(data.tags)) {
            data.tags = data.tags.map((t) => String(t || "").trim()).filter((t) => t.length > 0);
          }

          all.push(data);
        } catch (e) {
          console.error(`❌ Failed to parse ${filePath}: ${e.message}`);
        }
      }
    }
    console.log("✅ Loaded recipes:", all.length);
    return all;
  }

  // -------- Collections --------
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

  // -------- Eleventy Project Config --------
  return {
    dir: { input: "src", output: "dist", includes: "layouts", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    // Works with the | url filter for GitHub Pages under /cookbook/
    pathPrefix: process.env.PATH_PREFIX
      ? `/${String(process.env.PATH_PREFIX).replace(/^\/|\/$/g, "")}/`
      : "/cookbook/",
  };
};

