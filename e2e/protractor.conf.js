//jshint strict: false
var downloadDir = __dirname + '/tmp/downloads/';
exports.config = {

  allScriptsTimeout: 11000,

  specs: [
    'tests/privilege.spec.js'
  ],

  params: {
    downloadDir: downloadDir
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
