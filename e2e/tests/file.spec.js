'use strict';
var fs = require('fs');

describe('File API', function () {

  beforeAll(function () {
    browser.manage().deleteAllCookies();
    browser.get('http://localhost:9000/');
    browser.waitForAngular();
    element(by.xpath('//li/a[contains(text(),"Privilege")]/..')).click();
    browser.waitForAngular();
    $$('.privilegeForm button').get(0).click();
  });

  var openFileDialog = function () {
    element(by.xpath('//li[contains(text(),"New File")]')).click();
    browser.sleep(1000);
  }
  var fileName = "test.log";
  var fileContent = "Testing data";

  it('should open create file dialog', function () {
    openFileDialog();
    expect($('.edit').isPresent()).toBe(true);
    expect($('.edit').getCssValue('display')).not.toEqual('none');
  });

  it('should be able to close the file dialog by clicking on cancel button', function () {
    $('.edit .btn-default').click();
    expect($('.edit').isPresent()).toBe(false);
  });

  it('should be able to close the file dialog by clicking on cross button', function () {
    openFileDialog();
    $('.edit .fa-close').click();
    expect($('.edit').isPresent()).toBe(false);
  });

  it('should be able to add text in textarea and reset it', function () {
    openFileDialog();
    var textarea = $('.edit textarea');
    textarea.sendKeys(fileContent);
    expect(textarea.getAttribute('value')).toEqual(fileContent);
    $('.edit .btn-secondary').click();
    browser.waitForAngular();
    expect(textarea.getAttribute('value')).toEqual("");
  });

  it('should be able to resize the file dialog', function () {
    expect($('.edit .fa-compress').isPresent()).toBe(true);
    $('.edit .fa-compress').click();
    expect($('.edit .fa-compress').isPresent()).toBe(false);
    expect($('.edit .fa-expand').isPresent()).toBe(true);
    $('.edit .fa-expand').click();
    expect($('.edit .fa-compress').isPresent()).toBe(true);
  });

  it('should be able to add text in textarea and save it', function () {
    $('.edit input').sendKeys(fileName);
    $('.edit textarea').sendKeys(fileContent);
    $('.edit .btn-primary').click();
    browser.waitForAngular();
    expect($(".fileTable").element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]`)).isPresent()).toBe(true);
  });

  it('should be able to download newly created file', function () {
    var path = browser.params.downloadDir + fileName;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    $(".fileTable").element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]/../../td[3]/a`)).click();

    browser.driver.wait(function () {
      return fs.existsSync(path);
    }, 20000).then(function () {
      expect(fs.readFileSync(path, { encoding: 'utf8' }).trim()).toEqual(fileContent);
    });
    expect($(".fileTable").element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]`)).isPresent()).toBe(true);
  });

  it('should be able to delete a new created file', function () {
    $(".fileTable").element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]/../../td[1]/input`)).click();
    browser.waitForAngular();
    element(by.xpath('//li[contains(text(),"Delete")]')).click();
    browser.sleep(1000);
    $('.delete .btn-primary').click();
    browser.waitForAngular();
    var names = $$('.fileTable tbody tr').map(function (elem) {
      return elem.$('td:nth-child(3) a').getText();
    });
    expect(names).not.toContain(fileName);
  });
});
