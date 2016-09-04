#!/usr/bin/env sh
now=$(date +"%Y-%m-%d-%S")
cd scullog
node --harmony server/index.js -s uninstall
cd ..
npm update -g -d scullog
cd scullog
node --harmony server/index.js -s install
cp ../update.log server/log/update.$now.log
rm -rf ../update.log
rm -rf ../scullog-update.sh
exit