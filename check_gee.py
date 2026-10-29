from gee_service import GEEService


def main() -> None:
    service = GEEService()
    demo_field = {"name": "Kayonza Field", "lat": -1.94, "lng": 30.1}

    print(f"GEE initialized: {service.ready}")
    for layer_key in ("sar", "totram", "optram", "pawc"):
        payload = service.get_layer(layer_key, demo_field)
        mean = payload["stats"]["mean"]
        print(f"{layer_key}: mean={mean:.4f}, source={payload['source']}, label={payload['label']}")

    print("OK")


if __name__ == "__main__":
    main()
