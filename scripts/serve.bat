@echo off
cd /d "%~dp0..\src\frontend"
echo HandmadeFinance (React mock)
echo http://127.0.0.1:5173/
echo Khong ket noi database. Du lieu MOCK.
call npm run dev
pause
