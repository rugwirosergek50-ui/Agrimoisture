demo video


# 🌱 AgriMoisture

**Soil-water monitoring and agricultural decision support for farmers in Eastern Rwanda.**

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Flask](https://img.shields.io/badge/Flask-backend-lightgrey)
![Google Earth Engine](https://img.shields.io/badge/Google%20Earth%20Engine-geospatial-green)
![Status](https://img.shields.io/badge/status-prototype-orange)

🌐 **Live demo:** https://agrimoisture.onrender.com/
** video demo: ** https://drive.google.com/file/d/1k87v1qQ4YNRaxq4NZAspc4U87KoYe9cE/view?usp=sharing

---

## 📑 Table of Contents

**For everyone**
- [About](#about)
- [Key Features](#key-features)
- [👩🏾‍🌾 Farmer's Guide: How to Use AgriMoisture](#-farmers-guide-how-to-use-agrimoisture)
- [Important Limitations](#important-limitations)

**For developers**
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints-selection)
- [Security Note](#-security-note)
- [Contributing](#contributing) · [License](#license) · [Acknowledgments](#acknowledgments)

---

## About

AgriMoisture is a browser-based soil-water monitoring and decision-support prototype for Rwanda (Kayonza is used in the documented examples). Users register a farm as a point or a drawn field boundary, then view satellite-derived indicators and soil-property estimates for that field. The app also offers general crop-planning guidance and lets users record ground observations that can later be compared with the map estimates.

**Target users:** smallholder farmers, agricultural extension workers, and researchers working on soil moisture and water management in Rwanda.

> [!IMPORTANT]
> AgriMoisture supports decision-making. It does **not** replace direct soil inspection, local weather information, an official planting calendar, or advice from agricultural extension officers.

---

## Key Features

- **Field registration**: register a field as a point (lat/long) or draw a polygon on the map. The app computes vertex count, area (ha) and centroid.
- **Interactive soil-water maps**: four selectable layers per field, powered by Google Earth Engine:
  - **Sentinel-1 SAR**: VV radar backscatter (dB), an indirect signal of surface conditions
  - **TOTRAM**: relative thermal proxy based on Landsat land-surface temperature
  - **OPTRAM**: relative SWIR/optical proxy, NDVI-filtered
  - **PAWC**: estimated 0–100 cm plant-available water capacity (Saxton–Rawls pedotransfer equations)
- **Layer statistics**: Mean, Min, Max and Std dev for the selected field and layer.
- **Farm Advice & Crops**: general planning checks for Maize, Beans, Banana and Cassava. These are guidance prompts, not suitability rankings or fertilizer prescriptions.
- **Field Verification**: farmers submit ground observations (stored in SQLite) so map estimates can be compared with reality.
- **AI Assistant ("Ask AgriMoisture")**: a floating chat widget powered by Google Gemini that answers general farming questions in English or Kinyarwanda. It has no live field or weather data.
- **Bilingual interface**: English and Kinyarwanda.
- **Overview dashboard**: summary cards, field map and advice shortcuts.

---

# 👩🏾‍🌾 Farmer's Guide: How to Use AgriMoisture

This guide is for **small-scale farmers**, **cooperative members** and **extension workers**. You do not need technical knowledge. A phone with internet and a web browser is enough.

🌐 **Website:** https://agrimoisture.onrender.com/

> [!IMPORTANT]
> AgriMoisture helps you **decide what to check**. It does not tell you exactly when to plant or irrigate. Always look at your soil yourself and confirm important decisions with your local agricultural extension officer.

## 🧭 What can AgriMoisture do for me?

| I want to... | Go to this section |
|---|---|
| See a summary of my farm | **Overview** |
| Add my farm to the website | **Add Field Coordinates** |
| See satellite maps of my field | **Soil Moisture Map** |
| Read planting checks for my crop | **Farm Advice & Crops** |
| Tell the team what I found in my field | **Field Verification** |
| Ask a general farming question | **Ask AgriMoisture** (chat button) |

## 🚀 Quick Start (5 steps)

```
1️⃣ Open the website  →  choose English or Ikinyarwanda
2️⃣ Add your field    →  point or draw its boundary
3️⃣ View the maps     →  look at each layer one at a time
4️⃣ Check your field  →  walk the field and test the soil by hand
5️⃣ Share what you saw →  send your observation in Field Verification
```

## 📍 Step 1: Open the website and choose your language

1. Open your browser (Chrome, Firefox, Safari) and go to **https://agrimoisture.onrender.com/**
2. Use the **language selector** at the top to choose **English** or **Ikinyarwanda**.
3. Use the **menu on the left** to move between sections. On a phone, you may need to scroll or open the menu first.

## 🗺️ Step 2: Add your field

Open **Add Field Coordinates**. You can add your field in two ways.

<details>
<summary><b>Option A: Point (quick, location only)</b></summary>

Use this if you only know one location, such as the centre of your farm.

1. Choose **Point**.
2. Type a **field name**, for example `My maize field`.
3. Enter the **latitude** and **longitude** (decimal degrees).
4. Enter your **district** (for example Kayonza) and **main crop** (for example Maize).
5. Choose the **year and month**.
6. Press **+ Save field**.

> [!NOTE]
> A point shows one location only. It does not show the size or shape of your farm.
> Rwanda lies roughly between **28.8–30.9° E** and **1.0–2.9° S**. If your coordinates look very different, re-check them before saving.

</details>

<details open>
<summary><b>Option B: Draw your field boundary (recommended)</b></summary>

Use this if the shape and size of your field matter.

1. Choose **Polygon**.
2. Choose the **year and month** and type a **field name**.
3. **Tap or click on the map** around the edge of your field. You need at least **3 points**.
4. **Drag the pins** to place them exactly on your field corners. Zoom in for better accuracy.
5. Fix mistakes:
   - **Undo last**: removes the last point
   - **Clear**: starts again
   - Pencil icon: edit a point
   - Bin icon: delete a point
6. Check the **number of points, the area (hectares)** and the **centre point**.
7. Press **+ Save polygon field**.

</details>

> [!WARNING]
> In this prototype, saved fields are kept **temporarily** (browser session and server memory). If the website restarts, you may need to **add your field again**. Write down your field name and coordinates somewhere safe.

## 🛰️ Step 3: Read the Soil Moisture Map

1. Open **Soil Moisture Map**.
2. Select **your field** at the top of the map.
3. On the right, choose **one layer at a time**.
4. Wait while it says **Loading…**
5. Read the **description, legend, date range and statistics** (Mean, Min, Max, Std dev).

### The four layers in simple words

| Layer | In simple words | What it does **not** mean |
|---|---|---|
| 📡 **Sentinel-1 SAR** | A radar picture of the ground surface. Wetter, rougher or more vegetated surfaces can look different. | It is **not** a direct soil-moisture reading. |
| 🌡️ **TOTRAM** | A heat-based picture. Ground temperature can hint at drier or wetter areas. | Not a measured percentage of water. |
| 🌿 **OPTRAM** | A light-based picture using satellite images. Helps show moisture-related patterns in the field. | Clouds, crops and bare soil can affect it. |
| 💧 **PAWC** | How much water your **soil type can hold** for plants. | It does **not** show how wet the soil is **today**. |

### Wet today vs. able to hold water

> [!TIP]
> - **Soil moisture** = how much water is in the soil **now**.
> - **PAWC** = how much water the soil **can store** for plants.
>
> A clay soil may hold a lot of water (high PAWC) but still be dry in a drought. A sandy soil may hold less (low PAWC) but be wet right after rain.

### How to compare the layers

- Look at **each layer separately**. They measure different things, so they can look different.
- Look for **patches within your field** that are different (for example one corner drier than the rest).
- Then **go and check those patches** on the ground.

## 🌽 Step 4: Use Farm Advice & Crops

1. Open **Farm Advice & Crops**.
2. Confirm that the correct **field** is selected.
3. Choose your **crop**: Maize, Beans, Banana or Cassava.
4. Choose what you **see in the soil** (or leave **Not sure / need to check**).
5. Read the **planning checks** on the crop card.

| Crop | Check before and during planting |
|---|---|
| 🌽 **Maize** | Planting window, locally recommended variety, soil moisture and drainage. Watch for weeds, pests and uneven growth. |
| 🫘 **Beans** | Local planting calendar and variety. Avoid waterlogged soil. Watch crop condition as it grows. |
| 🍌 **Banana** | Healthy planting material, good drainage and moisture around plants. Ask extension staff about fertility. |
| 🥔 **Cassava** | Healthy stem cuttings, suitable planting period, soil and drainage checked in several parts of the field. |

> [!NOTE]
> These are **planning checks**, not a ranking of the best crop and not a fertilizer recipe. Confirm planting dates and varieties with your extension officer.

## ✋ Step 5: Check your field yourself (most important!)

Satellite data is only a guide. Walk your field and check in **several places**, not just one.

<details>
<summary><b>Simple hand test for soil moisture</b></summary>

1. Dig **10–15 cm** down with a hoe or small spade.
2. Take a handful of soil from that depth.
3. Squeeze it in your hand.

| What you see | What it usually means |
|---|---|
| Crumbles and feels dusty | **Dry** |
| Holds together lightly and feels cool | **Moist**, usually suitable |
| Water drips out or the soil is sticky and muddy | **Very wet / waterlogged** |

Repeat in the **top, middle and bottom** of the field and in any patches that looked different on the map.

</details>

**Rules of thumb**
- 💦 **Very wet soil:** avoid working in the field and check drainage.
- 🏜️ **Dry soil:** think about crop stage and the water you have, and use water-saving practices that suit your area.
- 📅 **Before planting:** check the soil, the local rainfall forecast and the recommended planting window.

## 📝 Step 6: Share your observation (Field Verification)

Your observations help the project check whether the maps match reality.

1. Open **Field Verification**.
2. Select **your field**.
3. Choose a **feedback type**: Moisture estimate accuracy, Crop advice, Feature request, or Report a problem.
4. Choose what you **found** in the soil (for example *Similar to the map*).
5. Choose your **crop or growth stage** (for example *Not planted*).
6. Add a **rating** (optional) and **comments** about what you saw.
7. Press **Submit feedback**.

> [!NOTE]
> Submitting feedback does **not** change the maps automatically. The project team reviews it later.

## 💬 Step 7: Ask AgriMoisture (AI assistant)

1. Press the **Ask AgriMoisture** button (bottom-right).
2. Tap a quick question (maize checks, cassava checks, soil moisture checks, fertilizer guidance) or **type your own** question.
3. Press **Send**.

**Good questions to ask**
- "What should I check before planting beans?"
- "How can I tell if my soil is waterlogged?"
- "What does PAWC mean?"

**Remember**
- The assistant gives **general information only**.
- It does **not** see your field, satellite data or the weather.
- It does **not** give fertilizer or pesticide amounts. Ask your **extension officer** and consider a **soil test**.
- Your questions are sent to **Google (Gemini)**, so **do not type personal or private information**.

## 🔁 Suggested routine for a farming season

| When | What to do |
|---|---|
| **Before the season** | Register your field boundary. Look at the PAWC layer to understand your soil's water-holding ability. |
| **Before planting** | View the moisture-related layers. Walk the field and do the hand test. Check the local forecast and talk to your extension officer. |
| **During the season** | Check the maps every few weeks. Note any patches that look different and verify them in the field. |
| **After the season** | Submit your observations in Field Verification. |

## 🛠️ Troubleshooting

| Problem | What to try |
|---|---|
| Map says **Loading…** for long | Wait a little, then re-select the field or layer. Try again later. |
| Statistics are blank | The data is not available for that field right now. Do not estimate values. |
| Wrong field is shown | Choose the correct field from the field selector. |
| Field outline looks wrong | Drag the pins, use **Undo last** or **Clear**, then save again. |
| My saved field disappeared | Add it again. Storage is temporary in this prototype. |
| Layers look different from each other | This is normal. They measure different things. |
| Assistant answer is unclear | Treat it as general advice and ask your extension officer. |

## 🤝 Who can help me?

- Your **sector or district agricultural extension officer**
- Your **cooperative leader**
- Local **weather and rainfall services**
- Use **Field Verification** to report problems with the website

<details>
<summary><b>📖 Simple glossary</b></summary>

| Word | Meaning |
|---|---|
| **Field** | A farm area registered on the website |
| **Polygon** | The shape of your field drawn with at least 3 points |
| **Latitude / Longitude** | Numbers that give a location on Earth |
| **Hectare (ha)** | A land area unit (10,000 m²) |
| **Satellite indicator** | Information from satellite images that hints at conditions on the ground |
| **SAR** | Radar from satellites; it can see the ground even through clouds |
| **PAWC** | How much water soil can hold for plants to use |
| **Waterlogged** | Soil so wet that plant roots can be harmed |
| **Extension officer** | A local agricultural adviser |

</details>

---

## Important Limitations

- **Demo values:** the Overview dashboard currently shows synthetic, illustrative values (for example "53%"). They are not live satellite measurements and have no validated confidence score.
- **Indirect indicators:** SAR, TOTRAM and OPTRAM are not direct soil-moisture measurements and need local validation.
- **PAWC is capacity, not wetness:** it describes how much water the soil can hold, not how wet it is now.
- **No weather or rainfall data** is included. Check reliable local forecasts separately.
- **Temporary storage:** registered fields are kept in server memory and are lost on restart.
- **AI assistant:** it has no live field or weather data, questions are sent to Google, and it does not give fertilizer or pesticide doses. Do not enter personal or confidential information.
- Feedback submissions are **not** automatically used to recalibrate models.

---

# 🛠️ For Developers

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| Geospatial processing | Google Earth Engine (Python API) |
| AI assistant | Google Gemini API (`google-genai`) |
| Frontend | HTML5, CSS3, JavaScript (Jinja2 templates) |
| Mapping | Leaflet.js, Esri map tiles |
| Storage | SQLite (feedback), in-memory (registered fields) |
| Hosting | Render |

## Getting Started

### Prerequisites

- Python 3.10 or newer
- A [Google Earth Engine](https://earthengine.google.com/) account and a Cloud project with Earth Engine enabled
- A [Gemini API key](https://aistudio.google.com/) (for the AI assistant)

### Installation

```bash
git clone https://github.com/rugwirosergek50-ui/Agrimoisture.git
cd Agrimoisture
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

Set at least the following in `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_preferred_gemini_model   # optional, a default is used if unset
```

Also set the Google Earth Engine project/credentials variables listed in `.env.example`.

Authenticate with Earth Engine and check the connection:

```bash
earthengine authenticate
python check_gee.py
```

### Run the app

```bash
python app.py
```

Then open http://localhost:5000 in your browser.

## Project Structure

```
Agrimoisture/
│
├── static/            # CSS and JavaScript files
├── templates/         # HTML (Jinja2) templates, e.g. dashboard.html
├── app.py             # Main Flask app: routes, field API, AI assistant endpoint
├── gee_routes.py      # Flask blueprint for Earth Engine map/layer endpoints
├── gee_service.py     # Earth Engine processing (SAR, TOTRAM, OPTRAM, PAWC)
├── feedback.py        # Field Verification feedback blueprint (SQLite)
├── check_gee.py       # Script to verify Earth Engine authentication
├── requirements.txt   # Python dependencies
├── .env.example       # Template for environment variables
└── .gitignore
```

## API Endpoints (selection)

| Endpoint | Method | Description |
|---|---|---|
| `/api/fields` | GET, POST | List or register a field (point or validated polygon) |
| `/api/advice-chat` | POST | Gemini-powered assistant (`query`, `language`: `en` or `rw`) |
| `/api/areas`, `/api/series`, `/api/summary` | GET | Demo dataset for the Overview dashboard |
| `/health` | GET | Health check |

## Contributing

Contributions and suggestions are welcome. Fork the repository, create a feature branch, and open a pull request. Field-validation data and improvements to calibration methods are especially valuable.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details. *(Replace with your chosen license.)*

## Acknowledgments

- **Copernicus Sentinel-1** data (European Union / ESA)
- **Landsat** (USGS/NASA) and **Sentinel-2** (ESA) imagery
- **Google Earth Engine** for planetary-scale geospatial processing
- **Google Gemini** for the AI assistant
- **Leaflet** and **Esri** for mapping and tiles
- Rwandan agricultural extension workers and farmers who provide field feedback
