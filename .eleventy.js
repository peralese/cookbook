module.exports = function(eleventyConfig) {
  // Copy static content (your JSON) to output
  eleventyConfig.addPassthroughCopy("content");

  return {
    dir: {
      input: "src",
      output: "dist",
      layouts: "layouts"
    },
    templateFormats: ["njk", "md", "html"]
  };
};
