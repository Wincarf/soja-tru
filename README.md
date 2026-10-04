# Soja Tru - Soybean Disease Diagnosis PWA

[Link](https://soja-tru.lovable.app/) — https://soja-tru.lovable.app/

## Problem (one sentence)
Because of Soja Tru, a family soybean farmer can **identify a field problem and know if the offered harvest price is fair** *while standing in the field* — something they would otherwise do late or [...]

## User
Family farmer (2-20 ha), basic Android phone, intermittent 3G, spends the day in the field, speaks Portuguese. The logic is replicable to other countries and languages.

## What the AI does (and why SMS/spreadsheet is not enough)
- **Computer vision**: A small image classifier (MobileNetV3-Small, 5.8 MB ONNX) identifies 9 soybean leaf diseases from a photo.
- Diagnosing by text would require the farmer to describe symptoms in words; the photo eliminates that barrier. SMS cannot do image classification.
- The price calculator is rules-based (not AI) — this is intentional for transparency.

## MVP Features
1. **Offline leaf diagnosis by photo** — 9 disease classes with confidence score
2. **Fail-safe "I don't know"** — below 65% confidence, the app says "seek a technician" and stores the photo (store-and-forward)
3. **Audio responses in Portuguese** — pre-recorded MP3s, one per class (user must record these)
4. **Fair price calculator** — CEPEA reference price, moisture/impurity discounts, expected total vs. buyer offer
5. **Minimal crop log** — planting date, inputs, occurrences, saved locally (IndexedDB)

## Guardrails (pass/fail criteria)
- Human decides: the app suggests, never orders pesticide application
- Confidence threshold with "I don't know" as a legitimate response
- No dosage or product recommended — only "seek a technician/agronomist"
- Privacy: photos and location stay on-device; sending requires explicit consent
- If phone is lost or borrowed: all data is in IndexedDB (browser storage). No server-side data. Clearing browser data removes everything.

## Model Performance (Test Set)
- **Overall accuracy: 96.4%** (106/110 correct)
- **Error rate: 3.6%** (4/110 errors)
- **Architecture**: MobileNetV3-Small, transfer learning (ImageNet), classifier head only trained
- **Training**: 10 epochs, batch size 8, Adam optimizer lr=0.002, data augmentation (flips, rotation, color jitter), class-weighted sampling
- **Input**: 224x224 RGB, ImageNet normalization
- **Size**: 5.83 MB (ONNX)

### Per-class results:
| Class | Precision | Recall | F1 | Error Rate |
|-------|-----------|--------|-----|------------|
| Mossaic Virus | 1.000 | 0.750 | 0.857 | 25.0% |
| Southern blight | 0.909 | 1.000 | 0.952 | 0.0% |
| Sudden Death Syndrome | 0.944 | 1.000 | 0.971 | 0.0% |
| Yellow Mosaic | 1.000 | 1.000 | 1.000 | 0.0% |
| Bacterial blight | 0.867 | 1.000 | 0.929 | 0.0% |
| Brown spot | 1.000 | 0.833 | 0.909 | 16.7% |
| Ferrugen (Rust) | 1.000 | 1.000 | 1.000 | 0.0% |
| Powdery mildew | 1.000 | 1.000 | 1.000 | 0.0% |
| Septoria | 1.000 | 0.750 | 0.857 | 25.0% |

### Confidence statistics:
- Mean confidence (correct): 0.940
- Mean confidence (wrong): 0.883
- Min confidence: 0.384
- Threshold: 0.65

## Data Sources

### Image Dataset
| Field | Value |
|-------|-------|
| Name | Soybean Diseased Leaf Dataset |
| Source | Kaggle (soybean-diseased-leaf-dataset) |
| License | See Kaggle dataset page |
| Size | 701 images, 10 classes (9 used, crestamento excluded due to 5 images only) |
| **Does NOT cover** | Field conditions (lighting, angles, backgrounds may differ from real farm photos); geographic diversity of disease strains; early-stage symptoms; mixed infections |

### Price Data (CEPEA)
| Field | Value |
|-------|-------|
| Name | Indicador da Soja CEPEA/ESALQ |
| Source | CEPEA/ESALQ-USP (Paranagua/PR, a vista) |
| License | CC BY-NC 4.0 — attribution required |
| Size | ~90 days daily + historical since 2006 |
| **Does NOT cover** | Local regional price differences; freight costs; specific buyer negotiations; futures contracts |

### Climate Data (NASA POWER)
| Field | Value |
|-------|-------|
| Source | NASA POWER (LARC) — MERRA-2 daily data |
| License | Public domain (NASA) |
| Coverage | Sorriso-MT and Cascavel-PR (two reference municipalities) |
| **Does NOT cover** | Microclimate variations within a farm; real-time weather; frost/hail events |

### Soil Data (Open-Meteo)
| Field | Value |
|-------|-------|
| Source | Open-Meteo Archive (ERA5-Land) |
| License | CC BY 4.0 |
| Coverage | Sorriso-MT and Cascavel-PR |
| **Does NOT cover** | Soil type, pH, nutrient levels; drainage; compaction |

### International Price (World Bank)
| Field | Value |
|-------|-------|
| Source | World Bank Commodity Price Data (Pink Sheet) |
| License | CC BY 4.0 |
| Coverage | Global soybean price, monthly since 1960 |
| **Does NOT cover** | Local market dynamics; currency exchange variations in real-time |

## Stack
- **Training**: PyTorch + torchvision (MobileNetV3-Small), Databricks serverless compute
- **Export**: ONNX (opset 18)
- **App**: PWA built with TanStack Start (React 19, TypeScript, Tailwind CSS v4, Vite 7); IndexedDB for local storage
- **Offline**: service worker generated by vite-plugin-pwa (model, inference runtime, audio and last price cached for offline use)
- **Inference**: ONNX Runtime Web (onnxruntime-web), WASM bundled with the app (no external CDN); preprocessing matches training (resize 256 keeping aspect ratio, center crop 224, ImageNet normalization)
- **Audio**: Pre-recorded MP3s played per class
- **Prices**: JSON file with last CEPEA quotation, updated when signal is available
- **Photos**: compressed on-device before being stored in IndexedDB

## Audio Files (user must record)
Place MP3 files in the `public/audio/` folder:
- `mossaic_virus.mp3` — "Provavel mosaico viral. Procure um tecnico agronomo."
- `southern_blight.mp3` — "Provavel podridao do colo. Procure um tecnico."
- `sudden_death_syndrome.mp3` — "Provavel morte repentina. Procure um tecnico."
- `yellow_mosaic.mp3` — "Provavel mosaico amarelo. Procure um tecnico."
- `bacterial_blight.mp3` — "Provavel crestamento bacteriano. Procure um tecnico."
- `brown_spot.mp3` — "Provavel mancha marrom. Procure um tecnico."
- `ferrugen.mp3` — "Provavel ferrugem da soja. Procure um tecnico com urgencia."
- `powdery_mildew.mp3` — "Provavel oidio. Procure um tecnico."
- `septoria.mp3` — "Provavel septoriose. Procure um tecnico."
- `nao_sei.mp3` — "Nao consegui identificar. Guardei a foto. Procure um tecnico."

## License
This project is licensed under the MIT License.

## How to Run
1. Install dependencies: `bun install` (or `npm install`)
2. The ONNX model is at `public/models/model_soybean.onnx`
3. `prices.json` is at `public/prices.json`
4. Audio files are in `public/audio/`
5. Start the dev server: `bun run dev` (or `npm run dev`); build with `bun run build`
6. Run tests: `bunx vitest run`
7. Open the published app in a mobile browser and add to home screen for offline use

## Next Steps (out of scope for MVP)
- Chatbot/LLM for natural language queries
- Yield prediction
- Farmer registration and profiles
- Integration with rural extension services
- Multi-language support (image classifier is language-agnostic; only audio needs re-recording)
- For less-supported languages: MMS and Common Voice would be starting points for TTS

## Vision on Localizing AI
Localizing is not translating: it means training with regional field leaves, speaking the farmer's language, working without signal, and being clear when the AI doesn't know.
