"""LUMINA Flask API."""
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import init_db, save_scan, get_history, clear_history
from text_analyzer import analyze_text
from url_analyzer import analyze_url
from risk_engine import assess_risk

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
init_db()

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "application": "LUMINA", "version": "1.0.0"})

@app.post("/api/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    content = str(payload.get("input", "")).strip()
    input_type = str(payload.get("type", "auto")).lower()
    if not content:
        return jsonify({"error": "Please enter text or a URL to analyze."}), 400
    if len(content) > 10000:
        return jsonify({"error": "Input is too long (maximum 10,000 characters)."}), 400

    try:
        looks_like_url = input_type == "url" or (
            input_type == "auto" and content.lower().startswith(("http://", "https://", "www."))
        )
        if input_type not in {"auto", "text", "url"}:
            return jsonify({"error": "Type must be auto, text or url."}), 400

        text_result = None
        url_result = None
        if looks_like_url:
            url_result = analyze_url(content)
            detected_type = "url"
        else:
            text_result = analyze_text(content)
            detected_type = "text"
            # Also inspect the first URL in a message, if present.
            import re
            match = re.search(r"https?://[^\s<>()]+|www\.[^\s<>()]+", content, re.I)
            if match:
                try:
                    url_result = analyze_url(match.group(0).rstrip(".,!?"))
                except ValueError:
                    pass

        result = assess_risk(text_result, url_result)
        result.update({
            "input_type": detected_type,
            "text_analysis": text_result,
            "url_analysis": url_result,
        })
        scan_id = save_scan(detected_type, content, result)
        result["scan_id"] = scan_id
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Analysis failed")
        return jsonify({"error": "Analysis failed. Check the backend terminal for details."}), 500

@app.get("/api/history")
def history():
    return jsonify({"history": get_history()})

@app.delete("/api/history")
def delete_history():
    clear_history()
    return jsonify({"message": "Analysis history cleared."})

@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Endpoint not found."}), 404

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
