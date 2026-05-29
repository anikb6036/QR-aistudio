/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageTemplate, QRDesignConfig } from '../types';
import { 
  Archive, 
  Trash2, 
  UploadCloud, 
  DownloadCloud, 
  Check, 
  Layers,
  Sparkles,
  Info,
  Activity,
  UserCheck
} from 'lucide-react';

interface MyVaultProps {
  currentConfig: QRDesignConfig;
  onApplyConfig: (config: QRDesignConfig) => void;
  savedTemplates: StorageTemplate[];
  onDeleteTemplate: (id: string) => void;
  onImportBackup: (imported: StorageTemplate[]) => void;
}

export default function MyVault({
  currentConfig,
  onApplyConfig,
  savedTemplates,
  onDeleteTemplate,
  onImportBackup,
}: MyVaultProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 1. Export entire templates list as a JSON file
  const handleExportBackup = () => {
    try {
      const backupData = {
        app: 'QR_CODE_GENERATOR',
        version: '1.0',
        timestamp: Date.now(),
        templates: savedTemplates,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `qr-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      triggerSuccessMsg('Backup downloaded successfully!');
    } catch (err) {
      console.error('Failed to export backup templates ledger', err);
    }
  };

  // 2. Import templates from a JSON file
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.app === 'QR_CODE_GENERATOR' && Array.isArray(parsed.templates)) {
          onImportBackup(parsed.templates);
          triggerSuccessMsg(`Successfully imported ${parsed.templates.length} saved templates!`);
        } else {
          alert('Invalid backup format. Make sure you upload a .json file exported from this application.');
        }
      } catch (err) {
        alert('Failed to parse the backup file. File might be corrupted.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clean input
  };

  return (
    <div className="space-y-6" id="vault-dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sync Operations and backups */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Archive className="w-4 h-4 text-indigo-600" />
            Vesting & Safe Backups
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Since your style preferences, custom files, and templates live privately in your local browser storage registry, downloading a backup payload lets you preserve your workspaces permanently.
          </p>

          {/* User local identity metrics */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800">Sandbox Vault Secure</span>
              <span className="block text-[10px] text-slate-400 font-medium">Encrypted in browser storage</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {/* Download backup */}
            <button
              onClick={handleExportBackup}
              disabled={savedTemplates.length === 0}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
            >
              <DownloadCloud className="w-4 h-4 text-white" />
              Download Configurations Backup (.json)
            </button>

            {/* Upload backup */}
            <label className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 hover:border-slate-350">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              Upload & Import Configuration Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackupFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Success toast inside panel */}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold text-center animate-pulse">
              {successMsg}
            </div>
          )}
        </div>

        {/* Saved Items Management list */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Your Custom Design Drawer
              </h3>
              <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded font-mono font-bold text-slate-500 border border-slate-200/50">
                {savedTemplates.length} Saved
              </span>
            </div>

            {savedTemplates.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-8 rounded-xl text-center text-slate-400 space-y-1.5 bg-slate-50/50">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Custom Templates Saved Yet</p>
                <p className="text-[10px] text-slate-450 text-slate-400">Go to Single Generator tab, find the "Save As Custom Design" panel, type a name, and hit save!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {savedTemplates.map((item) => {
                  const isCurrent = currentConfig.name === item.name;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/30 border-indigo-500/40'
                          : 'bg-white border-slate-210 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-200/30"
                          style={{
                            background: item.config.foreground.type === 'solid'
                              ? item.config.foreground.solidColor
                              : `linear-gradient(45deg, ${item.config.foreground.gradientColor1}, ${item.config.foreground.gradientColor2})`
                          }}
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block leading-tight">{item.name}</span>
                          <span className="block text-[9px] text-slate-400 font-mono font-medium mt-0.5">
                            Created {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full border border-emerald-200/60 font-bold">
                            <Check className="w-3 h-3 text-emerald-500" />
                            Active style
                          </span>
                        ) : (
                          <button
                            onClick={() => onApplyConfig(item.config)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 py-1 px-2.5 rounded text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                          >
                            Apply Style
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteTemplate(item.id)}
                          className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-4 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-650 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-normal font-medium">
              Saved configurations store full parameters including dots structure (pill/square/spheres), corners custom styling, color gradient vectors and bottom labels. Built-in logos remain connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
