#!/usr/bin/env sh

SHELL_PATH=$(dirname $([ -L $0 ] && readlink -f $0 || echo $0))

if [ "$1" = "update" ]
then
	cd $SHELL_PATH
	cp scullog-update.sh ../../scullog-update.sh
	cd ..
	cd ..
	sh ./scullog-update.sh $SHELL_PATH/../.. > ./update.log &
else
    cd $SHELL_PATH/..
    node --harmony server/index.js $*
fi