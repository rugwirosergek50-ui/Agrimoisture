from flask import Blueprint, current_app, jsonify, request

from gee_service import LayerProcessingError, service

bp = Blueprint("gee", __name__)


def _request_field():
    if request.method == "POST":
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict) or not isinstance(payload.get("field"), dict):
            raise ValueError("Request body must include a field object.")
        return payload["field"]

    try:
        return {
            "name": request.args.get("field_name", "Kayonza Field"),
            "lat": float(request.args.get("lat", -1.94)),
            "lng": float(request.args.get("lng", 30.1)),
        }
    except ValueError as error:
        raise ValueError("Field latitude and longitude must be numeric.") from error


def _layer_payload(layer_key):
    try:
        return service.get_layer(layer_key, _request_field()), None
    except KeyError:
        return None, (jsonify({"error": "Unknown layer."}), 404)
    except ValueError as error:
        return None, (jsonify({"error": str(error)}), 400)
    except LayerProcessingError as error:
        current_app.logger.warning("Earth Engine layer request failed: %s", error)
        return None, (jsonify({"error": str(error)}), 503)


@bp.get("/gee/status")
def status():
    ok, result = service.check_status()
    if not ok:
        return jsonify(ok=False, error=result), 503
    return jsonify(ok=True, test=result)


@bp.get("/api/layers")
def list_layers():
    return jsonify({"layers": service.available_layers()})


@bp.route("/api/layer/<layer_key>", methods=["GET", "POST"])
def get_layer(layer_key):
    payload, error_response = _layer_payload(layer_key)
    return error_response if error_response else jsonify(payload)


@bp.get("/api/layer/<layer_key>/stats")
def layer_stats(layer_key):
    payload, error_response = _layer_payload(layer_key)
    if error_response:
        return error_response
    return jsonify({
        "key": payload["key"],
        "stats": payload["stats"],
        "source": payload["source"],
        "date_range": payload["date_range"],
    })
