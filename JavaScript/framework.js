"use strict";

// Example showing us how the framework creates an environment (sandbox) for
// appication runtime, load an application code and passes a sandbox into app
// as a global context and receives exported application interface

// The framework can require core libraries
const api = {};
const fs = require("node:fs");
api.fs = fs;
api.vm = require("node:vm");
// api.sandboxedFs = require("sandboxed-fs");

const { cloneInterface, wrapFunction } = require("./wrapper.js");

const log = (s) => {
  console.log("Prints something from sandbox");
  console.log(s);
};

const safeRequire = (name) => {
  if (name === "fs") {
    const msg = "You dont have access to fs API";
    console.log(msg);
    return new Error(msg);
  } else {
    return require(name);
  }
};

const runSandboxed = (path) => {
  const fileName = path + "main.js";
  const context = {
    module: {},
    require: safeRequire,
    api: {
      console: { log },
      timers: {
        setTimeout: wrapFunction("setTimeout", setTimeout),
      },
      // Error: cannot find module "sandboxed-fs";
      // fs: cloneInterface(api.sandboxedFs.bind(path)),
      fs,
    },
  };
  context.global = context;
  const sandbox = api.vm.createContext(context);
  // Read an application source code from the file
  api.fs.readFile(fileName, (err, src) => {
    // We need to handle errors here

    // Run an application in sandboxed context
    const script = new api.vm.Script(src, fileName);
    const f = script.runInNewContext(sandbox);
    if (f) f();

    // We can access a link to exported interface from sandbox.module.exports
    // to execute, save to the cache, print to console, etc.
  });
};

runSandboxed("./applications/application1/");
runSandboxed("./applications/application2/");
