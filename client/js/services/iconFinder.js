'use strict';
(function () {

    var FMApp = angular.module('FMApp');

    function IconFinder() {
        var icons = {
            archive: 'fa fa-file-archive-o archive file-icon',
            audio: 'fa fa-file-audio-o audio file-icon',
            code: 'fa fa-file-code-o code file-icon',
            excel: 'fa fa-file-excel-o excel file-icon',
            image: 'fa fa-file-image-o image file-icon',
            movie: 'fa fa-file-movie-o movie file-icon',
            file: 'fa fa-file file file-icon',
            pdf: 'fa fa-file-pdf-o pdf file-icon',
            ppt: 'fa fa-file-powerpoint-o ppt file-icon',
            text: 'fa fa-file-text-o text file-icon',
            word: 'fa fa-file-word-o word file-icon',
            folder: 'fa fa-folder-open folder file-icon'
        };
        var keywords = {
            archive: ['zip', 'compressed'],
            audio: ['audio'],
            code: ["java", "html", "download", "sh"],
            excel: ['excel', 'csv'],
            image: ['image'],
            movie: ['video'],
            pdf: ['pdf'],
            ppt: ['powerpoint', 'presentation'],
            text: ['plain'],
            word: ['word'],
            folder: ['directory']
        };
        var actionIcon =  {
            'create_folder': 'fa-plus-circle',
            'create_file': 'fa-plus-circle',
            'update_file': 'fa-edit',
            'move': 'fa-random',
            'copy': 'fa-copy',
            'delete': 'fa-remove',
            'rename': 'fa-font',
            'refresh': 'fa-refresh',
            'download': 'fa-download',
            'stream': 'fa-feed'
        };
        var find = function (mime) {
            var icon;
            for (var key in keywords) {
                for (var i = 0; i < keywords[key].length; i++) {
                    if (mime.indexOf(keywords[key][i]) != -1) {
                        icon = icons[key];
                        break;
                    }
                }
                if (icon)
                    break;
            }
            return icon;
        };
        return {
            find: function (fs) {
                if (fs.folder) {
                    return icons["folder"];
                } else if (fs.mime) {
                    var k = find(fs.mime);
                    if (!k)
                        k = icons["file"];
                    return k;
                } else {
                    return icons["file"];
                }
            },
            actionIcon: function(action, title){
                return "<span class='fa " + actionIcon[action] + "'></span> " + title;
            }
        }
    }

    FMApp.factory('IconFinder', IconFinder);
})();