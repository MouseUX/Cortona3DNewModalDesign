@echo off
if not exist ..\..\..\..\..\xmax goto :EOF

xcopy /y ..\..\..\..\..\xmax\DC_DITA_1_3\src\less\*.json .\dita\
xcopy /y ..\..\..\..\..\xmax\DC_RWI\src\less\*.json .\rwi\
xcopy /y ..\..\..\..\..\xmax\DC_S1000D_4_1\src\less\*.json .\s1000d\

call lessb