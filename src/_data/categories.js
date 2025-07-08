const fs = require("fs");
const path = require("path");

module.exports = () => {
  const contentRoot = path.join(__dirname, "..", "..", "content");

  const categories = fs.readdirSync(contentRoot).filter(item =>
    fs.statSync(path.join(contentRoot, item)).isDirectory()
  );

  return categories.sort();
};
