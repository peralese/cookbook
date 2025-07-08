const fs = require("fs");
const path = require("path");

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
      allRecipes.push(data);
    });
  });

  return allRecipes;
};
