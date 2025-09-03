@echo off
set BROWSER="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
set PROF=C:\temp\solo-profile
set HTML=%~dp0viewer.html
mkdir "%PROF%" >nul 2>&1
%BROWSER% --allow-file-access-from-files --disable-web-security --user-data-dir="%PROF%" "%HTML%