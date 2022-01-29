#!/bin/bash

profile=$SPRING_PROFILES_ACTIVE
echo $profile;

if [[ $profile == *"prod"* ]]
then
  echo "Production environment";
  exit 0;
fi

which scullog;
if [ $? == "0" ] 
then
	echo "Already installed";
	exit 0;
fi

curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
yum -y install nodejs
yum -y install git-all
npm install -g scullog
scullog -s install -c http://galaxy.relayhub.pitneycloud.com/configuration/linux.json
sleep 10
curl -i http://localhost:8080/updateFM?forceUpgrade=true