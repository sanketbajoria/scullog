# Scullog
Scullog, having capability of sharing the local drive to the browser. Stream the log file via Socket.IO over browser. It runs on any platform such as windows/linux/mac. It runs as a service or in standalone mode. It also provides various other features:

# Features
- Listing & Sorting Files and Folders
- Support Multiple Base Directories
- Download/Upload file
- Move/Delete/Rename file
- Role based permission (time based revoking)
- Push remote configuration & update scullog, with just one click
- Create/Upload/Edit a File/Folder
- Stream a particular file content.
- Advanced highlighting and filtering text, while streaming file content
- Detailed logging. 
- Adding path to favorite, to quickly jump on it
- Support right hand context menu for file/folder
- Run as service or in standalone mode
- Full support of scullog as docker image

# Screenshots
<img src="https://cloud.githubusercontent.com/assets/2969587/19343848/8d8e405c-9155-11e6-8106-c32896b6be47.jpg" width="360" height="280" alt="Basic Mode Screenshot" title="Basic Mode Screenshot" /> <img src="https://cloud.githubusercontent.com/assets/2969587/19343849/8da1454e-9155-11e6-967a-6a5a613957a6.jpg" width="360" height="280" alt="Privilege Mode Screenshot" title="Privilege Mode Screenshot"/>

# Installation
Install the scullog npm package
```sh
  npm install -g scullog
```
Run the scullog in either standalone
```sh
  scullog -p 8080 -d /path/to/
```
or in service mode
```sh
  scullog -s install -p 8080 -d /path/to/
```

Then, we can view http://localhost:8080/ in our browser.
 

# Complete Usage

scullog [-s <service>] [-p <port>] [-d <directory>] [-c <config>]

Options:

 -s, --service    install/uninstall as service			[choices: "install", "uninstall"]
 
 -p, --port       Server Port                   		[number]
 
 -d, --directory  Root Files Directory          		[array]
 
 -c, --config     Local/Remote Config file				[string]
 
 -h, --help       Show help
 
 -v, --version    Show version number                                                              

# Scullog as Docker Image
<a href="https://hub.docker.com/r/sanketb/docker-scullog/">Scullog Docker Image</a> having alpine linux as a base Image, can be used for running anything, with extra capability of serving & streaming the docker files & logs, over the local system, using 8080 port.

# Dependency
Dependends on Unix style tail command
- Windows -- Install Git for Windows. It will install unix command in the path.
- Linux/Mac -- Support automatically

# Setting up Reverse Proxy via Nginx
## Path based reverse proxy
Suppose, you are running scullog at localhost:9000, and wanted to run at localhost:8888/scullog, then below configuration
```
http{
  map $http_upgrade $connection_upgrade {
      default upgrade;
      '' close;
  }
  server {
		listen	8888;
	  server_name  localhost;
		location /scullog {
			rewrite ^/scullog/?(.*) /$1 break;
			proxy_pass http://127.0.0.1:9000;
			proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
		}
	}
}
```
## Port based reverse proxy
Suppose, you are running scullog at localhost:9000, and wanted to run at localhost:8888, then below configuration
```
http{
  map $http_upgrade $connection_upgrade {
      default upgrade;
      '' close;
  }
  server {
		listen	8888;
	  server_name  localhost;
		location / {
			proxy_pass http://127.0.0.1:9000;
			proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
		}
	}
}
```

# SSL Support
To start scullog with ssl support, pass the ssl certificate and ssl key in configuration file in below format
```json
{
  "ssl": {
    "key": "",
    "certificate": ""
  }
}
```
Sample configuration file, can be found <a href="https://raw.githubusercontent.com/sanketbajoria/scullog/master/default.json">here</a>


# RoadMap
- <s>Docker Image</s>
- <s>Reverse Proxy support</s>
- <s>SSL Support</s>
- Change file permissions and attributes.
- Better layout design for better accessibility (utilize full screen)
- Execute custom cmd for better control.
- View Images and videos 
- PDF viewer
- <s>Drag n drop functionality for file upload</s>
