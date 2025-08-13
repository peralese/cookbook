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
    String(s || "").toLowerCase().replace(/[’'"]/g, "").replace(/\s+/g, "-"
  ));

  // Helper to build canonical recipe path (mirrors urlPath)
  eleventyConfig.addFilter("recipeUrlPath", (r) => {
    if (!r) return "/";
    const cat = slugify(r.category || "", { lower: true, strict: true });
    const title = slugify(r.title || r.filename || "", { lower: true, strict: true });
    return `/recipes/${cat}/${title}/`;
  });

  // Minimal year filter (replaces use of `date` in templates)
  eleventyConfig.addFilter("year", (d) => {
    const dt = d ? new Date(d) : new Date();
    return dt.getFullYear();
  });

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

  // -------- Loader (single source of truth) --------
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
    const usedByCategory = new Map(); // slug -> Set of used slugs

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

          // Slugify category and title
          const slugCategory = slugify(category, { lower: true, strict: true });
          data.slugCategory = slugCategory;

          const baseTitle = data.title ? String(data.title) : String(filename);
          const titleDashed = slugify(baseTitle, { lower: true, strict: true });
          const fileDashed = slugify(filename, { lower: true, strict: true });

          if (!usedByCategory.has(slugCategory)) usedByCategory.set(slugCategory, new Set());
          const usedSet = usedByCategory.get(slugCategory);

          // Ensure unique slug within category
          let uniqueDashed = titleDashed;
          if (usedSet.has(uniqueDashed)) {
            const candidate = `${titleDashed}-${fileDashed}`;
            uniqueDashed = usedSet.has(candidate) ? `${titleDashed}-${fileDashed.slice(-6)}` : candidate;
          }
          usedSet.add(uniqueDashed);

          data.slugTitle = titleDashed;
          data.slugTitleUnique = uniqueDashed;
          data.slugTitleFlat = titleDashed.replace(/-/g, "");
          data.id = `${category}/${filename}`;

          // *** Leading slash so `| url` + pathPrefix work on GitHub Pages
          data.urlPath = `/recipes/${slugCategory}/${uniqueDashed}/`;

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
      tagMap[k].sort((a, b) =>
        (a.title || a.filename || "").localeCompare(
          b.title || b.filename || "",
          undefined,
          { sensitivity: "base" }
        )
      );
    }
    return tagMap;
  });

  // Categories collection: [{ slug, label, items: [...] }, ...]
  eleventyConfig.addCollection("categories", () => {
    const recipes = loadAllRecipes();
    const map = new Map(); // slug -> { slug, label, items }

    for (const r of recipes) {
      if (!r.slugCategory) continue;
      const slug = r.slugCategory;
      const label = r.category || slug;
      if (!map.has(slug)) map.set(slug, { slug, label, items: [] });
      map.get(slug).items.push(r);
    }

    // Sort recipes within each category (optional)
    for (const entry of map.values()) {
      entry.items.sort((a, b) =>
        (a.title || a.filename || "").localeCompare(b.title || b.filename || "", undefined, {
          sensitivity: "base",
        })
      );
    }

    // Sort categories by label for stable pagination order
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );
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



