set dstpath=%~dp0..

cd /d %~dp0

for /r %%i in (*.less) do call :START %%i
goto :EOF

:START
echo Processing %1
call npx lessc --global-var="locale=en" "%1" "%dstpath%\en\%~n1.css"
call npx lessc --global-var="locale=ru" "%1" "%dstpath%\ru\%~n1.css"
call npx lessc --global-var="locale=de" "%1" "%dstpath%\de\%~n1.css"
call npx lessc --global-var="locale=fr" "%1" "%dstpath%\fr\%~n1.css"
call npx lessc --global-var="locale=ja" "%1" "%dstpath%\ja\%~n1.css"
call npx lessc --global-var="locale=ko" "%1" "%dstpath%\ko\%~n1.css"
call npx lessc --global-var="locale=zh" "%1" "%dstpath%\zh\%~n1.css"
call npx lessc --global-var="locale=it" "%1" "%dstpath%\it\%~n1.css"
goto :EOF

