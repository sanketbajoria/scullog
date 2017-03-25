module.exports = {
    openHomePage: function () {
        browser.get('http://localhost:9000/');
    },
    escalatePrivilege: function () {
        this.getPrivilegeButton().click();
        $$('.privilegeForm button').get(0).click();
    },
    getPrivilegeButton: function () {
        return element(by.xpath('//li/a[contains(text(),"Privilege")]/..'));
    },
    getPrivilegeForm: function () {
        return $('.privilegeForm');
    },
    getRefreshButton: function () {
        return element(by.xpath('//li[contains(text(),"Refresh")]'));
    },
    getNewFileButton: function () {
        return element(by.xpath('//li[contains(text(),"New File")]'));
    },
    getEditModal: function () {
        return $('.edit');
    },
    getFileTable: function () {
        return $(".fileTable");
    }
}