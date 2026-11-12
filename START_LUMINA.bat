@echo off
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
  echo Create the virtual environment and install requirements first. See README.md.
  pause
  exit /b 1
)
call .venv\Scripts\activate
python app.py
pause
