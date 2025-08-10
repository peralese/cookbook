// src/_data/recipes.js
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

const safeSlug = (str) =>
  slugify(String(str || ""), { lower: true, strict: true });

// ↓ new: normalize a name for fuzzy matching (case/punctuation-insensitive)
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ↓ new: shared image helpers
const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".JPG", ".PNG", ".JPEG", ".WEBP", ".GIF"];
const hasExt = (s) => /\.[A-Za-z0-9]{2,5}$/.test(s);

// exact: look for /src/images/<base><ext> and /src/images/<slugCategory>/<base><ext>
function resolveExact(fsImagesDir, slugCategory, base) {
  for (const ext of exts) {
    const flat = path.join(fsImagesDir, `${base}${ext}`);
    if (fs.existsSync(flat)) return `/images/${base}${ext}`;
    if (slugCategory) {
      const inCat = path.join(fsImagesDir, slugCategory, `${base}${ext}`);
      if (fs.existsSync(inCat)) return `/images/${slugCategory}/${base}${ext}`;
    }
  }
  return undefined;
}

// fuzzy: case/punctuation-insensitive match inside /src/images and /src/images/<slugCategory>
function resolveFuzzy(fsImagesDir, slugCategory, base) {
  const wanted = norm(base);
  const dirs = [fsImagesDir, slugCategory ? path.join(fsImagesDir, slugCategory) : null].filter(Boolean);

  for (const dir of dirs) {
    let files = [];
    try { files = fs.readdirSync(dir); } catch { /* ignore */ }
    for (const f of files) {
      const ext = path.extname(f);
      if (!exts.includes(ext)) continue;
      const nb = norm(path.basename(f, ext));
      if (nb === wanted) {
        return dir === fsImagesDir ? `/images/${f}` : `/images/${slugCategory}/${f}`;
      }
    }
  }
  return undefined;
}

const pick = (obj, keys) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
};

