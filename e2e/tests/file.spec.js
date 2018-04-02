'use strict';
var fs = require('fs');
var po = require('./po');

describe('File API', function () {

  beforeAll(function () {
    browser.manage().deleteAllCookies();
    po.openHomePage();
    po.escalatePrivilege();
  });

  var openFileDialog = function () {
    po.getNewFileButton().click();
    browser.sleep(1000);
  }
  var fileName = "test.log";
  var fileContent = "Testing data";

  it('should open create file dialog', function () {
    openFileDialog();
    expect(po.getEditModal().isPresent()).toBe(true);
    expect(po.getEditModal().getCssValue('display')).not.toEqual('none');
  });

  it('should be able to close the file dialog by clicking on cancel button', function () {
    po.getEditModal().$('.btn-default').click();
    expect(po.getEditModal().isPresent()).toBe(false);
  });

  it('should be able to close the file dialog by clicking on cross button', function () {
    openFileDialog();
    po.getEditModal().$('.fa-close').click();
    expect(po.getEditModal().isPresent()).toBe(false);
  });

  it('should be able to add text in textarea and reset it', function () {
    openFileDialog();
    var textarea = po.getEditModal().$('textarea');
    textarea.sendKeys(fileContent);
    expect(textarea.getAttribute('value')).toEqual(fileContent);
    po.getEditModal().$('.btn-secondary').click();
    browser.waitForAngular();
    expect(textarea.getAttribute('value')).toEqual("");
  });

  it('should be able to resize the file dialog', function () {
    expect(po.getEditModal().$('.fa-compress').isPresent()).toBe(true);
    po.getEditModal().$('.fa-compress').click();
    expect(po.getEditModal().$('.fa-compress').isPresent()).toBe(false);
    expect(po.getEditModal().$('.fa-expand').isPresent()).toBe(true);
    po.getEditModal().$('.fa-expand').click();
    expect(po.getEditModal().$('.fa-compress').isPresent()).toBe(true);
  });

  it('should be able to add text in textarea and save it', function () {
    po.getEditModal().$('input').sendKeys(fileName);
    po.getEditModal().$('textarea').sendKeys(fileContent);
    po.getEditModal().$('.btn-primary').click();
    browser.waitForAngular();
    expect(po.getFileTable().element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]`)).isPresent()).toBe(true);
    expect(fs.existsSync(`${browser.params.baseDir}/${fileName}`)).toBe(true);
    expect(fs.readFileSync(`${browser.params.baseDir}/${fileName}`, { encoding: 'utf8' }).trim()).toEqual(fileContent);
  });

  it('should be able to download newly created file', function () {
    var path = browser.params.downloadDir + fileName;
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    po.getFileTable().element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]/../../td[3]/a`)).click();

    browser.driver.wait(function () {
      return fs.existsSync(path);
    }, 20000).then(function () {
      expect(fs.readFileSync(path, { encoding: 'utf8' }).trim()).toEqual(fileContent);
    });
    expect(po.getFileTable().element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]`)).isPresent()).toBe(true);
  });

  it('should be able to delete a new created file', function () {
    po.getFileTable().element(by.xpath(`//tbody/tr/td/a[contains(text(),${fileName})]/../../td[1]/input`)).click();
    browser.waitForAngular();
    element(by.xpath('//li[contains(text(),"Delete")]')).click();
    browser.sleep(1000);
    $('.delete .btn-primary').click();
    browser.waitForAngular();
    var names = po.getFileTable().$$('tbody tr').map(function (elem) {
      return elem.$('td:nth-child(3) a').getText();
    });
    expect(names).not.toContain(fileName);
  });
});
