const fs = require("node:fs");

const readFile = fs.readFile;

module.exports = (...args) => {
  console.log("From fake fs function");
  const filepath = args.shift();
  const callback = args.pop();
  const options = args.pop();

  readFile(filepath, options, (err, data) => {
    if (err) console.log("An error occured inside fake fs function");
    else callback(null, data);
  });
};
