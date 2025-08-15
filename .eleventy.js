// .eleventy.js
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

// ✅ Schema validation (Ajv)
const Ajv = require("ajv/dist/2020");   // ✅ use the 2020 build
const addFormats = require("ajv-formats");
const recipeSchema = require("./src/_data/recipe.schema.json");

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
  eleventyConfig.addFilter("recipeUrlPath", (r) => {
    if (!r) return "/";
    const cat = slugify(r.category || "", { lower: true, strict: true });
    const title = slugify(r.title || r.filename || "", { lower: true, strict: true });
    return `/recipes/${cat}/${title}/`;
  });
  eleventyConfig.addFilter("year", (d) => (d ? new Date(d) : new Date()).getFullYear());

  // -------- Passthroughs & Watchers --------
  // Content (works whether content/ is at repo root or src/content/)
  if (fs.existsSync("content")) {
    eleventyConfig.addPassthroughCopy("content");
    eleventyConfig.addWatchTarget("content");
  }
  if (fs.existsSync("src/content")) {
    eleventyConfig.addPassthroughCopy({ "src/content": "content" });
    eleventyConfig.addWatchTarget("src/content");
  }

  // CSS: auto-detect common locations and publish as /style.css
  const cssCandidates = [
    "src/style.css",
    "src/styles.css",
    "src/css/style.css",
    "src/assets/style.css",
    "src/assets/styles.css",
    "style.css",
    "styles.css",
  ];
  const cssSource = cssCandidates.find((p) => fs.existsSync(p));
  if (cssSource) {
    eleventyConfig.addPassthroughCopy({ [cssSource]: "style.css" });
    eleventyConfig.addWatchTarget(cssSource);
  }

  // Print CSS → /print.css (auto-detect)
  const printCandidates = ["src/print.css", "print.css", "src/css/print.css"];
  const printSource = printCandidates.find((p) => fs.existsSync(p));
  if (printSource) {
    eleventyConfig.addPassthroughCopy({ [printSource]: "print.css" });
    eleventyConfig.addWatchTarget(printSource);
  }

  // Images → /images/*
  if (fs.existsSync("src/images")) {
    eleventyConfig.addPassthroughCopy({ "src/images": "images" });
    eleventyConfig.addWatchTarget("src/images");
  }
  if (fs.existsSync("images")) {
    eleventyConfig.addPassthroughCopy("images");
    eleventyConfig.addWatchTarget("images");
  }

  // Optional JS → /search.js
  if (fs.existsSync("src/search.js")) {
    eleventyConfig.addPassthroughCopy({ "src/search.js": "search.js" });
    eleventyConfig.addWatchTarget("src/search.js");
  }

  // Fuse.js search script → /assets/js/fuse-search.js
  if (fs.existsSync("src/assets/js/fuse-search.js")) {
    eleventyConfig.addPassthroughCopy({ "src/assets/js/fuse-search.js": "assets/js/fuse-search.js" });
    eleventyConfig.addWatchTarget("src/assets/js/fuse-search.js");
  }

  // -------- Ajv setup (once) --------
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateRecipe = ajv.compile(recipeSchema);

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

          // Canonicalize fields (support multiple casings)
          const titleValue =
            data.title || data.Title || data.name || data.Name ||
            data.recipeTitle || (data.meta && (data.meta.title || data.meta.Title)) || filename;

          const imageValue = data.image || data.Image || data.photo || data.Photo || null;

          let yieldValue =
            data.yield || data.Yield || data.servings || data.Servings || data.Makes || "";

          let sourceValue =
            data.source || data.Source || data.attribution || data.Attribution || data.Author || "";

          const ingredientsValue =
            data.ingredients || data.Ingredients || data.ingredient || data.Ingredient || null;

          // Many JSONs use `instructions`
          const directionsValue =
            data.directions || data.Directions || data.instructions || data.Instructions || null;

          let remarksValue =
            data.remarks || data.Remarks || data.notes || data.Notes || data.Description || "";

          // Extract "Yield:" and "Source:" from remarks if fields are empty
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

          // Canonical fields
          data.title = String(titleValue);
          if (ingredientsValue) data.ingredients = ingredientsValue;
          if (directionsValue) data.directions = directionsValue;
          data.remarks = remarksValue || "";
          data.yield = yieldValue || "";
          data.source = sourceValue || "";

          // Robust image resolution (handles case/extension/locations)
          if (imageValue && String(imageValue).trim()) {
            const imgRaw = String(imageValue).trim().replace(/\\/g, "/");

            if (/^https?:\/\//i.test(imgRaw) || imgRaw.startsWith("/")) {
              data.imageUrl = imgRaw;
            } else {
              const searchDirs = [
                categoryPath,                                           // content/<Category>/
                path.join(categoryPath, "images"),                      // content/<Category>/images/
                path.join(contentRoot, "images"),                       // content/images/
                path.join(process.cwd(), "src", "images"),              // src/images/
                path.join(process.cwd(), "images"),                     // images/
              ].filter((p) => fs.existsSync(p));

              const wantedBase = path.basename(imgRaw, path.extname(imgRaw)).toLowerCase();
              const wantedFullLower = imgRaw.toLowerCase();

              for (const dir of searchDirs) {
                const filesInDir = fs.readdirSync(dir);
                let found = filesInDir.find((f) => f.toLowerCase() === wantedFullLower);
                if (!found) {
                  const pics = filesInDir.filter((f) => /\.(png|jpe?g|webp|gif|svg)$/i.test(f));
                  found = pics.find(
                    (f) => path.basename(f, path.extname(f)).toLowerCase() === wantedBase
                  );
                }
                if (found) {
                  const abs = path.join(dir, found);
                  const dirNorm = dir.replace(/\\/g, "/").toLowerCase();
                  if (dirNorm.startsWith(contentRoot.replace(/\\/g, "/").toLowerCase())) {
                    const rel = path.relative(contentRoot, abs).replace(/\\/g, "/");
                    data.imageUrl = encodeURI(`/content/${rel}`);
                  } else if (dirNorm.endsWith("/images") || dirNorm.includes("/src/images")) {
                    const rel = path.basename(abs);
                    data.imageUrl = encodeURI(`/images/${rel}`);
                  } else {
                    const rel = path.relative(process.cwd(), abs).replace(/\\/g, "/");
                    data.imageUrl = encodeURI(`/${rel}`);
                  }
                  break;
                }
              }

              if (!data.imageUrl) {
                const fallback = encodeURI(`/content/${data.category}/${imgRaw}`);
                data.imageUrl = fallback;
                console.warn(
                  `⚠️ Image not found for "${data.title}" -> "${imgRaw}". Using fallback: ${fallback}`
                );
              }
            }

            data.image = imgRaw; // keep original
          }

          // Slugs + URL
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

          // Tags
          if (Array.isArray(data.tags)) {
            data.tags = data.tags.map((t) => String(t || "").trim()).filter((t) => t.length > 0);
          }

          // ✅ Validate against JSON Schema (fail build on error)
          const ok = validateRecipe(data);
          if (!ok) {
            const where = `${categoryFolder}/${file}`;
            const details = validateRecipe.errors
              .map(e => `• ${e.instancePath || "(root)"} ${e.message}`)
              .join("\n");
            throw new Error(`❌ Recipe schema validation failed for ${where}\n${details}`);
          }

          all.push(data);
        } catch (e) {
          console.error(`❌ Failed to parse ${filePath}: ${e.message}`);
        }
      }
    }

    // Build-time hints
    if (!cssSource) {
      console.warn("⚠️ No stylesheet found. Place one at src/style.css (or styles.css).");
    } else {
      console.log(`✓ CSS passthrough: ${cssSource} → /style.css`);
    }

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
        (a.title || a.filename || "").localeCompare(b.title || b.filename || "", undefined, {
          sensitivity: "base",
        })
      );
    }
    return tagMap;
  });

  eleventyConfig.addCollection("categories", () => {
    const recipes = loadAllRecipes();
    const map = new Map();
    for (const r of recipes) {
      if (!r.slugCategory) continue;
      const slug = r.slugCategory;
      const label = r.category || slug;
      if (!map.has(slug)) map.set(slug, { slug, label, items: [] });
      map.get(slug).items.push(r);
    }
    for (const entry of map.values()) {
      entry.items.sort((a, b) =>
        (a.title || a.filename || "").localeCompare(b.title || b.filename || "", undefined, {
          sensitivity: "base",
        })
      );
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );
  });

  // -------- Eleventy Project Config --------
  return {
    dir: { input: "src", output: "dist", includes: "layouts", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    pathPrefix: process.env.PATH_PREFIX
      ? `/${String(process.env.PATH_PREFIX).replace(/^\/|\/$/g, "")}/`
      : "/cookbook/",
  };
};




