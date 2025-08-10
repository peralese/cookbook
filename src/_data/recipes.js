// src/_data/recipes.js
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

const safeSlug = (str) =>
  slugify(String(str || ""), { lower: true, strict: true });

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
