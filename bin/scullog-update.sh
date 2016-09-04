#!/usr/bin/env sh
SHELL_PATH=$1

now=$(date +"%Y-%m-%d-%S")
cd scullog
node --harmony server/index.js -s uninstall
cd ..
npm update -g scullog
cp $SHELL_PATH/main.json $SHELL_PATH/scullog/server/config/main.json
cd scullog
node --harmony server/index.js -s install
cp $SHELL_PATH/update.log $SHELL_PATH/scullog/server/log/update.$now.log
rm -rf $SHELL_PATH/main.json
rm -rf $SHELL_PATH/update.log
rm -rf $SHELL_PATH/scullog-update.sh
exit