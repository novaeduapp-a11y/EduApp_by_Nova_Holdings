const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [require.resolve("babel-preset-expo", { paths: [__dirname] })],
  };
};
