import math
import os
from datetime import date, timedelta
from typing import Any, Dict, Optional

try:
    import ee
except ImportError:  # pragma: no cover - optional dependency
    ee = None


LAYER_CONFIG = {
    "sar": {
        "label": "Sentinel-1 SAR (VV backscatter)",
        "description": "Median Sentinel-1 VV backscatter for the past year. Backscatter is not a direct soil-moisture measurement.",
        "unit": "dB",
        "legend": ["−25 dB", "−19 dB", "−13 dB", "−6 dB", "0 dB"],
        "palette": ["#313695", "#74add1", "#ffffbf", "#fdae61", "#a50026"],
        "min": -25,
        "max": 0,
    },
    "totram": {
        "label": "TOTRAM thermal proxy",
        "description": "Landsat land-surface temperature normalized to the local 5th–95th percentile. This is an uncalibrated relative proxy, not a validated TOTRAM moisture retrieval.",
        "unit": "relative index",
        "legend": ["0.00", "0.25", "0.50", "0.75", "1.00"],
        "palette": ["#a50026", "#f46d43", "#fee08b", "#a6d96a", "#1a9850"],
        "min": 0,
        "max": 1,
    },
    "optram": {
        "label": "OPTRAM SWIR proxy",
        "description": "Landsat NDVI-filtered shortwave-infrared transform normalized to local percentiles. This uncalibrated relative proxy is not volumetric soil moisture.",
        "unit": "relative index",
        "legend": ["0.00", "0.25", "0.50", "0.75", "1.00"],
        "palette": ["#a50026", "#fdae61", "#ffffbf", "#a6d96a", "#1a9850"],
        "min": 0,
        "max": 1,
    },
    "pawc": {
        "label": "PAWC (texture-based estimate)",
        "description": "Estimated 0–100 cm plant-available water capacity from OpenLandMap soil texture and organic carbon using Saxton–Rawls pedotransfer equations. Validate against local soil measurements.",
        "unit": "mm",
        "legend": ["0 mm", "50 mm", "100 mm", "175 mm", "250 mm"],
        "palette": ["#f7e7bd", "#d9bd83", "#a5c98a", "#4d9a70", "#175c4a"],
        "min": 0,
        "max": 250,
    },
}

class LayerProcessingError(RuntimeError):
    """Raised when a requested Earth Engine layer cannot be calculated."""


