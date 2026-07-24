import { useRef, useState } from 'react';
import { Leaf, Upload, ImageIcon, X, Info, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { analyzePlantImage } from '../lib/gemini';
interface Analysis {
  status: 'healthy' | 'warning' | 'disease' | 'unknown';
  title: string;
  description: string;
  suggestions: string[];
}

export default function PlantHealthPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setAnalysis(null);
    setUsedFallback(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

async function analyze() {
    if (!image) return;
    setAnalyzing(true);
    setAnalysis(null);
    setUsedFallback(false);

    try {
      const mimeType = image.substring(image.indexOf(":") + 1, image.indexOf(";")) || 'image/jpeg';
      
      const rawResponse = await analyzePlantImage(image, mimeType);
      
      setAnalysis({
        status: 'disease', 
        title: 'AI Analysis Report',
        description: rawResponse,
        suggestions: [
          'Review the organic and chemical remedies provided above.',
          'Monitor changes in leaf spots or wilting daily.',
          'Ask the AI Assistant for more details on these specific symptoms if needed.'
        ],
      });
    } catch (error) {
      console.error("Real AI analysis failed:", error);
      setAnalysis({
        status: 'unknown',
        title: 'Analysis Failed',
        description: 'Could not communicate with Gemini API. Please try again or describe the symptoms to the AI Assistant.',
        suggestions: ['Check your internet connection.', 'Ensure the image is clear.'],
      });
      setUsedFallback(true);
    } finally {
      setAnalyzing(false);
    }
  }
  function reset() {
    setImage(null);
    setFileName('');
    setAnalysis(null);
    setUsedFallback(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Plant Health Checker"
        subtitle="Upload a photo of your plant to check for possible disease."
        icon={Leaf}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <section className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-4">Upload a plant photo</h2>

          {!image ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-3xl border-2 border-dashed border-forest-200 dark:border-forest-700 bg-white/40 dark:bg-forest-900/30 p-8 text-center hover:border-forest-400 transition cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-forest-100 text-forest-600 dark:bg-forest-800/60 dark:text-forest-200 mx-auto mb-4">
                <Upload size={26} />
              </div>
              <p className="font-medium text-forest-800 dark:text-forest-100">Click to upload or drag & drop</p>
              <p className="text-sm text-forest-500 dark:text-forest-400 mt-1">PNG, JPG up to ~5MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div>
              <div className="relative rounded-3xl overflow-hidden border border-forest-100 dark:border-forest-800/60">
                <img src={image} alt="Plant preview" className="w-full h-64 object-cover" />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-xl bg-forest-950/60 text-white hover:bg-forest-950/80 transition"
                  aria-label="Remove image"
                >
                  <X size={18} />
                </button>
                {fileName && (
                  <div className="absolute bottom-0 inset-x-0 bg-forest-950/60 text-white text-xs px-4 py-2 truncate flex items-center gap-2">
                    <ImageIcon size={13} /> {fileName}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={analyze} disabled={analyzing} className="btn-primary flex-1">
                  {analyzing ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</>
                  ) : (
                    <><Sparkles size={18} /> Analyze plant</>
                  )}
                </button>
                <button onClick={reset} className="btn-secondary">Replace</button>
              </div>
            </div>
          )}
        </section>

        {/* Result panel */}
        <section className="glass-card p-5">
          <h2 className="font-display text-lg font-semibold text-forest-900 dark:text-forest-50 mb-4">Analysis</h2>

          {!analysis && !analyzing && (
            <EmptyState
              icon={<Leaf size={28} />}
              title="No analysis yet"
              description="Upload a photo and tap Analyze to check your plant's health."
            />
          )}

          {analyzing && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mb-4" />
              <p className="text-sm text-forest-600 dark:text-forest-300">Examining your plant…</p>
            </div>
          )}

          {analysis && (
            <div className="animate-fade-in space-y-4">
              <div className={`rounded-2xl p-4 flex items-start gap-3 ${
                analysis.status === 'healthy' ? 'bg-forest-100 text-forest-700 dark:bg-forest-800/50 dark:text-forest-200'
                : analysis.status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : analysis.status === 'disease' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
              }`}>
                {analysis.status === 'unknown' ? <Info size={22} className="shrink-0 mt-0.5" />
                  : analysis.status === 'healthy' ? <CheckCircle2 size={22} className="shrink-0 mt-0.5" />
                  : <AlertTriangle size={22} className="shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold">{analysis.title}</p>
                  <p className="text-sm mt-1 opacity-90">{analysis.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-display font-semibold text-forest-900 dark:text-forest-50 mb-2">Suggested next steps</h3>
                <ul className="space-y-2">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-forest-700 dark:text-forest-200">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-forest-600 text-white text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {usedFallback && (
                <p className="text-xs text-forest-500 dark:text-forest-400 border-t border-forest-100 dark:border-forest-800/60 pt-3">
                  This feature requires an AI vision model for accurate disease identification. Connect a plant-disease classification model to enable automatic diagnosis.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
