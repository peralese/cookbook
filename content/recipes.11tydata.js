// recipes.11tydata.js
const path = require("path");
const slugify = require("slugify");

module.exports = {
  eleventyComputed: {
    // Parent folder name under /recipes/, e.g. "02-baking"
    section: (data) => {
      // data.page.filePathStem is like: /content/02-baking/Moms_Empanada_Dough
      const parts = (data.page && data.page.filePathStem || "").split("/").filter(Boolean);
      // grab the folder right before the file name
      return (parts.length >= 2 ? parts[parts.length - 2] : "").toLowerCase();
    },

    // Flat, punctuation-free, lowercase slug from title (fallback: filename)
    cleanTitleSlug: (data) => {
      const base =
        data.title ||
        (data.page && path.parse(data.page.inputPath).name) ||
        "";
      // slugify once (strict removes punctuation, lower lowercases), then remove dashes
      return slugify(String(base), { lower: true, strict: true }).replace(/-/g, "");
    },

    // Final permalink
    // Result: /recipes/<section>/<cleanTitleSlug>/
    permalink: (data) => {
      const section = data.section || "";
      const slug = data.cleanTitleSlug || "";
      if (!section || !slug) return false; // skip output if something's off
      return `/recipes/${section}/${slug}/`;
    },
  },
};
