/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BatchQRItem, QRDesignConfig } from '../types';
import { drawQRCodeOnCanvas, generateQRAsSVG } from '../utils/qrRenderer';
import JSZip from 'jszip';
import { 
  FolderArchive, 
  Trash2, 
  Play, 
  Plus, 
  Check, 
  FileSpreadsheet, 
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Grid,
  FileCheck
} from 'lucide-react';

interface BatchProcessorProps {
  config: QRDesignConfig;
}

export default function BatchProcessor({ config }: BatchProcessorProps) {
  const [items, setItems] = useState<BatchQRItem[]>([
    { id: '1', content: 'https://ai.studio/build', filename: 'ai_studio_signage', label: 'AI Build Platform', isSelected: true, status: 'pending' },
    { id: '2', content: 'https://github.com', filename: 'github_main', label: 'GitHub Repo', isSelected: true, status: 'pending' },
    { id: '3', content: 'https://google.com', filename: 'google_home', label: 'Google Search', isSelected: true, status: 'pending' },
  ]);

  const [bulkTextInput, setBulkTextInput] = useState('');
  const [batchFormat, setBatchFormat] = useState<'png-512' | 'png-1024' | 'png-2048' | 'svg'>('png-1024');
  
  // Progress state trackers
  const [isCompiling, setIsCompiling] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  // 1. Bulk import logic
  const handleBulkImportText = () => {
    if (!bulkTextInput.trim()) return;

    const lines = bulkTextInput.split('\n');
    const newItems: BatchQRItem[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Handle CSV-like parsing: "URL,Filename,Label"
      const parts = trimmedLine.split(',');
      const content = parts[0]?.trim();
      if (!content) return;

      // Generate neat filename
      let filename = parts[1]?.trim();
      if (!filename) {
        // Formulate safe filename from part of domain name or index
        const safeUrl = content.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/[^a-zA-Z0-9]/g, '_');
        filename = `qr_${safeUrl.slice(0, 25) || 'node'}`;
      }

      const label = parts[2]?.trim() || '';

      newItems.push({
        id: Math.random().toString(36).substr(2, 9),
        content,
        filename,
        label: label || undefined,
        isSelected: true,
        status: 'pending',
      });
    });

    setItems([...items, ...newItems]);
    setBulkTextInput('');
  };

  // 2. Clear, toggle items
  const handleClearAll = () => {
    setItems([]);
  };

  const selectAll = (selected: boolean) => {
    setItems(items.map((it) => ({ ...it, isSelected: selected })));
  };

  const handleToggleSelect = (id: string) => {
    setItems(items.map((it) => (it.id === id ? { ...it, isSelected: !it.isSelected } : it)));
  };

  const handleUpdateItemField = (id: string, field: 'content' | 'filename' | 'label', val: string) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            [field]: val,
            status: 'pending', // reset status on edit
          };
        }
        return it;
      })
    );
  };

  const handleAddEmptyRow = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        content: '',
        filename: `qr_export_${items.length + 1}`,
        isSelected: true,
        status: 'pending',
      },
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  // 3. Batch build and ZIP download compression trigger
  const handleCompileZipBatch = async () => {
    const selectedItems = items.filter((it) => it.isSelected);
    if (selectedItems.length === 0) return;

    try {
      setIsCompiling(true);
      setProgressTotal(selectedItems.length);
      setProgressCount(0);

      // Status updates to selected items to 'generating'
      setItems((prev) =>
        prev.map((it) => (it.isSelected ? { ...it, status: 'pending', isGenerating: true } : it))
      );

      const zip = new JSZip();
      
      // Determine pixels size
      let pixelsSize = 1024;
      if (batchFormat === 'png-512') pixelsSize = 512;
      if (batchFormat === 'png-2048') pixelsSize = 2048;

      // Create dummy off-screen canvas element for parallel draw
      const offscreenCanvas = document.createElement('canvas');

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        
        try {
          // Setup inline design customization if specific item has custom label override
          const itemDesign: QRDesignConfig = {
            ...config,
            label: item.label !== undefined
              ? {
                  text: item.label,
                  fontSize: config.label?.fontSize || 20,
                  color: config.label?.color || '#000000',
                  fontFamily: config.label?.fontFamily || 'sans-serif'
                }
              : config.label,
          };

          if (batchFormat === 'svg') {
            // SVG Mode
            const svgString = await generateQRAsSVG(item.content, itemDesign);
            zip.file(`${item.filename}.svg`, svgString);
          } else {
            // PNG Mode
            await drawQRCodeOnCanvas(offscreenCanvas, item.content, itemDesign, pixelsSize);
            
            // Convert canvas drawing to blobs rather than raw base64 arrays (saves heap space)
            const blob = await new Promise<Blob | null>((resolve) => offscreenCanvas.toBlob(resolve, 'image/png', 1.0));
            if (blob) {
              zip.file(`${item.filename}.png`, blob);
            } else {
              throw new Error('Canvas buffer render is empty');
            }
          }

          // Mark Success
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, status: 'success', isGenerating: false } : it
            )
          );
        } catch (err: any) {
          console.error(`Error building item: ${item.content}`, err);
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: 'error', isGenerating: false, errorMessage: err?.message || 'Error' }
                : it
            )
          );
        }

        setProgressCount((c) => c + 1);
        // Add tiny timeout to prevent thread starving on massive batches
        await new Promise((r) => setTimeout(r, 45));
      }

      // Output Zip download file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `qr-batch-${Date.now().toString().slice(-5)}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);

    } catch (err) {
      console.error('Batch zipping failed', err);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-6" id="batch-processor-dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Paste import panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            1. Fast Bulk Paste Import
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Quickly paste links or CSV lines (one per line). Format can be a simple link OR comma-separated attributes:
            <code className="block mt-1 bg-slate-100 p-1.5 rounded text-[10px] font-mono text-indigo-600 border border-slate-200 whitespace-pre">
              https://site.com, output_name, Label Text
            </code>
          </p>

          <textarea
            rows={6}
            placeholder="https://ai.studio, first_badge, AI Studio&#10;https://github.com, code_repo, My Repository"
            value={bulkTextInput}
            onChange={(e) => setBulkTextInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-700 font-mono outline-none resize-none transition-all placeholder:text-slate-400"
          />

          <button
            onClick={handleBulkImportText}
            disabled={!bulkTextInput.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40"
          >
            Append Imported Rows
          </button>
        </div>

        {/* Batch Queue summary card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                2. Export Layout Options
              </h3>
              <div className="text-xs text-slate-500 font-medium">
                Queue: {items.filter((it) => it.isSelected).length} Selected of {items.length} Total
              </div>
            </div>

            {/* Select settings options details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-505 text-slate-500 uppercase tracking-wider block font-bold">Bulk File Format</span>
                <select
                  value={batchFormat}
                  onChange={(e) => setBatchFormat(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-505 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="png-512">Raster PNG (Compact 512px)</option>
                  <option value="png-1024">HD Raster PNG (Web 1024px)</option>
                  <option value="png-2048">Ultra PNG (Print-Ready 2048px)</option>
                  <option value="svg">Scalable Vector SVG (Infinite DPI)</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <div className="text-[10px] text-slate-400 italic pb-1.5 leading-tight">
                  Applying active {config.name} designer style overlay automatically to every item in the queue.
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Compilation ZIP card */}
          {isCompiling ? (
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold font-mono">
                <span className="text-indigo-605 text-indigo-600 flex items-center gap-2 animate-pulse">
                  <Play className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  Compiling High-Resolution Package...
                </span>
                <span className="text-slate-600">{Math.round((progressCount / progressTotal) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-150" 
                  style={{ width: `${(progressCount / progressTotal) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Completed {progressCount} of {progressTotal} elements.</p>
            </div>
          ) : (
            <button
              onClick={handleCompileZipBatch}
              disabled={items.filter((it) => it.isSelected).length === 0}
              className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <FolderArchive className="w-4 h-4 text-white" />
              Build & Download Batch ZIP ({items.filter((it) => it.isSelected).length} Items)
            </button>
          )}
        </div>
      </div>

      {/* Main interactive Table Batch items card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Generation Queue</span>
            <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-0.5 rounded-full font-mono border border-indigo-200/50 font-bold">
              {items.length} in scope
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAll(true)}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] text-slate-600 rounded font-semibold transition-all cursor-pointer"
            >
              Select All
            </button>
            <button
              onClick={() => selectAll(false)}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] text-slate-600 rounded font-semibold transition-all cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[11px] text-rose-605 font-bold text-rose-600 rounded transition-all cursor-pointer"
            >
              Clear Queue
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto font-sans">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-550 bg-white">
              <FolderArchive className="w-12 h-12 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Queue is empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Paste strings above or click add row below to build a dynamic print queue.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="batch-interactive-table">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-indigo-650 text-indigo-600 uppercase tracking-wider bg-slate-50/50 select-none">
                  <th className="py-3.5 px-4 w-12 text-center">Active</th>
                  <th className="py-3.5 px-3">Scan String / Payload URL</th>
                  <th className="py-3.5 px-3 w-48">Output Filename</th>
                  <th className="py-3.5 px-3 w-48">Text Label (Optional)</th>
                  <th className="py-3.5 px-4 w-32 text-center">Status badge</th>
                  <th className="py-3.5 px-4 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-mono text-xs text-slate-600">
                {items.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`transition-colors duration-150 ${
                      item.isSelected ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'bg-transparent opacity-60 hover:opacity-85'
                    }`}
                  >
                    {/* Checkbox selector */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0 bg-white cursor-pointer w-4 h-4 accent-indigo-605"
                      />
                    </td>

                    {/* Scan payload text box */}
                    <td className="py-3 px-3 font-sans">
                      <input
                        type="text"
                        value={item.content}
                        onChange={(e) => handleUpdateItemField(item.id, 'content', e.target.value)}
                        placeholder="https://mysite.com/destination-page"
                        className="bg-transparent border-b border-transparent focus:border-indigo-500 py-1 text-slate-700 font-mono text-xs w-full focus:outline-none transition-all placeholder:text-slate-300 font-medium"
                      />
                    </td>

                    {/* Output filename file handle */}
                    <td className="py-3 px-3 font-sans">
                      <input
                        type="text"
                        value={item.filename}
                        onChange={(e) => handleUpdateItemField(item.id, 'filename', e.target.value)}
                        placeholder="e.g. coupon_label"
                        className="bg-transparent border-b border-transparent focus:border-indigo-500 py-1 text-slate-700 font-mono text-xs w-full focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </td>

                    {/* Custom Text footer label */}
                    <td className="py-3 px-3 font-sans">
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={(e) => handleUpdateItemField(item.id, 'label', e.target.value)}
                        placeholder="e.g. SCAN TO CONNECT"
                        className="bg-transparent border-b border-transparent focus:border-indigo-500 py-1 text-slate-700 font-mono text-xs w-full focus:outline-none transition-all placeholder:text-slate-300"
                      />
                    </td>

                    {/* Tracking status metrics */}
                    <td className="py-3 px-4 text-center select-none font-sans font-semibold">
                      {item.isGenerating ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100">
                          <Clock className="w-3 h-3 animate-spin" />
                          Drawing
                        </span>
                      ) : item.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Ready
                        </span>
                      ) : item.status === 'error' ? (
                        <span 
                          title={item.errorMessage}
                          className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100 cursor-help font-semibold"
                        >
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Delete action row */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete dynamic row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Append direct item trigger button */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleAddEmptyRow}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Append Single Empty Row
          </button>
          
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 select-none">
            <HelpCircle className="w-3.5 h-3.5" />
            Double click cell fields to make instant inline edits.
          </div>
        </div>
      </div>
    </div>
  );
}
