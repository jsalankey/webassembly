var loadStrata = function(options) {
  // return a Promise that resolves when Strata has fully loaded and is ready for use in the application.
  return new Promise(function(resolve, reject) {
    var e = 'script';
    var s = document.currentScript;
    var pathRegexp = /\/Strata-loader\.js$/;
    if (!s || !pathRegexp.test(s.src)) {
      var ss = document.getElementsByTagName(e);
      var i = ss.length;
      while (i--){
        if (pathRegexp.test(ss[i].src)) {
          s=ss[i];
          break;
        }
      }
    }
    var n=document.createElement(e);
    n.src=s.src.replace(/(^.*)\/.*?$/,'$1/Strata-'+(!!window.WebAssembly?'w':'')+'asm.js');
    (document.body||document.head).appendChild(n);

    // how often to check if Strata is loaded
    var testInterval = window['STRATA_LOAD_INTERVAL'] || 100;

    // timeout to give up on the load
    var testTimeout = window['STRATA_LOAD_TIMEOUT'] || 30000;

    var startTime = Date.now();
    var tryLoad = function() {
      if (Date.now() - startTime > testTimeout) {
        // reached the timeout - reject the promise
        reject(new Error('Timed out waiting for Strata to load.'));
      } else if (window['StrataLoader'] === undefined) {
        // waiting for the ASM/WASM script to load
        setTimeout(tryLoad, testInterval);
      } else if (window['Strata'] === undefined) {
        // initialize the Strata instance
        try {
          var instance = StrataLoader(options);
          if (instance) {
            // set the global instance and wait for it to finish loading
            window['Strata'] = instance;
            setTimeout(tryLoad, testInterval);
          } else {
            // the loader should have returned the instance - reject the promise
            reject(new Error('Strata failed to initialize.'));
          }
        } catch (e) {
          reject(e);
        }
      } else if (!window['Strata']['asm'] || !window['Strata']['asm']['_malloc']) {
        // wait for the ASM code to be loaded/initialized
        setTimeout(tryLoad, testInterval);
      } else {
        // all set - resolve the promise
        resolve();
      }
    };

    tryLoad();
  });
};
