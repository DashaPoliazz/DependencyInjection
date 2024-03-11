"use strict";

// Example showing us how the framework creates an environment (sandbox) for
// appication runtime, load an application code and passes a sandbox into app
// as a global context and receives exported application interface

// The framework can require core libraries
const api = {};
const fs = require("node:fs");
const path = require("node:path");
api.fs = fs;
api.vm = require("node:vm");
api.util = require("node:util");
api.sandboxedFs = require("sandboxed-fs");

const { cloneInterface, wrapFunction } = require("./wrapper.js");

const applicationName = process.argv[2];

if (!applicationName) {
  console.error("You have to pass the name of application you want to run");
  process.exit(1);
}

const applicationPath = path.join(__dirname, "applications", applicationName);

if (!fs.existsSync(applicationPath)) {
  console.error(`Application ${applicationName} is not found!`);
  process.exit(1);
}

const log = (applicationName, time, s) => {
  console.log(`${applicationName} ${time} ${s}`);
};

const timeout = (cb, ms) => {
  console.log("Hello from timeout!");
  return setTimeout(cb, ms);
};
const interval = (cb, ms) => {
  console.log("Hello from interval!");
  return setInterval(cb, ms);
};

const safeRequire = (name) => {
  const currentTime = new Date(Date.now()).toISOString();
  console.log(`Module name: ${name}, ${currentTime}`);

  if (name === "fs") {
    const msg = "You dont have access to fs API";
    console.log(msg);
    return new Error(msg);
  } else {
    return require(name);
  }
};

const createObservable = (obj, onChange) => {
  return new Proxy(obj, {
    set(target, prop, value) {
      console.log(
        `Key ${prop} has been modified from ${target[prop]} to ${value}`,
      );
      target[prop] = value;
      onChange();
      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      console.log(`Key: ${prop} has been removed`);
      onChange();
      return true;
    },
  });
};

const runSandboxed = (filePath) => {
  const fileName = filePath.concat("main.js");
  const parentDirectory = path.basename(path.dirname(fileName));

  const context = {
    module: {},
    require: safeRequire,
    api: {
      console: { log },
      timers: {
        setTimeout: timeout,
        setInterval: interval,
      },
      fs: cloneInterface(api.sandboxedFs.bind(filePath)),
      util: api.util,
    },
    __dirname: parentDirectory,
  };

  context.global = context;

  const observableContext = createObservable(context, () =>
    console.log("Changes has been occured!"),
  );

  const sandbox = api.vm.createContext(observableContext);
  // Read an application source code from the file
  api.fs.readFile(fileName, (err, src) => {
    // We need to handle errors here

    // Run an application in sandboxed context

    const script = new api.vm.Script(src, fileName);
    const f = script.runInNewContext(sandbox);
    if (f) {
      const hash = f();
      if (hash) {
        console.log("HASH", hash);
        const keys = Object.keys(hash);
        for (const key of keys) {
          if (typeof hash[key] === "function") {
            const name = hash[key].name;
            const len = hash[key].length;
            console.log(`Length: ${len}, Name: ${name}`);
            continue;
          }
          console.log(`KEY: ${key}, VALUE: ${hash[key]}`);
        }
      }
    }

    // We can access a link to exported interface from sandbox.module.exports
    // to execute, save to the cache, print to console, etc.
  });
};

runSandboxed("./applications/application1/");
runSandboxed("./applications/application2/");
