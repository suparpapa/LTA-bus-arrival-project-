import React, { useState } from 'react';
import { ApiConfig } from '../services/ltaBusService';
import { X, Server, Key, Globe, CheckCircle2, AlertCircle, Copy, Check, Code } from 'lucide-react';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (cfg: ApiConfig) => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [mode, setMode] = useState<'simulation' | 'backend'>(config.mode);
  const [backendUrl, setBackendUrl] = useState(config.backendUrl);
  const [ltaApiKey, setLtaApiKey] = useState(config.ltaApiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      mode,
      backendUrl: backendUrl.trim(),
      ltaApiKey: ltaApiKey.trim(),
    });
    onClose();
  };

  const handleTestConnection = async () => {
    if (mode === 'simulation') {
      setTestStatus('success');
      setTestMessage('Simulation Engine is active and generating live LTA arrival telemetry.');
      return;
    }

    if (!backendUrl) {
      setTestStatus('failed');
      setTestMessage('Please enter your backend URL first.');
      return;
    }

    setTestStatus('testing');
    try {
      const url = new URL(backendUrl, window.location.origin);
      url.searchParams.set('BusStopCode', '83139');
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (ltaApiKey) headers['AccountKey'] = ltaApiKey;

      const resp = await fetch(url.toString(), { headers });
      const data = await resp.json().catch(() => null);

      if (resp.ok) {
        setTestStatus('success');
        setTestMessage(`Connected to LTA DataMall! Returned ${data?.Services?.length || 0} active bus services.`);
      } else if (resp.status === 401 && data?.error?.includes('AccountKey')) {
        setTestStatus('failed');
        setTestMessage(`Serverless endpoint reachable! Waiting for LTA_ACCOUNT_KEY in .env or header.`);
      } else {
        setTestStatus('failed');
        setTestMessage(`Server returned HTTP ${resp.status}: ${data?.message || resp.statusText}`);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`Connection error: ${err.message || 'Unable to connect to backend endpoint'}`);
    }
  };

  const sampleBackendSnippet = `// Sample Express Backend Route for LTA DataMall v3 BusArrival
import express from 'express';

const app = express();
const LTA_KEY = process.env.LTA_DATAMALL_KEY || '${ltaApiKey || 'YOUR_LTA_KEY_HERE'}';

app.get('/api/bus-arrival', async (req, res) => {
  const { BusStopCode, ServiceNo } = req.query;
  const url = new URL('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival');
  if (BusStopCode) url.searchParams.set('BusStopCode', String(BusStopCode));
  if (ServiceNo) url.searchParams.set('ServiceNo', String(ServiceNo));

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'AccountKey': LTA_KEY,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch LTA DataMall' });
  }
});`;

  const copySnippet = () => {
    navigator.clipboard.writeText(sampleBackendSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-red-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Backend Connection & API Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Engine Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Data Engine Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('simulation')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  mode === 'simulation'
                    ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Built-in Realtime Simulator
                  </span>
                  {mode === 'simulation' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Realistic Singapore LTA arrival countdowns, vehicle plates, loads, and live moving buses without requiring API credentials.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('backend')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  mode === 'backend'
                    ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Custom Backend API
                  </span>
                  {mode === 'backend' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Connect to your own backend server or proxy route querying LTA DataMall v3 BusArrival endpoint.
                </p>
              </button>
            </div>
          </div>

          {/* Backend Fields (active or preview) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Backend Endpoint URL</span>
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="e.g. /api/bus-arrival or https://your-server.com/api/bus"
                className="mt-1.5 w-full p-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The frontend will request: <code className="font-mono text-slate-600 dark:text-slate-400">{backendUrl || '[YOUR_URL]'}?BusStopCode=09048</code>
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>LTA DataMall AccountKey (Optional if forwarded by backend)</span>
              </label>
              <input
                type="password"
                value={ltaApiKey}
                onChange={(e) => setLtaApiKey(e.target.value)}
                placeholder="Your LTA DataMall v2/v3 50-character API key"
                className="mt-1.5 w-full p-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {testStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
              </button>

              {testStatus === 'success' && (
                <div className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testMessage}</span>
                </div>
              )}
              {testStatus === 'failed' && (
                <div className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Backend Implementation Guide */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Code className="w-3.5 h-3.5 text-red-600" />
                <span>Express.js Backend Integration Starter</span>
              </div>
              <button
                type="button"
                onClick={copySnippet}
                className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            
            <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {sampleBackendSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
