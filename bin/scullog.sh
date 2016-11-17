#!/usr/bin/env sh

SHELL_PATH=$(dirname $([ -L $0 ] && readlink -f $0 || echo $0))
cd $SHELL_PATH/..
MSYS_NO_PATHCONV=1 node --harmony server/index.js $@
