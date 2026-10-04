import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Camera, Check, ChevronRight, CircleAlert, CloudOff, Database, FileText, Leaf, LoaderCircle, MapPin, Play, Plus, RefreshCw, Scale, ShieldCheck, Sprout, Trash2, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIO_UNKNOWN, calculateFairPrice, CONFIDENCE_THRESHOLD, DISEASES, MODEL_ACCURACY, MODEL_CLASSES, outcomeForConfidence, type ModelClass } from "@/lib/soja-domain";
import { addItem, compressImage, deleteItem, getAll, type CropEntry, type StoredPhoto } from "@/lib/soja-storage";
import type { Prediction } from "@/lib/soja-model";

type View = "diagnosis" | "price" | "log" | "model";
type ModelState = "loading" | "ready" | "error";
type PriceData = { reference_price_rs_saca_60kg: number; source: string; date: string; url: string; discounts: { moisture_base_pct: number; moisture_penalty_per_pct_above_base: number; impurity_base_pct: number; impurity_penalty_per_pct_above_base: number } };
const DEFAULT_PRICE: PriceData = { reference_price_rs_saca_60kg: 159.94, source: "CEPEA/ESALQ-USP — Soybean Indicator (Paranaguá/PR, cash)", date: "2026-10-02", url: "https://www.cepea.org.br/br/indicador/soja.aspx", discounts: { moisture_base_pct: 13, moisture_penalty_per_pct_above_base: 1.5, impurity_base_pct: 1, impurity_penalty_per_pct_above_base: 0.7 } };
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const METRICS = [
  ["Mosaic virus", "1.000", "0.750", "0.857"], ["Southern blight", "0.909", "1.000", "0.952"], ["Sudden death syndrome", "0.944", "1.000", "0.971"], ["Yellow mosaic", "1.000", "1.000", "1.000"], ["Bacterial blight", "0.867", "1.000", "0.929"], ["Brown spot", "1.000", "0.833", "0.909"], ["Soybean rust", "1.000", "1.000", "1.000"], ["Powdery mildew", "1.000", "1.000", "1.000"], ["Septoria", "1.000", "0.750", "0.857"],
];

