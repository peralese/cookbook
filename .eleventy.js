const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

module.exports = function(eleventyConfig) {
  // ✅ Filters
  eleventyConfig.addFilter("slug", input => {
    if (typeof input !== "string") return "";
    return slugify(input, { lower: true, strict: true });
  });

  eleventyConfig.addFilter("keys", obj => {
    if (typeof obj !== "object" || obj === null) return [];
    return Object.keys(obj);
  });

  // ✅ Passthrough Copy
  eleventyConfig.addPassthroughCopy("content");
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  eleventyConfig.addPassthroughCopy("src/search.js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/print.css");

  // ✅ Load all recipe JSON files directly
  function loadAllRecipes() {
    const contentRoot = path.join(__dirname, "content");
    const categories = fs.readdirSync(contentRoot).filter(item =>
      fs.statSync(path.join(contentRoot, item)).isDirectory()
    );

    let allRecipes = [];

    categories.forEach(category => {
      const categoryPath = path.join(contentRoot, category);
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith(".json"));

      files.forEach(file => {
        const recipePath = path.join(categoryPath, file);
        const data = JSON.parse(fs.readFileSync(recipePath, "utf8"));
        data.category = category;
        data.filename = file.replace(".json", "");
        data.slugCategory = slugify(category, { lower: true, strict: true });
        allRecipes.push(data);
      });
    });

    console.log("✅ Loaded recipes for tagged collection:", allRecipes.length);
    return allRecipes;
  }

  // ✅ Create a custom tag-based collection
  eleventyConfig.addCollection("tagged", function() {
    const recipes = loadAllRecipes();
    const tagMap = {};

    recipes.forEach(recipe => {
      if (Array.isArray(recipe.tags)) {
        recipe.tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = [];
          tagMap[tag].push(recipe);
        });
      }
    });

    return tagMap;
  });

  // ✅ Project config
  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "layouts"
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"], // ← missing comma fixed
    pathPrefix: process.env.PATH_PREFIX || "/cookbook/", // repo name with slashes
  };
};




