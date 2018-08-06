import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/font-awesome/css/font-awesome.min.css';
import '../node_modules/angular-loading-bar/build/loading-bar.min.css';
import '../node_modules/angular-toastr/dist/angular-toastr.min.css';
import './css/app.css';


import ace from "ace-builds";
import '../node_modules/ace-builds/src-min-noconflict/ext-language_tools.js';

import angular from 'angular';
import 'angular-ui-bootstrap';
import 'angular-ui-ace';
import 'ng-file-upload';
import 'angular-toastr';
import 'angular-loading-bar';
import 'angularjs-scroll-glue';

import './js/services/contextMenu.js';
import './js/index.js';
import './js/services/authInterceptor.js';
import "./js/controllers/mainCtrl.js";
import './js/controllers/modal/modalCtrl.js';
import './js/controllers/modal/editModalCtrl.js';
import './js/controllers/modal/serviceModalCtrl.js';
import './js/controllers/modal/streamModalCtrl.js';
import './js/controllers/modal/findModalCtrl.js';
import './js/filters/filters.js';
import './js/services/basePath.js';
import './js/services/PermissionFactory.js';
import './js/services/authInterceptor.js';
import './js/services/iconFinder.js';
import './js/services/FileDownloader.js';
import './js/services/serviceFactory.js';
import './js/services/Favorite.js';
import './js/services/Editor.js';