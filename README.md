# Scullog
Scullog, having capability of sharing the local drive to the browser. Stream the log file via Socket.IO over browser. It run on any platform such as windows/linux/mac. It run as service or standalone mode. It also provide various other features:

# Features
- Listing & Sorting Files and Folders
- Support Multiple Base Directory
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
- Run as service or standalone mode
- URL prefix support (i.e. /scullog)

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

 -s, --service    install/uninstall as service			[choices: "install", "uninstall", "start", "stop", "restart"]
 
 -p, --port       Server Port                   		[number]
 
 -d, --directory  Root Files Directory          		[array]

 -P, --prefix     URL Prefix                                   [string]
 
 -c, --config     Local/Remote Config file				[string]
 
 -h, --help       Show help
 
 -v, --version    Show version number                                                              
  
# Dependency
Dependent on Unix style tail command
- Windows -- Install Git for Windows. It will install unix command in the path.
- Linux/Mac -- Support automatically

# RoadMap
- Docker Image
- Change file permission and attributes.
- Better layout design for better accessibility (utilize full screen)
- Execute custom cmd for better control.
- View Images and videos 
- PDF viewer
- Drag n drop functionality for file upload

# Scullog
Scullog, having capability of sharing the local drive to the browser. Stream the log file via Socket.IO over browser. It run on any platform such as windows/linux/mac. It run as service or standalone mode. It also provide various other features:


# Features
- Listing & Sorting Files and Folders
- Support Multiple Base Directory
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
- Run as service or standalone mode


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

 -s, --service    install/uninstall as service			[choices: "install", "uninstall", "start", "stop", "restart"]
 
 -p, --port       Server Port                   		[number]
 
 -d, --directory  Root Files Directory          		[array]

 -P, --prefix     URL Prefix                                   [string]
 
 -c, --config     Local/Remote Config file				[string]
 
 -h, --help       Show help
 
 -v, --version    Show version number                                                              
  
# Dependency
Dependent on Unix style tail command
- Windows -- Install Git for Windows. It will install unix command in the path.
- Linux/Mac -- Support automatically

# RoadMap
- Docker Image
- Change file permission and attributes.
- Better layout design for better accessibility (utilize full screen)
- Execute custom cmd for better control.
- View Images and videos 
- PDF viewer
- Drag n drop functionality for file upload
