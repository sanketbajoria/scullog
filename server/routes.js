var fs = require('co-fs');
var path = require('path');
var views = require('co-views');
var origFs = require('fs');
var koaRouter = require('koa-router');
var bodyParser = require('koa-bodyparser');
var formParser = require('co-busboy');
var jwt = require('jsonwebtoken');
var spawn = require('cross-spawn');
var Tools = require('./tools');
var utils = require('./utils');
var FilePath = utils.filePath;
var FileManager = require('./fileManager');
var timers = require('timers');
var router = new koaRouter({prefix: global.C.conf.prefix});
var render = views(path.join(__dirname, '../client'), {map: {html: 'ejs'}});
var base = __dirname;
var svc = require('./service');
var actions = ["start", "stop", "status", "restart"];
var exec = require('co-exec');
var childProcess = require('child_process');


var restart = function(){
  timers.setTimeout(function(){
    try{
      var child = spawn(`${base}/../bin/scullog.sh`, ['-s','restart'], {detached:true});
    }catch(err){
      console.log("Error, occured, while restarting service: ", err);
    }
  },1000);
}

router.get('base', function *(){
  this.body = global.C.data.root;
});

router.get('', function *() {
  this.body = yield render('index');
});

router.get('api/(.*)', Tools.loadRealPath, Tools.checkPathExists, function *() {
  var p = this.request.fPath;
  var stats = yield fs.stat(p);
  if (stats.isDirectory()) {
    this.body = yield * FileManager.list(p);
  }
  else {
    this.body = origFs.createReadStream(p);
  }
});

router.get('version', function *(){
  var local = yield utils.read(`${base}/../package.json`);
  this.body = local["version"];
});

router.get('updateFM', function *(){
  console.log("Updating server");
  var remote = yield utils.read(global.C.conf.remoteJSON);
  var local = yield utils.read(`${base}/../package.json`);
  var c = utils.versionCompare(remote['version'], local['version']);
  if(c===false){
    this.status = 400;
    this.body = "Invalid configuration for remote JSON path";
  }else if(c<1 && !this.request.query.forceUpgrade){
    this.body = c==0?'Already up to date':`Lower version ${remote['version']} for remote`;
  }
  if(!!!this.body){
    try{
      yield utils.extractRemoteZip(global.C.conf.remoteLocation,`${base}/..`);
    }catch(err){
      C.logger.error(err.stack);
      this.status = 400;
      this.body = `Update Failed from ${local['version']} to ${remote['version']}`;
    }
    childProcess.execSync(`cd ${base}/.. && npm install`);
    origFs.chmodSync(`${base}/../bin/scullog.sh`, '0777');
    restart();
    this.body = `Update Successful from ${local['version']} to ${remote['version']}`;
  }
});

router.get('restartFM', function(){
  console.log("Restarting server");
  restart();
  this.body = "Restart Successful";
});

router.get('access', function (){
  var role = "default";
  var expiresIn = this.request.query.t;
  var accessJwt;
  if(expiresIn){
    role = "elevated";
    accessJwt = jwt.sign({role: role}, global.C.conf.secret, {expiresIn: expiresIn});
    this.cookies.set(global.C.conf.id, accessJwt, {httpOnly: true})
  }else{
    accessJwt = this.cookies.get(global.C.conf.id);
    if(accessJwt){
      try{
        role = jwt.verify(accessJwt, global.C.conf.secret).role;
      }catch(e){
        this.cookies.set(global.C.conf.id, '', {httpOnly: true, expires: new Date(1)})
      }
    }
  }
  this.body = {permissions:utils.getPermissions(role), role: role};
});

router.get('partialDownload/(.*)', Tools.loadRealPath, Tools.checkPathExists, function *() {
  var p = this.request.fPath;
  var stats = yield fs.stat(p);
  if (stats.isDirectory()) {
    this.status = 400;
    this.body = 'Cannot download a directory'
  }else {
    var res = FileManager.partialDownload(p, this.request.query);
    if(res.error){
      this.status = 400;
      this.body = "Bad request! " + res.error;
    }else{
      this.body = res.text;
    }
  }
});

router.get('stream/(.*)', Tools.loadRealPath, Tools.checkPathExists, function *() {
  var p = this.request.fPath;
  var stats = yield fs.stat(p);
  if (stats.isDirectory()) {
    this.status = 400;
    this.body = 'Cannot stream a directory'
  }else {
    this.body = FileManager.stream(p, this.request.query);
  }
});

