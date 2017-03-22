'use strict';

describe('Folder API', function () {
  beforeAll(function () {
    browser.manage().deleteAllCookies();
    browser.get('http://localhost:9000/');
    browser.waitForAngular();
    element(by.xpath('//li/a[contains(text(),"Privilege")]/..')).click();
    browser.waitForAngular();
    $$('.privilegeForm button').get(0).click();
  });

  var openFolderDialog = function () {
    element(by.xpath('//li[contains(text(),"New Folder")]')).click();
    browser.sleep(1000);
  }

  it('should open create folder dialog', function () {
    openFolderDialog();
    browser.waitForAngular();
    expect($('.create_folder').isPresent()).toBe(true);
    expect($('.create_folder').getCssValue('display')).not.toEqual('none');
  });
  it('should be able to close the folder dialog', function () {
    $('.create_folder .btn-default').click();
    browser.waitForAngular();
    expect($('.create_folder').isPresent()).toBe(false);
  });
  it('should open create folder dialog and create a new folder', function () {
    openFolderDialog();
    var input = $('.create_folder input');
    input.sendKeys('email');
    $('.create_folder .btn-primary').click();
    browser.waitForAngular();
    expect($('.create_folder').isPresent()).toBe(false);
    expect($(".fileTable").element(by.xpath("//tbody/tr/td/a[contains(text(),'email')]")).isPresent()).toBe(true);
  });

  it('should go into newly created folder', function () {
    $(".fileTable").element(by.xpath("//tbody/tr/td/a[contains(text(),'email')]/../../td[3]/a")).click();
    expect(browser.getCurrentUrl()).toEqual('http://localhost:9000/#/email/');
    expect($('.breadcrumb').element(by.xpath('//li/a[contains(text(),"email")]')).isPresent()).toEqual(true);
  });

  it('should go back to main folder via breadcrumb', function () {
    $('.breadcrumb').element(by.xpath('//li/a[contains(text(),"Home")]')).click();
    expect(browser.getCurrentUrl()).toEqual('http://localhost:9000/#/');
    expect($('.breadcrumb').element(by.xpath('//li/a[contains(text(),"email")]')).isPresent()).not.toEqual(true);
  });

  it('should be able to delete a new created folder', function () {
    $(".fileTable").element(by.xpath("//tbody/tr/td/a[contains(text(),'email')]/../../td[1]/input")).click();
    browser.waitForAngular();
    element(by.xpath('//li[contains(text(),"Delete")]')).click();
    browser.sleep(1000);
    $('.delete .btn-primary').click();
    browser.waitForAngular();
    var names = $$('.fileTable tbody tr').map(function (elem) {
      return elem.$('td:nth-child(3) a').getText();
    });
    expect(names).not.toContain('email');
  });
});
