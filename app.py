import math
import os
import random

from flask import Flask, jsonify, render_template, request
from google import genai
from google.genai._gaos.lib.compat_errors import (
    APIError as GeminiInteractionsAPIError,
    APITimeoutError as GeminiInteractionsAPITimeoutError,
)
import httpx

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:  # pragma: no cover - optional during local demo runs
    def load_dotenv():
        return False

load_dotenv()

from feedback import feedback_bp, init_feedback_db
from gee_routes import bp as gee_bp

app = Flask(__name__)
app.register_blueprint(feedback_bp)
app.register_blueprint(gee_bp)
init_feedback_db()
FIELDS = []

AREAS = [
    "Eastern Province (all)",
    "Nyagatare",
    "Gatsibo",
    "Kayonza",
    "Kirehe",
    "Ngoma",
    "Bugesera",
    "Rwamagana" ,
]

MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

METHODS = [
    {"key": "totram", "name": "TOTRAM", "bias": -0.05, "noise": 0.07},
    {"key": "optram", "name": "OPTRAM", "bias": 0.03, "noise": 0.05},
    {"key": "sar", "name": "Sentinel-1 SAR", "bias": 0.0, "noise": 0.04},
]


def build_mask(x, y, width=34, height=22):
    a = (x / width - 0.5) * 2
    b = (y / height - 0.5) * 2
    return a * a * 0.9 + b * b * 1.1 + 0.18 * math.sin(a * 5) < 0.85


def build_area_dataset(area_index=0, depth_index=1):
    rng = random.Random(11 + area_index * 7)
    phase = rng.random() * 6
    amp = 0.8 + rng.random() * 0.4
    depth_factor = 0.55 if depth_index == 1 else 1.0
    base = []

    for y in range(22):
        for x in range(34):
            if build_mask(x, y):
                base_value = (
                    0.5
                    + 0.22 * math.sin(x / 5 + phase)
                    + 0.18 * math.cos(y / 4 - phase)
                    + (rng.random() - 0.5) * 0.1
                )
                base.append(base_value)
            else:
                base.append(None)

    def season_value(t):
        seasonal = 0.5 + amp * 0.3 * math.cos((t - 3.5) * math.pi / 6)
        return min(0.95, max(0.05, seasonal))

    ref_series = [0.5 + (season_value(t) - 0.5) * depth_factor for t in range(12)]
    series = {}
    grids = {}

    for method_index, method in enumerate(METHODS):
        method_rng = random.Random(100 + method_index * 13 + area_index)
        method_series = []
        method_grids = []

        for month in range(12):
            grid = []
            for value in base:
                if value is None:
                    grid.append(None)
                    continue
                cell = (
                    (season_value(month) - 0.5) * depth_factor
                    + 0.5
                    + (value - 0.5) * 0.9
                    + method["bias"]
                    + (method_rng.random() - 0.5) * method["noise"] * 2
                )
                grid.append(min(1.0, max(0.0, cell)))

            method_grids.append(grid)
            valid = [value for value in grid if value is not None]
            average = sum(valid) / len(valid) + (method_rng.random() - 0.5) * method["noise"] * 0.6
            method_series.append(average)

        series[method["key"]] = method_series
        grids[method["key"]] = method_grids

    return {
        "area": AREAS[area_index],
        "area_index": area_index,
        "months": MONTHS,
        "depth_index": depth_index,
        "depth_label": "0–5 cm (surface)" if depth_index == 0 else "0–100 cm (root zone)",
        "reference": ref_series,
        "methods": METHODS,
        "series": series,
        "grids": grids,
        "base": base,
        "grid_size": {"width": 34, "height": 22},
    }


@app.get("/api/areas")
def api_areas():
    return jsonify({"areas": AREAS})


@app.get("/api/series")
def api_series():
    area_index = request.args.get("area", default=0, type=int)
    depth_index = request.args.get("depth", default=1, type=int)
    area_index = max(0, min(area_index, len(AREAS) - 1))
    depth_index = 0 if depth_index == 0 else 1
    return jsonify(build_area_dataset(area_index, depth_index))


@app.get("/api/summary")
def api_summary():
    area_index = request.args.get("area", default=0, type=int)
    depth_index = request.args.get("depth", default=1, type=int)
    area_index = max(0, min(area_index, len(AREAS) - 1))
    depth_index = 0 if depth_index == 0 else 1
    data = build_area_dataset(area_index, depth_index)
    month_index = request.args.get("month", default=5, type=int)
    month_index = max(0, min(month_index, 11))

    active_methods = [method["key"] for method in METHODS]
    values = [data["series"][key][month_index] for key in active_methods]
    consensus = sum(values) / len(values)
    return jsonify(
        {
            "area": data["area"],
            "month": data["months"][month_index],
            "consensus_wetness": round(consensus, 4),
            "reference": round(data["reference"][month_index], 4),
            "methods": {key: round(data["series"][key][month_index], 4) for key in active_methods},
            "depth_label": data["depth_label"],
        }
    )