export function SojaApp() {
  const [view, setView] = useState<View>("diagnosis");
  const [online, setOnline] = useState(true);
  const [modelState, setModelState] = useState<ModelState>("loading");
  const [logs, setLogs] = useState<CropEntry[]>([]);
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const refresh = async () => {
    try { const [nextLogs, nextPhotos] = await Promise.all([getAll<CropEntry>("crop_log"), getAll<StoredPhoto>("stored_photos")]); setLogs(nextLogs.reverse()); setPhotos(nextPhotos.reverse()); } catch { /* storage may be unavailable in private browsing */ }
  };
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off); refresh();
    import("@/lib/soja-model").then(({ loadModel }) => loadModel()).then(() => setModelState("ready")).catch(() => setModelState("error"));
    import("@/lib/register-pwa").then(({ registerPwa }) => registerPwa()).catch(() => undefined);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button className="flex items-center gap-2.5" onClick={() => setView("diagnosis")} aria-label="Soja Tru home">
            <span className="grid size-9 place-items-center rounded-md bg-primary-foreground text-primary"><Sprout className="size-5" /></span>
            <span className="font-display text-xl font-bold">Soja Tru</span>
          </button>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${online ? "bg-success" : "bg-warning"}`} />{online ? "Online" : "Offline"}</span>
            <button onClick={() => setView("log")} className="flex items-center gap-1.5 rounded-md bg-primary-foreground/10 px-2.5 py-1.5" aria-label={`${photos.length} locally stored photos`}><CloudOff className="size-4" />{photos.length}</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
        {view === "diagnosis" && <Diagnosis modelState={modelState} onStored={refresh} />}
        {view === "price" && <FairPrice />}
        {view === "log" && <CropLog logs={logs} photos={photos} onRefresh={refresh} />}
        {view === "model" && <ModelData />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:sticky lg:bottom-0">
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-4 items-stretch px-2">
          <NavButton active={view === "diagnosis"} icon={Leaf} label="Diagnosis" onClick={() => setView("diagnosis")} />
          <NavButton active={view === "price"} icon={Scale} label="Fair price" onClick={() => setView("price")} />
          <NavButton active={view === "log"} icon={BookOpen} label="Crop log" badge={photos.length} onClick={() => setView("log")} />
          <NavButton active={view === "model"} icon={Database} label="Model" onClick={() => setView("model")} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, badge, onClick }: { active: boolean; icon: typeof Leaf; label: string; badge?: number; onClick: () => void }) {
  return <button onClick={onClick} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><span className={`grid size-9 place-items-center rounded-md ${active ? "bg-secondary" : ""}`}><Icon className="size-5" /></span><span>{label}</span>{Boolean(badge) && <span className="absolute right-[24%] top-2 grid size-5 place-items-center rounded-full bg-warning text-[10px] text-warning-foreground">{badge}</span>}</button>;
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-7"><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p><h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p></div>;
}

function Diagnosis({ modelState, onStored }: { modelState: ModelState; onStored: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null); const imageRef = useRef<HTMLImageElement>(null);
  const [preview, setPreview] = useState<string | null>(null); const [file, setFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null); const [analyzing, setAnalyzing] = useState(false); const [error, setError] = useState<string | null>(null); const [locationConsent, setLocationConsent] = useState(false);
  const choose = (selected?: File) => { if (!selected) return; if (!selected.type.startsWith("image/")) { setError("Please choose an image file."); return; } setFile(selected); setPreview(URL.createObjectURL(selected)); setPrediction(null); setError(null); };
  const reset = () => { if (preview) URL.revokeObjectURL(preview); setPreview(null); setFile(null); setPrediction(null); setError(null); if (fileRef.current) fileRef.current.value = ""; };
  const getLocation = async () => {
    if (!locationConsent || !("geolocation" in navigator)) return null;
    try { const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 })); return { lat: position.coords.latitude, lon: position.coords.longitude }; } catch { return null; }
  };
  const analyze = async () => {
    if (!imageRef.current || !file) return; setAnalyzing(true); setError(null);
    try {
      const { runInference } = await import("@/lib/soja-model"); const result = await runInference(imageRef.current); setPrediction(result);
      const uncertain = outcomeForConfidence(result.confidence) === "uncertain";
      new Audio(uncertain ? AUDIO_UNKNOWN : DISEASES[result.className].audio).play().catch(() => undefined);
      if (uncertain) {
        const current = await getAll<StoredPhoto>("stored_photos");
        if (current.length < 20) await addItem("stored_photos", { photo: await compressImage(file), date: new Date().toISOString(), prediction: result.className, confidence: result.confidence, location: await getLocation() });
        await onStored();
      }
    } catch { setError("This photo could not be analyzed. The model may still be loading—please try again."); } finally { setAnalyzing(false); }
  };
  const disease = prediction ? DISEASES[prediction.className] : null; const uncertain = prediction ? outcomeForConfidence(prediction.confidence) === "uncertain" : false;
  return <section>
    <PageTitle eyebrow="Field tool · Works offline" title="Check a soybean leaf" description="Take a clear photo of one leaf. The trained model analyzes it directly on this device." />
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {!preview ? <button onClick={() => fileRef.current?.click()} className="group flex aspect-[4/3] w-full flex-col items-center justify-center bg-canvas px-6 text-center transition-colors hover:bg-secondary">
          <span className="mb-5 grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105"><Camera className="size-9" /></span>
          <span className="font-display text-xl font-bold">Take or choose a photo</span><span className="mt-2 text-sm text-muted-foreground">Fill the frame with one leaf in good light</span>
        </button> : <div><div className="relative aspect-[4/3] bg-canvas"><img ref={imageRef} src={preview} alt="Selected soybean leaf" className="h-full w-full object-contain" /><Button onClick={reset} variant="secondary" size="icon" className="absolute right-3 top-3" aria-label="Remove photo"><X /></Button></div><div className="border-t border-border p-4"><Button className="h-12 w-full text-base" disabled={analyzing || modelState !== "ready"} onClick={analyze}>{analyzing ? <><LoaderCircle className="animate-spin" />Analyzing on this device…</> : <><Leaf />Analyze leaf</>}</Button></div></div>}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => choose(event.target.files?.[0])} />
      </div>
      <div className="space-y-4">
        <div className={`rounded-lg border p-5 ${modelState === "ready" ? "border-success/30 bg-success/10" : modelState === "error" ? "border-destructive/30 bg-destructive/10" : "border-warning/30 bg-warning/10"}`}>
          <div className="flex items-start gap-3">{modelState === "loading" ? <LoaderCircle className="mt-0.5 animate-spin text-warning" /> : modelState === "ready" ? <Check className="mt-0.5 text-success" /> : <CircleAlert className="mt-0.5 text-destructive" />}<div><p className="font-bold">{modelState === "loading" ? "Preparing the model" : modelState === "ready" ? "AI model ready" : "Model unavailable"}</p><p className="mt-1 text-sm text-muted-foreground">{modelState === "ready" ? "MobileNetV3-Small · 9 classes · 5.83 MB" : modelState === "loading" ? "One moment—this only happens once." : "Reconnect and reload to try again."}</p></div></div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4"><input type="checkbox" checked={locationConsent} onChange={(event) => setLocationConsent(event.target.checked)} className="mt-1 size-4 accent-primary" /><span><span className="block text-sm font-bold">Add location to uncertain photos</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Optional. Location and photos remain only on this device.</span></span></label>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
        {prediction && <div className={`rounded-lg border p-5 ${uncertain ? "border-warning bg-warning/10" : "border-success bg-success/10"}`}>
          <div className="mb-4 flex items-center gap-3"><span className={`grid size-11 place-items-center rounded-full ${uncertain ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}`}>{uncertain ? <CircleAlert /> : <Leaf />}</span><div><p className="text-xs font-bold uppercase text-muted-foreground">AI suggestion</p><h2 className="font-display text-2xl font-bold">{uncertain ? "I'm not sure" : disease?.label}</h2></div></div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-border"><div className={`h-full ${uncertain ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.round(prediction.confidence * 100)}%` }} /></div>
          <div className="flex justify-between text-sm"><span>Confidence</span><strong>{Math.round(prediction.confidence * 100)}%</strong></div>
          <p className="mt-4 border-t border-current/15 pt-4 text-sm leading-6">{uncertain ? "The photo was saved locally. Please seek an agronomy technician." : disease?.urgency === "high" ? "Seek an agronomy technician promptly." : "Seek an agronomy technician for confirmation."}</p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => new Audio(uncertain ? AUDIO_UNKNOWN : disease?.audio).play()}><Play />Play original audio</Button>
        </div>}
        <div className="flex items-start gap-3 rounded-lg bg-primary p-4 text-primary-foreground"><ShieldCheck className="mt-0.5 shrink-0" /><div><p className="font-bold">AI suggests; people decide.</p><p className="mt-1 text-xs leading-5 text-primary-foreground/75">No pesticide or dosage recommendation is made. Model test accuracy: {MODEL_ACCURACY}%.</p></div></div>
      </div>
    </div>
  </section>;
}

function FairPrice() {
  const [price, setPrice] = useState(DEFAULT_PRICE); const [moisture, setMoisture] = useState("13"); const [impurity, setImpurity] = useState("1"); const [bags, setBags] = useState("100"); const [offer, setOffer] = useState("155"); const [touched, setTouched] = useState(false);
  useEffect(() => { fetch("/prices.json").then((r) => r.ok ? r.json() : Promise.reject()).then(setPrice).catch(() => undefined); }, []);
  const numbers = { moisture: Number(moisture), impurity: Number(impurity), bags: Number(bags), buyerOffer: Number(offer) };
  const valid = numbers.moisture >= 0 && numbers.moisture <= 40 && numbers.impurity >= 0 && numbers.impurity <= 20 && numbers.bags > 0 && numbers.bags <= 100000 && numbers.buyerOffer >= 0;
  const result = useMemo(() => valid ? calculateFairPrice(numbers, { referencePrice: price.reference_price_rs_saca_60kg, moistureBase: price.discounts.moisture_base_pct, moisturePenalty: price.discounts.moisture_penalty_per_pct_above_base, impurityBase: price.discounts.impurity_base_pct, impurityPenalty: price.discounts.impurity_penalty_per_pct_above_base }) : null, [moisture, impurity, bags, offer, price]);
  return <section><PageTitle eyebrow="Transparent rule · Not AI" title="Is the offer fair?" description="Compare the buyer's offer with the stored CEPEA reference and visible quality discounts." />
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <div className="space-y-4"><div className="rounded-lg bg-primary p-6 text-primary-foreground"><p className="text-xs font-bold uppercase text-primary-foreground/70">Reference per 60 kg bag</p><p className="mt-2 font-display text-4xl font-bold">{BRL.format(price.reference_price_rs_saca_60kg)}</p><p className="mt-4 text-xs leading-5 text-primary-foreground/70">{price.source}<br />Quote date: {DATE.format(new Date(`${price.date}T12:00:00`))}</p></div>
      <div className="rounded-lg border border-border bg-card p-5"><a href={price.url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-sm font-bold text-primary">View CEPEA source <ChevronRight /></a><p className="mt-3 text-xs leading-5 text-muted-foreground">This reference does not include local price differences, freight, negotiation terms, or futures contracts.</p></div></div>
      <div><div className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
        <Field label="Moisture" suffix="%"><Input inputMode="decimal" type="number" min="0" max="40" value={moisture} onChange={(e) => setMoisture(e.target.value)} /></Field>
        <Field label="Impurity" suffix="%"><Input inputMode="decimal" type="number" min="0" max="20" value={impurity} onChange={(e) => setImpurity(e.target.value)} /></Field>
        <Field label="Quantity" suffix="bags"><Input inputMode="numeric" type="number" min="1" max="100000" value={bags} onChange={(e) => setBags(e.target.value)} /></Field>
        <Field label="Buyer offer" suffix="R$/bag"><Input inputMode="decimal" type="number" min="0" value={offer} onChange={(e) => setOffer(e.target.value)} /></Field>
        <Button className="h-11 sm:col-span-2" onClick={() => setTouched(true)} disabled={!valid}><Scale />Compare offer</Button>
        {!valid && <p className="text-sm text-destructive sm:col-span-2">Enter realistic positive values. Moisture must be at most 40% and impurity at most 20%.</p>}
      </div>
      {touched && result && <div className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-3"><Result label="Fair price" value={BRL.format(result.fairPerBag)} /><Result label="Expected total" value={BRL.format(result.expectedTotal)} /><Result label="Offered total" value={BRL.format(result.offeredTotal)} /></div><div className={`mt-5 rounded-md p-4 ${result.difference >= 0 ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"}`}><strong>{result.difference >= 0 ? "Fair offer" : "Below reference"}</strong><p className="mt-1 text-sm">Difference: {BRL.format(Math.abs(result.difference))} {result.difference >= 0 ? "above" : "below"} the expected total.</p></div><div className="mt-4 space-y-2 text-xs text-muted-foreground"><p className="flex justify-between"><span>Moisture discount</span><span>− {BRL.format(result.moistureDiscount)}/bag</span></p><p className="flex justify-between"><span>Impurity discount</span><span>− {BRL.format(result.impurityDiscount)}/bag</span></p></div></div>}</div>
    </div></section>;
}
function Field({ label, suffix, children }: { label: string; suffix: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 flex justify-between text-sm font-bold"><span>{label}</span><span className="font-normal text-muted-foreground">{suffix}</span></span>{children}</label>; }
function Result({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-xl font-bold">{value}</p></div>; }

function CropLog({ logs, photos, onRefresh }: { logs: CropEntry[]; photos: StoredPhoto[]; onRefresh: () => Promise<void> }) {
  const [type, setType] = useState("Occurrence"); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [note, setNote] = useState(""); const [open, setOpen] = useState(false);
  const save = async () => { if (!note.trim() || !date) return; await addItem("crop_log", { type, date, note: note.trim() }); setNote(""); setOpen(false); await onRefresh(); };
  const remove = async (store: "crop_log" | "stored_photos", id?: number) => { if (id === undefined) return; await deleteItem(store, id); await onRefresh(); };
  return <section><div className="flex items-start justify-between gap-4"><PageTitle eyebrow="Saved on this device" title="Crop log" description="Keep a simple field history and review photos the model could not identify confidently." /><Button size="icon" className="mt-7 shrink-0 sm:hidden" aria-label="Add entry" onClick={() => setOpen(true)}><Plus /></Button><Button className="mt-7 hidden shrink-0 sm:inline-flex" onClick={() => setOpen(true)}><Plus />Add entry</Button></div>
    {open && <div className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm sm:grid-cols-2"><Field label="Date" suffix=""><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field><div><span className="mb-2 block text-sm font-bold">Type</span><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Planting">Planting</SelectItem><SelectItem value="Input">Input</SelectItem><SelectItem value="Occurrence">Occurrence</SelectItem><SelectItem value="Harvest">Harvest</SelectItem></SelectContent></Select></div><label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Note</span><Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} placeholder="What happened in the field?" /></label><div className="flex gap-2 sm:col-span-2"><Button onClick={save} disabled={!note.trim()}>Save entry</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div></div>}
    <div className="grid gap-8 lg:grid-cols-2"><div><h2 className="mb-4 font-display text-xl font-bold">Field entries <span className="text-muted-foreground">{logs.length}</span></h2>{logs.length === 0 ? <Empty icon={BookOpen} title="No entries yet" text="Planting, inputs and field occurrences will appear here." /> : <div className="space-y-3">{logs.map((entry) => <article key={entry.id} className="rounded-lg border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><span className="rounded-sm bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">{entry.type}</span><p className="mt-3 text-sm leading-6">{entry.note}</p><p className="mt-2 text-xs text-muted-foreground">{DATE.format(new Date(`${entry.date}T12:00:00`))}</p></div><Button size="icon" variant="ghost" onClick={() => remove("crop_log", entry.id)} aria-label="Delete entry"><Trash2 /></Button></div></article>)}</div>}</div>
    <div><h2 className="mb-4 font-display text-xl font-bold">Uncertain photos <span className="text-muted-foreground">{photos.length}</span></h2>{photos.length === 0 ? <Empty icon={CloudOff} title="Queue is empty" text="Photos below 65% confidence are kept here, locally." /> : <div className="space-y-3">{photos.map((photo) => <article key={photo.id} className="flex gap-4 rounded-lg border border-border bg-card p-3"><img src={photo.photo} alt="Uncertain soybean leaf" className="size-20 rounded-md object-cover" /><div className="min-w-0 flex-1"><p className="font-bold">I'm not sure</p><p className="mt-1 text-xs text-muted-foreground">{Math.round(photo.confidence * 100)}% confidence · {DATE.format(new Date(photo.date))}</p>{photo.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />Location saved</p>}<p className="mt-2 text-xs font-semibold text-warning-foreground">Waiting locally—no technician is connected.</p></div><Button size="icon" variant="ghost" onClick={() => remove("stored_photos", photo.id)} aria-label="Delete photo"><Trash2 /></Button></article>)}</div>}</div></div>
    <div className="mt-8 flex items-start gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>Data stays in this browser. Clearing browser data removes it; anyone using this device may be able to see it.</p></div>
  </section>;
}
function Empty({ icon: Icon, title, text }: { icon: typeof Leaf; title: string; text: string }) { return <div className="rounded-lg border border-dashed border-border bg-canvas p-8 text-center"><Icon className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-bold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>; }

function ModelData() { return <section><PageTitle eyebrow="Model & data" title="Built to be inspected" description="The trained vision model makes the leaf suggestion. The price tool uses a separate, deterministic formula." />
  <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4"><Stat value="96.4%" label="Test accuracy" /><Stat value="3.6%" label="Error rate" /><Stat value="9" label="Leaf classes" /><Stat value="65%" label="Fail-safe threshold" /></div>
  <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><div><h2 className="mb-4 font-display text-xl font-bold">Per-class results</h2><div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full text-left text-sm"><thead className="bg-canvas text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Class</th><th className="px-3 py-3">Precision</th><th className="px-3 py-3">Recall</th><th className="px-3 py-3">F1</th></tr></thead><tbody>{METRICS.map((row) => <tr key={row[0]} className="border-t border-border"><td className="px-4 py-3 font-semibold">{row[0]}</td><td className="px-3 py-3">{row[1]}</td><td className="px-3 py-3">{row[2]}</td><td className="px-3 py-3">{row[3]}</td></tr>)}</tbody></table></div></div>
  <div className="space-y-4"><Info title="Vision model" icon={Leaf}>MobileNetV3-Small, 5.83 MB ONNX, ImageNet transfer learning. Trained for 10 epochs on 701 source images; 106 of 110 test images were correct.</Info><Info title="Image dataset" icon={Database}>Soybean Diseased Leaf Dataset (Kaggle). License pending confirmation. Does not cover all field lighting, regions, early symptoms, or mixed infections.</Info><Info title="Price data" icon={Scale}>CEPEA/ESALQ soybean indicator. Does not cover local differences, freight, negotiations, or futures contracts.</Info><Info title="Context sources" icon={FileText}>NASA POWER: regional climate, not microclimate or severe events. Open-Meteo ERA5-Land: no soil type, pH or nutrients. World Bank: global monthly prices, not live local markets.</Info></div></div>
  <div className="mt-8 rounded-lg bg-primary p-5 text-primary-foreground"><p className="font-display text-xl font-bold">Human oversight is part of the system.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-primary-foreground/75">The app returns “I'm not sure” below 65% confidence, stores the occurrence locally, and asks the farmer to seek technical help. It never recommends a product or dosage.</p></div>
</section>; }
function Stat({ value, label }: { value: string; label: string }) { return <div className="bg-card p-5"><p className="font-display text-3xl font-bold text-primary">{value}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p></div>; }
function Info({ title, icon: Icon, children }: { title: string; icon: typeof Leaf; children: React.ReactNode }) { return <article className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-2"><Icon className="size-5 text-primary" /><h3 className="font-bold">{title}</h3></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{children}</p></article>; }
