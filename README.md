# Scullog
Scullog, having capability of sharing the local drive to the browser. And, do below features.

# Features
- Listing & Sorting Files and Folders
- Download/Upload file
- Move/Delete/Rename file
- Create a New Folder
- Stream a particular file content.
- Advanced highlighting and filtering text, while streaming file content
 
# Usage

```sh
  npm install -g scullog
  scullog -p 8080 -d /path/to/
```

Then, we can view localhost:8080/ in our browser.

# Dependency
Dependent on Unix style tail command
- Windows	
-- Install Git for Windows. It will install unix command in the path.
- Linux
-- tail command is available by default

# Credit
- efeiefei/node-file-manager (Enhanced mainly taking this as base)
- mthenw/frontail (Tailing functionality)