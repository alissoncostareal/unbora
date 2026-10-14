@echo off
set "ANDROID_HOME=C:\Users\aliss\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%PATH%"

echo [Unbora] Abrindo o emulador Android (unbora)...
start "" "%ANDROID_HOME%\emulator\emulator.exe" -avd unbora -no-snapshot-load
