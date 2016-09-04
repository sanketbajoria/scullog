#!/usr/bin/env sh
SHELL_PATH=$1

now=$(date +"%Y-%m-%d-%S")
cd scullog
node --harmony server/index.js -s uninstall
cd ..
npm update -g -d scullog
cd scullog
node --harmony server/index.js -s install
cd $SHELL_PATH
cp $SHELL_PATH/update.log $SHELL_PATH/scullog/server/log/update.$now.log
rm -rf update.log
rm -rf scullog-update.sh
exit