'use strict';

describe('Scullog', function () {
  beforeAll(function () {
    browser.manage().deleteAllCookies();
    browser.get('http://localhost:9000/');
  });
  it('should have a title', function () {
    expect(browser.getTitle()).toEqual('Scullog');
  });
});
