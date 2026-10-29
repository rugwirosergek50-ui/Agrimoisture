(() => {
  "use strict";

  const areas = [];
  const fields = [{ name: "Kayonza Field", district: "Kayonza", lat: -1.94, lng: 30.1, crop: "Maize", demo: true }];
  let overviewMap;
  let overviewFieldLayer;
  let mainMap;
  let polygonMap;
  let polygonMarkerLayer;
  let polygonShapeLayer;
  let selectedFieldLayer;
  let toastTimer;
  let currentArea = 0;
  let language = "en";
  let selectedLayerKey = "sar";
  let activeLayerOverlay = null;
  let layerRequestId = 0;
  let drawingMode = "point";
  let coordinateFormat = "dec";
  let vertices = [];

  const byId = (id) => document.getElementById(id);
  const translations = {
    "AgriMoisture | Soil-Water Monitoring": "AgriMoisture | Gukurikirana amazi yo mu butaka",
    "Soil-water monitoring": "Gukurikirana amazi yo mu butaka",
    "Select interface language": "Hitamo ururimi",
    "Farmer view": "Uko umuhinzi abibona",
    "Main navigation": "Ibice by'ingenzi",
    "Overview": "Incamake",
    "Add Field Coordinates": "Ongeramo aho umurima uherereye",
    "Soil Moisture Map": "Ikarita y'ubushuhe bw'ubutaka",
    "Farm Advice & Crops": "Inama z'ubuhinzi n'ibihingwa",
    "Farmer Hub": "Urubuga rw'abahinzi",
    "Field Verification": "Kwemeza amakuru y'umurima",
    "Better information. Higher yields.": "Amakuru meza. Umusaruro mwinshi.",
    "A greener Eastern Rwanda.": "Intara y'Iburasirazuba irushijeho kugira ibidukikije byiza.",
    "Soil-water status and practical guidance for your registered fields.": "Imiterere y'amazi yo mu butaka n'inama ngiro ku mirima wandikishije.",
    "Rwanda Fields Overview": "Incamake y'imirima yo mu Rwanda",
    "My registered fields": "Imirima nandikishije",
    "Choose a saved field": "Hitamo umurima wabitswe",
    "No saved fields yet": "Nta murima urabikwa",
    "Add a field to see it here.": "Ongeramo umurima kugira ngo uwubone hano.",
    "Sample field (not registered)": "Umurima w'icyitegererezo (utanditswe)",
    "Map showing the selected field": "Ikarita yerekana umurima wahisemo",
    "Demo dashboard": "Urubuga rw'igerageza",
    "Root-zone soil moisture": "Ubushuhe bw'ubutaka ahari imizi",
    "Loading": "Birimo gutegurwa",
    "Demo": "Igerageza",
    "Saved on server": "Byabitswe kuri seriveri",
    "Saved this session": "Byabitswe muri uru rupapuro",
    "Synthetic model estimate": "Ibarura ry'icyitegererezo",
    "Model confidence": "Icyizere cy'icyitegererezo",
    "Illustrative": "Urugero gusa",
    "No validated confidence score": "Nta gipimo cy'icyizere cyemejwe",
    "Data status": "Imiterere y'amakuru",
    "Sample data": "Amakuru y'icyitegererezo",
    "Not live satellite observations": "Si amakuru ya satelite y'ako kanya",
    "Selected field": "Umurima wahisemo",
    "Eastern Province, Rwanda": "Intara y'Iburasirazuba, Rwanda",
    "Kayonza District": "Akarere ka Kayonza",
    "Field Map / Ishusho y'umurima": "Ikarita y'umurima",
    "Open map layers ↗": "Fungura ibice by'ikarita ↗",
    "Illustrative map of a sample field near Kayonza": "Ikarita y'urugero y'umurima uri hafi ya Kayonza",
    "Use soil and weather information alongside local agronomic advice before making a decision.": "Mbere yo gufata icyemezo, koresha amakuru y'ubutaka n'ikirere hamwe n'inama z'inzobere zo hafi.",
    "Check field conditions": "Reba uko umurima umeze",
    "Look for water stress or waterlogging before planting.": "Mbere yo gutera, reba niba ubutaka bwumye cyane cyangwa bwarengewe n'amazi.",
    "Compare soil layers": "Gereranya amakuru y'ubutaka",
    "SAR, TOTRAM, OPTRAM and PAWC describe different conditions.": "SAR, TOTRAM, OPTRAM na PAWC bigaragaza imiterere itandukanye.",
    "Confirm locally": "Banza ubyemeze aho uri",
    "Use field observations and extension-worker guidance.": "Koresha ibyo wabonye mu murima n'inama z'abajyanama b'ubuhinzi.",
    "Field-based": "Bishingiye ku murima",
    "View crop advice": "Reba inama ku bihingwa",
    "Open Farmer Hub": "Fungura urubuga rw'abahinzi",
    "Soil moisture": "Ubushuhe bw'ubutaka",
    "Illustrative estimate": "Ikigereranyo cy'urugero",
    "Soil water availability": "Amazi ashobora kuboneka mu butaka",
    "Medium": "Hagati",
    "PAWC indicator · sample data": "Ikimenyetso cya PAWC · amakuru y'icyitegererezo",
    "Planting calendar": "Kalendari yo gutera",
    "Check season": "Reba igihembwe",
    "Confirm with local extension guidance": "Banza ubyemeze ku bajyanama b'ubuhinzi bo hafi",
    "Crop suitability": "Ubukwiriye bw'igihingwa",
    "Needs checking": "Birasaba kugenzurwa",
    "Example only; validate for the field": "Urugero gusa; banza ugenzure umurima",
    "Switch between complementary soil-moisture and soil-water layers for each saved field.": "Hinduranya amakuru yuzuzanya y'ubushuhe n'amazi yo mu butaka kuri buri murima wabitswe.",
    "4 data layers": "Amakuru 4",
    "Choose field": "Hitamo umurima",
    "＋ Add field": "＋ Ongeramo umurima",
    "Illustrative map showing the selected sample field": "Ikarita y'urugero yerekana umurima wahisemo",
    "Map Layers / Ubwoko bw'amakuru": "Ibice by'ikarita",
    "Radar-based moisture indicator": "Ikimenyetso cy'ubushuhe gishingiye kuri radar",
    "Optical / thermal moisture approach": "Uburyo bw'ubushuhe bushingiye ku rumuri n'ubushyuhe",
    "NDVI and shortwave-infrared triangle method": "Uburyo bwa mpandeshatu bukoresha NDVI n'imirasire y'ubutuku butagaragara",
    "Soil Water Availability (PAWC)": "Amazi aboneka mu butaka (PAWC)",
    "Plant-available water capacity from soil properties": "Ubushobozi bw'ubutaka bwo kubika amazi akoreshwa n'ibimera",
    "Very low": "Hasi cyane",
    "Low": "Hasi",
    "Moderate": "Hagati",
    "High": "Hejuru",
    "Very high": "Hejuru cyane",
    "Very dry": "Byumye cyane",
    "Dry": "Byumye",
    "Wet": "Birimo amazi",
    "Very wet": "Birimo amazi menshi cyane",
    "Check soil moisture before planting or irrigation.": "Reba ubushuhe bw'ubutaka mbere yo gutera cyangwa kuhira.",
    "Your field may be suitable for planting; verify conditions locally.": "Umurima wawe ushobora kuba ukwiriye guterwamo; banza ugenzure uko umeze aho uri.",
    "Sentinel-1 SAR · illustrative index": "Sentinel-1 SAR · urugero rw'ikimenyetso",
    "TOTRAM · illustrative output": "TOTRAM · ibisubizo by'urugero",
    "OPTRAM · illustrative output": "OPTRAM · ibisubizo by'urugero",
    "PAWC · soil water availability capacity": "PAWC · ubushobozi bw'ubutaka bwo kubika amazi",
    "Radar-based signal can support soil-moisture estimation, but requires preprocessing, calibration and validation.": "Ibimenyetso bya radar bishobora gufasha kugereranya ubushuhe bw'ubutaka, ariko bisaba gutunganywa, kugereranywa no kwemezwa.",
    "A thermal/optical approach needs suitable land-surface temperature and vegetation inputs. Availability depends on the method and datasets.": "Uburyo bushingiye ku bushyuhe n'urumuri bukenera amakuru akwiye y'ubushyuhe bw'ubutaka n'ibimera. Biterwa n'uburyo n'amakuru ahari.",
    "OPTRAM uses vegetation and shortwave-infrared information, commonly NDVI and STR. The output must be calibrated for the study area.": "OPTRAM ikoresha amakuru y'ibimera n'imirasire itagaragara, akenshi NDVI na STR. Ibisubizo bigomba kugereranywa n'iby'ahantu hakorerwa ubushakashatsi.",
    "PAWC is derived from soil water properties over a defined depth. It represents capacity, not current moisture.": "PAWC ibarwa hashingiwe ku miterere y'amazi yo mu butaka ku bujyakuzimu runaka. Yerekana ubushobozi, si ubushuhe buhari ubu.",
    "Example display only. A real map needs processed imagery, a defined date range and field-level validation.": "Iyi ni urugero gusa. Ikarita nyayo ikenera amashusho yatunganyijwe, igihe gisobanutse n'igenzura rikorerwa mu murima.",
    "How to interpret these layers": "Uko wasobanukirwa n'aya makuru",
    "SAR, TOTRAM and OPTRAM estimate moisture using different observations and methods. PAWC describes the soil's capacity to hold plant-available water; it is not a measurement of current moisture.": "SAR, TOTRAM na OPTRAM bigereranya ubushuhe hakoreshejwe uburyo butandukanye. PAWC igaragaza ubushobozi bw'ubutaka bwo kubika amazi akoreshwa n'ibimera; ntigaragaza ubushuhe buhari ubu.",
    "Record field observations to help check model estimates.": "Andika ibyo wabonye mu murima kugira ngo ugenzure ibigereranyo by'icyitegererezo.",
    "Field observations": "Ibyagaragaye mu murima",
    "New field check": "Igenzura rishya ry'umurima",
    "Field": "Umurima",
    "Feedback type": "Ubwoko bw'igitekerezo",
    "Moisture estimate accuracy": "Ukuri kw'ikigereranyo cy'ubushuhe",
    "Crop advice": "Inama ku bihingwa",
    "Feature request": "Igitekerezo cy'ikindi cyakongerwamo",
    "Report a problem": "Menyesha ikibazo",
    "Observed soil condition": "Imiterere y'ubutaka wabonye",
    "Similar to the map": "Bimeze nk'uko biri ku ikarita",
    "Drier than the map": "Byumye kurusha uko biri ku ikarita",
    "Wetter than the map": "Birimo amazi menshi kurusha uko biri ku ikarita",
    "Flooded / waterlogged": "Byarengewe n'amazi",
    "Not sure / not applicable": "Sinzi neza / ntibireba",
    "Crop / growth stage": "Igihingwa / icyiciro cyo gukura",
    "Not planted": "Ntibiraterwa",
    "Recently planted": "Bimaze guterwa vuba",
    "Growing": "Birakura",
    "Near harvest": "Byenda gusarurwa",
    "Rating (optional)": "Amanota (si ngombwa)",
    "No rating": "Nta nota",
    "1 — Poor": "1 — Bibi",
    "2 — Fair": "2 — Biringaniye",
    "3 — Good": "3 — Byiza",
    "4 — Very good": "4 — Byiza cyane",
    "5 — Excellent": "5 — Indashyikirwa",
    "Comments": "Ibisobanuro",
    "Describe what you observed or suggest an improvement...": "Sobanura ibyo wabonye cyangwa utange igitekerezo cy'icyanozwa...",
    "Submit feedback": "Ohereza igitekerezo",
    "Why verify?": "Kuki tugenzura?",
    "Compare estimates with reality": "Gereranya ibigereranyo n'ibyabaye",
    "Record soil conditions observed directly in the field.": "Andika imiterere y'ubutaka wabonye mu murima.",
    "Improve confidence": "Ongera icyizere",
    "Repeated observations help evaluate model performance over time.": "Kugenzura kenshi bifasha gusuzuma imikorere y'icyitegererezo uko igihe kigenda.",
    "Share with an extension worker": "Sangira n'umujyanama w'ubuhinzi",
    "Use notes to support practical decisions and follow-up.": "Koresha ibyo wanditse mu gufata ibyemezo ngiro no gukurikirana umurima.",
    "Feedback is stored in the app's SQLite database. Admin access is required to review submitted comments.": "Ibitekerezo bibikwa muri SQLite y'iyi porogaramu. Umuyobozi ni we ushobora kureba ibitekerezo byoherejwe.",
    "Recent submissions": "Ibitekerezo biherutse koherezwa",
    "Your submission appears here after it is saved. Admin access is required to view the full feedback history.": "Igitekerezo wohereje kigaragara hano kimaze kubikwa. Umuyobozi ni we ushobora kureba amateka yose.",
    "Register a point or draw a field boundary. Point entries are kept in this page session; polygon fields stay in server memory until restart.": "Andika aho umurima uri cyangwa ushushanye imbibi zawo. Aho wanditse habikwa muri uru rupapuro; imbibi zigashyuha muri mudasobwa kugeza yongeye gutangizwa.",
    "Field details": "Amakuru y'umurima",
    "Field geometry type": "Ubwoko bw'imiterere y'umurima",
    "Point": "Akadomo",
    "Polygon": "Imbibi z'umurima",
    "Field name": "Izina ry'umurima",
    "e.g. My maize field": "urugero: umurima wanjye w'ibigori",
    "Latitude (decimal degrees)": "Umurongo wa ruguru n'amajyepfo (impamyabushyuhe)",
    "Longitude (decimal degrees)": "Umurongo w'iburasirazuba n'iburengerazuba (impamyabushyuhe)",
    "District": "Akarere",
    "Main crop": "Igihingwa nyamukuru",
    "Other / not selected": "Ikindi / nticyatoranyijwe",
    "＋ Save field": "＋ Bika umurima",
    "Year": "Umwaka",
    "Month": "Ukwezi",
    "January": "Mutarama",
    "February": "Gashyantare",
    "March": "Werurwe",
    "April": "Mata",
    "May": "Gicurasi",
    "June": "Kamena",
    "July": "Nyakanga",
    "August": "Kanama",
    "September": "Nzeri",
    "October": "Ukwakira",
    "November": "Ugushyingo",
    "December": "Ukuboza",
    "Click the map to add boundary points. Drag pins to adjust them. Add at least three points to define the field.": "Kanda ku ikarita wongereho utudomo tw'imbibi. Kurura utudomo ubihindure. Shyiraho nibura utudomo dutatu.",
    "Click to draw a field boundary": "Kanda ushushanye imbibi z'umurima",
    "Coordinate format": "Uburyo bwo kwandika aho ahantu riherereye",
    "Decimal": "Imibare icagaguye",
    "Deg/Min/Sec": "Impamyabushyuhe/iminota/amasegonda",
    "Polygon vertices": "Utudomo tw'imbibi z'umurima",
    "0 points. Need at least 3.": "Utudomo 0. Hakenewe nibura 3.",
    "Undo last": "Subiza inyuma",
    "Clear": "Siba byose",
    "＋ Save polygon field": "＋ Bika imbibi z'umurima",
    "Rwanda is approximately between 28.8–30.9° E and 1.0–2.9° S. Accurate field boundaries require a polygon or uploaded boundary file.": "U Rwanda ruherereye hafi ya 28.8–30.9° E na 1.0–2.9° S. Kugira ngo imbibi z'umurima zibe nyazo, koresha ishusho y'imbibi cyangwa dosiye yazo.",
    "Saved fields": "Imirima yabitswe",
    "Adding a field here does not retrieve satellite, weather or soil data. This prototype uses sample data only.": "Kongera umurima hano ntibizana amakuru ya satelite, ikirere cyangwa ubutaka. Iyi porogaramu y'igerageza ikoresha amakuru y'icyitegererezo gusa.",
    "Key information for planning and managing your registered field.": "Amakuru y'ingenzi yo gutegura no gucunga umurima wandikishije.",
    "Farmer-friendly summary": "Incamake yoroshye ku bahinzi",
    "Current soil moisture": "Ubushuhe bw'ubutaka buriho ubu",
    "Illustrative estimate. Check field conditions before irrigation or planting.": "Ikigereranyo cy'urugero. Banza urebe uko umurima umeze mbere yo kuhira cyangwa gutera.",
    "PAWC is based on soil properties and indicates water-holding capacity for plants.": "PAWC ishingiye ku miterere y'ubutaka kandi igaragaza amazi ubutaka bushobora kubikira ibimera.",
    "Consider season, soil, seed availability and local advice.": "Reba igihembwe, ubutaka, imbuto zihari n'inama zo hafi.",
    "Satellite information": "Amakuru ya satelite",
    "4 layers": "Amakuru 4",
    "Compare Sentinel-1 SAR, TOTRAM, OPTRAM and PAWC on the map.": "Gereranya Sentinel-1 SAR, TOTRAM, OPTRAM na PAWC ku ikarita.",
    "Open soil map": "Fungura ikarita y'ubutaka",
    "Planting dates vary by crop and season. Confirm current agricultural guidance.": "Igihe cyo gutera kiratandukana bitewe n'igihingwa n'igihembwe. Banza wemeze inama z'ubuhinzi ziheruka.",
    "Your input matters": "Igitekerezo cyawe ni ingenzi",
    "Record soil moisture observations to compare with sample estimates.": "Andika uko ubutaka buteye kugira ngo ubigereranye n'ibigereranyo by'icyitegererezo.",
    "Record observation": "Andika ibyo wabonye",
    "Simple guide / Inama z'ibanze": "Inama z'ibanze",
    "Before planting": "Mbere yo gutera",
    "Check soil moisture, expected rainfall and the recommended planting window.": "Reba ubushuhe bw'ubutaka, imvura iteganyijwe n'igihe cyiza cyo gutera.",
    "When soil is very wet": "Iyo ubutaka burimo amazi menshi",
    "Avoid working waterlogged fields where this could damage soil structure.": "Irinde guhinga mu murima wuzuye amazi niba bishobora kwangiza imiterere y'ubutaka.",
    "When soil is dry": "Iyo ubutaka bwumye",
    "Check crop stage and water availability; use locally appropriate water-saving practices.": "Reba icyiciro igihingwa kigezeho n'amazi ahari; koresha uburyo bwo kubungabunga amazi bukwiye aho uri.",
    "Use local knowledge": "Koresha ubumenyi bwo hafi",
    "Satellite products support decisions; they do not replace field inspection or extension advice.": "Amakuru ya satelite afasha gufata ibyemezo; ntasimbura kugenzura umurima cyangwa inama z'abajyanama b'ubuhinzi.",
    "General crop-planning checks for your selected field. Confirm timing and practices with local agricultural guidance.": "Igenzura rusange ryo gutegura igihingwa ku murima wahisemo. Banza wemeze igihe n'uburyo bukwiye ukoresheje inama z'ubuhinzi zo hafi.",
    "General guidance": "Inama rusange",
    "Ask AgriMoisture": "Baza AgriMoisture",
    "AgriMoisture Assistant": "Umufasha wa AgriMoisture",
    "AI assistance via Google Gemini · Questions are sent to Google": "Umufasha wa Google Gemini · Ibibazo byoherezwa kuri Google",
    "Hello! Ask me for general crop-planning or field-check guidance. I don't have live field or weather data. AI replies are generated by Google Gemini, and your questions are sent to Google.": "Muraho! Baza inama rusange zo gutegura ibihingwa cyangwa kugenzura umurima. Nta makuru y'ako kanya y'umurima cyangwa y'iteganyagihe mfite. Google Gemini ni yo itanga ibisubizo by'ubwenge buhangano, kandi ibibazo byawe byoherezwa kuri Google.",
    "Close assistant": "Funga umufasha",
    "Maize planting checks": "Ibyo kugenzura mbere yo gutera ibigori",
    "Soil moisture checks": "Ibyo kugenzura ku buhehere bw'ubutaka",
    "Fertilizer guidance": "Inama ku ifumbire",
    "Ask a question": "Baza ikibazo",
    "Ask a question...": "Baza ikibazo...",
    "Send": "Ohereza",
    "What should I check before planting maize?": "Ni iki ngomba kugenzura mbere yo gutera ibigori?",
    "How should I check soil moisture?": "Nagenzura nte ubushuhe bw'ubutaka?",
    "Can you recommend fertilizer rates?": "Wampa ingano y'ifumbire ngomba gukoresha?",
    "Unable to send your question. Check your connection and try again.": "Ntibyashobotse kohereza ikibazo cyawe. Reba aho uhurira na internet wongere ugerageze.",
    "Crop to explore": "Hitamo igihingwa ushaka kurebera",
    "Observed soil condition": "Imiterere y'ubutaka wabonye",
    "Not sure / need to check": "Sinzi neza / ndacyakeneye kugenzura",
    "Moist, not waterlogged": "Burimo ubuhehere, butarengewe n'amazi",
    "Very wet / standing water": "Burengewe n'amazi / amazi ahagaze",
    "Next step based on your observation": "Intambwe ikurikira ishingiye ku byo wabonye",
    "Check moisture in the root zone and recent rainfall; confirm water access and crop stage locally before planting or irrigation.": "Genzura ubuhehere aho imizi iri n'imvura iherutse kugwa; mbere yo gutera cyangwa kuhira, banza urebe amazi ahari n'icyiciro igihingwa kigezeho ukoresheje inama zo hafi.",
    "Check for standing water and drainage. Avoid working soil while it is waterlogged; seek local advice if the condition persists.": "Reba niba hari amazi ahagaze n'uko atemba. Irinde guhinga ubutaka bwarengewe n'amazi; saba inama zo hafi niba bikomeje.",
    "Check soil around planting depth and monitor the field as the crop establishes; follow the local crop calendar.": "Reba ubutaka aho imbuto ziterwa kandi ukomeze gukurikirana umurima mu gihe igihingwa gishinze; kurikiza kalendari yo gutera yo hafi.",
    "Inspect soil in several parts of the field and compare with recent local conditions. Do not rely on the map estimate alone.": "Genzura ubutaka ahantu hatandukanye mu murima ugereranye n'uko aho uri haherutse kumera. Ntukishingikirize ku kigereranyo cy'ikarita cyonyine.",
    "Planning focus": "Iby'ingenzi mu igenamigambi",
    "General crop-planning checks; verify local recommendations before acting.": "Igenzura rusange ryo gutegura igihingwa; banza wemeze inama zo hafi mbere yo gufata icyemezo.",
    "This is general planning information, not a crop-suitability score or a fertilizer prescription. Map estimates do not replace field inspection, a local planting calendar, or advice from an agricultural extension worker.": "Aya ni amakuru rusange yo gutegura, si amanota y'ubukwiriye bw'igihingwa cyangwa amabwiriza y'ifumbire. Ibigereranyo by'ikarita ntibisimbura kugenzura umurima, kalendari yo gutera yo hafi, cyangwa inama z'umujyanama w'ubuhinzi.",
    "Planting time": "Igihe cyo gutera",
    "Field conditions": "Imiterere y'umurima",
    "During growth": "Mu gihe igihingwa gikura",
    "Maize": "Ibigori",
    "Beans": "Ibishyimbo",
    "Sorghum": "Amasaka",
    "Rice": "Umuceri",
    "Banana": "Ibitoki",
    "Cassava": "Imyumbati",
    "Planting material": "Ibikoresho byo gutera",
    "Choose healthy, locally recommended stem cuttings and check the planting period with an extension worker.": "Hitamo ibiti byo gutera bizima kandi bisabwa aho uri; ubaze umujyanama w'ubuhinzi igihe cyo kubitera.",
    "Check soil condition and drainage in several parts of the field before planting.": "Mbere yo gutera, genzura imiterere y'ubutaka n'uko amazi atembera ahantu hatandukanye mu murima.",
    "Inspect plants for unusual leaf or stem symptoms and seek local crop-health advice if you notice them.": "Jya ugenzura niba amababi cyangwa ibiti bifite ibimenyetso bidasanzwe; nubibona, saba inama zo hafi ku buzima bw'igihingwa.",
    "Cassava planting checks": "Ibyo kugenzura mbere yo gutera imyumbati",
    "What should I check before planting cassava?": "Ni iki ngomba kugenzura mbere yo gutera imyumbati?",
    "Confirm the current planting window and a locally recommended maize variety with an extension worker.": "Baza umujyanama w'ubuhinzi igihe cyo gutera n'ubwoko bw'ibigori busabwa aho uri.",
    "Check soil moisture and drainage in the field; do not rely on a satellite layer alone.": "Reba ubushuhe bw'ubutaka n'uko amazi atembera mu murima; ntukishingikirize ku makuru ya satelite yonyine.",
    "Inspect regularly for weeds, pests and uneven growth; seek local advice before applying inputs.": "Jya ugenzura ibyatsi bibi, udukoko n'ibihingwa bidakura kimwe; saba inama zo hafi mbere yo gukoresha inyongeramusaruro.",
    "Confirm the local planting calendar and choose a bean variety suited to your area.": "Emeza igihe cyo gutera cyo muri aka karere kandi uhitemo ubwoko bw'ibishyimbo bubereye aho uri.",
    "Check that the field drains well, because prolonged waterlogging can harm beans.": "Reba niba amazi atembera neza mu murima, kuko amazi menshi amara igihe ashobora kwangiza ibishyimbo.",
    "Check crop condition during growth and ask locally before changing fertilizer or pest-control practices.": "Jya ugenzura uko ibishyimbo bimeze bikura, kandi ubanze ubaze aho uri mbere yo guhindura ifumbire cyangwa uburyo bwo kurwanya udukoko.",
    "Ask locally which sorghum variety and planting period fit your field and season.": "Baza aho uri ubwoko bw'amasaka n'igihe cyo kuyatera biberanye n'umurima n'igihembwe.",
    "Check soil moisture and recent field conditions before sowing.": "Reba ubushuhe bw'ubutaka n'uko umurima uherutse kumera mbere yo kubiba.",
    "Inspect for weeds and pests; confirm suitable control methods with local guidance.": "Reba ibyatsi bibi n'udukoko; wemeze uburyo bwo kubirwanya ukoresheje inama zo hafi.",
    "Confirm that your field, water supply and rice variety are suitable for the local production system.": "Emeza niba umurima wawe, amazi ahari n'ubwoko bw'umuceri bikwiriye uburyo bwo guhinga bwo muri aka karere.",
    "Discuss water management and the planting calendar with an agricultural extension worker before planting.": "Mbere yo gutera, ganira n'umujyanama w'ubuhinzi ku micungire y'amazi na kalendari yo gutera.",
    "Check field water conditions regularly and follow locally recommended practices.": "Jya ugenzura uko amazi ameze mu murima kandi ukurikize uburyo busabwa aho uri.",
    "Choose healthy planting material and confirm the locally recommended planting time.": "Hitamo ibikoresho byo gutera bizima kandi wemeze igihe cyo gutera gisabwa aho uri.",
    "Check drainage and keep observing soil moisture around the plants.": "Reba uko amazi atembera kandi ukomeze kugenzura ubushuhe bw'ubutaka bukikije ibitoki.",
    "Ask local extension staff about soil fertility and crop care for your site.": "Baza abajyanama b'ubuhinzi bo hafi iby'uburumbuke bw'ubutaka no kwita ku bihingwa ahantu hawe.",
    "Select a crop to see general checks for planting time, field conditions and crop care.": "Hitamo igihingwa urebe igenzura rusange ku gihe cyo gutera, imiterere y'umurima no kwita ku gihingwa.",
    "Check the locally recommended planting calendar for your crop and district.": "Reba kalendari yo gutera igihingwa cyawe isabwa muri aka karere.",
    "Inspect soil, drainage and water availability directly in your field.": "Rebera mu murima wawe imiterere y'ubutaka, uko amazi atembera n'amazi ahari.",
    "Ask an agricultural extension worker for crop-specific guidance.": "Baza umujyanama w'ubuhinzi inama zijyanye n'igihingwa cyawe.",
    "What should I check?": "Ni iki ngomba kugenzura?",
    "Browse crop guides": "Reba inama ku bihingwa",
    "Compare general field checks. These are not crop suitability rankings.": "Gereranya igenzura rusange ry'imirima. Izi si nzego zerekana ubukwiriye bw'ibihingwa.",
    "Crop guide layout": "Uburyo bwo kwerekana inama ku bihingwa",
    "Cards": "Amakarita",
    "Table": "Imbonerahamwe",
    "Planning check 1": "Igenzura rya mbere",
    "Planning check 2": "Igenzura rya kabiri",
    "Planning check 3": "Igenzura rya gatatu",
    "Compare map layers carefully": "Gereranya amakuru y'ikarita witonze",
    "Look for patterns, but remember that the layers use different methods and are not direct field measurements.": "Reba imiterere y'amakuru, ariko uzirikane ko ibice by'ikarita bikoresha uburyo butandukanye kandi atari ibipimo byo mu murima by'ako kanya.",
    "Using map information": "Uko wakoresha amakuru y'ikarita",
    "Check what each layer measures": "Reba icyo buri gice gipima",
    "SAR and optical layers are indicators; they are not direct measurements of soil moisture.": "Ibice bya SAR n'iby'urumuri ni ibimenyetso; si ibipimo by'ako kanya by'ubushuhe bw'ubutaka.",
    "Read PAWC as soil capacity": "Sobanukirwa PAWC nk'ubushobozi bw'ubutaka",
    "PAWC estimates how much plant-available water soil can hold, not how wet it is today.": "PAWC igereranya amazi ubutaka bushobora kubikira ibimera, ntigaragaza uko ubutaka butose uyu munsi.",
    "Verify conditions in the field": "Genzura imiterere mu murima",
    "Compare map patterns with your soil, crop stage and recent local conditions.": "Gereranya uko ikarita imeze n'ubutaka bwawe, icyiciro cy'igihingwa n'uko aho uri hameze vuba aha.",
    "Confirm decisions locally": "Banza wemeze ibyemezo aho uri",
    "Use trusted agricultural guidance for planting dates and input use.": "Koresha inama zizewe z'ubuhinzi ku matariki yo gutera no gukoresha inyongeramusaruro.",
    "Decision support": "Ubufasha mu gufata ibyemezo",
    "Crop recommendations": "Inama ku bihingwa",
    "Illustrative examples — not validated agronomic prescriptions": "Ingero gusa — si amabwiriza y'ubuhinzi yemejwe",
    "Crop": "Igihingwa",
    "Water need": "Amazi akenewe",
    "Suitability": "Ubukwiriye",
    "Suggested action": "Igikorwa gisabwa",
    "Reason to check": "Impamvu yo kugenzura",
    "Potentially suitable": "Gishobora kuba gikwiriye",
    "Low–medium": "Hasi kugeza hagati",
    "Check planting window and seed availability.": "Reba igihe cyo gutera n'imbuto zihari.",
    "Confirm seasonal rainfall and soil fertility.": "Reba imvura y'igihembwe n'uburumbuke bw'ubutaka.",
    "Check drainage and local planting calendar.": "Reba uburyo amazi atembera n'igihe cyo gutera cyo muri aka karere.",
    "Avoid prolonged waterlogging; consider variety.": "Irinde ko umurima umara igihe urengewe n'amazi; hitamo ubwoko bukwiye.",
    "Consider where dry spells are common.": "Reba ahakunze kubaho amapfa.",
    "Confirm local suitability, soil and market needs.": "Reba niba gikwiriye aho uri, ubutaka n'ibikenewe ku isoko.",
    "These example suggestions are not generated from validated field data. A production recommendation engine should use reliable soil, moisture, rainfall, crop-calendar and agronomic datasets.": "Izi nama ni ingero gusa kandi ntizaturutse ku makuru y'umurima yemejwe. Porogaramu itanga inama nyazo ikeneye amakuru yizewe ku butaka, ubushuhe, imvura, igihe cyo gutera n'ubuhinzi.",
    "What should I do today?": "Nakora iki uyu munsi?",
    "Inspect soil conditions": "Genzura uko ubutaka bumeze",
    "Check whether soil is dry, suitably moist or waterlogged.": "Reba niba ubutaka bwumye, burimo amazi akwiye cyangwa bwarengewe n'amazi.",
    "Compare the four map layers": "Gereranya amakuru ane yo ku ikarita",
    "Look for consistent patterns and note where estimates disagree.": "Reba ibisa kandi wandike aho ibigereranyo bitandukaniye.",
    "Plan around the season": "Tegura hakurikijwe igihembwe",
    "Use an official forecast and local planting calendar before sowing.": "Mbere yo kubiba, koresha iteganyagihe ryemewe na kalendari yo gutera yo muri aka karere.",
    "Ask an extension worker if uncertain": "Baza umujyanama w'ubuhinzi niba ushidikanya",
    "Especially before changing irrigation, fertilizer or planting decisions.": "By'umwihariko mbere yo guhindura kuhira, gukoresha ifumbire cyangwa gufata icyemezo cyo gutera.",
    "How recommendations are made": "Uko inama zikorwa",
    "Soil properties": "Imiterere y'ubutaka",
    "Texture and PAWC help describe water-holding capacity.": "Imiterere y'ubutaka na PAWC bifasha gusobanura ubushobozi bwo kubika amazi.",
    "Current conditions": "Imiterere iriho ubu",
    "SAR / optical estimates help track changing moisture conditions.": "Ibigereranyo bya SAR / iby'urumuri bifasha gukurikirana ihinduka ry'ubushuhe.",
    "Crop and season needs": "Ibyo igihingwa n'igihembwe bikenera",
    "Match local crop requirements and planting periods.": "Huza ibyo igihingwa cyo muri aka karere gikenera n'igihe cyo kugiteramo.",
    "Validation": "Kwemeza amakuru",
    "Compare advice with field observations and trusted agronomic guidance.": "Gereranya inama n'ibyo wabonye mu murima n'inama zizewe z'ubuhinzi.",
    "AgriMoisture prototype · Map layers use Earth Engine satellite and soil estimates for the selected field. Relative optical indices and texture-based PAWC need local validation. Crop advice remains illustrative.": "AgriMoisture y'igerageza · Ikarita ikoresha amakuru ya satelite n'ubutaka yo muri Earth Engine ku murima wahisemo. Ibipimo by'urumuri n'ubushobozi bw'ubutaka bwo kubika amazi bikenera kwemezwa aho hantu. Inama ku bihingwa ziracyari iz'urugero.",
    "Map tiles are unavailable. Connect to the internet to view the sample map.": "Amashusho y'ikarita ntaboneka. Huza internet kugira ngo urebe ikarita y'icyitegererezo.",
    "Rotate map 15 degrees counterclockwise": "Zengurutsa ikarita dogere 15 ibumoso",
    "Reset map rotation": "Subiza ikarita uko yari imeze",
    "Rotate map 15 degrees clockwise": "Zengurutsa ikarita dogere 15 iburyo",
    "Kayonza Field": "Umurima wa Kayonza",
    "Illustrative sample boundary": "Imbibi z'urugero",
    "Enter latitude, longitude (decimal degrees):": "Andika umurongo wa ruguru n'amajyepfo, uw'iburasirazuba n'iburengerazuba (impamyabushyuhe):",
    "Enter valid latitude and longitude in decimal degrees.": "Andika neza umurongo wa ruguru n'amajyepfo n'uw'iburasirazuba n'iburengerazuba.",
    "Edit point ": "Hindura akadomo ",
    "Delete point ": "Siba akadomo ",
    "Choose a valid year and month for the field.": "Hitamo umwaka n'ukwezi by'ukuri by'umurima.",
    "Please enter a name and valid decimal-degree coordinates.": "Andika izina n'aho umurima uherereye mu buryo bw'ukuri.",
    "These coordinates look outside the expected Rwanda area. Save anyway?": "Aho hantu hasa n'aho hatari mu Rwanda. Uracyashaka kubika?",
    "Field saved in this page session.": "Umurima wabitswe muri uru rupapuro.",
    "Add at least 3 points to save a polygon.": "Ongeraho nibura utudomo 3 kugira ngo ubike imbibi z'umurima.",
    "Turf.js is unavailable. Check your internet connection and reload before saving a polygon.": "Turf.js ntiboneka. Reba internet wongere ufungure urupapuro mbere yo kubika imbibi.",
    "The boundary is invalid or crosses itself. Adjust the points and try again.": "Imbibi si zo cyangwa ziranyurana. Hindura utudomo wongere ugerageze.",
    "Some points are outside the expected Rwanda area. Save anyway?": "Hari utudomo turi hanze y'akarere k'u Rwanda. Uracyashaka kubika?",
    "Unnamed field": "Umurima utagira izina",
    "Select a valid field before submitting feedback.": "Hitamo umurima nyawo mbere yo kohereza igitekerezo.",
    "Feedback submitted and saved.": "Igitekerezo cyoherejwe kandi kirabitswe.",
    "Unable to load dashboard data": "Ntibyashobotse gutegura amakuru y'urubuga",
    "Unable to update area summary": "Ntibyashobotse kuvugurura incamake y'agace",
    "Unable to save polygon field": "Ntibyashobotse kubika imbibi z'umurima",
    "Unable to submit feedback": "Ntibyashobotse kohereza igitekerezo",
    "Selected layer:": "Igice wahisemo:",
    "Saved ": "Byabitswe: ",
    "Mean": "Averaje",
    "Min": "Hasi",
    "Max": "Hejuru",
    "Std dev": "Itandukaniro",
    "Source": "Inkomoko"
  };
  const englishByKinyarwanda = new Map(
    Object.entries(translations).map(([english, kinyarwanda]) => [kinyarwanda, english])
  );
  const kinyarwandaKeys = Object.keys(translations).sort((first, second) => second.length - first.length);
  const englishKeys = [...englishByKinyarwanda.keys()].sort((first, second) => second.length - first.length);
  const cropGuides = {
    maize: {
      name: "Maize",
      scientific: "Zea mays",
      summary: "General crop-planning checks; verify local recommendations before acting.",
      checks: [
        ["Planting time", "Confirm the current planting window and a locally recommended maize variety with an extension worker."],
        ["Field conditions", "Check soil moisture and drainage in the field; do not rely on a satellite layer alone."],
        ["During growth", "Inspect regularly for weeds, pests and uneven growth; seek local advice before applying inputs."]
      ]
    },
    beans: {
      name: "Beans",
      scientific: "Phaseolus vulgaris",
      summary: "General crop-planning checks; verify local recommendations before acting.",
      checks: [
        ["Planting time", "Confirm the local planting calendar and choose a bean variety suited to your area."],
        ["Field conditions", "Check that the field drains well, because prolonged waterlogging can harm beans."],
        ["During growth", "Check crop condition during growth and ask locally before changing fertilizer or pest-control practices."]
      ]
    },
    sorghum: {
      name: "Sorghum",
      scientific: "Sorghum bicolor",
      summary: "General crop-planning checks; verify local recommendations before acting.",
      checks: [
        ["Planting time", "Ask locally which sorghum variety and planting period fit your field and season."],
        ["Field conditions", "Check soil moisture and recent field conditions before sowing."],
        ["During growth", "Inspect for weeds and pests; confirm suitable control methods with local guidance."]
      ]
    },
    rice: {
      name: "Rice",
      scientific: "Oryza sativa",
      summary: "General crop-planning checks; verify local recommendations before acting.",
      checks: [
        ["Before planting", "Confirm that your field, water supply and rice variety are suitable for the local production system."],
        ["Planting time", "Discuss water management and the planting calendar with an agricultural extension worker before planting."],
        ["During growth", "Check field water conditions regularly and follow locally recommended practices."]
      ]
    },
    banana: {
      name: "Banana",
      scientific: "Musa spp.",
      summary: "General crop-planning checks; verify local recommendations before acting.",
      checks: [
        ["Before planting", "Choose healthy planting material and confirm the locally recommended planting time."],
        ["Field conditions", "Check drainage and keep observing soil moisture around the plants."],
        ["During growth", "Ask local extension staff about soil fertility and crop care for your site."]
      ]
    },
    cassava: {
      name: "Cassava",
      scientific: "Manihot esculenta",
      summary: "General crop-planning checks; verify local recommendations before acting.",
      checks: [
        ["Planting material", "Choose healthy, locally recommended stem cuttings and check the planting period with an extension worker."],
        ["Field conditions", "Check soil condition and drainage in several parts of the field before planting."],
        ["During growth", "Inspect plants for unusual leaf or stem symptoms and seek local crop-health advice if you notice them."]
      ]
    },
    other: {
      name: "Other / not selected",
      scientific: "",
      summary: "Select a crop to see general checks for planting time, field conditions and crop care.",
      checks: [
        ["Planting time", "Check the locally recommended planting calendar for your crop and district."],
        ["Field conditions", "Inspect soil, drainage and water availability directly in your field."],
        ["Before planting", "Ask an agricultural extension worker for crop-specific guidance."]
      ]
    }
  };
  let cropCatalogMode = "cards";
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  try {
    language = window.localStorage.getItem("agrimoisture-language") === "rw" ? "rw" : "en";
  } catch (error) {
    console.warn("Unable to read the saved interface language.", error);
  }

  function translate(value) {
    const dictionary = language === "rw" ? translations : englishByKinyarwanda;
    const exact = dictionary instanceof Map ? dictionary.get(value) : dictionary[value];
    if (exact !== undefined) return exact;
    const keys = language === "rw" ? kinyarwandaKeys : englishKeys;
    const prefix = keys.find((key) => key && value.startsWith(key));
    if (prefix) {
      const prefixTranslation = dictionary instanceof Map ? dictionary.get(prefix) : dictionary[prefix];
      return `${prefixTranslation}${value.slice(prefix.length)}`;
    }
    const decorated = value.match(/^([^\p{L}\p{N}]+)(.+)$/u);
    if (!decorated) return value;
    const translation = dictionary instanceof Map
      ? dictionary.get(decorated[2])
      : dictionary[decorated[2]];
    return translation === undefined ? value : `${decorated[1]}${translation}`;
  }

  function translateMessage(message) {
    return translate(message);
  }

  function formatDistrict(district) {
    return language === "rw" ? `Akarere ka ${district}` : `${district} District`;
  }

  function applyTranslations() {
    document.documentElement.lang = language;
    document.title = translate("AgriMoisture | Soil-Water Monitoring");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      let original = originalText.get(node);
      if (original === undefined) {
        original = node.nodeValue;
        originalText.set(node, original);
      }
      if (node.parentElement?.closest(".crop-scientific")) {
        node.nodeValue = original;
        node = walker.nextNode();
        continue;
      }
      const parts = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
      node.nodeValue = `${parts[1]}${translate(parts[2])}${parts[3]}`;
      node = walker.nextNode();
    }

    document.body.querySelectorAll("[aria-label], [placeholder], [title]").forEach((element) => {
      let originals = originalAttributes.get(element);
      if (!originals) {
        originals = {};
        originalAttributes.set(element, originals);
      }
      ["aria-label", "placeholder", "title"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        if (originals[attribute] === undefined) originals[attribute] = element.getAttribute(attribute);
        element.setAttribute(attribute, translate(originals[attribute]));
      });
    });
    byId("languageSelect").value = language;
  }

  const RWANDA = { minLng: 28.8, maxLng: 30.9, minLat: -2.9, maxLat: -1.0 };
  const layerInfo = {
    sar: {
      title: "Sentinel-1 SAR (VV backscatter)",
      desc: "Median Sentinel-1 VV backscatter for the past year. Backscatter is not a direct soil-moisture measurement.",
      colors: "linear-gradient(90deg,#313695,#74add1,#ffffbf,#fdae61,#a50026)"
    },
    totram: {
      title: "TOTRAM thermal proxy",
      desc: "Landsat land-surface temperature normalized to the local 5th–95th percentile. This is an uncalibrated relative proxy, not a validated TOTRAM moisture retrieval.",
      colors: "linear-gradient(90deg,#a50026,#f46d43,#fee08b,#a6d96a,#1a9850)"
    },
    optram: {
      title: "OPTRAM SWIR proxy",
      desc: "Landsat NDVI and shortwave-infrared transform normalized to local percentiles. This uncalibrated relative proxy is not volumetric soil moisture.",
      colors: "linear-gradient(90deg,#a50026,#fdae61,#ffffbf,#a6d96a,#1a9850)"
    },
    pawc: {
      title: "PAWC (texture-based estimate)",
      desc: "Estimated 0–100 cm plant-available water capacity from OpenLandMap soil texture and organic carbon using Saxton–Rawls equations. Validate against local soil measurements.",
      colors: "linear-gradient(90deg,#f7e7bd,#d9bd83,#a5c98a,#4d9a70,#175c4a)"
    }
  };

  async function loadAvailableLayers() {
    try {
      const response = await fetch("/api/layers");
      if (!response.ok) return;
      const payload = await response.json();
      if (!Array.isArray(payload.layers)) return;
      const layerMap = Object.fromEntries(payload.layers.map((layer) => [layer.key, layer]));
      document.querySelectorAll('input[name="layer"]').forEach((radio) => {
        const layer = layerMap[radio.value];
        if (!layer) return;
        const option = radio.closest(".layer-option");
        const name = option?.querySelector("b");
        const hint = option?.querySelector("small");
        if (name) name.textContent = layer.label;
        if (hint) hint.textContent = layer.description;
      });
    } catch (error) {
      console.warn("Unable to fetch the server layer list.", error);
    }
  }

  function showToast(message) {
    const toast = byId("toast");
    toast.textContent = translateMessage(message);
    toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  function showError(message) {
    const error = byId("error");
    error.textContent = translateMessage(message);
    error.hidden = false;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function renderCropCatalog(mode = cropCatalogMode) {
    cropCatalogMode = mode === "table" ? "table" : "cards";
    const cropEntries = Object.entries(cropGuides).filter(([key]) => key !== "other");
    const catalog = byId("cropCatalog");
    const cardsButton = byId("cropCardsButton");
    const tableButton = byId("cropTableButton");
    cardsButton.classList.toggle("active", cropCatalogMode === "cards");
    tableButton.classList.toggle("active", cropCatalogMode === "table");
    cardsButton.setAttribute("aria-pressed", String(cropCatalogMode === "cards"));
    tableButton.setAttribute("aria-pressed", String(cropCatalogMode === "table"));

    if (cropCatalogMode === "cards") {
      catalog.className = "crop-catalog-grid";
      catalog.innerHTML = cropEntries.map(([, guide]) => `
        <article class="crop-guide-card">
          <div class="crop-guide-card-heading">
            <div>
              <h3>${escapeHtml(guide.name)}</h3>
              <small class="crop-scientific">${escapeHtml(guide.scientific)}</small>
            </div>
            <span class="pill">General guidance</span>
          </div>
          <div class="mini-list">
            ${guide.checks.map(([title, detail]) =>
              `<div class="mini-item"><span class="check" aria-hidden="true">✓</span><div><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></div></div>`
            ).join("")}
          </div>
        </article>`).join("");
    } else {
      catalog.className = "crop-catalog-table-wrap";
      catalog.innerHTML = `
        <table class="crop-catalog-table">
          <thead><tr>
            <th scope="col">Crop</th>
            <th scope="col">Planning check 1</th>
            <th scope="col">Planning check 2</th>
            <th scope="col">Planning check 3</th>
          </tr></thead>
          <tbody>${cropEntries.map(([, guide]) => `
            <tr>
              <th scope="row">${escapeHtml(guide.name)}<small class="crop-scientific">${escapeHtml(guide.scientific)}</small></th>
              ${guide.checks.map(([, detail]) => `<td>${escapeHtml(detail)}</td>`).join("")}
            </tr>`).join("")}
          </tbody>
        </table>`;
    }
    applyTranslations();
  }

  function renderCropAdvice(cropKey) {
    const guide = cropGuides[cropKey] || cropGuides.other;
    byId("adviceCropSelect").value = cropGuides[cropKey] ? cropKey : "other";
    byId("cropAdviceGuide").innerHTML = `
      <div class="crop-guide-heading">
        <div>
          ${guide.scientific ? `<small class="crop-scientific">${escapeHtml(guide.scientific)}</small>` : ""}
          <h2>${escapeHtml(guide.name)}</h2>
          <p>${escapeHtml(guide.summary)}</p>
        </div>
        <span class="pill">Planning focus</span>
      </div>
      <div class="mini-list">
        ${guide.checks.map(([title, detail]) =>
          `<div class="mini-item"><span class="check" aria-hidden="true">✓</span><div><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></div></div>`
        ).join("")}
      </div>`;
    applyTranslations();
  }

  function renderConditionAdvice(conditionKey) {
    const advice = {
      dry: "Check moisture in the root zone and recent rainfall; confirm water access and crop stage locally before planting or irrigation.",
      moist: "Check soil around planting depth and monitor the field as the crop establishes; follow the local crop calendar.",
      wet: "Check for standing water and drainage. Avoid working soil while it is waterlogged; seek local advice if the condition persists.",
      unsure: "Inspect soil in several parts of the field and compare with recent local conditions. Do not rely on the map estimate alone."
    };
    const key = advice[conditionKey] ? conditionKey : "unsure";
    byId("adviceConditionSelect").value = key;
    byId("conditionAdviceText").textContent = advice[key];
    applyTranslations();
  }

  function updateAdviceField(field) {
    byId("adviceFieldName").textContent = field.name;
    byId("adviceFieldDistrict").textContent = formatDistrict(field.district || "Eastern Province");
    const cropKey = String(field.crop || "").trim().toLowerCase();
    renderCropAdvice(cropGuides[cropKey] ? cropKey : "other");
    renderConditionAdvice(byId("adviceConditionSelect").value);
  }

  function appendAdviceChatMessage(text, sender) {
    const message = document.createElement("p");
    message.className = `advice-chat-message ${sender}`;
    message.textContent = text;
    byId("adviceChatLog").appendChild(message);
    byId("adviceChatLog").scrollTop = byId("adviceChatLog").scrollHeight;
  }

  async function sendAdviceChatMessage(query) {
    const question = query.trim();
    if (!question) return;

    const submitButton = byId("adviceChatForm").querySelector('button[type="submit"]');
    submitButton.disabled = true;
    appendAdviceChatMessage(question, "user");
    byId("adviceChatInput").value = "";

    try {
      const response = await fetch("/api/advice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, language })
      });
      const payload = await response.json();
      if (!response.ok) {
        appendAdviceChatMessage(payload.error || translate("Unable to send your question. Check your connection and try again."), "error");
        return;
      }
      if (typeof payload.reply !== "string" || !payload.reply.trim()) {
        throw new Error("The AI assistant returned an invalid response.");
      }
      appendAdviceChatMessage(payload.reply, "bot");
    } catch (error) {
      console.error("Unable to send advice chat question.", error);
      appendAdviceChatMessage(translate("Unable to send your question. Check your connection and try again."), "error");
    } finally {
      submitButton.disabled = false;
      byId("adviceChatInput").focus();
    }
  }

  function setAdviceChatOpen(isOpen) {
    byId("adviceChatPanel").hidden = !isOpen;
    byId("adviceChatToggle").setAttribute("aria-expanded", String(isOpen));
    if (isOpen) byId("adviceChatInput").focus();
  }

  function showView(id) {
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === id));
    document.querySelectorAll(".nav-btn").forEach((button) => button.classList.toggle("active", button.dataset.view === id));
    if (id === "mapview" || id === "overview") {
      window.setTimeout(() => {
        if (mainMap) mainMap.invalidateSize();
        if (overviewMap) overviewMap.invalidateSize();
      }, 100);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setMapLayerOverlay(layerKey) {
    selectedLayerKey = layerKey;
    if (activeLayerOverlay && mainMap) mainMap.removeLayer(activeLayerOverlay);
    activeLayerOverlay = null;
  }

  function initMap(elementId, zoom) {
    if (!window.L) {
      byId(elementId).innerHTML = '<div class="map-fallback">Map tiles are unavailable. Connect to the internet to view the sample map.</div>';
      return null;
    }
    const map = window.L.map(elementId, {
      zoomControl: true,
      rotate: true,
      rotateControl: false
    }).setView([-1.94, 30.1], zoom);
    const esriAttribution = "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";
    const basemaps = {
      Imagery: window.L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: esriAttribution, maxNativeZoom: 18, maxZoom: 20 }
      ),
      Topographic: window.L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        { attribution: esriAttribution, maxNativeZoom: 17, maxZoom: 20 }
      ),
      Streets: window.L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        { attribution: esriAttribution, maxNativeZoom: 18, maxZoom: 20 }
      ),
      OpenStreetMap: window.L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }
      )
    };
    const labels = window.L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: esriAttribution, maxNativeZoom: 18, maxZoom: 20 }
    );
    basemaps.Imagery.addTo(map);
    window.L.control.layers(basemaps, { "Place labels": labels }, {
      position: "topright",
      collapsed: true
    }).addTo(map);
    addRotationControl(map);
    return map;
  }

  function addRotationControl(map) {
    const RotationControl = window.L.Control.extend({
      options: { position: "topleft" },
      onAdd() {
        const container = window.L.DomUtil.create("div", "leaflet-bar leaflet-rotation-control");
        const controls = [
          { label: "Rotate map 15 degrees counterclockwise", text: "↶", bearing: -15 },
          { label: "Reset map rotation", text: "N", bearing: 0 },
          { label: "Rotate map 15 degrees clockwise", text: "↷", bearing: 15 }
        ];

        controls.forEach((control) => {
          const button = window.L.DomUtil.create("button", "leaflet-rotation-button", container);
          button.type = "button";
          button.textContent = control.text;
          button.title = control.label;
          button.setAttribute("aria-label", control.label);
          window.L.DomEvent.on(button, "click", window.L.DomEvent.stop);
          window.L.DomEvent.on(button, "click", () => {
            map.setBearing(control.bearing === 0 ? 0 : map.getBearing() + control.bearing);
          });
        });

        renderCropCatalog();

        window.L.DomEvent.disableClickPropagation(container);
        window.L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });
    new RotationControl().addTo(map);
  }

  function addSampleField(layer, map) {
    if (!layer || !map) return;
    const coords = [
      [-1.947, 30.09], [-1.939, 30.087], [-1.933, 30.094], [-1.927, 30.099],
      [-1.93, 30.107], [-1.938, 30.111], [-1.948, 30.106], [-1.951, 30.098]
    ];
    const polygon = window.L.polygon(coords, {
      color: "#fff", weight: 3, fillColor: "#71c84b", fillOpacity: 0.47
    }).addTo(layer);
    window.L.marker([-1.94, 30.1]).addTo(layer)
      .bindPopup("<b>Kayonza Field</b><br>Illustrative sample boundary");
    map.fitBounds(polygon.getBounds(), { padding: [15, 15] });
  }

  function toDMS(value, isLatitude) {
    const direction = isLatitude ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutesValue = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesValue);
    const seconds = ((minutesValue - minutes) * 60).toFixed(2);
    return `${degrees}° ${minutes}′ ${seconds}″ ${direction}`;
  }

  function formatCoordinate(vertex) {
    return coordinateFormat === "dec"
      ? `${vertex.lat.toFixed(5)}, ${vertex.lng.toFixed(5)}`
      : `${toDMS(vertex.lat, true)}, ${toDMS(vertex.lng, false)}`;
  }

  function drawPolygonShape() {
    if (!polygonMap) return;
    if (polygonShapeLayer) polygonMap.removeLayer(polygonShapeLayer);
    polygonShapeLayer = null;
    if (vertices.length < 2) return;

    const latlngs = vertices.map((vertex) => [vertex.lat, vertex.lng]);
    polygonShapeLayer = vertices.length >= 3
      ? window.L.polygon(latlngs, { color: "#d62828", weight: 2, fillColor: "#d62828", fillOpacity: 0.2 })
      : window.L.polyline(latlngs, { color: "#d62828", weight: 2 });
    polygonShapeLayer.addTo(polygonMap);
  }

  function updatePolygonInfo() {
    const info = byId("poly-info");
    if (vertices.length < 3) {
      info.textContent = language === "rw"
        ? `${vertices.length} utudomo. Hakenewe nibura 3.`
        : `${vertices.length} point(s). Need at least 3.`;
      return;
    }
    if (!window.turf) {
      info.textContent = language === "rw"
        ? `${vertices.length} utudomo. Kubara ubuso ntibishoboka; subira kuri internet wongere ufungure urupapuro kugira ngo ukoreshe Turf.js.`
        : `${vertices.length} vertices. Area calculation is unavailable; reconnect and reload to use Turf.js.`;
      return;
    }

    const ring = vertices.map((vertex) => [vertex.lng, vertex.lat]);
    ring.push(ring[0]);
    const polygon = window.turf.polygon([ring]);
    const areaHectares = window.turf.area(polygon) / 10000;
    const center = window.turf.centroid(polygon).geometry.coordinates;
    const outside = vertices.some((vertex) =>
      vertex.lng < RWANDA.minLng || vertex.lng > RWANDA.maxLng ||
      vertex.lat < RWANDA.minLat || vertex.lat > RWANDA.maxLat
    );
    info.textContent = language === "rw"
      ? `${vertices.length} utudomo · ${areaHectares.toFixed(2)} ha · hagati ${center[1].toFixed(5)}, ${center[0].toFixed(5)}${outside ? " · Hanze y'u Rwanda" : ""}`
      : `${vertices.length} vertices · ${areaHectares.toFixed(2)} ha · centroid ${center[1].toFixed(5)}, ${center[0].toFixed(5)}${outside ? " · Outside Rwanda" : ""}`;
  }

  function renderVertexList() {
    const list = byId("vertex-list");
    list.replaceChildren();
    vertices.forEach((vertex, index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      number.className = "idx";
      number.textContent = String(index + 1);
      const coordinate = document.createElement("span");
      coordinate.className = "coord";
      coordinate.textContent = formatCoordinate(vertex);
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "edit";
      edit.title = `Edit point ${index + 1}`;
      edit.setAttribute("aria-label", `Edit point ${index + 1}`);
      edit.textContent = "✎";
      edit.addEventListener("click", () => editVertex(index));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "del";
      remove.title = `Delete point ${index + 1}`;
      remove.setAttribute("aria-label", `Delete point ${index + 1}`);
      remove.textContent = "✖";
      remove.addEventListener("click", () => {
        vertices.splice(index, 1);
        redrawPolygon();
      });
      item.append(number, coordinate, edit, remove);
      list.appendChild(item);
    });
    updatePolygonInfo();
    applyTranslations();
  }

  function redrawPolygon() {
    if (polygonMarkerLayer) polygonMarkerLayer.clearLayers();
    vertices.forEach((vertex, index) => {
      const marker = window.L.marker([vertex.lat, vertex.lng], { draggable: true }).addTo(polygonMarkerLayer);
      marker.bindTooltip(String(index + 1), {
        permanent: true,
        direction: "top",
        offset: [0, -30],
        className: "vertex-marker-label"
      });
      marker.on("drag", (event) => {
        const point = event.target.getLatLng();
        vertices[index] = { lat: point.lat, lng: point.lng };
        drawPolygonShape();
        renderVertexList();
      });
    });
    drawPolygonShape();
    renderVertexList();
  }

  function editVertex(index) {
    const current = `${vertices[index].lat.toFixed(5)}, ${vertices[index].lng.toFixed(5)}`;
    const input = window.prompt(translate("Enter latitude, longitude (decimal degrees):"), current);
    if (input === null) return;
    const parts = input.split(",").map((part) => Number(part.trim()));
    const [lat, lng] = parts;
    if (parts.length !== 2 || !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast("Enter valid latitude and longitude in decimal degrees.");
      return;
    }
    vertices[index] = { lat, lng };
    redrawPolygon();
  }

  function saveFieldToClient(field) {
    fields.push(field);
    renderFields();
    byId("fieldSelect").value = String(fields.length - 1);
    selectField(fields.length - 1);
    loadLayerDetails(selectedLayerKey);
    showView("mapview");
  }

  function getSelectedFieldPeriod() {
    const year = Number(byId("fieldYear").value);
    const month = Number(byId("fieldMonth").value);
    if (!Number.isInteger(year) || year < 1900 || year > 2100 ||
        !Number.isInteger(month) || month < 1 || month > 12) {
      showToast("Choose a valid year and month for the field.");
      return null;
    }
    return { year, month };
  }

  function renderFields() {
    const fieldSelect = byId("fieldSelect");
    const verifyField = byId("verifyField");
    const selected = fieldSelect.value === "" ? Number.NaN : Number(fieldSelect.value);
    fieldSelect.replaceChildren();
    verifyField.replaceChildren();
    fields.forEach((field, index) => {
      const fieldOption = document.createElement("option");
      fieldOption.value = String(index);
      fieldOption.textContent = field.name;
      fieldSelect.appendChild(fieldOption);
      const verifyOption = document.createElement("option");
      verifyOption.value = String(index);
      verifyOption.textContent = field.name;
      verifyField.appendChild(verifyOption);
    });
    const fallbackField = fields.findIndex((field) => !field.demo);
    const selectedIndex = Number.isInteger(selected) && selected >= 0 && selected < fields.length
      ? selected
      : fallbackField >= 0 ? fallbackField : 0;
    fieldSelect.value = String(selectedIndex);
    const overviewFieldSelect = byId("overviewFieldSelect");
    const savedFields = fields
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => !field.demo);
    overviewFieldSelect.replaceChildren();
    if (savedFields.length) {
      savedFields.forEach(({ field, index }) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${field.name} (${field.district || "Rwanda"})`;
        overviewFieldSelect.appendChild(option);
      });
      overviewFieldSelect.disabled = false;
      if (savedFields.some(({ index }) => index === selectedIndex)) {
        overviewFieldSelect.value = String(selectedIndex);
      } else {
        overviewFieldSelect.selectedIndex = -1;
      }
    } else {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = translate("No saved fields yet");
      overviewFieldSelect.appendChild(option);
      overviewFieldSelect.disabled = true;
    }
    byId("fieldList").innerHTML = fields.map((field) =>
      `<div class="field-row"><div><b>${escapeHtml(field.name)}</b><small>${escapeHtml(formatDistrict(field.district || "Rwanda"))} · ${field.lat.toFixed(4)}, ${field.lng.toFixed(4)}${field.area_ha ? ` · ${field.area_ha} ha` : ""}${Number.isInteger(field.month) && Number.isInteger(field.year) ? ` · ${translate(new Date(field.year, field.month - 1).toLocaleString("en", { month: "long" }))} ${field.year}` : ""}</small></div><span class="pill">${field.demo ? translate("Demo") : field.geometry ? translate("Saved on server") : translate("Saved this session")}</span></div>`
    ).join("");
    applyTranslations();
  }

  function selectField(index) {
    const field = fields[index];
    if (!field) return;
    const isRegisteredField = !field.demo;
    byId("overviewField").textContent = isRegisteredField
      ? field.name
      : translate("Sample field (not registered)");
    const district = field.district || "Kayonza";
    byId("overviewDistrict").textContent = isRegisteredField
      ? formatDistrict(district)
      : translate("Add a field to see it here.");
    byId("locationLabel").textContent = `${district}, Rwanda`;
    byId("fieldSelect").value = String(index);
    if (isRegisteredField) {
      byId("overviewFieldSelect").value = String(index);
    } else if (byId("overviewFieldSelect").options.length) {
      byId("overviewFieldSelect").selectedIndex = -1;
    }
    if (mainMap) {
      if (selectedFieldLayer) selectedFieldLayer.clearLayers();
      if (field.geometry) {
        window.L.geoJSON(field.geometry, {
          style: { color: "#d62828", weight: 3, fillColor: "#d62828", fillOpacity: 0.2 }
        }).addTo(selectedFieldLayer);
      } else {
        window.L.marker([field.lat, field.lng]).addTo(selectedFieldLayer)
          .bindPopup(escapeHtml(field.name));
      }
      mainMap.setView([field.lat, field.lng], 14);
    }
    if (overviewMap && overviewFieldLayer) {
      overviewFieldLayer.clearLayers();
      if (field.demo) {
        addSampleField(overviewFieldLayer, overviewMap);
      } else if (field.geometry) {
        const boundary = window.L.geoJSON(field.geometry, {
          style: { color: "#d62828", weight: 3, fillColor: "#d62828", fillOpacity: 0.2 }
        }).addTo(overviewFieldLayer);
        overviewMap.fitBounds(boundary.getBounds(), { padding: [15, 15] });
      } else {
        window.L.marker([field.lat, field.lng]).addTo(overviewFieldLayer)
          .bindPopup(escapeHtml(field.name));
        overviewMap.setView([field.lat, field.lng], 14);
      }
    }
    const fieldAreaIndex = areas.indexOf(district);
    if (fieldAreaIndex >= 0) currentArea = fieldAreaIndex;
    updateAdviceField(field);
  }

  async function loadSummary(areaIndex) {
    const response = await fetch(`/api/summary?area=${encodeURIComponent(areaIndex)}&depth=1&month=5`);
    if (!response.ok) throw new Error(`Summary request failed (${response.status})`);
    const summary = await response.json();
    const percentage = `${Math.round(summary.consensus_wetness * 100)}%`;
    byId("overviewMoisture").textContent = percentage;
    byId("quickMoisture").textContent = percentage;
    byId("hubMoisture").textContent = percentage;
    const wetness = summary.consensus_wetness;
    const label = wetness < 0.2 ? "Very dry" : wetness < 0.4 ? "Dry" : wetness < 0.6 ? "Moderate" : wetness < 0.8 ? "Wet" : "Very wet";
    byId("moistureLabel").textContent = translate(label);
    byId("overviewRecommendation").textContent = translate(wetness < 0.35
      ? "Check soil moisture before planting or irrigation."
      : "Your field may be suitable for planting; verify conditions locally.");
  }

  function setLayerStatsLoading() {
    byId("layerMean").textContent = "Loading...";
    byId("layerMin").textContent = "Loading...";
    byId("layerMax").textContent = "Loading...";
    byId("layerStd").textContent = "Loading...";
    byId("layerSource").textContent = "Loading...";
  }

  function updateLayerStats(payload, layerKey) {
    const stats = payload && payload.stats ? payload.stats : {};
    const unit = payload && payload.unit ? payload.unit : "index";
    const label = payload && payload.label ? payload.label : (layerInfo[layerKey]?.title || "Layer");
    const source = payload && payload.source ? payload.source : "demo";
    const meanValue = typeof stats.mean === "number" ? stats.mean : null;
    const minValue = typeof stats.min === "number" ? stats.min : null;
    const maxValue = typeof stats.max === "number" ? stats.max : null;
    const stdValue = typeof stats.std_dev === "number" ? stats.std_dev : null;
    byId("layerMean").textContent = meanValue === null ? "—" : `${meanValue.toFixed(3)} ${unit}`;
    byId("layerMin").textContent = minValue === null ? "—" : `${minValue.toFixed(3)} ${unit}`;
    byId("layerMax").textContent = maxValue === null ? "—" : `${maxValue.toFixed(3)} ${unit}`;
    byId("layerStd").textContent = stdValue === null ? "—" : `${stdValue.toFixed(3)} ${unit}`;
    byId("layerSource").textContent = source;
    byId("legendTitle").textContent = label;
    byId("legendTitle").setAttribute("title", label);
    const layer = layerInfo[layerKey] || layerInfo.sar;
    byId("legendBar").style.background = layer.colors;
    const details = [
      payload && payload.description ? payload.description : layer.desc,
      payload && payload.date_range ? `Period: ${payload.date_range}.` : "",
      payload && payload.source ? `Source: ${payload.source}.` : ""
    ].filter(Boolean);
    byId("layerDescription").textContent = details.join(" ");
    if (Array.isArray(payload.legend)) {
      document.querySelectorAll("#mapview .legend-labels span").forEach((labelElement, index) => {
        if (payload.legend[index]) labelElement.textContent = payload.legend[index];
      });
    }

    if (activeLayerOverlay && typeof meanValue === "number") {
      activeLayerOverlay.setOpacity(0.78);
    }
    if (payload && payload.tile_url && mainMap && window.L) {
      activeLayerOverlay = window.L.tileLayer(payload.tile_url, {
        opacity: 0.78,
        maxZoom: 19,
        attribution: "Google Earth Engine"
      }).addTo(mainMap);
    } else if (mainMap && window.L && !payload?.tile_url) {
      if (activeLayerOverlay) {
        activeLayerOverlay.remove();
        activeLayerOverlay = null;
      }
      byId("layerSource").textContent = payload?.source || "Demo fallback";
    }
  }

  async function loadLayerDetails(layerKey) {
    const field = fields[Number(byId("fieldSelect").value)] || fields[0];
    if (!field) return;
    const requestId = ++layerRequestId;
    const layer = layerInfo[layerKey] || layerInfo.sar;
    byId("legendTitle").textContent = layer.title;
    byId("layerDescription").textContent = layer.desc;
    byId("legendBar").style.background = layer.colors;
    setLayerStatsLoading();
    setMapLayerOverlay(layerKey);
    try {
      const response = await fetch(`/api/layer/${encodeURIComponent(layerKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field })
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || `Layer request failed (${response.status})`);
      }
      const payload = await response.json();
      if (requestId !== layerRequestId) return;
      updateLayerStats(payload, layerKey);
    } catch (error) {
      if (requestId !== layerRequestId) return;
      console.warn("Unable to fetch layer details for the map.", error);
      byId("layerDescription").textContent = layer.desc;
      byId("layerMean").textContent = "Unavailable";
      byId("layerMin").textContent = "Unavailable";
      byId("layerMax").textContent = "Unavailable";
      byId("layerStd").textContent = "Unavailable";
      byId("layerSource").textContent = "Error";
      byId("layerDescription").textContent = `${layer.desc} ${error.message}`;
    }
  }

  async function initialize() {
    try {
      const response = await fetch("/api/areas");
      if (!response.ok) throw new Error(`Area request failed (${response.status})`);
      const payload = await response.json();
      areas.push(...payload.areas);
      const fieldsResponse = await fetch("/api/fields");
      if (!fieldsResponse.ok) throw new Error(`Saved fields request failed (${fieldsResponse.status})`);
      const savedFields = await fieldsResponse.json();
      fields.push(...savedFields.map((field) => ({
        ...field,
        district: field.district || "Kayonza",
        crop: field.crop || "Other / not selected",
        demo: false
      })));
      const currentFieldIndex = Number(byId("fieldSelect").value);
      if (savedFields.length && fields[currentFieldIndex]?.demo) {
        byId("fieldSelect").value = String(fields.findIndex((field) => !field.demo));
      }
      currentArea = Math.max(0, areas.indexOf("Kayonza"));
      byId("locationLabel").textContent = `${areas[currentArea]}, Rwanda`;
      renderFields();
      selectField(Number(byId("fieldSelect").value));
      await loadSummary(currentArea);
      await loadAvailableLayers();
      const selectedLayer = document.querySelector('input[name="layer"]:checked');
      if (selectedLayer) {
        setMapLayerOverlay(selectedLayer.value);
        await loadLayerDetails(selectedLayer.value);
      }
      applyTranslations();
    } catch (error) {
      showError(`Unable to load dashboard data: ${error.message}`);
    }
  }

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.go));
  });
  document.querySelector("[data-home]").addEventListener("click", (event) => {
    event.preventDefault();
    showView("overview");
  });

  byId("languageSelect").addEventListener("change", (event) => {
    language = event.target.value === "rw" ? "rw" : "en";
    try {
      window.localStorage.setItem("agrimoisture-language", language);
    } catch (error) {
      console.warn("Unable to save the interface language preference.", error);
    }
    applyTranslations();
    renderFields();
    const selectedField = fields[Number(byId("fieldSelect").value)];
    if (selectedField) {
      byId("overviewDistrict").textContent = formatDistrict(selectedField.district || "Eastern Province");
    }
    const chatWelcome = byId("adviceChatLog").querySelector(".advice-chat-message.bot");
    if (chatWelcome && byId("adviceChatLog").children.length === 1) {
      chatWelcome.textContent = translate("Hello! Ask me for general crop-planning or field-check guidance. I don't have live field or weather data. AI replies are generated by Google Gemini, and your questions are sent to Google.");
    }
    renderVertexList();
    loadSummary(currentArea).catch((error) => {
      showError(`Unable to update area summary: ${error.message}`);
    });
  });

  byId("overviewFieldSelect").addEventListener("change", async (event) => {
    const index = Number(event.target.value);
    if (!Number.isInteger(index) || !fields[index] || fields[index].demo) return;
    selectField(index);
    try {
      await loadSummary(currentArea);
      await loadLayerDetails(selectedLayerKey);
    } catch (error) {
      showError(`Unable to update selected field: ${error.message}`);
    }
  });

  document.querySelectorAll('input[name="layer"]').forEach((radio) => {
    radio.addEventListener("change", async () => {
      document.querySelectorAll(".layer-option").forEach((option) =>
        option.classList.toggle("selected", option.querySelector("input").checked)
      );
      const layer = layerInfo[radio.value];
      byId("legendTitle").textContent = layer.title;
      byId("layerDescription").textContent = layer.desc;
      byId("legendBar").style.background = layer.colors;
      setMapLayerOverlay(radio.value);
      await loadLayerDetails(radio.value);
      applyTranslations();
      showToast(`Selected layer: ${layer.title}`);
    });
  });

  byId("fieldSelect").addEventListener("change", (event) => {
    selectField(Number(event.target.value));
    loadLayerDetails(selectedLayerKey);
  });

  byId("adviceCropSelect").addEventListener("change", (event) => {
    renderCropAdvice(event.target.value);
  });

  byId("cropCardsButton").addEventListener("click", () => renderCropCatalog("cards"));
  byId("cropTableButton").addEventListener("click", () => renderCropCatalog("table"));

  byId("adviceConditionSelect").addEventListener("change", (event) => {
    renderConditionAdvice(event.target.value);
  });

  byId("adviceChatToggle").addEventListener("click", () => {
    setAdviceChatOpen(byId("adviceChatPanel").hidden);
  });
  byId("adviceChatClose").addEventListener("click", () => setAdviceChatOpen(false));
  byId("adviceChatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sendAdviceChatMessage(byId("adviceChatInput").value);
  });
  document.querySelectorAll(".advice-chat-prompts button").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = language === "rw" ? button.dataset.promptRw : button.dataset.promptEn;
      sendAdviceChatMessage(prompt);
    });
  });

  byId("fieldForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const period = getSelectedFieldPeriod();
    if (!period) return;
    const name = byId("fieldName").value.trim();
    const lat = Number(byId("latitude").value);
    const lng = Number(byId("longitude").value);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast("Please enter a name and valid decimal-degree coordinates.");
      return;
    }
    if ((lat > 0 || lng < 28 || lng > 32 || lat < -4) &&
        !window.confirm("These coordinates look outside the expected Rwanda area. Save anyway?")) return;
    saveFieldToClient({
      name, district: byId("district").value, lat, lng,
      crop: byId("fieldCrop").value,
      ...period,
      demo: false
    });
    event.target.reset();
    showToast("Field saved in this page session.");
  });

  document.querySelectorAll(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      drawingMode = button.dataset.mode;
      document.querySelectorAll(".mode-tab").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      byId("point-panel").hidden = drawingMode !== "point";
      byId("polygon-panel").hidden = drawingMode !== "polygon";
      if (polygonMap) {
        polygonMap.getContainer().style.cursor = drawingMode === "polygon" ? "crosshair" : "";
        if (drawingMode === "polygon") window.setTimeout(() => polygonMap.invalidateSize(), 100);
      }
    });
  });

  document.querySelectorAll(".fmt").forEach((button) => {
    button.addEventListener("click", () => {
      coordinateFormat = button.dataset.fmt;
      document.querySelectorAll(".fmt").forEach((formatButton) => {
        const active = formatButton === button;
        formatButton.classList.toggle("active", active);
        formatButton.setAttribute("aria-pressed", String(active));
      });
      renderVertexList();
    });
  });

  byId("poly-undo").addEventListener("click", () => {
    vertices.pop();
    redrawPolygon();
  });
  byId("poly-clear").addEventListener("click", () => {
    vertices = [];
    redrawPolygon();
  });
  byId("poly-save").addEventListener("click", async () => {
    const period = getSelectedFieldPeriod();
    if (!period) return;
    if (vertices.length < 3) {
      showToast("Add at least 3 points to save a polygon.");
      return;
    }
    if (!window.turf) {
      showError("Turf.js is unavailable. Check your internet connection and reload before saving a polygon.");
      return;
    }

    const ring = vertices.map((vertex) => [vertex.lng, vertex.lat]);
    ring.push(ring[0]);
    const geometry = { type: "Polygon", coordinates: [ring] };
    if (window.turf.kinks(window.turf.feature(geometry)).features.length > 0) {
      showToast("The boundary is invalid or crosses itself. Adjust the points and try again.");
      return;
    }
    const outside = vertices.some((vertex) =>
      vertex.lng < RWANDA.minLng || vertex.lng > RWANDA.maxLng ||
      vertex.lat < RWANDA.minLat || vertex.lat > RWANDA.maxLat
    );
    if (outside && !window.confirm("Some points are outside the expected Rwanda area. Save anyway?")) return;

    const name = byId("polygonName").value.trim() || "Unnamed field";
    try {
      const response = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          district: byId("district").value,
          crop: byId("fieldCrop").value,
          ...period,
          geometry
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Polygon save failed (${response.status})`);
      saveFieldToClient({ ...payload, demo: false });
      vertices = [];
      redrawPolygon();
      byId("polygonName").value = "";
      showToast(`Saved ${payload.name} (${payload.area_ha} ha).`);
    } catch (error) {
      showError(`Unable to save polygon field: ${error.message}`);
    }
  });

  byId("verifyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const field = fields[Number(byId("verifyField").value)];
    if (!field) {
      showError("Select a valid field before submitting feedback.");
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const comments = byId("verifyNotes").value.trim();
      const context = [
        `Observed condition: ${byId("soilFeel").selectedOptions[0].textContent}`,
        `Crop stage: ${byId("cropStage").value}`
      ].join(" · ");
      const payload = {
        field_name: field.name,
        latitude: field.lat,
        longitude: field.lng,
        category: byId("feedbackCategory").value,
        ground_match: byId("soilFeel").value,
        rating: byId("feedbackRating").value,
        comments: `${context}\n${comments}`.trim(),
        language
      };
      const response = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Feedback request failed (${response.status})`);

      const container = byId("observations");
      if (container.querySelector(".note")) container.replaceChildren();
      const item = document.createElement("div");
      item.className = "field-row";
      const details = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = `${result.entry.field_name} — ${byId("feedbackCategory").selectedOptions[0].textContent}`;
      const note = document.createElement("small");
      note.textContent = result.entry.comments;
      const status = document.createElement("span");
      status.className = "pill";
      status.textContent = result.entry.status;
      details.append(title, note);
      item.append(details, status);
      container.prepend(item);
      event.target.reset();
      showToast("Feedback submitted and saved.");
    } catch (error) {
      showError(`Unable to submit feedback: ${error.message}`);
    } finally {
      submitButton.disabled = false;
    }
  });

  overviewMap = initMap("overviewMap", 13);
  if (overviewMap) {
    overviewFieldLayer = window.L.layerGroup().addTo(overviewMap);
    addSampleField(overviewFieldLayer, overviewMap);
  }
  mainMap = initMap("mainMap", 13);
  if (mainMap) selectedFieldLayer = window.L.layerGroup().addTo(mainMap);
  polygonMap = initMap("polygonMap", 13);
  if (polygonMap) {
    polygonMarkerLayer = window.L.layerGroup().addTo(polygonMap);
    polygonMap.on("click", (event) => {
      if (drawingMode !== "polygon") return;
      vertices.push({ lat: event.latlng.lat, lng: event.latlng.lng });
      redrawPolygon();
    });
  }
  byId("fieldYear").value = String(new Date().getFullYear());
  byId("fieldMonth").value = String(new Date().getMonth() + 1);
  renderFields();
  applyTranslations();
  initialize();
})();
