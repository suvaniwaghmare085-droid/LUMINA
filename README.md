# LUMINA — AI-Powered Scam Detection & Link Protection Assistant

A beginner-friendly educational prototype implementing the core capabilities in the project presentation: message classification using TF-IDF + Logistic Regression, URL structure checks, explainable risk scoring, Flask API, SQLite scan history, dashboard and a Chrome Manifest V3 extension.

## Important limitations
- The included CSV is a small starter dataset created for demonstration. It is not representative of all scams and is not sufficient for production-grade detection.
- The risk score is a heuristic/model-based **risk indicator**, not a calibrated probability of fraud.
- URL analysis is offline and structural. LUMINA does not visit URLs, check live reputation, inspect page contents, or verify ownership.
- The Chrome extension analyzes selected text or the current tab URL when the user clicks a button. It does not silently monitor browsing or private messages.
- A SAFE result is not a guarantee that content is safe. Never share OTPs, PINs, passwords, CVVs or recovery phrases.

## Requirements
- Windows 10/11
- Python 3.10+ (Python 3.11 or 3.12 recommended)
- VS Code (recommended)
- Google Chrome (for the extension)

## 1. Open the project
Extract the ZIP. In VS Code, open the `LUMINA` folder.

## 2. Create and activate a virtual environment (PowerShell)
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```
If PowerShell blocks activation, run this once in that terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```
If `py` is unavailable, use `python` instead.

## 3. Install dependencies and train the model
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
python train_model.py
```

## 4. Start the backend
From the `backend` directory:
```powershell
python app.py
```
Keep this terminal open. The API runs at `http://127.0.0.1:5000`.

Check health in a browser: `http://127.0.0.1:5000/api/health`

## 5. Open the dashboard
Open `frontend/index.html` in Chrome. The dashboard calls the local Flask API. If the browser blocks local requests from a `file://` page, start a second terminal at the project root and run:
```powershell
py -m http.server 8080 --directory frontend
```
Then open `http://127.0.0.1:8080`.

## 6. Load the Chrome extension

> **Experimental component:** The Chrome extension source code is included in this repository but has not been fully tested. The currently tested components are the Flask backend and web dashboard.

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Select **Load unpacked**
4. Choose the project's `extension` folder
5. Keep the Flask backend running, then pin LUMINA to the Chrome toolbar.
6. Open a normal website, select text and use the extension's **Analyze selected text** action, or analyze the current page URL.

The extension requires the local Flask backend to be running on the same computer. Its functionality is provided for experimentation and future development.

## 7. Test the API
With the backend running, open a new PowerShell terminal:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/health
$body = @{ input = "URGENT: your account is blocked. Share your OTP now to restore access."; type = "text" } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:5000/api/analyze -Method Post -ContentType "application/json" -Body $body
```

## 8. Run tests
Install pytest, then from the project root:
```powershell
pip install pytest
pytest
```

## Project structure
```text
LUMINA/
  backend/       Flask API, ML training, analyzers, risk engine, SQLite
  frontend/      Browser dashboard
  extension/     Chrome Manifest V3 extension
  tests/         Starter automated tests
```

## Suggested demonstration
1. Start the backend and open the dashboard.
2. Analyze the included suspicious prize sample.
3. Analyze the normal delivery sample.
4. Analyze a URL such as `http://192.0.2.10/login` (reserved documentation IP; do not visit it).
5. Show the explanations and history.
6. Demonstrate the Chrome extension on selected text.

## Future improvements
Expand and document the dataset, evaluate precision/recall on a separate test set, add safe URL reputation integrations, improve multilingual coverage, add user-controlled privacy settings, and package the extension for distribution.
