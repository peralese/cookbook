// src/_data/tags.js
const recipesData = require("./recipes");
const recipes = typeof recipesData === "function" ? recipesData() : recipesData;

function getAllTags() {
  const tagSet = new Set();

  if (!Array.isArray(recipes)) {
    throw new Error("Expected recipes to be an array, got: " + typeof recipes);
  }

  recipes.forEach(recipe => {
    if (Array.isArray(recipe.tags)) {
      recipe.tags.forEach(tag => {
        if (typeof tag === "string" && tag.trim() !== "") {
          tagSet.add(tag.trim());
        }
      });
    }
  });

  return Array.from(tagSet).sort();
}

module.exports = getAllTags();