const toArray = (val) => {
  if (Array.isArray(val)) {
    return val.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    // split on newlines or commas
    return val
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const toSteps = (val) => {
  const items = toArray(val);
  // Strip leading numbers/bullets like "1. Step", "• Step"
  return items
    .map((s) =>
      s.replace(/^\s*(?:\d+[.)\-:]+|[\u2022\u2023\u25E6\-•])\s*/, "")
    )
    .filter(Boolean);
};

module.exports = () => {
  // Content root containing category folders (e.g., content/01-breakfast/*.json)
  const contentRoot = path.join(__dirname, "..", "..", "content");

  // Only real category dirs (skip hidden or underscored)
  const categories = fs
    .readdirSync(contentRoot)
    .filter((item) => {
      const full = path.join(contentRoot, item);
      return (
        fs.statSync(full).isDirectory() &&
        !item.startsWith(".") &&
        !item.startsWith("_")
      );
    });

  const allRecipes = [];
  let parseErrors = 0;

  categories.forEach((category) => {
    const categoryPath = path.join(contentRoot, category);
    const files = fs
      .readdirSync(categoryPath)
      .filter((f) => f.toLowerCase().endsWith(".json"));

    files.forEach((file) => {
      const recipePath = path.join(categoryPath, file);
      let raw;
      try {
        raw = JSON.parse(fs.readFileSync(recipePath, "utf8"));
      } catch (e) {
        parseErrors++;
        console.warn("⚠️  Skipping invalid JSON:", recipePath, "-", e.message);
        return;
      }

      // Derived basics
      const categoryName = String(category).trim();
      const filename = file.replace(/\.json$/i, "");
      const slugCategory = safeSlug(categoryName);

      // Normalize core fields
      let title =
        pick(raw, ["title", "Title", "name", "recipeTitle"]) ||
        (raw.meta && raw.meta.title) ||
        filename;
      title = String(title).trim();

      let source = pick(raw, [
        "source",
        "Source",
        "from",
        "author",
        "Author",
        "credit",
        "Credit",
      ]);

      let yld = pick(raw, [
        "yield",
        "Yield",
        "servings",
        "Servings",
        "Makes",
        "makes",
        "Qty",
        "qty",
        "quantity",
      ]);

      let remarks = pick(raw, [
        "remarks",
        "Remarks",
        "notes",
        "Notes",
        "note",
        "Note",
        "description",
        "Description",
      ]);

      // Normalize arrays
      const ingredients = toArray(pick(raw, ["ingredients", "Ingredients"]));
      const instructions = toSteps(
        pick(raw, ["instructions", "Instructions", "steps", "Steps"])
      );

      // Normalize tags (array or CSV string)
      const tags = toArray(pick(raw, ["tags", "Tags", "tag", "Tag"]));

      // Slug for file name (prefer explicit slug if provided)
      const slugFilename = safeSlug(
        pick(raw, ["slug", "slugFilename"]) || filename || title
      );

      // --- Extract embedded "Yield:" and "Source:" from remarks, if present ---
      if (remarks && typeof remarks === "string") {
        let r = remarks;

        // Capture "Yield: ..." (dotall to allow newlines)
        const mYield = r.match(/\bYield\s*:\s*(.+?)(?=(?:\bSource\s*:)|$)/is);
        if (!yld && mYield) {
          yld = mYield[1].trim().replace(/\s*\.*\s*$/, "");
        }

        // Capture "Source: ..." (dotall to allow newlines)
        const mSource = r.match(/\bSource\s*:\s*(.+?)(?=(?:\bYield\s*:)|$)/is);
        if (!source && mSource) {
          source = mSource[1].trim().replace(/\s*\.*\s*$/, "");
        }

        // Remove embedded lines from remarks
        r = r
          .replace(/\bYield\s*:\s*.+?(?=(?:\bSource\s*:)|$)/gis, "")
          .replace(/\bSource\s*:\s*.+?(?=(?:\bYield\s*:)|$)/gis, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        // If remarks ended with a duplicate of the title, trim it
        if (title && r.toLowerCase().endsWith(String(title).toLowerCase())) {
          r = r.slice(0, r.length - String(title).length).trim();
        }

        remarks = r || undefined;
      }

      // --- Image normalization & discovery (src/images) ---
      const isAbsoluteUrl = (v) =>
        typeof v === "string" && /^(?:https?:)?\/\//i.test(v);
      const hasLeadingSlash = (v) =>
        typeof v === "string" && v.startsWith("/");

      let imgPick = pick(raw, [
        "image",
        "Image",
        "photo",
        "Photo",
        "picture",
        "img",
        "image_url",
        "imageUrl",
        "images",
      ]);
      if (Array.isArray(imgPick) && imgPick.length) {
        imgPick = imgPick.find(Boolean);
      }

      let imageAbs;    // full URL (http/https/data)
      let imagePath;   // site-absolute path like /images/foo.jpg
      let imageAlt =
        pick(raw, ["imageAlt", "alt", "caption", "Caption"]) || title || filename;
      let imageCredit = pick(raw, [
        "imageCredit",
        "credit",
        "Credit",
        "sourceImage",
        "photoCredit",
      ]);

      if (typeof imgPick === "string" && imgPick.trim()) {
        const v = imgPick.trim();
        if (isAbsoluteUrl(v)) {
          imageAbs = v; // use as-is in template
        } else if (hasLeadingSlash(v)) {
          // e.g. /images/foo.jpg (| url will handle /cookbook)
          imagePath = v;
        } else {
          // relative filename
          if (hasExt(v)) {
            // explicit extension -> assume /src/images/<name>
            imagePath = `/images/${v}`;
          } else {
            // no extension -> try exact then fuzzy inside /src/images
            const fsPathImages = path.join(__dirname, "..", "images");
            imagePath =
              resolveExact(fsPathImages, slugCategory, v) ||
              resolveFuzzy(fsPathImages, slugCategory, v) ||
              `/images/${v}`; // last-resort fallback
          }
        }
      }

      // If still missing, try to auto-discover in /src/images (exact then fuzzy)
      if (!imageAbs && !imagePath) {
        const fsPathImages = path.join(__dirname, "..", "images"); // /src/images
        const tryBases = [slugFilename, safeSlug(title), filename].filter(Boolean);
        let found;
        for (const base of tryBases) {
          found =
            resolveExact(fsPathImages, slugCategory, base) ||
            resolveFuzzy(fsPathImages, slugCategory, base);
          if (found) break;
        }
        if (found) imagePath = found;
      }

      // Assemble final record
      const recipe = {
        // keep original fields for reference (shallow copy)
        ...raw,

        // normalized/derived fields used by templates
        category: categoryName,
        filename,
        slugCategory,
        slugFilename,

        title,
        source: source ? String(source).trim() : undefined,
        yield: yld ? String(yld).trim() : undefined,
        remarks: remarks ? String(remarks).trim() : undefined,

        ingredients,
        instructions,
        tags,

        // image fields
        image: imagePath || undefined,    // use with | url
        imageAbs: imageAbs || undefined,  // absolute URL (no | url)
        imageAlt: imageAlt ? String(imageAlt).trim() : undefined,
        imageCredit: imageCredit ? String(imageCredit).trim() : undefined,
      };

      // Friendly warnings (optional)
      if (!recipe.title) {
        console.warn("⚠️  Recipe missing title:", recipePath);
      }

      allRecipes.push(recipe);
    });
  });

  console.log("Loaded recipes:", allRecipes.length);
  if (parseErrors) {
    console.log(`⚠️  JSON parse errors: ${parseErrors}`);
  }

  // Optional: stable ordering
  allRecipes.sort((a, b) => {
    if (a.slugCategory === b.slugCategory) {
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }
    return a.slugCategory.localeCompare(b.slugCategory);
  });

  return allRecipes;
};
