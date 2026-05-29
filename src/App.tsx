/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { QRDesignConfig, StorageTemplate } from './types';
import { DEFAULT_DESIGN_CONFIG } from './utils/defaultTemplates';
import DesignCustomizer from './components/DesignCustomizer';
import SingleGenerator from './components/SingleGenerator';
import BatchProcessor from './components/BatchProcessor';
import MyVault from './components/MyVault';
import { 
  QrCode, 
  Grid, 
  Archive, 
  HelpCircle, 
  Github, 
  Cpu, 
  Maximize2,
  Sliders,
  CheckCircle,
  FileCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'vault'>('single');
  const [designConfig, setDesignConfig] = useState<QRDesignConfig>(DEFAULT_DESIGN_CONFIG);
  const [savedTemplates, setSavedTemplates] = useState<StorageTemplate[]>([]);

  // 1. Load saved templates from localStorage on initialization
  useEffect(() => {
    try {
      const cached = localStorage.getItem('qr_studio_templates');
      if (cached) {
        setSavedTemplates(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Failed to load saved templates from local storage', err);
    }
  }, []);

  // 2. Add design config template inside local cache
  const handleSaveConfig = (name: string) => {
    const isDuplicate = savedTemplates.some(
      (tpl) => tpl.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      alert('A template with this name already exists. Please pick a different name!');
      return;
    }

    const newTemplate: StorageTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      config: { ...designConfig, id: Math.random().toString(36).substr(2, 9), name },
      createdAt: Date.now(),
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('qr_studio_templates', JSON.stringify(updated));
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter((item) => item.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('qr_studio_templates', JSON.stringify(updated));
  };

  const handleImportBackup = (imported: StorageTemplate[]) => {
    // Merge list, deduplicating based on either ID or exact same name
    const combined = [...savedTemplates, ...imported];
    const unique = combined.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id || t.name === v.name) === i
    );
    setSavedTemplates(unique);
    localStorage.setItem('qr_studio_templates', JSON.stringify(unique));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app">
      {/* Universal Top Branding Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-650 bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <QrCode className="w-5.5 h-5.5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 font-display">
              QR Forge <span className="text-indigo-650 text-indigo-600">Pro</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono -mt-0.5">High-Resolution Vector & Raster Studio</p>
          </div>
        </div>

        {/* Global tab triggers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'single'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Single QR
          </button>
          
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Batch download
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Preset Vault
          </button>
        </div>

        {/* Active connection/sync status info right side */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Workspace Active
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn">
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Design Controls Sidebar (4 cols) */}
            <div className="xl:col-span-4 h-full">
              <DesignCustomizer config={designConfig} onChange={setDesignConfig} />
            </div>

            {/* Instant Render Panel (8 cols) */}
            <div className="xl:col-span-8">
              <SingleGenerator config={designConfig} onSaveConfig={handleSaveConfig} />
            </div>
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Design Controls Sidebar so batch template can be customized in real-time */}
            <div className="xl:col-span-4 h-full">
              <DesignCustomizer config={designConfig} onChange={setDesignConfig} />
            </div>

            {/* Batch items stack columns */}
            <div className="xl:col-span-8">
              <BatchProcessor config={designConfig} />
            </div>
          </div>
        )}

        {/* Vault list view full width */}
        {activeTab === 'vault' && (
          <div className="max-w-4xl mx-auto">
            <MyVault
              currentConfig={designConfig}
              onApplyConfig={setDesignConfig}
              savedTemplates={savedTemplates}
              onDeleteTemplate={handleDeleteTemplate}
              onImportBackup={handleImportBackup}
            />
          </div>
        )}
      </main>

      {/* Footer System Credits */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-slate-400 font-mono text-[11px] shadow-inner-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Engines: Canvas High-DPI Layer • JSZip Compressor • jsPDF Builder</span>
          </div>
          <div className="text-slate-400">
            <span>QR Forge Studio • © 2026 Forge LLC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
