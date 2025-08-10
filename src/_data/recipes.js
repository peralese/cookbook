const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

module.exports = () => {
  const contentRoot = path.join(__dirname, "..", "..", "content");

  // Only real category dirs (skip hidden or underscored)
  const categories = fs.readdirSync(contentRoot).filter((item) => {
    const full = path.join(contentRoot, item);
    return (
      fs.statSync(full).isDirectory() &&
      !item.startsWith(".") &&
      !item.startsWith("_")
    );
  });

  const allRecipes = [];

  categories.forEach((category) => {
    const categoryPath = path.join(contentRoot, category);

    const files = fs
      .readdirSync(categoryPath)
      .filter((f) => f.toLowerCase().endsWith(".json"));

    files.forEach((file) => {
      const recipePath = path.join(categoryPath, file);
      const data = JSON.parse(fs.readFileSync(recipePath, "utf8"));

      // Derived fields
      data.category = category.trim();
      data.filename = file.replace(/\.json$/i, "");
      data.slugCategory = slugify(data.category, { lower: true, strict: true });
      data.slugFilename = slugify(data.filename, { lower: true, strict: true });

      // Normalize tags
      if (!Array.isArray(data.tags)) data.tags = [];

      allRecipes.push(data);
    });
  });

  console.log("Loaded recipes:", allRecipes.length);
  return allRecipes;
};

