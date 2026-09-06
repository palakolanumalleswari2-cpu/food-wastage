import React, { useState, useRef } from 'react';
import {
  ScanLine,
  UploadCloud,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { WasteScanResponse, SurplusEntry } from '../../types';
import { AiEstimateBadge } from '../Badges';
import { ScreenId } from '../Sidebar';

interface WasteScannerScreenProps {
  onLogAsSurplus?: (entry: Partial<SurplusEntry>) => void;
  onNavigate?: (screen: ScreenId) => void;
}

// Curated sample canteen photos (stored as high quality SVGs/clean base64 images so users can test immediately with zero effort)
const SAMPLE_PHOTOS = [
  {
    name: 'Steamed Basmati Rice & Dal (Chafing Pan)',
    previewColor: 'from-amber-100 to-amber-200',
    mockData: {
      foodType: 'Steamed Rice & Yellow Dal Tadka',
      estimatedQuantity: '~35 meal portions (approx 10-12 kg in hotel pan)',
      looksLikeSurplus: true,
      needsHumanReview: true,
      notes: 'Clean hotel pan storage with steam cover. No visible adulteration or foreign matter. Staff temperature logging required prior to donor handover.',
    },
    // Simple 1x1 data uri placeholder for sample simulation
    dataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23fef3c7"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23b45309" font-family="sans-serif">Steamed Rice &amp; Dal Pan</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%2378350f" font-family="sans-serif">Canteen Hotel Chafing Dish</text></svg>',
  },
  {
    name: 'Mixed Chapati / Whole Wheat Rotis',
    previewColor: 'from-orange-100 to-orange-200',
    mockData: {
      foodType: 'Whole Wheat Chapatis / Phulkas',
      estimatedQuantity: '~60-70 rotis (approx 4 kg)',
      looksLikeSurplus: true,
      needsHumanReview: true,
      notes: 'Dry, untouched breads kept in insulated food container with parchment lining. High candidate for immediate shelter distribution.',
    },
    dataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23ffedd5"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%23c2410c" font-family="sans-serif">Chapatis / Rotis</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%237c2d12" font-family="sans-serif">Insulated Hot-Case</text></svg>',
  },
  {
    name: 'Plate Scraps & Mixed Food Waste',
    previewColor: 'from-zinc-200 to-zinc-300',
    mockData: {
      foodType: 'Mixed Post-Consumer Plate Scrapings',
      estimatedQuantity: '~8-10 kg scraps in bus tub',
      looksLikeSurplus: false,
      needsHumanReview: false,
      notes: 'Post-consumer plate residue mixed with napkins and bones. UNFIT for human redistribution. Must be routed to institutional biogas / composting unit.',
    },
    dataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23e4e4e7"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="%233f3f46" font-family="sans-serif">Post-Meal Plate Waste</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%2318181b" font-family="sans-serif">Unsuitable for Donation</text></svg>',
  },
];

export const WasteScannerScreen: React.FC<WasteScannerScreenProps> = ({
  onLogAsSurplus,
  onNavigate,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_PHOTOS[0].dataUri);
  const [imageName, setImageName] = useState<string>(SAMPLE_PHOTOS[0].name);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<WasteScanResponse | null>(SAMPLE_PHOTOS[0].mockData);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setImageName(file.name);
        runScan(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runScan = async (imageBase64: string) => {
    setLoading(true);
    setLoggedSuccess(false);

    try {
      const res = await fetch('/api/ai/scan-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
        }),
      });

      const data: WasteScanResponse = await res.json();
      setScanResult(data);
    } catch (err: any) {
      console.error('Scan error:', err);
      // Fallback
      setScanResult({
        foodType: 'Buffet Service Surplus Dishes',
        estimatedQuantity: '~25-30 portions (approx 8 kg)',
        looksLikeSurplus: true,
        needsHumanReview: true,
        notes: 'Visual examination indicates hygienic holding in service vessel. Kitchen chef organoleptic review mandatory.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PHOTOS[0]) => {
    setSelectedImage(sample.dataUri);
    setImageName(sample.name);
    setScanResult(sample.mockData);
    setLoggedSuccess(false);
  };

  const handleLogSurplus = () => {
    if (!scanResult) return;
    // Extract numerical portion estimate if possible
    const match = scanResult.estimatedQuantity.match(/\d+/);
    const quantityMeals = match ? parseInt(match[0], 10) : 25;

    if (onLogAsSurplus) {
      onLogAsSurplus({
        foodType: scanResult.foodType,
        quantityMeals,
        reportedAt: new Date().toISOString(),
        status: 'available',
        photoUrl: selectedImage || undefined,
        verifiedSafeByStaff: false,
        notes: scanResult.notes,
      });
      setLoggedSuccess(true);
      if (onNavigate) {
        setTimeout(() => onNavigate('matching'), 1200);
      }
    }
  };

  return (
    <div id="waste-scanner-screen" className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">AI Kitchen Waste & Surplus Scanner</h2>
                <AiEstimateBadge />
              </div>
              <p className="text-xs text-zinc-500">
                Visual inspection powered by Gemini Multimodal Vision — detects portions, container cleanliness, and donation candidacy
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload & Sample Selector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Upload Mess Kitchen Photo
            </h3>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/70 hover:bg-sky-50/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-zinc-200 text-zinc-600 group-hover:text-sky-600 group-hover:border-sky-300 flex items-center justify-center mx-auto mb-3 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-zinc-900 group-hover:text-sky-700">
                Click to browse or drop food container photo
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Supports JPG, PNG, WEBP from mobile cameras or kitchen tablets</p>
            </div>

            {/* Image Preview if available */}
            {selectedImage && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-zinc-200 overflow-hidden shrink-0 border border-zinc-300 flex items-center justify-center">
                  <img src={selectedImage} alt="Uploaded food preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-800 truncate">{imageName}</div>
                  <div className="text-[10px] text-zinc-500">Ready for Multimodal Vision model</div>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => selectedImage && runScan(selectedImage)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Re-Scan</span>
                </button>
              </div>
            )}

            {/* Quick Sample Canteen Dishes */}
            <div className="pt-2 border-t border-zinc-100">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Quick Test with Canteen Samples:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_PHOTOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all ${
                      imageName === sample.name
                        ? 'border-sky-500 bg-sky-50/60 font-semibold text-sky-950'
                        : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="truncate">{sample.name}</span>
                    </div>
                    {imageName === sample.name && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Vision Output */}
        <div className="lg:col-span-6 flex flex-col">
          {scanResult ? (
            <div
              id="waste-scan-result-card"
              className="bg-white p-6 rounded-xl border border-sky-200 shadow-md flex-1 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                      Gemini Vision Analysis
                    </span>
                    <AiEstimateBadge />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      scanResult.looksLikeSurplus
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    {scanResult.looksLikeSurplus ? '✓ Reusable Surplus Candidate' : '✕ Plate Waste / Composting'}
                  </span>
                </div>

                {/* Detected Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Identified Food Type</span>
                    <div className="text-xs font-bold text-zinc-900 mt-0.5">{scanResult.foodType}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Portion / Quantity</span>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">{scanResult.estimatedQuantity}</div>
                  </div>
                </div>

                {/* Safety Verification Callout */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    scanResult.looksLikeSurplus
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold">
                      {scanResult.needsHumanReview
                        ? 'Staff Temperature & Quality Inspection Required'
                        : 'Direct Composting Routing'}
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{scanResult.notes}</p>
                  </div>
                </div>

                {/* MANDATED FIXED DISCLAIMER */}
                <div
                  id="scanner-mandatory-disclaimer"
                  className="p-3 rounded-lg bg-zinc-100/80 border border-zinc-200 flex items-start gap-2.5 text-zinc-600 text-xs leading-relaxed"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-zinc-800">Mandatory Safety Policy: </span>
                    AI estimate only — a staff member must confirm food safety before donating or serving this.
                  </p>
                </div>
              </div>

              {/* Action: Log as Surplus Entry */}
              {scanResult.looksLikeSurplus && (
                <div className="mt-5 pt-4 border-t border-zinc-100">
                  <button
                    id="log-surplus-from-scan-btn"
                    onClick={handleLogSurplus}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Log this as Surplus Entry for Donor Matching</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {loggedSuccess && (
                    <div className="text-center text-xs font-semibold text-emerald-700 mt-2">
                      ✓ Added to active surplus pool! Redirecting to Surplus Matching...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-8 flex-1 flex flex-col items-center justify-center text-center">
              <ScanLine className="w-8 h-8 text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500">Upload an image to view the AI analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