def segments_intersect(first_start, first_end, second_start, second_end):
    def orientation(start, end, point):
        return (
            (end[0] - start[0]) * (point[1] - start[1])
            - (end[1] - start[1]) * (point[0] - start[0])
        )

    def on_segment(start, point, end):
        return (
            min(start[0], end[0]) <= point[0] <= max(start[0], end[0])
            and min(start[1], end[1]) <= point[1] <= max(start[1], end[1])
        )

    first_orientation = orientation(first_start, first_end, second_start)
    second_orientation = orientation(first_start, first_end, second_end)
    third_orientation = orientation(second_start, second_end, first_start)
    fourth_orientation = orientation(second_start, second_end, first_end)

    if first_orientation * second_orientation < 0 and third_orientation * fourth_orientation < 0:
        return True
    return (
        (first_orientation == 0 and on_segment(first_start, second_start, first_end))
        or (second_orientation == 0 and on_segment(first_start, second_end, first_end))
        or (third_orientation == 0 and on_segment(second_start, first_start, second_end))
        or (fourth_orientation == 0 and on_segment(second_start, first_end, second_end))
    )


@app.route("/api/fields", methods=["GET", "POST"])
def api_fields():
    if request.method == "GET":
        return jsonify(FIELDS)

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request body must be a JSON object"), 400

    name = data.get("name", "Unnamed field")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
        return jsonify(error="Field name must be between 1 and 120 characters"), 400

    geometry = data.get("geometry")
    if not isinstance(geometry, dict) or geometry.get("type") != "Polygon":
        return jsonify(error="Geometry must be a Polygon"), 400
    coordinates = geometry.get("coordinates")
    if not isinstance(coordinates, list) or len(coordinates) != 1:
        return jsonify(error="Polygon must contain one exterior ring and no holes"), 400
    ring = coordinates[0]
    if not isinstance(ring, list) or len(ring) < 4:
        return jsonify(error="A polygon needs at least 3 vertices and a closing point"), 400

    normalized_ring = []
    for point in ring:
        if not isinstance(point, (list, tuple)) or len(point) != 2:
            return jsonify(error="Each polygon position must contain longitude and latitude"), 400
        longitude, latitude = point
        if (
            isinstance(longitude, bool) or isinstance(latitude, bool)
            or not isinstance(longitude, (int, float))
            or not isinstance(latitude, (int, float))
            or not math.isfinite(longitude) or not math.isfinite(latitude)
            or not -180 <= longitude <= 180 or not -90 <= latitude <= 90
        ):
            return jsonify(error="Polygon coordinates must be finite longitude/latitude values"), 400
        normalized_ring.append([float(longitude), float(latitude)])

    if normalized_ring[0] != normalized_ring[-1]:
        return jsonify(error="Polygon ring must end with its first coordinate"), 400
    vertices = normalized_ring[:-1]
    if len({(point[0], point[1]) for point in vertices}) < 3:
        return jsonify(error="A polygon needs at least 3 distinct vertices"), 400
    if any(
        vertices[index] == vertices[(index + 1) % len(vertices)]
        for index in range(len(vertices))
    ):
        return jsonify(error="Polygon cannot contain consecutive duplicate vertices"), 400

    vertex_count = len(vertices)
    for first_index in range(vertex_count):
        first_start = vertices[first_index]
        first_end = vertices[(first_index + 1) % vertex_count]
        for second_index in range(first_index + 1, vertex_count):
            if second_index == first_index + 1 or (
                first_index == 0 and second_index == vertex_count - 1
            ):
                continue
            second_start = vertices[second_index]
            second_end = vertices[(second_index + 1) % vertex_count]
            if segments_intersect(first_start, first_end, second_start, second_end):
                return jsonify(error="Polygon boundary cannot cross or touch itself"), 400

    latitude_origin = sum(point[1] for point in vertices) / len(vertices)
    x_scale = 111320 * math.cos(math.radians(latitude_origin))
    projected = [(point[0] * x_scale, point[1] * 110540) for point in normalized_ring]
    area_m2 = abs(sum(
        projected[index][0] * projected[index + 1][1]
        - projected[index + 1][0] * projected[index][1]
        for index in range(len(projected) - 1)
    )) / 2
    if area_m2 <= 0:
        return jsonify(error="Polygon must enclose an area greater than zero"), 400

    district = data.get("district", "Kayonza")
    crop = data.get("crop", "Other / not selected")
    if not isinstance(district, str) or len(district) > 80:
        return jsonify(error="District must be a string of at most 80 characters"), 400
    if not isinstance(crop, str) or len(crop) > 80:
        return jsonify(error="Crop must be a string of at most 80 characters"), 400

    year = data.get("year")
    month = data.get("month")
    if year is None and month is None:
        year = month = None
    elif (
        isinstance(year, bool) or not isinstance(year, int) or not 1900 <= year <= 2100
        or isinstance(month, bool) or not isinstance(month, int) or not 1 <= month <= 12
    ):
        return jsonify(error="Year must be 1900–2100 and month must be 1–12"), 400

    field = {
        "id": len(FIELDS) + 1,
        "name": name.strip(),
        "district": district,
        "crop": crop,
        "year": year,
        "month": month,
        "geometry": {"type": "Polygon", "coordinates": [normalized_ring]},
        "lat": latitude_origin,
        "lng": sum(point[0] for point in vertices) / len(vertices),
        "area_ha": round(area_m2 / 10000, 2),
    }
    FIELDS.append(field)
    return jsonify(field), 201