class GEEService:
    def __init__(self, project_id: Optional[str] = None, key_file: Optional[str] = None) -> None:
        self.project_id = project_id or os.getenv("EE_PROJECT") or os.getenv("GEE_PROJECT")
        self.key_file = key_file or os.getenv("GEE_KEY_FILE")
        self.ready = False
        self._init_gee()

    def _init_gee(self) -> None:
        if ee is None:
            return
        try:
            if self.project_id:
                ee.Initialize(project=self.project_id)
            else:
                ee.Initialize()
            self.ready = True
        except Exception:
            self.ready = False

    def check_status(self):
        if not self.ready or ee is None:
            return False, "Earth Engine is not initialized. Check EE_PROJECT and run earthengine authenticate."

        try:
            return True, ee.Number(1).add(1).getInfo()
        except Exception:
            return False, "Earth Engine connection test failed. Check credentials and project permissions."

    def available_layers(self) -> list:
        return [
            {
                "key": key,
                "label": config["label"],
                "description": config["description"],
                "unit": config["unit"],
                "legend": config["legend"],
            }
            for key, config in LAYER_CONFIG.items()
        ]

    def build_field_geometry(self, field: Optional[Dict[str, Any]]):
        if ee is None:
            raise LayerProcessingError("The Earth Engine Python package is not installed.")
        field = field or {}
        geometry = field.get("geometry")
        if isinstance(geometry, dict) and geometry.get("type") == "Feature":
            geometry = geometry.get("geometry")
        if isinstance(geometry, dict) and geometry.get("type") == "Polygon":
            return ee.Geometry(geometry)

        try:
            latitude = float(field.get("lat", -1.94))
            longitude = float(field.get("lng", 30.1))
        except (TypeError, ValueError) as error:
            raise ValueError("Field latitude and longitude must be numeric.") from error
        if (
            not math.isfinite(latitude)
            or not math.isfinite(longitude)
            or not -90 <= latitude <= 90
            or not -180 <= longitude <= 180
        ):
            raise ValueError("Field coordinates are outside the valid latitude/longitude range.")
        return ee.Geometry.Point([longitude, latitude]).buffer(250)

    def _landsat_composite(self, region, start_date: str, end_date: str):
        def prepare_landsat(image):
            qa = image.select("QA_PIXEL")
            clear = qa.bitwiseAnd(63).eq(0).And(image.select("QA_RADSAT").eq(0))
            reflectance = image.select(["SR_B4", "SR_B5", "SR_B6"]).multiply(0.0000275).add(-0.2)
            ndvi = reflectance.normalizedDifference(["SR_B5", "SR_B4"]).rename("ndvi")
            swir = reflectance.select("SR_B6")
            str_index = (
                ee.Image.constant(1)
                .subtract(swir)
                .pow(2)
                .divide(swir.multiply(2))
                .rename("str")
                .updateMask(swir.gt(0))
            )
            temperature = (
                image.select("ST_B10")
                .multiply(0.00341802)
                .add(149.0)
                .subtract(273.15)
                .rename("lst")
            )
            return ndvi.addBands(str_index).addBands(temperature).updateMask(clear)

        landsat8 = (
            ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterDate(start_date, end_date)
            .filterBounds(region)
        )
        landsat9 = (
            ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
            .filterDate(start_date, end_date)
            .filterBounds(region)
        )
        collection = landsat8.merge(landsat9).map(prepare_landsat)
        image_count = int(collection.size().getInfo())
        if image_count == 0:
            raise LayerProcessingError("No Landsat 8/9 scenes cover this field during the selected period.")
        return collection.median(), image_count

    def _relative_index(self, image, band: str, region, scale: int):
        percentiles = (
            image.select(band)
            .reduceRegion(
                reducer=ee.Reducer.percentile([5, 95]),
                geometry=region,
                scale=scale,
                maxPixels=10_000_000,
                bestEffort=True,
            )
            .getInfo()
        )
        lower = percentiles.get(f"{band}_p5")
        upper = percentiles.get(f"{band}_p95")
        if not isinstance(lower, (int, float)) or not isinstance(upper, (int, float)) or upper <= lower:
            raise LayerProcessingError(f"Not enough valid {band.upper()} pixels to calculate a local relative index.")
        return (
            ee.Image.constant(upper)
            .subtract(image.select(band))
            .divide(upper - lower)
            .clamp(0, 1)
            .rename("value")
        )

    def _pawc_image(self):
        sand = ee.Image("OpenLandMap/SOL/SOL_SAND-WFRACTION_USDA-3A1A1A_M/v02")
        clay = ee.Image("OpenLandMap/SOL/SOL_CLAY-WFRACTION_USDA-3A1A1A_M/v02")
        organic_carbon = ee.Image("OpenLandMap/SOL/SOL_ORGANIC-CARBON_USDA-6A1C_M/v02")
        capacity = ee.Image.constant(0)

        for band, thickness_mm in (("b0", 100), ("b10", 200), ("b30", 300), ("b60", 400)):
            sand_fraction = sand.select(band).divide(100)
            clay_fraction = clay.select(band).divide(100)
            organic_matter_fraction = organic_carbon.select(band).multiply(0.00862)

            wilted_raw = (
                sand_fraction.multiply(-0.024)
                .add(clay_fraction.multiply(0.487))
                .add(organic_matter_fraction.multiply(0.006))
                .add(sand_fraction.multiply(organic_matter_fraction).multiply(0.005))
                .subtract(clay_fraction.multiply(organic_matter_fraction).multiply(0.013))
                .add(clay_fraction.multiply(sand_fraction).multiply(0.068))
                .add(0.031)
            )
            wilting_point = wilted_raw.add(wilted_raw.multiply(0.14)).subtract(0.02)

            field_capacity_raw = (
                sand_fraction.multiply(-0.251)
                .add(clay_fraction.multiply(0.195))
                .add(organic_matter_fraction.multiply(0.011))
                .add(sand_fraction.multiply(organic_matter_fraction).multiply(0.006))
                .subtract(clay_fraction.multiply(organic_matter_fraction).multiply(0.027))
                .add(clay_fraction.multiply(sand_fraction).multiply(0.452))
                .add(0.299)
            )
            field_capacity = (
                field_capacity_raw
                .add(field_capacity_raw.pow(2).multiply(1.283))
                .subtract(field_capacity_raw.multiply(0.374))
                .subtract(0.015)
            )
            layer_capacity = field_capacity.subtract(wilting_point).max(0).multiply(thickness_mm)
            capacity = capacity.add(layer_capacity)

        return capacity.rename("value")

    def _calculate_image(self, layer_key: str, field_geometry, percentile_region, start_date: str, end_date: str):
        date_range = f"{start_date} to {end_date}"
        if layer_key == "pawc":
            return self._pawc_image(), 250, "OpenLandMap v02 soil layers and Saxton–Rawls pedotransfer estimate", None

        if layer_key == "sar":
            collection = (
                ee.ImageCollection("COPERNICUS/S1_GRD")
                .filterDate(start_date, end_date)
                .filterBounds(field_geometry)
                .filter(ee.Filter.eq("instrumentMode", "IW"))
                .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
            )
            image_count = int(collection.size().getInfo())
            if image_count == 0:
                raise LayerProcessingError("No Sentinel-1 VV scenes cover this field during the selected period.")
            image = collection.select("VV").median().rename("value")
            return image, 10, "Copernicus Sentinel-1 GRD, VV polarization", date_range

        landsat, image_count = self._landsat_composite(percentile_region, start_date, end_date)
        if layer_key == "totram":
            image = self._relative_index(landsat, "lst", percentile_region, 30)
            source = f"Landsat 8/9 Collection 2 Level 2 ({image_count} scenes), local thermal proxy"
        else:
            vegetation_mask = landsat.select("ndvi").gt(0)
            optical_image = landsat.updateMask(vegetation_mask)
            image = self._relative_index(optical_image, "str", percentile_region, 30)
            source = f"Landsat 8/9 Collection 2 Level 2 ({image_count} scenes), local NDVI/SWIR proxy"
        return image, 30, source, date_range

    def _reduce_stats(self, image, region, scale: int) -> Dict[str, Optional[float]]:
        reducer = (
            ee.Reducer.mean()
            .combine(ee.Reducer.min(), sharedInputs=True)
            .combine(ee.Reducer.max(), sharedInputs=True)
            .combine(ee.Reducer.stdDev(), sharedInputs=True)
        )
        values = image.rename("value").reduceRegion(
            reducer=reducer,
            geometry=region,
            scale=scale,
            maxPixels=10_000_000,
            bestEffort=True,
        ).getInfo()
        mean = values.get("value_mean")
        if not isinstance(mean, (int, float)):
            raise LayerProcessingError("The selected field has no valid pixels for this layer.")
        return {
            "mean": round(float(mean), 4),
            "min": round(float(values["value_min"]), 4) if isinstance(values.get("value_min"), (int, float)) else None,
            "max": round(float(values["value_max"]), 4) if isinstance(values.get("value_max"), (int, float)) else None,
            "std_dev": round(float(values["value_stdDev"]), 4) if isinstance(values.get("value_stdDev"), (int, float)) else None,
        }

    def _fallback_layer(self, layer_key: str, field: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        config = LAYER_CONFIG[layer_key]
        latitude = float((field or {}).get("lat", -1.94))
        longitude = float((field or {}).get("lng", 30.1))
        seed = abs(int((latitude + 90) * 10000 + (longitude + 180) * 1000 + sum(ord(ch) for ch in str((field or {}).get("name", "field")))))
        offset = (seed % 1000) / 1000.0

        if layer_key == "sar":
            mean = -15.0 - 7.0 * offset
            spread = 4.5
        elif layer_key == "totram":
            mean = 0.58 + 0.22 * offset
            spread = 0.12
        elif layer_key == "optram":
            mean = 0.62 + 0.18 * offset
            spread = 0.11
        else:
            mean = 110.0 + 80.0 * offset
            spread = 26.0

        stats = {
            "mean": round(mean, 4),
            "min": round(max(mean - spread * 1.6, config["min"] if layer_key == "sar" else 0), 4),
            "max": round(min(mean + spread * 1.6, config["max"]), 4),
            "std_dev": round(spread, 4),
        }
        if layer_key == "pawc":
            stats["min"] = round(max(mean - spread * 1.2, 0), 4)
            stats["max"] = round(min(mean + spread * 1.2, config["max"]), 4)

        return {
            "key": layer_key,
            "label": config["label"],
            "description": f"{config['description']} Demo fallback data is shown because Earth Engine is not initialized.",
            "unit": config["unit"],
            "source": "Demo fallback (Earth Engine unavailable)",
            "date_range": "Demo period",
            "stats": stats,
            "legend": config["legend"],
            "tile_url": None,
        }

    def get_layer(self, layer_key: str, field: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if layer_key not in LAYER_CONFIG:
            raise KeyError(f"Unsupported layer: {layer_key}")
        if not self.ready or ee is None:
            return self._fallback_layer(layer_key, field)

        try:
            config = LAYER_CONFIG[layer_key]
            region = self.build_field_geometry(field)
            percentile_region = region.buffer(5000)
            end = date.today()
            start = end - timedelta(days=365)
            start_date = start.isoformat()
            end_date = end.isoformat()
            image, scale, source, date_range = self._calculate_image(
                layer_key,
                region,
                percentile_region,
                start_date,
                end_date,
            )
            stats = self._reduce_stats(image, region, scale)
            map_id = image.clip(region).getMapId(
                {
                    "min": config["min"],
                    "max": config["max"],
                    "palette": config["palette"],
                }
            )
            return {
                "key": layer_key,
                "label": config["label"],
                "description": config["description"],
                "unit": config["unit"],
                "source": source,
                "date_range": date_range,
                "stats": stats,
                "legend": config["legend"],
                "tile_url": map_id["tile_fetcher"].url_format,
            }
        except (KeyError, ValueError, LayerProcessingError):
            raise
        except Exception as error:
            raise LayerProcessingError(f"Earth Engine could not calculate the {layer_key.upper()} layer.") from error


service = GEEService()
