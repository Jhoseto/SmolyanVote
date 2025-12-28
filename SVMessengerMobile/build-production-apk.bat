@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0build-production-apk.ps1"
pause