@app.route("/")
def home():
    return render_template("dashboard.html")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/advice-chat")
def api_advice_chat():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Request body must be a JSON object"), 400

    query = data.get("query")
    if not isinstance(query, str) or not query.strip() or len(query) > 500:
        return jsonify(error="Question must contain 1 to 500 characters"), 400

    language = data.get("language", "en")
    if language not in ("en", "rw"):
        return jsonify(error="Language must be 'en' or 'rw'"), 400

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        message = (
            "The AI assistant is not configured yet. Set GEMINI_API_KEY on the server and restart the app."
            if language == "en"
            else "Umufasha w'ubwenge buhangano ntarashyirwaho. Shyira GEMINI_API_KEY kuri seriveri wongere utangize porogaramu."
        )
        return jsonify(error=message), 503

    answer_language = "English" if language == "en" else "Kinyarwanda"
    system_instruction = (
        "You are Baza AgriMoisture, a practical agricultural information assistant for farmers in Rwanda. "
        f"Always answer in {answer_language}, regardless of the language used in the question. "
        "Use concise, clear language. Give general crop-planning, soil-moisture observation, irrigation "
        "principles, and crop-care information. You do not receive live field sensor readings, the user's "
        "field location, current satellite measurements, or verified weather data; never claim that you do. "
        "Explain that satellite products are estimates and recommend direct field checks. Do not invent "
        "planting dates, forecasts, diagnoses, or local regulations. Do not prescribe fertilizer quantities "
        "or pesticide products/doses; recommend a soil test and a local agricultural extension worker for "
        "field-specific or high-impact decisions. State uncertainty and encourage local verification."
    )
    try:
        with genai.Client(
            api_key=api_key,
            http_options=genai.types.HttpOptions(timeout=20000),
        ) as client:
            interaction = client.interactions.create(
                model=os.getenv("GEMINI_MODEL") or "gemini-3.8-flash",
                input=query.strip(),
                system_instruction=system_instruction,
                generation_config={
                    "temperature": 0.4,
                    "max_output_tokens": 350,
                    "thinking_config": {"thinking_level": "low"},
                },
                store=False,
                timeout=30,
                automatic_continuation=False,
            )
    except (GeminiInteractionsAPIError, httpx.HTTPError) as error:
        status_code = getattr(error, "status_code", None)
        app.logger.warning(
            "Gemini advice request failed (%s; status %s).",
            type(error).__name__,
            status_code or "unavailable",
        )
        if isinstance(error, (GeminiInteractionsAPITimeoutError, httpx.TimeoutException)):
            message = (
                "Gemini took too long to respond. Please try again in a moment."
                if language == "en"
                else "Gemini yatindije igisubizo. Ongera ugerageze nyuma gato."
            )
            return jsonify(error=message), 504
        if status_code in (401, 403):
            message = (
                "Google rejected the Gemini API key. Check that the key is valid and Gemini API access is enabled."
                if language == "en"
                else "Google yanze urufunguzo rwa Gemini. Reba niba urufunguzo ari rwo kandi Gemini API yemerewe."
            )
            return jsonify(error=message), 502
        if status_code == 429:
            message = (
                "Gemini's request limit or quota has been reached. Please try again later or check your Google AI Studio quota."
                if language == "en"
                else "Umubare cyangwa ingano y'ibibazo bya Gemini yarenze. Ongera ugerageze nyuma cyangwa urebe quota muri Google AI Studio."
            )
            return jsonify(error=message), 429
        if status_code == 404:
            message = (
                "The configured Gemini model is unavailable. Check GEMINI_MODEL in your server environment."
                if language == "en"
                else "Model ya Gemini yashyizweho ntiboneka. Reba GEMINI_MODEL mu miterere ya seriveri."
            )
            return jsonify(error=message), 502
        message = (
            "The Gemini service returned an error. Please try again later."
            if language == "en"
            else "Serivisi ya Gemini yagaragaje ikibazo. Ongera ugerageze nyuma."
        )
        return jsonify(error=message), 502

    reply = interaction.output_text
    if not reply or not reply.strip():
        message = (
            "The AI did not return an answer. Please rephrase your question and try again."
            if language == "en"
            else "Umufasha ntiyatanze igisubizo. Ongera ubaze ikibazo mu bundi buryo."
        )
        return jsonify(error=message), 502

    return jsonify(reply=reply.strip())
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
