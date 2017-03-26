//jshint strict: false
var os = require("os");

var tmpDir = __dirname + "/tmp/";
var pidFile = tmpDir + "/pid"
var downloadDir = tmpDir + '/downloads/';

exports.config = {

  allScriptsTimeout: 11000,

  specs: [
    'tests/*.spec.js'
  ],

  params: {
    tmpDir: tmpDir,
    pidFile: pidFile,
    downloadDir: downloadDir,
    logDir: __dirname + "/logs/",
    baseDir: os.homedir() + "/temp/"
  },

  capabilities: {
    'browserName': 'chrome',
    'platform': 'ANY',
    'version': 'ANY',
    'chromeOptions': {
      // Get rid of --ignore-certificate yellow warning
      args: ['--no-sandbox', '--test-type=browser'],
      // Set download path and avoid prompting for download even though
      // this is already the default on Chrome but for completeness
      prefs: {
        'download': {
          'prompt_for_download': false,
          'directory_upgrade': true,
          'default_directory': downloadDir,
        }
      }
    }
  },

  baseUrl: 'http://localhost:8000/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }

};
