Set WshShell = CreateObject("WScript.Shell")
sdk = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Android\Sdk\emulator"
WshShell.CurrentDirectory = sdk
WshShell.Run "emulator.exe -avd unbora -no-snapshot-load", 0, False
