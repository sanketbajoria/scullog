'use strict';
var po = require("./po");

describe('Privilege API', function () {

  var privilegeElem, privilegeForm;

  var expectPrivilegeFormOpened = function () {
    expect(privilegeElem.getCssValue('display')).not.toEqual('none');
    expect(privilegeForm.isPresent()).toBe(true);
    expect(privilegeForm.getCssValue('display')).not.toEqual('none');
  }
  var expectPrivilegeFormClosedWithNoPrivilege = function () {
    expect(privilegeElem.getCssValue('display')).not.toEqual('none');
    expect(privilegeForm.isPresent()).toBe(false);
  }
  var expectPrivilegeFormClosedWithPrivilege = function () {
    expect(privilegeElem.getCssValue('display')).toEqual('none');
    expect(privilegeForm.isPresent()).toBe(false);
  }

  var openPrivilegeForm = function () {
    expectPrivilegeFormClosedWithNoPrivilege();
    privilegeElem.click();
    expectPrivilegeFormOpened();
  }

  var getPrivilege = function () {
    openPrivilegeForm();
    privilegeForm.$$('button').get(0).click();
    expectPrivilegeFormClosedWithPrivilege();
  }

  beforeEach(function () {
    browser.manage().deleteAllCookies();
    browser.get('http://localhost:9000/');
    privilegeElem = po.getPrivilegeButton();
    privilegeForm = po.getPrivilegeForm();
  });

  describe("Open the privilege form", function () {
    it("should be able to open the privilege form", function () {
      openPrivilegeForm();
    });
    describe("Close the privilege form", function () {
      it('should close the privilege pop over, when clicking again over the privilege button', function () {
        openPrivilegeForm();
        privilegeElem.click();
        expectPrivilegeFormClosedWithNoPrivilege();
      });

      it('should close the privilege pop over, when clicking outside of privilege form', function () {
        openPrivilegeForm();
        browser.actions().mouseMove({x: -500, y: 400}).click().perform()
        expectPrivilegeFormClosedWithNoPrivilege();
      });

      it('should close the privilege pop over and get privilege for some time', function () {
        getPrivilege();
      });
    });
  });

  it('in privilege mode, if delete cookie, and refresh screen, privilege mode should be gone', function () {
    getPrivilege();
    browser.manage().deleteAllCookies();
    po.getRefreshButton().click();
    browser.waitForAngular();
    expectPrivilegeFormClosedWithNoPrivilege();
  });
});
