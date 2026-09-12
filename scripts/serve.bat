@echo off
cd /d "%~dp0..\frontend"
echo Finance Manager (mock frontend)
echo http://127.0.0.1:8766/
echo Khong ket noi database. Du lieu MOCK trong js/data.js
python -m http.server 8766
pause
