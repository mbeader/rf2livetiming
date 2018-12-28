const fs   = require('fs');

createConfig();

function createConfig() {
  let example;
  try {
    require.resolve('./config');
  } catch(err) { 
    if (err instanceof Error && err.code === "MODULE_NOT_FOUND") {
      example = fs.readFileSync('config.js.example');
      fs.writeFileSync('config.js', example);
    } else
      throw err;
  }
}