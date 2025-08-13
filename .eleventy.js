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

  // -------- Passthroughs & Watchers --------
  if (fs.existsSync("content")) {
    eleventyConfig.addPassthroughCopy("content");
    eleventyConfig.addWatchTarget("content");
  }
  if (fs.existsSync("src/content")) {
    eleventyConfig.addPassthroughCopy({ "src/content": "content" });
    eleventyConfig.addWatchTarget("src/content");
  }

  // CSS (Option A): pass through whichever you actually have
  if (fs.existsSync("src/style.css")) {
    eleventyConfig.addPassthroughCopy("src/style.css");
    eleventyConfig.addWatchTarget("src/style.css");
  }
  if (fs.existsSync("src/styles.css")) {
    eleventyConfig.addPassthroughCopy("src/styles.css");
    eleventyConfig.addWatchTarget("src/styles.css");
  }

  if (fs.existsSync("src/_data/categories.json")) {
    eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  }
  if (fs.existsSync("src/search.js")) {
    eleventyConfig.addPassthroughCopy("src/search.js");
  }
  if (fs.existsSync("src/images")) {
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addWatchTarget("src/images");
  }
  if (fs.existsSync("images")) {
    eleventyConfig.addPassthroughCopy("images");
    eleventyConfig.addWatchTarget("images");
  }
  if (fs.existsSync("src/print.css")) {
    eleventyConfig.addPassthroughCopy("src/print.css");
    eleventyConfig.addWatchTarget("src/print.css");
  }

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

    for (const categoryFolder of categories) {
      const categoryPath = path.join(contentRoot, categoryFolder);
      const files = fs.readdirSync(categoryPath).filter((f) => f.toLowerCase().endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        try {
          const raw = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(raw);
          if (excludeDrafts && data.draft === true) continue;

          const filename = file.replace(/\.json$/i, "");

          // Keep the human label and folder as-is (e.g., "01 - Breakfast")
          data.category = data.category || data.Category || categoryFolder;
          data.filename = filename;

          // ---- Canonicalize fields (support multiple casings) ----
          const titleValue =
            data.title || data.Title || data.name || data.Name ||
            data.recipeTitle || (data.meta && (data.meta.title || data.meta.Title)) || filename;

          const imageValue = data.image || data.Image || data.photo || data.Photo || null;

          // May be in remarks; we’ll also extract below if present there
          let yieldValue =
            data.yield || data.Yield || data.servings || data.Servings || data.Makes || "";

          let sourceValue =
            data.source || data.Source || data.attribution || data.Attribution || data.Author || "";

          const ingredientsValue =
            data.ingredients || data.Ingredients || data.ingredient || data.Ingredient || null;

          // Many of your JSONs use `instructions`
          const directionsValue =
            data.directions || data.Directions || data.instructions || data.Instructions || null;

          let remarksValue =
            data.remarks || data.Remarks || data.notes || data.Notes || data.Description || "";

          // Extract "Yield:" and "Source:" from remarks if those fields are empty
          if (remarksValue) {
            if (!yieldValue) {
              const m = remarksValue.match(/(?:^|\s)Yield:\s*(.+?)(?=(?:\s+Source:|$))/i);
              if (m) {
                yieldValue = m[1].trim();
                remarksValue = (remarksValue.replace(m[0], "")).trim();
              }
            }
            if (!sourceValue) {
              const m2 = remarksValue.match(/(?:^|\s)Source:\s*(.+)$/i);
              if (m2) {
                sourceValue = m2[1].trim();
                remarksValue = (remarksValue.replace(m2[0], "")).trim();
              }
            }
          }

          // Write canonical fields back so templates can rely on lowercase
          data.title = String(titleValue);
          if (ingredientsValue) data.ingredients = ingredientsValue;
          if (directionsValue) data.directions = directionsValue;
          data.remarks = remarksValue || "";
          data.yield = yieldValue || "";
          data.source = sourceValue || "";

          // ---- Image resolution (robust) ----
          if (imageValue && String(imageValue).trim()) {
            const imgRaw = String(imageValue).trim().replace(/\\/g, "/");

            // Absolute URL or site-absolute => use as-is.
            if (/^https?:\/\//i.test(imgRaw) || imgRaw.startsWith("/")) {
              data.imageUrl = imgRaw;
            } else {
              // Places to search (in order)
              const searchDirs = [
                categoryPath,                                           // content/<Category>/
                path.join(categoryPath, "images"),                      // content/<Category>/images/
                path.join(contentRoot, "images"),                       // content/images/
                path.join(process.cwd(), "src", "images"),              // src/images/
                path.join(process.cwd(), "images"),                     // images/
              ].filter(p => fs.existsSync(p));

              const wantedBase = path.basename(imgRaw, path.extname(imgRaw)).toLowerCase();
              const wantedFullLower = imgRaw.toLowerCase();

              let resolvedAbsPath = null;

              for (const dir of searchDirs) {
                const filesInDir = fs.readdirSync(dir);
                // Prefer exact filename (case-insensitive)
                let found = filesInDir.find(f => f.toLowerCase() === wantedFullLower);
                if (!found) {
                  // Then match by basename with any common extension
                  const pics = filesInDir.filter(f => /\.(png|jpe?g|webp|gif|svg)$/i.test(f));
                  found = pics.find(f => path.basename(f, path.extname(f)).toLowerCase() === wantedBase);
                }
                if (found) {
                  resolvedAbsPath = path.join(dir, found);
                  const dirNorm = dir.replace(/\\/g, "/").toLowerCase();
                  if (dirNorm.startsWith(contentRoot.replace(/\\/g, "/").toLowerCase())) {
                    // Anything under contentRoot publishes under /content
                    const rel = path.relative(contentRoot, resolvedAbsPath).replace(/\\/g, "/");
                    data.imageUrl = encodeURI(`/content/${rel}`);
                  } else if (dirNorm.endsWith("/images") || dirNorm.includes("/src/images")) {
                    // /images root
                    const rel = path.basename(resolvedAbsPath); // keep it flat for /images
                    data.imageUrl = encodeURI(`/images/${rel}`);
                  } else {
                    // Fallback: absolute path from project root
                    const rel = path.relative(process.cwd(), resolvedAbsPath).replace(/\\/g, "/");
                    data.imageUrl = encodeURI(`/${rel}`);
                  }
                  break;
                }
              }

              if (!data.imageUrl) {
                // Not found—fall back to category-relative path under /content and warn.
                const fallback = encodeURI(`/content/${data.category}/${imgRaw}`);
                data.imageUrl = fallback;
                console.warn(`⚠️ Image not found by scanner for "${data.title}" -> tried "${imgRaw}". Using fallback: ${fallback}`);
              }
            }

            data.image = imgRaw; // keep original
          }

          // ---- Slugs and URL path ----
          const slugCategory = slugify(data.category, { lower: true, strict: true });
          data.slugCategory = slugCategory;

          const titleDashed = slugify(data.title, { lower: true, strict: true });
          const fileDashed = slugify(filename, { lower: true, strict: true });

          if (!usedByCategory.has(slugCategory)) usedByCategory.set(slugCategory, new Set());
          const usedSet = usedByCategory.get(slugCategory);

          let uniqueDashed = titleDashed;
          if (usedSet.has(uniqueDashed)) {
            const candidate = `${titleDashed}-${fileDashed}`;
            uniqueDashed = usedSet.has(candidate) ? `${titleDashed}-${fileDashed.slice(-6)}` : candidate;
          }
          usedSet.add(uniqueDashed);

          data.slugTitle = titleDashed;
          data.slugTitleUnique = uniqueDashed;
          data.slugTitleFlat = titleDashed.replace(/-/g, "");
          data.id = `${categoryFolder}/${filename}`;

          // Leading slash so `| url` works with pathPrefix on GitHub Pages
          data.urlPath = `/recipes/${slugCategory}/${uniqueDashed}/`;

          // Normalize tags (string → array safety)
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


