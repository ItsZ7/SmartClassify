@echo off
setlocal
if not exist .venv\Scripts\python.exe (
  echo Creating Python 3.12 virtual environment...
  py -3.12 -m venv .venv
  if errorlevel 1 (
    echo Python 3.12 was not found. Install it from https://www.python.org/downloads/release/python-312/
    pause
    exit /b 1
  )
  .venv\Scripts\python.exe -m pip install --upgrade pip
  .venv\Scripts\python.exe -m pip install -r requirements.txt
)
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
