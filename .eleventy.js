const slugify = require("slugify");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("content");
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy({ "src/_data/categories.json": "categories.json" });
  eleventyConfig.addPassthroughCopy("src/search.js");
  eleventyConfig.addPassthroughCopy("src/images");


  eleventyConfig.addFilter("slug", input =>
    slugify(input, { lower: true, strict: true })
  );

  return {
    dir: {
      input: "src",
      output: "dist",
      layouts: "layouts"
    },
    templateFormats: ["njk", "md", "html"]
  };
};

