const slugify = require("slugify");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("content");
  eleventyConfig.addPassthroughCopy("src/styles.css");


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

