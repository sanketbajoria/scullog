var FMApp = angular.module('FMApp');

function FileManagerCtr($scope, $http, $location, $timeout, $uibModal, $attrs, $log, $q, Favorite, IconFinder, FileDownloader, PermissionFactory, toastr, serviceFactory, BasePath, $window) {
    var FM = this;
    FM.getIcon = IconFinder.find;
    FM.accessTime = ['15m', '30m', '60m'];
    FM.BasePath = BasePath;
    FM.lastLines = 20;
    FM.curHashPath = '#/';          // hash in browser url
    FM.curFolderPath = '/';         // current relative folder path
    FM.curBreadCrumbPaths = [];     // items in breadcrumb list, for each level folder
    FM.curFiles = [];               // files in current folder

    FM.selecteAll = false;          // if select all files
    FM.selection = [];              // selected files
    FM.renameName = '';             // new name for rename action
    FM.uploadFile = null;           // will upload file
    FM.newFolderName = '';
    FM.successData = '__init__';
    FM.errorData = '__init__';
    $scope.sortType = 'name'; // set the default sort type
    $scope.sortReverse = false;  // set the default sort order
    // Private functions

    var setCurFiles = function (relPath) {
        return $http.get('./api' + relPath)
            .success(function (data) {
                var files = data;
                files.forEach(function (file) {
                    file.relPath = relPath + file.name;
                    if (file.folder) file.relPath += '/';
                    file.selected = false;
                });
                FM.curFiles = files;
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    };

    var handleHashChange = function (hash) {
        if (!hash) {
            return $location.path('/');
        }
        $log.debug('Hash change: ' + hash);
        var relPath = hash.slice(1);
        FM.curHashPath = hash;
        FM.curFolderPath = relPath;
        FM.curBreadCrumbPaths = hash2paths(relPath, BasePath.activePath());
        setCurFiles(relPath);
    };

    var httpRequest = function (method, url, params, data, config) {
        var conf = {
            method: method,
            url: url,
            params: params,
            data: data,
            timeout: 10000
        };
        for (var k in config) {
            if (config.hasOwnProperty(k)) {
                conf[k] = config[k];
            }
        }
        $log.debug('request url', url);
        return $http(conf)
            .success(function (data) {
                $log.debug(data);
                FM.successData = data;
                handleHashChange(FM.curHashPath);
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    };

    //Watching variable

    $q.all([PermissionFactory.$permissions, BasePath.$path]).then(function () {
        FM.initialized = true;
        $scope.$watch(function () {
            return location.hash;
        }, function (val) {
            handleHashChange(val);
        });
    });

    // listening on file checkbox
    $scope.$watch('FM.curFiles|filter:{selected:true}', function (nv) {
        FM.selection = nv.map(function (file) {
            return file;
        });
    }, true);

    $scope.$on('selectOne', function (data) {
        FM.curFiles.forEach(function (f) {
            f.selected = (f==data.file);
        });
    });

    $scope.$watch('FM.selectAll', function (nv) {
        FM.curFiles.forEach(function (file) {
            file.selected = nv;
        });
    });

    $scope.$watch('FM.successData', function () {
        if (FM.successData === '__init__') return;
        toastr.success(FM.successData, "Success");
    });

    $scope.$watch('FM.errorData', function () {
        if (FM.errorData === '__init__') return;
        toastr.error(FM.errorData, "Error");
    });

    angular.element($window).bind('resize', function(){
        $scope.$emit('resize');
    });

    $scope.$watch(function(){
        return BasePath.activePath();
    }, function (val,old) {
        if(val && old){
            FM.curFolderPath == '/'?setCurFiles('/'):$location.url('/');
            FM.curHashPath = '#/';
            FM.curFolderPath = '/';
            handleHashChange('#/');
        }
    });


    //Public functions

    FM.menuOptions = function (file) {
        if(!file.selected){
            FM.curFiles.forEach(function (f) {
                f.selected = (f==file);
            });
            FM.selection = [file];
        };
        var actions = ['Create Folder',{
            name: 'Create File', perm: 'create_file', exec: FM.createFile
        },{
            name: 'Edit File', perm: 'update_file', exec: FM.updateFile
        }, null, 'Move', 'Copy', null, 'Delete', 'Rename', {
            name: 'Refresh', perm: 'refresh', exec: FM.refresh
        }, null, {
            name: 'Stream (Last 100 lines)', perm: 'stream', exec: function () { FM.stream(100); }
        }, {
            name: 'Download (Last 1000 lines)', perm: 'stream', exec: function () { FM.partialDownload(1000); }
        }, {
            name: 'Download (Full)', perm: 'download', exec: FM.download
        }];
        var last=null;
        var ret = actions.filter(function(a,i,arr){
            var cur = a?!FM.hideBtn(_case(a.perm || a)):null;
            if((cur === null && last !== null) || cur){
                last = a;
                return true;
            }
            return false;
        }).map(function (a) {
            return a ? [IconFinder.actionIcon(_case(a.perm || a),a.name || a), function ($itemScope) {
                a.exec ? a.exec() : FM.open(_case(a));
            }] : null;
        });
        if(ret[ret.length-1]==null)
            ret.pop();
        return ret;
    }

    FM.open = function (m, data, ctrl, size) {
        var modalName = "./views/" + $attrs.$normalize(m) + "Modal.html";
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: modalName,
            controller: ctrl || 'ModalCtrl',
            size: size || 'md',
            windowClass: m + " myModal",
            controllerAs: 'vm',
            resolve: {
                FM: FM,
                data: data,
                items: function () {
                    return $scope.items;
                }
            }
        });
        return modalInstance.result.then(FM.refresh, FM.refresh);
    };

    FM.clickFile = function (file) {
        file.folder?$location.path(decodeURIComponent(file.relPath)):downloadFile(file, BasePath);
    };

    FM.download = function () {
        for (var i in FM.selection) {
            downloadFile(FM.selection[i], BasePath);
        }
    };

    FM.refresh = function () {
        FM.refreshed = true;
        var stopRefresh = function(){$timeout(function(){FM.refreshed = false;},1000)};
        setCurFiles(FM.curFolderPath).then(stopRefresh,stopRefresh);
    }

    FM.restartFM = function () {
        $http.get("./restartFM");
    }

    FM.updateFM = function () {
        $http.get("./updateFM").then(function(res){
            FM.successData = res.data;
        }, function(err){
            FM.errorData = err.status + ': ' + err.data;
        });
    }

    FM.delete = function () {
        for (var i in FM.selection) {
            var url = 'api' + FM.selection[i].relPath;
            httpRequest('DELETE', url, null, null);
        }
    };

    FM.move = function (target) {
        var url = 'api' + target;
        var src = FM.selection.map(function (file) {
            return {path: file.relPath, base: BasePath.activePath()};
        });
        httpRequest('PUT', url, {type: 'MOVE'}, {src: src});
    };

    FM.partialDownload = function (lastLines) {
        var url = 'partialDownload' + FM.selection[0].relPath;
        $http.get(url, {params: {buffer: lastLines || FM.lastLines}})
            .success(function (data) {
                FileDownloader.download(FM.selection[0].name, data);
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    };

    FM.service = function(){
        serviceFactory.status().then(function(res){
            FM.open('service', {services:res}, 'ServiceModalCtrl', 'lg');
        })
    }

    FM.createFile = function(){
        FM.open('edit', {name:'',content:''}, 'EditModalCtrl', 'lg');
    }

    FM.updateFile = function (noCheck) {
        var fs = FM.selection[0];
        if(!noCheck && !IconFinder.isEditable(fs)){
            FM.open('confirmEdit');
            return;
        }
        if(fs.size > 2*1024*1024){
            toastr.warning("Unable to edit file greater than 2 MB", "Warning")
            return;
        }
        $http.get('api' + fs.relPath, { transformResponse: function(d, h){return d;}})
            .success(function (data) {
                FM.open('edit', {name:fs.name,content:data,editMode:true}, 'EditModalCtrl', 'lg');
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    }

    FM.stream = function (lastLines) {
        var url = 'stream' + FM.selection[0].relPath;
        $log.debug('stream url', url);
        $http.get(url, {params: {buffer: lastLines || FM.lastLines}})
            .success(function (data) {
                $log.info("Opening socket connection - " + data.channel);
                var socket = new io.connect('/' + data.channel, {path: window.location.pathname + 'socket.io'});
                var closingSocket = function () {
                    $log.info("Closing socket connection: " + data.channel);
                    socket.close();
                }
                FM.open('stream', angular.extend({}, FM.selection[0], data, {socket: socket}), 'StreamModalCtrl', 'lg').then(closingSocket, closingSocket);
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    };

    FM.copy = function (newName) {
        var url = 'api' + FM.selection[0].relPath;
        var target = {path: FM.curFolderPath + newName, base: BasePath.activePath()};
        httpRequest('PUT', url, {type: 'COPY'}, {target: target});
    };

    FM.rename = function (newName) {
        var url = 'api' + FM.selection[0].relPath;
        var target = {path: FM.curFolderPath + newName, base: BasePath.activePath()};
        httpRequest('PUT', url, {type: 'RENAME'}, {target: target});
    };

    FM.createFolder = function (folderName) {
        var url = 'api' + FM.curFolderPath + folderName;
        httpRequest('POST', url, {type: 'CREATE_FOLDER'}, null);
    };

    FM.upload = function () {
        var formData = new FormData();
        formData.append('upload', FM.uploadFile);
        var url = 'api' + FM.curFolderPath + FM.uploadFile.name;
        httpRequest('POST', url, {type: 'UPLOAD_FILE'}, formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        });
    };

    FM.curPath = function(path){
        return path?$location.url(path):FM.curFolderPath;
    }

    FM.favorite = function(set){
        var ret = !!Favorite.is(FM.curFolderPath);
        if(set){
            ret?Favorite.remove(FM.curFolderPath):Favorite.add(FM.curFolderPath);
        }
        return ret;
    };

    FM.favorites = function(){
        return Favorite.get()[BasePath.activePath()] || {};
    }

    FM.privilege = function (time) {
        PermissionFactory.elevatedPermission(time);
    }

    FM.hideBtn = function (btnName) {
        return FM.invalidSelect(btnName) || !PermissionFactory.hasPermission(btnName);
    };

    FM.invalidSelect = function (btnName) {
        switch (btnName) {
            case 'download':
                if (FM.selection.length === 0) return true;
                else {
                    for (var i in FM.selection) {
                        if (FM.selection[i].folder) return true;
                    }
                    return false;
                }
            case 'delete':
            case 'move':
                return FM.selection.length === 0;
            case 'copy':
            case 'rename':
                return FM.selection.length !== 1;
            case 'update_file':
            case 'stream':
                return FM.selection.length !== 1 || FM.selection[0].folder;
            case 'upload_file':
            case 'create_folder':
            case 'create_file':
            case 'refresh':
            case 'privilege':
            case 'service':
            case 'change_base':
            case 'settings':
            case 'edit_favorite':
                return false;
            case 'favorite': return Object.keys(FM.favorites()).length==0;
            default:
                return true;
        }
    }
}


function downloadFile(file, BasePath) {
    window.open('api' + file.relPath + "?base=" + BasePath.activePath());
};

function hash2paths(relPath, base) {
    var paths = [];
    var names = relPath.split('/');
    var path = '#/';
    paths.push({name: 'Home (' + base +')', path: path});
    for (var i = 0; i < names.length; ++i) {
        var name = names[i];
        if (name) {
            path = path + name + '/';
            paths.push({name: name, path: path});
        }
    }
    return paths;
};

function _case(s){
    return s.toLowerCase().replace(" ","_");
}
FMApp.controller('FileManagerCtr', FileManagerCtr);
