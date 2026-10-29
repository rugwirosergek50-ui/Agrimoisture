"""SQLite-backed farmer feedback API for the AgriMoisture app."""

import hmac
import math
import os
import sqlite3
from datetime import datetime, timezone

from flask import Blueprint, current_app, g, jsonify, request

feedback_bp = Blueprint("feedback", __name__)

DB_PATH = os.environ.get(
    "FEEDBACK_DB",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "agrimoisture_feedback.db"),
)

ALLOWED_CATEGORIES = {"moisture_accuracy", "crop_advice", "feature_request", "bug_report"}
ALLOWED_GROUND_MATCH = {"accurate", "drier_than_map", "wetter_than_map", "flooded", ""}
ALLOWED_STATUS = {"Received", "Under Review", "Acknowledged", "Resolved"}
MAX_COMMENT_LEN = 2000


def get_db():
    """Return one SQLite connection for the current request."""
    if "feedback_db" not in g:
        g.feedback_db = sqlite3.connect(DB_PATH)
        g.feedback_db.row_factory = sqlite3.Row
    return g.feedback_db


@feedback_bp.teardown_app_request
def close_db(exc=None):
    db = g.pop("feedback_db", None)
    if db is not None:
        db.close()


def init_feedback_db():
    """Create the feedback table if it does not already exist."""
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                field_name TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                category TEXT NOT NULL,
                ground_match TEXT,
                rating INTEGER,
                comments TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en',
                status TEXT NOT NULL DEFAULT 'Received',
                submitted_at TEXT NOT NULL
            )
            """
        )
        connection.commit()
    finally:
        connection.close()


def row_to_dict(row):
    return {key: row[key] for key in row.keys()}


def validate_payload(data):
    """Return a normalized payload and an error message, if invalid."""
    if not isinstance(data, dict):
        return None, "Invalid JSON body."

    comments = data.get("comments")
    if not isinstance(comments, str) or not comments.strip():
        return None, "Feedback comment is required."
    comments = comments.strip()
    if len(comments) > MAX_COMMENT_LEN:
        return None, f"Comment too long (max {MAX_COMMENT_LEN} characters)."

    category = data.get("category")
    if not isinstance(category, str) or category not in ALLOWED_CATEGORIES:
        return None, "Invalid feedback category."

    ground_match = data.get("ground_match", "")
    if ground_match is None:
        ground_match = ""
    if not isinstance(ground_match, str) or ground_match not in ALLOWED_GROUND_MATCH:
        return None, "Invalid ground-match value."

    rating = data.get("rating")
    if rating not in (None, ""):
        if isinstance(rating, bool):
            return None, "Rating must be a number from 1 to 5."
        try:
            numeric_rating = int(rating)
        except (TypeError, ValueError, OverflowError):
            return None, "Rating must be a number from 1 to 5."
        if str(numeric_rating) != str(rating).strip() and not isinstance(rating, int):
            return None, "Rating must be a whole number from 1 to 5."
        if not 1 <= numeric_rating <= 5:
            return None, "Rating must be between 1 and 5."
        rating = numeric_rating
    else:
        rating = None

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    if latitude in (None, "") and longitude in (None, ""):
        latitude = longitude = None
    elif latitude in (None, "") or longitude in (None, ""):
        return None, "Both latitude and longitude are required."
    else:
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError, OverflowError):
            return None, "Invalid coordinates."
        if (
            not math.isfinite(latitude)
            or not math.isfinite(longitude)
            or not -90 <= latitude <= 90
            or not -180 <= longitude <= 180
        ):
            return None, "Coordinates out of range."

    field_name = data.get("field_name", "Unknown Field")
    if not isinstance(field_name, str):
        return None, "Field name must be text."
    field_name = field_name.strip()[:120] or "Unknown Field"

    language = data.get("language", "en")
    if language not in ("en", "rw"):
        language = "en"

    return {
        "field_name": field_name,
        "latitude": latitude,
        "longitude": longitude,
        "category": category,
        "ground_match": ground_match,
        "rating": rating,
        "comments": comments,
        "language": language,
    }, None


def admin_authorized():
    token = os.environ.get("FEEDBACK_ADMIN_TOKEN")
    provided = request.headers.get("X-Admin-Token", "")
    return bool(token) and hmac.compare_digest(provided, token)


def unauthorized_response():
    return jsonify({"status": "error", "message": "Unauthorized."}), 401


@feedback_bp.post("/api/submit-feedback")
def submit_feedback():
    clean, error = validate_payload(request.get_json(silent=True))
    if error:
        return jsonify({"status": "error", "message": error}), 400

    submitted_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO feedback
            (field_name, latitude, longitude, category, ground_match, rating,
             comments, language, status, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Received', ?)
        """,
        (
            clean["field_name"],
            clean["latitude"],
            clean["longitude"],
            clean["category"],
            clean["ground_match"],
            clean["rating"],
            clean["comments"],
            clean["language"],
            submitted_at,
        ),
    )
    db.commit()
    entry = db.execute(
        "SELECT * FROM feedback WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    if entry is None:
        current_app.logger.error("Inserted feedback row %s could not be read back", cursor.lastrowid)
        return jsonify({"status": "error", "message": "Feedback was saved but could not be loaded."}), 500
    return jsonify({
        "status": "success",
        "message": "Feedback saved.",
        "entry": row_to_dict(entry),
    }), 201


@feedback_bp.get("/api/get-feedback")
def get_feedback():
    """Admin-only query endpoint; supports field, category, status, limit, and offset."""
    if not admin_authorized():
        return unauthorized_response()

    where = []
    params = []
    for column, argument in (("field_name", "field"), ("category", "category"), ("status", "status")):
        value = request.args.get(argument)
        if value:
            where.append(f"{column} = ?")
            params.append(value)

    try:
        limit = min(max(int(request.args.get("limit", 20)), 1), 100)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return jsonify({"status": "error", "message": "limit/offset must be integers."}), 400

    clause = ("WHERE " + " AND ".join(where)) if where else ""
    db = get_db()
    total = db.execute(f"SELECT COUNT(*) FROM feedback {clause}", params).fetchone()[0]
    rows = db.execute(
        f"SELECT * FROM feedback {clause} ORDER BY id DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    return jsonify({
        "status": "success",
        "total": total,
        "feedback": [row_to_dict(row) for row in rows],
    })


