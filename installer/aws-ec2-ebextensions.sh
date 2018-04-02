files:
  "/tmp/scullog-linux.sh":
    mode: "000777"
    owner: root
    group: root
    content: |
		#!/bin/bash
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

container_commands:
  99_set_up:
    command: /tmp/scullog-linux.sh