router.del('api/(.*)', Tools.loadRealPath, Tools.checkPathExists, function *() {
  var p = this.request.fPath;
  yield * FileManager.remove(p);
  this.body = 'Delete Succeed!';
});

router.put('api/(.*)', Tools.loadRealPath, Tools.checkPathExists, bodyParser(), function* () {
  var type = this.query.type;
  var p = this.request.fPath;
  if (!type) {
    this.status = 400;
    this.body = 'Lack Arg Type'
  }
  else if (type === 'MOVE') {
    var src = this.request.body.src;
    if (!src || ! (src instanceof Array)) return this.status = 400;
    var src = src.map(function (s) {
      return FilePath(s.path, s.base);
    });
    yield * FileManager.move(src, p);
    this.body = 'Move Succeed!';
  }
  else if (type === 'RENAME') {
    var target = this.request.body.target;
    if (!target) return this.status = 400;
    yield * FileManager.rename(p, FilePath(target.path, target.base));
    this.body = 'Rename Succeed!';
  }
  else if (type === 'COPY') {
    var target = this.request.body.target;
    if (!target) return this.status = 400;
    yield * FileManager.copy(p, FilePath(target.path, target.base));
    this.body = 'Copy Succeed!';
  }
  else if(type === 'WRITE_FILE') {
    try {
      yield fs.writeFile(p, utils.normalizeContent(this.request.body.content));
      this.body = 'Edit File Succeed!';
    } catch (err) {
      this.status = 400;
      this.body = 'Edit File Failed!';
    }
  }
  else {
    this.status = 400;
    this.body = 'Arg Type Error!';
  }
});

router.post('api/(.*)', Tools.loadRealPath, Tools.checkPathNotExists, bodyParser(), function *() {
  console.log("reached here");
  var type = this.query.type;
  var p = this.request.fPath;
  if (!type) {
    this.status = 400;
    this.body = 'Lack Arg Type!';
  }
  else if (type === 'CREATE_FOLDER') {
    yield * FileManager.mkdirs(p);
    this.body = 'Create Folder Succeed!';
  }
  else if (type === 'UPLOAD_FILE') {
    var formData = yield formParser(this.req);
    if (formData.fieldname === 'upload'){
      var writeStream = origFs.createWriteStream(p);
      formData.pipe(writeStream);
      this.body = 'Upload File Succeed!';
    }
    else {
      this.status = 400;
      this.body = 'Lack Upload File!';
    }
  }
  else if(type === 'WRITE_FILE') {
    try {
      yield fs.writeFile(p, utils.normalizeContent(this.request.body.content));
      this.body = 'Create File Succeed!';
    } catch (err) {
      C.logger.error(err.stack);
      this.status = 400;
      this.body = 'Create File Failed!';
    }
  }
  else {
    this.status = 400;
    this.body = 'Arg Type Error!';
  }
});

router.get("service", function *(){
  var action = this.request.query.a;
  var service = this.request.query.s || (action == 'status' && global.C.conf.services);
  var res = {};
  if(actions.indexOf(action) == -1 || !service){
    res.error = `Invalid action ${action} on service ${service}`;
  }else{
    res = yield svc[action](service);
  }
  if(res.error){
    this.status = 400;
    this.body = res.error;
  }else{
    this.body = res;
  }
});

var favorites;
router.get('favorite', function *(){
  if(!favorites)
    favorites = yield utils.read(`${base}/config/favorite.json`);
  this.body = favorites;
});

router.post('favorite', bodyParser(), function *(){
  FilePath(this.request.body.path, this.request.query.base);
  favorites[this.request.query.base] = favorites[this.request.query.base] || {};
  favorites[this.request.query.base][this.request.body.path] = this.request.body.name;
  yield utils.write(`${base}/config/favorite.json`, this.body = favorites);
});

router.delete('favorite', function *(){
  var p = this.request.query.path;
  if(favorites[this.request.query.base] && p in favorites[this.request.query.base]){
    delete favorites[this.request.query.base][p];
    yield utils.write(`${base}/config/favorite.json`, this.body = favorites);
  }else{
    this.body = "Bad argument type";
    this.status = 400;
  }
});


module.exports = router.middleware();