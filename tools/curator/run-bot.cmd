@echo off
REM Launcher for الأسطى. Kept as a file rather than inlined into the scheduled
REM task so the command can be edited without re-registering the task.
cd /d "%~dp0..\.."
:loop
node --env-file=.env.local tools\curator\bot.mjs >> "%TEMP%\el-osta.log" 2>&1
REM If node exits for any reason, wait and come back. Covers transient network
REM loss on boot, when the network stack often isn't up yet.
timeout /t 15 /nobreak >nul
goto loop
