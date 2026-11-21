@echo off
setlocal
title Set up ClassTools

set "SRC=%~dp0"
set "DEST=%LOCALAPPDATA%\ClassTools"

echo.
echo   ClassTools setup
echo   ================
echo.
echo   This copies ClassTools into your own user folder:
echo       %DEST%
echo.
echo   No administrator rights are needed, and nothing is written to the
echo   registry. Run this again any time to update to a newer version.
echo.
echo   A "Remove ClassTools" shortcut is added so you can undo all of it.
echo.
pause
echo.

taskkill /im ClassTools.exe /f >nul 2>&1
if not errorlevel 1 (
  echo   Closed the copy of ClassTools that was already running.
  ping -n 3 127.0.0.1 >nul
)

echo   Copying files. The first time this takes a minute or two.
robocopy "%SRC%." "%DEST%" /E /PURGE /NFL /NDL /NJH /NJS /NP /XF "Set up ClassTools.cmd" >nul
if errorlevel 8 goto copyfailed

echo   Making shortcuts.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $d='%DEST%'; $w=New-Object -ComObject WScript.Shell; $prog=Join-Path ([Environment]::GetFolderPath('Programs')) 'ClassTools'; New-Item -ItemType Directory -Force -Path $prog | Out-Null; foreach($p in @((Join-Path ([Environment]::GetFolderPath('Desktop')) 'ClassTools.lnk'),(Join-Path $prog 'ClassTools.lnk'))){ $s=$w.CreateShortcut($p); $s.TargetPath=(Join-Path $d 'ClassTools.exe'); $s.WorkingDirectory=$d; $s.IconLocation=(Join-Path $d 'ClassTools.exe')+',0'; $s.Description='ClassTools classroom assistant'; $s.Save() }; $r=$w.CreateShortcut((Join-Path $prog 'Remove ClassTools.lnk')); $r.TargetPath=(Join-Path $d 'Remove ClassTools.cmd'); $r.WorkingDirectory=$d; $r.Description='Remove ClassTools from this computer'; $r.Save()"
if errorlevel 1 echo   Note: the shortcuts could not be made. You can still run
if errorlevel 1 echo   ClassTools.exe from %DEST%

echo.
echo   Done. ClassTools is set up for your account only.
echo.
echo     Start it    the ClassTools icon on your Desktop,
echo                 or Start menu ^> ClassTools
echo     Remove it   Start menu ^> ClassTools ^> Remove ClassTools
echo.
echo   You can delete the zip and this extracted folder now. The copy that
echo   runs lives in %DEST%
echo.
choice /c yn /n /m "  Start ClassTools now? [Y/N] "
if errorlevel 2 goto end
start "" "%DEST%\ClassTools.exe"
goto end

:copyfailed
echo.
echo   The copy did not finish. The usual reasons are:
echo     - ClassTools is still running. Quit it and try again.
echo     - this is being run from inside the zip. Extract the zip first.
echo.

:end
echo.
pause
endlocal
