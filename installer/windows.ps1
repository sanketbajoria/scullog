if (Get-Command scullog -errorAction SilentlyContinue)
{
    "Scullog exists"
	exit
}
Set-Location C:\
mkdir temp
Set-Location temp

Set-ExecutionPolicy Unrestricted -Scope CurrentUser -Force

$WebClient = New-Object System.Net.WebClient
$WebClient.DownloadFile("http://galaxy.relayhub.pitneycloud.com/installer/settings.ini","C:\temp\settings.ini")
$WebClient.DownloadFile("http://github.com/git-for-windows/git/releases/download/v2.10.0.windows.1/Git-2.10.0-64-bit.exe","C:\temp\Git-2.10.0-64-bit.exe")
$WebClient.DownloadFile("https://nodejs.org/dist/v4.5.0/node-v4.5.0-x64.msi","C:\temp\node-v4.5.0-x64.msi")

C:\temp\Git-2.10.0-64-bit.exe /SILENT /LOADINF="C:\temp\settings.ini"
Start-Sleep 45
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
msiexec.exe /i node-v4.5.0-x64.msi /quiet
Start-Sleep 25
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
npm install --global --production npm-windows-upgrade
npm-windows-upgrade --npm-version 3.10.7
npm install -g scullog
scullog -s install -c http://galaxy.relayhub.pitneycloud.com/configuration/windows.json
Start-Sleep 10
Remove-Item settings.ini
Remove-Item Git-2.10.0-64-bit.exe
Remove-Item node-v4.5.0-x64.msi
$WebClient.DownloadString("http://localhost:8080/updateFM?forceUpgrade=true")
Start-Sleep 30
Set-Location ..
Remove-Item -Recurse -Force temp