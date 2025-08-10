// src/_data/tags.js
const recipesData = require("./recipes");

module.exports = function () {
  const recipes = typeof recipesData === "function" ? recipesData() : recipesData;

  if (!Array.isArray(recipes)) {
    throw new Error("Expected recipes to be an array, got: " + typeof recipes);
  }

  // Use a map to de-duplicate case-insensitively but keep first-seen original casing
  const map = new Map(); // key: lowercased tag, value: original tag as first seen

  recipes.forEach(recipe => {
    if (Array.isArray(recipe.tags)) {
      recipe.tags.forEach(tag => {
        if (typeof tag === "string") {
          const cleaned = tag.trim();
          if (cleaned) {
            const key = cleaned.toLowerCase();
            if (!map.has(key)) map.set(key, cleaned);
          }
        }
      });
    }
  });

  // Return a sorted array of original tag strings
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
};


