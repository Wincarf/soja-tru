import { IMAGE_MEAN, IMAGE_SIZE, IMAGE_STD, MODEL_CLASSES, type ModelClass } from "./soja-domain";
import wasmAsset from "@/assets/ort-wasm-simd-threaded.wasm.asset.json";
export type Prediction = { className: ModelClass; confidence: number; classIndex: number };
let sessionPromise: Promise<import("onnxruntime-web").InferenceSession> | null = null;

export async function loadModel() {
  if (!sessionPromise) {
    sessionPromise = import("onnxruntime-web").then(async (ort) => {
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = { wasm: wasmAsset.url, mjs: new URL("/ort/ort-wasm-simd-threaded.mjs", window.location.origin).href };
      return ort.InferenceSession.create("/models/model_soybean.onnx", { executionProviders: ["wasm"] });
    });
  }
  return sessionPromise;
}

function preprocess(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image processing is unavailable");
  const shortest = Math.min(image.naturalWidth, image.naturalHeight);
  const crop = shortest * (224 / 256);
  const sx = (image.naturalWidth - crop) / 2;
  const sy = (image.naturalHeight - crop) / 2;
  context.drawImage(image, sx, sy, crop, crop, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const rgba = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE).data;
  const data = new Float32Array(3 * IMAGE_SIZE * IMAGE_SIZE);
  for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value = (rgba[i * 4 + channel] ?? 0) / 255;
      const mean = IMAGE_MEAN[channel] ?? 0;
      const std = IMAGE_STD[channel] ?? 1;
      data[channel * IMAGE_SIZE * IMAGE_SIZE + i] = (value - mean) / std;
    }
  }
  return data;
}

export async function runInference(image: HTMLImageElement): Promise<Prediction> {
  const [ort, session] = await Promise.all([import("onnxruntime-web"), loadModel()]);
  const tensor = new ort.Tensor("float32", preprocess(image), [1, 3, IMAGE_SIZE, IMAGE_SIZE]);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  if (!inputName || !outputName) throw new Error("Model input is unavailable");
  const output = (await session.run({ [inputName]: tensor }))[outputName];
  if (!output) throw new Error("Model returned no result");
  const logits = Array.from(output.data, Number);
  const maxLogit = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - maxLogit));
  const sum = exps.reduce((total, value) => total + value, 0);
  const probabilities = exps.map((value) => value / sum);
  let classIndex = 0;
  probabilities.forEach((probability, index) => { if (probability > (probabilities[classIndex] ?? 0)) classIndex = index; });
  const className = MODEL_CLASSES[classIndex];
  if (!className) throw new Error("Model returned an unknown class");
  return { classIndex, className, confidence: probabilities[classIndex] ?? 0 };
}
