const fs   = require('fs');
const path   = require('path');

createConfig();
createClassColorsConfig();

function createConfig() {
  let example;
  try {
    require.resolve('../config');
  } catch(err) { 
    if (err instanceof Error && err.code === "MODULE_NOT_FOUND") {
      example = fs.readFileSync(path.join('..', 'config', 'examples', 'index.js.'));
      fs.writeFileSync(path.join('..', 'config', 'index.js.'), example);
    } else
      throw err;
  }
}

function createClassColorsConfig() {
  let example;
  try {
    require.resolve('../config/classes');
  } catch(err) { 
    if (err instanceof Error && err.code === "MODULE_NOT_FOUND") {
      example = fs.readFileSync(path.join('..', 'config', 'examples', 'classes.js.'));
      fs.writeFileSync(path.join('..', 'config', 'classes.js'), example);
    } else
      throw err;
  }
}