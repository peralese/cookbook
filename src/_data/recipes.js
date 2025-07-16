const fs = require("fs");
const path = require("path");
const slugify = require("slugify");


module.exports = () => {
  const contentRoot = path.join(__dirname, "..", "..", "content");

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

  console.log("Loaded recipes:", allRecipes.length);
  return allRecipes;
};
