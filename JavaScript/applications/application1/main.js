"use strict";

// File contains a small piece of the source to demonstrate main module
// of a sample application to be executed in the sandboxed context by
// another pice of code from `framework.js`. Read README.md for tasks.
const m = require("node:path");

// Print from the global context of application module
api.console.log(
  __dirname,
  new Date(Date.now()).toISOString(),
  "From application1 global context",
);

const hash = {
  foo: "bar",
  bar: 42,
  fn: (name, age) => {
    const somecode = "foo";
    const anotherCode = "bar";
    return somecode.concat(anotherCode);
  },
};

module.exports = () => {
  // Print from the exported function context

  api.fs.readFile("../../README.md", (err, data) => {
    if (err) {
      api.console.log(err.message);
      return;
    }
    // Inspecting data obj
    api.util.inspect(data, { showHidden: false, depth: null });
    api.console.log(data.toString());
  });

  api.timers.setTimeout(() => {
    api.console.log(
      __dirname,
      new Date(Date.now()).toISOString(),
      "From application1 exported function",
    );
    // api.console.log("From application1 exported function");
  }, 5000);

  return hash;
};
