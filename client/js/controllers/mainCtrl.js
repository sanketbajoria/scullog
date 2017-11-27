var FMApp = angular.module('FMApp');

function FileManagerCtr($scope, $http, $location, $timeout, $uibModal, $attrs, $log, $q, Favorite, IconFinder, FileDownloader, PermissionFactory, toastr, serviceFactory, BasePath, $window, Upload, cfpLoadingBar, Editor) {
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
    $scope.sortType = 'name'; // set the default sort type
    $scope.sortReverse = false;  // set the default sort order
    // Private functions

    var setCurFiles = function (relPath) {
        return $http.get('api' + relPath)
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
                return $q.reject();
            });
    };

    var handleHashChange = function (hash) {
        if (!hash) {
            return $location.path('/');
        }
        hash = decodeURIComponent(hash);
        $log.debug('Hash change: ' + hash);
        var relPath = hash.slice(1);
        FM.curHashPath = hash;
        FM.curFolderPath = relPath;
        FM.curBreadCrumbPaths = hash2paths(relPath, BasePath.activePath());
        return setCurFiles(relPath);
    };

    var httpRequest = function (method, url, params, data, config) {
        var conf = {
            method: method,
            url: url,
            params: params,
            data: data,
            timeout: 45000
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

    var downloadFile = function (file, url) {
        var url = 'api' + file.relPath + "?base=" + BasePath.activePath() + "&type=DOWNLOAD" ;
        download(file, url);
        
        //window.open('api' + file.relPath + "?base=" + BasePath.activePath() + "&type=DOWNLOAD", "Download");
        //window.location.href = 'api' + file.relPath + "?base=" + BasePath.activePath() + "&type=DOWNLOAD";
        /* $http.get(url, { params: { type: 'DOWNLOAD' }, responseType: 'arraybuffer' })
            .success(function (data) {
                FileDownloader.download(file.name, data, true, file.folder);
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            }); */
    }

    var download = function(file, url){
        var temporaryDownloadLink = document.createElement("a");
        temporaryDownloadLink.style.display = 'none';
    
        document.body.appendChild( temporaryDownloadLink );
    
        temporaryDownloadLink.setAttribute( 'href', url);
        temporaryDownloadLink.setAttribute( 'download', file.name );

        temporaryDownloadLink.click();
    
        document.body.removeChild( temporaryDownloadLink );
    }

    //Watching variable

    $q.all([PermissionFactory.$permissions, BasePath.$path]).then(function () {
        FM.initialized = true;
        $scope.$watch(function () {
            return location.hash;
        }, function (val, prev) {
            handleHashChange(val).catch(function(){
                if(prev != val){
                    $location.path(prev.substring(prev.indexOf("#") + 1));
                }
            });
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
            f.selected = (f === data.file);
        });
    });

    FM.toggleSelectAll = function(){
        FM.curFiles.forEach(function (file) {
            file.selected = FM.selectAll;
        });
    }

    Object.defineProperties(FM, {
        successData: {
            set: function(v) {
                toastr.success(v, "Success");
            }
        }, errorData: {
            set: function(v) {
                toastr.error(v, "Error");
            }
        }
    });

    angular.element($window).bind('resize', function () {
        $scope.$emit('resize');
    });

    $scope.$watch(function () {
        return BasePath.activePath();
    }, function (val, old) {
        if (val && old) {
            FM.curFolderPath == '/' ? setCurFiles('/') : $location.url('/');
            FM.curHashPath = '#/';
            FM.curFolderPath = '/';
            handleHashChange('#/');
        }
    });


    //Public functions

    FM.menuOptions = function (file) {
        if (!file.selected) {
            FM.curFiles.forEach(function (f) {
                f.selected = (f == file);
            });
            FM.selection = [file];
        };
        var actions = ['Create Folder', {
            name: 'Create File', perm: 'create_file', exec: FM.createFile
        }, {
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
        var last = null;
        var ret = actions.filter(function (a, i, arr) {
            var cur = a ? !FM.hideBtn(_case(a.perm || a)) : null;
            if ((cur === null && last !== null) || cur) {
                last = a;
                return true;
            }
            return false;
        }).map(function (a) {
            return a ? [IconFinder.actionIcon(_case(a.perm || a), a.name || a), function ($itemScope) {
                a.exec ? a.exec() : FM.open(_case(a));
            }] : null;
        });
        if (ret[ret.length - 1] == null)
            ret.pop();
        return ret;
    }

    FM.open = function (m, data, ctrl, size, noRefresh) {
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
        return modalInstance.result.finally(function(){if(!noRefresh){
            FM.refresh();
        }});
    };

    FM.clickFile = function (file) {
        file.folder ? $location.path(decodeURIComponent(file.relPath)) : downloadFile(file);
    };

    FM.download = function () {
        var c = 0;
        for (var i in FM.selection) {
            (function (i) {
                setTimeout(function(){
                    downloadFile(FM.selection[i]);
                }, c*500);
            })(i);
            ++c;
        }
    };

    FM.refresh = function () {
        FM.refreshed = true;
        var stopRefresh = function () { $timeout(function () { FM.refreshed = false; }, 1000) };
        setCurFiles(FM.curFolderPath).then(stopRefresh, stopRefresh);
    }

    FM.restartFM = function () {
        $http.get("/restartFM");
    }

    FM.updateFM = function () {
        $http.get("/updateFM").then(function (res) {
            FM.successData = res.data;
        }, function (err) {
            FM.errorData = err.status + ': ' + err.data;
        });
    }

    FM.delete = function () {
        for (var i in FM.selection) {
            var url = 'api' + FM.selection[i].relPath;
            httpRequest('DELETE', url, null, null);
        }
    };

    FM.partialDownload = function (lastLines) {
        var url = 'api' + FM.selection[0].relPath + "?base=" + BasePath.activePath() + "&type=PARTIAL_DOWNLOAD&buffer=" + (lastLines || FM.lastLines);
        download(FM.selection[0], url);
        /*var url = 'api' + FM.selection[0].relPath;
         $http.get(url, { params: { buffer: lastLines || FM.lastLines, type: 'PARTIAL_DOWNLOAD' } })
            .success(function (data) {
                FileDownloader.download(FM.selection[0].name, data);
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            }); */
    };

    FM.service = function () {
        serviceFactory.status().then(function (res) {
            FM.open('service', { services: res }, 'ServiceModalCtrl', 'lg');
        })
    }

    FM.createFile = function () {
        FM.open('edit', { name: '', content: '' }, 'EditModalCtrl', 'lg');
    }

    FM.findInFiles = function () {
        FM.open('find', { name: '', content: '' }, 'FindModalCtrl', 'lg');
    }

    FM.updateFile = function (noCheck) {
        var fs = FM.selection[0];
        if (!noCheck && !Editor.getModeForPath(fs.name)) {
            FM.open('confirmEdit', null, null, null, true);
            return;
        }
        if (fs.size > 2 * 1024 * 1024) {
            toastr.warning("Unable to edit file greater than 2 MB", "Warning")
            return;
        }
        $http.get('api' + fs.relPath, { transformResponse: function (d, h) { return d; } })
            .success(function (data) {
                FM.open('edit', { name: fs.name, content: data, editMode: true }, 'EditModalCtrl', 'lg');
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    }

    FM.stream = function (lastLines) {
        var url = 'api' + FM.selection[0].relPath;
        $log.debug('stream url', url);
        $http.get(url, { params: { buffer: lastLines || FM.lastLines, type: 'STREAM' } })
            .success(function (data) {
                $log.info("Opening socket connection - " + data.channel);
                var socket = new io.connect("/" + data.channel, {path: window.location.pathname + "socket.io"});
                var closingSocket = function () {
                    $log.info("Closing socket connection: " + data.channel);
                    socket.close();
                }
                FM.open('stream', angular.extend({}, FM.selection[0], data, { socket: socket }), 'StreamModalCtrl', 'lg').then(closingSocket, closingSocket);
            })
            .error(function (data, status) {
                FM.errorData = status + ': ' + data;
            });
    };

    FM.copy = function (newName) {
        var url = 'api' + FM.selection[0].relPath;
        var target = { path: FM.curFolderPath + newName, base: BasePath.activePath() };
        httpRequest('PUT', url, { type: 'COPY' }, { target: target });
    };

    FM.rename = function (newName) {
        var url = 'api' + FM.selection[0].relPath;
        var target = { path: FM.curFolderPath + newName, base: BasePath.activePath() };
        httpRequest('PUT', url, { type: 'RENAME' }, { target: target });
    };

    FM.move = function (target) {
        var url = 'api' + target;
        var src = FM.selection.map(function (file) {
            return { path: file.relPath, base: BasePath.activePath() };
        });
        httpRequest('PUT', url, { type: 'MOVE' }, { src: src });
    };

    FM.createFolder = function (folderName) {
        var url = 'api' + FM.curFolderPath + folderName;
        httpRequest('POST', url, { type: 'CREATE_FOLDER' }, null);
    };

    /* var upload = function (file) {
        file = file || FM.uploadFile;
        var formData = new FormData();
        formData.append('upload', file);
        var url = 'api' + FM.curFolderPath + file.name;
        httpRequest('POST', url, { type: 'UPLOAD_FILE' }, formData, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            },
            timeout: 120000
        });
    };  */


    var upload = function (file) {
        var url = 'api' + FM.curFolderPath + (file.relativePath || file.name);
        Upload.upload({
            url: url,
            params: { type: file.type=='directory'?'CREATE_FOLDER':'UPLOAD_FILE' },
            data: { upload: file },
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined },
            timeout: 120000,
            resumeChunkSize: '5MB',
            ignoreLoadingBar: true
        }).then(function (resp) {
            $log.debug(resp.data);
            FM.successData = resp.data;
        }, function (resp) {
            FM.errorData = resp.status + ': ' + resp.data;
        }, function (evt) {
            cfpLoadingBar.start();
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            cfpLoadingBar.set(progressPercentage/100.0);
            $log.debug('progress: ' + progressPercentage + '% ');
        });
    }; 

    FM.upload = function (files) {
        var paths = [];
        files = angular.isArray(files)?files:[files];
        $q.all(files.map(function (file) {
            if(file.type == 'directory'){
                paths.push(file.name);
            }else if(file.path){
                var temp = file.path.replace(/\\/g, "/");
                for(var i=paths.length-1;i>=0;i--){
                    if(temp.indexOf(paths[i] + "/" + file.name) >= 0){
                        file.relativePath = paths[i] + "/" + file.name;
                        break;
                    }
                }
            }
            return upload(file);
        })).finally(function(){
            handleHashChange(FM.curHashPath);
        });
    }

    FM.curPath = function (path) {
        return path ? $location.url(path) : FM.curFolderPath;
    }

    FM.favorite = function (set) {
        var ret = !!Favorite.is(FM.curFolderPath);
        if (set) {
            ret ? Favorite.remove(FM.curFolderPath) : Favorite.add(FM.curFolderPath);
        }
        return ret;
    };

    FM.favorites = function () {
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
                    /*for (var i in FM.selection) {
                        if (FM.selection[i].folder) return true;
                    }*/
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
            case 'find': return FM.selection.length > 0
            case 'favorite': return Object.keys(FM.favorites()).length == 0;
            default:
                return true;
        }
    }
}

function hash2paths(relPath, base) {
    var paths = [];
    var names = relPath.split('/');
    var path = '#/';
    paths.push({ name: 'Home (' + base + ')', path: path });
    for (var i = 0; i < names.length; ++i) {
        var name = names[i];
        if (name) {
            path = path + name + '/';
            paths.push({ name: name, path: path });
        }
    }
    return paths;
};

function _case(s) {
    return s.toLowerCase().replace(" ", "_");
}
FMApp.controller('FileManagerCtr', FileManagerCtr);
