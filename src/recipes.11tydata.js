// src/recipes.11tydata.js
const slugify = require("@sindresorhus/slugify");

module.exports = {
  eleventyComputed: {
    // Each recipe object is provided by your recipes data file
    permalink: (data) => {
      const r = data.recipe || {};
      const cat = slugify(r.category || "", { lowercase: true, separator: "-" });
      const title = slugify(r.title || r.filename || "", { lowercase: true, separator: "-" });
      return `/recipes/${cat}/${title}/`;
    },
    // Useful to have on the object for templates
    urlPath: (data) => {
      const r = data.recipe || {};
      const cat = slugify(r.category || "", { lowercase: true, separator: "-" });
      const title = slugify(r.title || r.filename || "", { lowercase: true, separator: "-" });
      return `/recipes/${cat}/${title}/`;
    }
  }
};
