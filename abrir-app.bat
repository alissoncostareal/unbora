@echo off
set "ANDROID_HOME=C:\Users\aliss\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%PATH%"

cd /d "c:\dev\projetos\unbora\mobile"
echo [Unbora] Iniciando Metro e abrindo no Android...
npm run android