@feedback_bp.patch("/api/feedback/<int:feedback_id>/status")
def update_status(feedback_id):
    """Admin-only feedback status update."""
    if not admin_authorized():
        return unauthorized_response()

    data = request.get_json(silent=True)
    new_status = data.get("status") if isinstance(data, dict) else None
    if new_status not in ALLOWED_STATUS:
        return jsonify({
            "status": "error",
            "message": f"Status must be one of {sorted(ALLOWED_STATUS)}.",
        }), 400

    db = get_db()
    cursor = db.execute(
        "UPDATE feedback SET status = ? WHERE id = ?", (new_status, feedback_id)
    )
    db.commit()
    if cursor.rowcount == 0:
        return jsonify({"status": "error", "message": "Feedback not found."}), 404
    return jsonify({"status": "success", "id": feedback_id, "new_status": new_status})


@feedback_bp.get("/api/feedback-summary")
def feedback_summary():
    """Admin-only aggregate summary for feedback analysis."""
    if not admin_authorized():
        return unauthorized_response()

    db = get_db()
    by_match = db.execute(
        """
        SELECT ground_match, COUNT(*) AS n
        FROM feedback
        WHERE ground_match != ''
        GROUP BY ground_match
        """
    ).fetchall()
    by_field = db.execute(
        """
        SELECT field_name, COUNT(*) AS n, ROUND(AVG(rating), 2) AS avg_rating
        FROM feedback
        GROUP BY field_name
        ORDER BY n DESC
        """
    ).fetchall()
    return jsonify({
        "status": "success",
        "ground_match": [row_to_dict(row) for row in by_match],
        "by_field": [row_to_dict(row) for row in by_field],
    })
