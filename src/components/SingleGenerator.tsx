/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { QRDesignConfig } from '../types';
import { drawQRCodeOnCanvas, generateQRAsSVG } from '../utils/qrRenderer';
import { jsPDF } from 'jspdf';
import { 
  Download, 
  Globe, 
  Wifi, 
  Mail, 
  PhoneCall, 
  AlignLeft, 
  Sparkles,
  BookmarkPlus,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface SingleGeneratorProps {
  config: QRDesignConfig;
  onSaveConfig: (name: string) => void;
}

type QRInputType = 'url' | 'text' | 'wifi' | 'email' | 'phone';

export default function SingleGenerator({ config, onSaveConfig }: SingleGeneratorProps) {
  const [inputType, setInputType] = useState<QRInputType>('url');
  const [inputValue, setInputValue] = useState('https://ai.studio/build');
  const [isRenderError, setIsRenderError] = useState<string | null>(null);
  
  // WiFi Form States
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  
  // Email Form States
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Phone Form States
  const [phoneNumber, setPhoneNumber] = useState('');

  // Sizing Output Size config (DPI)
  const [exportSize, setExportSize] = useState<number>(1024);

  // References and drawing states
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // 1. Build the correct payload string depending on inputType
  const getProcessedPayload = (): string => {
    switch (inputType) {
      case 'url':
        if (!inputValue.trim()) return 'https://ai.studio/build';
        return inputValue.startsWith('http://') || inputValue.startsWith('https://')
          ? inputValue.trim()
          : `https://${inputValue.trim()}`;
      case 'text':
        return inputValue || 'Welcome to QR Code Studio';
      case 'wifi':
        if (!wifiSsid) return 'WIFI:S:ExampleNetwork;T:WPA;P:password;;';
        return `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;
      case 'email':
        if (!emailTo) return 'mailto:info@example.com';
        const subj = emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : '';
        const bodyStr = emailBody ? `${subj ? '&' : '?' }body=${encodeURIComponent(emailBody)}` : '';
        return `mailto:${emailTo}${subj}${bodyStr}`;
      case 'phone':
        if (!phoneNumber) return 'tel:+1234567890';
        return `tel:${phoneNumber.trim()}`;
      default:
        return 'https://ai.studio/build';
    }
  };

  const payloadString = getProcessedPayload();

  // 2. Clear placeholder or redraw canvas when config/payload/resolution changes
  useEffect(() => {
    let active = true;
    const draw = async () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      
      try {
        setIsDrawing(true);
        setIsRenderError(null);
        
        // We draw the preview at a stable high density canvas size (600px for sharp preview)
        await drawQRCodeOnCanvas(canvas, payloadString, config, 600);
        
      } catch (err: any) {
        if (active) {
          setIsRenderError(err?.message || 'Error occurred during layout drawing');
        }
      } finally {
        if (active) {
          setIsDrawing(false);
        }
      }
    };

    draw();
    return () => {
      active = false;
    };
  }, [payloadString, config]);

  // 3. Export operations
  const handleDownloadPNG = async () => {
    try {
      // Create high-resolution export canvas off-screen to avoid display glitching
      const exportCanvas = document.createElement('canvas');
      await drawQRCodeOnCanvas(exportCanvas, payloadString, config, exportSize);
      
      const imageURL = exportCanvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      downloadLink.href = imageURL;
      
      // Sanitized name
      const title = config.name.toLowerCase().replace(/\s+/g, '-');
      downloadLink.download = `qr-${title}-${exportSize}px.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to export PNG', err);
    }
  };

  const handleDownloadSVG = async () => {
    try {
      const svgText = await generateQRAsSVG(payloadString, config);
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = blobURL;
      const title = config.name.toLowerCase().replace(/\s+/g, '-');
      downloadLink.download = `qr-${title}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);
    } catch (err) {
      console.error('Failed to export SVG', err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Draw high resolution image
      const exportCanvas = document.createElement('canvas');
      const dpiSize = exportSize;
      await drawQRCodeOnCanvas(exportCanvas, payloadString, config, dpiSize);
      const imgData = exportCanvas.toDataURL('image/png', 1.0);

      // Create PDF - 100mm x 100mm square layout is beautiful for print labels
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [105, 105] // A6 square or custom
      });

      pdf.addImage(imgData, 'PNG', 2.5, 2.5, 100, 100, undefined, 'FAST');
      
      const title = config.name.toLowerCase().replace(/\s+/g, '-');
      pdf.save(`qr-${title}-${dpiSize}dpi.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="single-generator-panel">
      {/* Configuration Form Column */}
      <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Quick Payload Types Selection header card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-indigo-600" />
              1. Setup Content Type
            </h3>
            
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {[
                { id: 'url', label: 'Website Link', icon: Globe },
                { id: 'wifi', label: 'Wi-Fi Login', icon: Wifi },
                { id: 'email', label: 'Send Email', icon: Mail },
                { id: 'phone', label: 'Call Action', icon: PhoneCall },
                { id: 'text', label: 'Plain Text', icon: AlignLeft },
              ].map((type) => {
                const Icon = type.icon;
                const active = inputType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setInputType(type.id as QRInputType)}
                    className={`flex-1 min-w-[90px] py-2 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Inputs Dynamic Panel */}
            <div className="pt-2">
              {inputType === 'url' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-slate-500">Target Hyperlink URL</label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://example.com/destiny"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    Type a webpage link. Your scanner is redirected instantly to the live location.
                  </span>
                </div>
              )}

              {inputType === 'text' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-slate-500">General Plain Text Message</label>
                  <textarea
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type raw logs, coupon codes, notes or codes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    Stores raw text content offline. Perfect for scanning offline item identifiers or credentials.
                  </span>
                </div>
              )}

              {inputType === 'wifi' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500">Wi-Fi Network Name (SSID)</label>
                    <input
                      type="text"
                      placeholder="e.g. MyHomeWireless"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Password / Pre-Shared Key</label>
                    <input
                      type="text"
                      placeholder="WPA Password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Security Encrypt</label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer transition-all"
                    >
                      <option value="WPA">WPA / WPA2 (Default)</option>
                      <option value="WEP">WEP Legacy</option>
                      <option value="nopass">Unsecured Network (Open)</option>
                    </select>
                  </div>
                  
                  <span className="text-[10px] text-slate-400 sm:col-span-2 leading-tight">
                    Scanner joins this Wi-Fi automatically upon matching. Extremely convenient for hospitality cards.
                  </span>
                </div>
              )}

              {inputType === 'email' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Recipient Email Address</span>
                      <input
                        type="email"
                        placeholder="recipient@domain.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-705 text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Subject Theme Header</span>
                      <input
                        type="text"
                        placeholder="e.g. Booking Support Feedback"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-705 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500">Message Body Template</span>
                    <textarea
                      rows={2}
                      placeholder="Pre-populate support template details here..."
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
              )}

              {inputType === 'phone' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-semibold text-slate-500">Dial Phone Connection Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +14155552671"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-705 text-slate-700 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    Launches standard dialing protocol automatically with the digits entered.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preset templates quick Save panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookmarkPlus className="w-4 h-4 text-indigo-650 text-indigo-600" />
              Save As Custom Design
            </h3>
            
            <p className="text-xs text-slate-500 -mt-1">
              Store current styling configuration permanently in your local design drawer.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name your template (e.g. Studio Red)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
              <button
                onClick={() => {
                  if (!templateName.trim()) return;
                  onSaveConfig(templateName.trim());
                  setTemplateName('');
                }}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Metadata Footer */}
        <div className="bg-slate-100 p-4 border border-slate-205 border-slate-200/50 rounded-xl flex items-center justify-between text-slate-500 mt-4 sm:mt-12 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Input: {payloadString.length} Bytes</span>
          </div>
          <div>QR Density: {payloadString.length > 100 ? 'Medium Grid' : 'Compact Grid'}</div>
        </div>
      </div>

      {/* Instant High-Res Visual Preview Column */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs min-h-[460px]">
        {/* Dynamic Canvas Container Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Live Vector Matrix</span>
            <span className="text-xs bg-slate-100 text-slate-600 py-1 px-2.5 rounded-md border border-slate-200/60 font-mono font-medium">{config.name}</span>
          </div>

          <div className="aspect-square relative w-full rounded-2xl bg-slate-50 border border-slate-150 border-slate-200/60 flex items-center justify-center overflow-hidden p-6 shadow-inner group">
            {isRenderError ? (
              <div className="absolute inset-x-4 text-center space-y-2">
                <span className="text-rose-600 font-bold text-xs block">Render Error</span>
                <p className="text-[11px] text-slate-500 bg-rose-50 py-2 px-3 border border-rose-150 border-rose-200 rounded-lg">{isRenderError}</p>
              </div>
            ) : (
              <>
                <canvas 
                  ref={previewCanvasRef} 
                  className={`w-full max-w-[280px] sm:max-w-[320px] aspect-square object-contain mx-auto select-all rounded transition-all duration-300 ${
                    isDrawing ? 'opacity-30 scale-95 blur-xs' : 'opacity-100 scale-100'
                  }`}
                  id="preview-canvas"
                />
                
                {isDrawing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-xs">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* High Resolution Export Configurations */}
        <div className="space-y-4 pt-5 mt-4 border-t border-slate-200">
          {/* Resolution Options */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500">Raster Output Matrix Sizing</span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              {[
                { label: '512px', val: 512, sub: 'Digital' },
                { label: '1024px', val: 1024, sub: 'HD Web' },
                { label: '2048px', val: 2048, sub: 'Standard Print' },
                { label: '4096px', val: 4096, sub: 'Fine Print' },
              ].map((res) => (
                <button
                  key={res.val}
                  onClick={() => setExportSize(res.val)}
                  className={`py-1 rounded text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    exportSize === res.val
                      ? 'bg-white text-indigo-600 border border-slate-250 border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold">{res.label}</span>
                  <span className="text-[9px] opacity-70 font-mono italic">{res.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Action Triggers */}
          <div className="space-y-2">
            {/* Main high resolution direct download */}
            <button
              onClick={handleDownloadPNG}
              disabled={isDrawing || !!isRenderError}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-45 disabled:pointer-events-none"
            >
              <Download className="w-4 h-4 text-white stroke-[2.5]" />
              Export High-Resolution PNG ({exportSize} px)
            </button>

            {/* Print/Vector Alternatives */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadSVG}
                disabled={isDrawing || !!isRenderError}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full"
              >
                Vector SVG (Print-Ready)
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDrawing || !!isRenderError}
                className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full"
              >
                Vector PDF (Flyer DPI)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
