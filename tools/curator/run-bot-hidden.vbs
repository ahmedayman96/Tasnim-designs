' Starts the launcher with no console window. A scheduled task set to "run only
' when the user is logged on" would otherwise leave a black cmd window on screen.
CreateObject("WScript.Shell").Run """" & _
  CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & _
  "\run-bot.cmd""", 0, False
