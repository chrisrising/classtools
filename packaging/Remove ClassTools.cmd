@echo off
setlocal
title Remove ClassTools

rem The app folder is always this fixed path, never the folder this script
rem happens to be sitting in, so this can never delete the wrong thing.
set "DEST=%LOCALAPPDATA%\ClassTools"
set "CFG=%APPDATA%\ClassCalc"

if /i "%~1"=="--finish" goto finish

echo.
echo   Remove ClassTools
echo   =================
echo.
echo   This deletes:
echo     the app folder           %DEST%
echo     the Desktop shortcut and the Start menu entry
echo     leftover scratch files from the document viewer
echo.
echo   Your saved settings ^(window positions and preferences^) are kept
echo   unless you say otherwise in a moment.
echo.
choice /c yn /n /m "  Remove ClassTools? [Y/N] "
if errorlevel 2 goto cancelled

echo.
choice /c yn /n /m "  Also delete your saved settings? [Y/N] "
set "WIPECFG=no"
if not errorlevel 2 set "WIPECFG=yes"
echo.

taskkill /im ClassTools.exe /f >nul 2>&1
if not errorlevel 1 ping -n 3 127.0.0.1 >nul

echo   Removing shortcuts.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path ([Environment]::GetFolderPath('Desktop')) 'ClassTools.lnk'); Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path ([Environment]::GetFolderPath('Programs')) 'ClassTools')" >nul 2>&1

echo   Removing scratch files.
for /d %%D in ("%TEMP%\classtools-*") do rd /s /q "%%~D" 2>nul
del /q "%TEMP%\classtools-sheet-*.html" 2>nul

if /i "%WIPECFG%"=="yes" (
  echo   Removing saved settings.
  rd /s /q "%CFG%" 2>nul
)

if not exist "%DEST%\ClassTools.exe" goto nofolder

rem Hand the folder delete to a copy of this script running from %TEMP%,
rem because a script cannot delete the folder it is running from.
copy /y "%~f0" "%TEMP%\classtools-remove.cmd" >nul
start "" cmd /c ""%TEMP%\classtools-remove.cmd" --finish"
exit /b

:finish
ping -n 3 127.0.0.1 >nul
rd /s /q "%DEST%" 2>nul
echo.
if exist "%DEST%" (
  echo   Could not delete %DEST%
  echo   Something in there is still in use. Close ClassTools, then delete
  echo   that folder by hand.
) else (
  echo   ClassTools has been removed.
)
echo.
pause
exit /b

:nofolder
echo.
echo   There was no app folder at %DEST%
echo   so nothing was installed there. Shortcuts and scratch files have
echo   been cleared.
echo.
pause
exit /b

:cancelled
echo.
echo   Nothing was changed.
echo.
pause
exit /b
