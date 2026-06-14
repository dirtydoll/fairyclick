@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "ENTRY=%PROJECT_DIR%index.html"

if not exist "%ENTRY%" (
  echo Could not find index.html next to this script.
  echo Expected: "%ENTRY%"
  pause
  exit /b 1
)

start "" "%ENTRY%"

