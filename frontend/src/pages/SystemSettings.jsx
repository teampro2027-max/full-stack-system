import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, CreditCard, HardDrive, Palette, Save } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const tabs = [
  { id: 'general', label: 'General', icon: Bell },
  { id: 'notifications', label: 'Notifications', icon: MessageSquare },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const SystemSettings = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('systemSettings')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure all system preferences</p>
        </div>
        <button onClick={handleSave} className={`btn-primary ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
          <Save size={15}/>{saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setActiveTab(tb.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tb.id ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <tb.icon size={14}/>{tb.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">General Configuration</h2>
          {[
            { label: 'System Name', value: 'BillTrack Pro', placeholder: 'System name' },
            { label: 'Admin Email', value: 'admin@billtrack.so', placeholder: 'admin@example.com', type: 'email' },
            { label: 'Support Phone', value: '+252 61 000 0000', placeholder: '+252...' },
            { label: 'System Timezone', value: 'Africa/Mogadishu (UTC+3)', placeholder: 'Timezone' },
          ].map(f => (
            <div key={f.label}>
              <label className="label">{f.label}</label>
              <input type={f.type || 'text'} defaultValue={f.value} placeholder={f.placeholder} className="input"/>
            </div>
          ))}
          <div>
            <label className="label">Default Currency</label>
            <select className="input">
              <option value="USD">USD – US Dollar</option>
              <option value="SOS">SOS – Somali Shilling</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Notification Gateways</h2>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><MessageSquare size={14} className="text-indigo-600"/>SMS Gateway (Africa's Talking)</p>
            {[
              { label: 'API Key', value: 'AT-XXXXXXXX', type: 'password' },
              { label: 'Username', value: 'billtrack_prod', type: 'text' },
              { label: 'Sender ID', value: 'BillTrack', type: 'text' },
            ].map(f => (
              <div key={f.label}><label className="label">{f.label}</label><input type={f.type} defaultValue={f.value} className="input"/></div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Mail size={14} className="text-indigo-600"/>Email Gateway (SMTP)</p>
            {[
              { label: 'SMTP Host', value: 'smtp.gmail.com' },
              { label: 'SMTP Port', value: '587' },
              { label: 'Username', value: 'noreply@billtrack.so' },
              { label: 'Password', value: '••••••••' },
            ].map(f => (
              <div key={f.label}><label className="label">{f.label}</label><input defaultValue={f.value} className="input"/></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Payment Gateway Settings</h2>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
            <p className="text-sm font-semibold">EVC Plus / WaafiPay</p>
            {[
              { label: 'Merchant UID', value: 'M0910291' },
              { label: 'API User ID', value: '1000416' },
              { label: 'API Key', value: 'API-675418888AHX' },
              { label: 'API Endpoint', value: 'https://api.waafipay.net/asm' },
            ].map(f => (
              <div key={f.label}><label className="label">{f.label}</label><input defaultValue={f.value} className="input"/></div>
            ))}
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div><p className="text-sm font-medium">Test Mode</p><p className="text-xs text-slate-400">Use sandbox for testing payments</p></div>
            <div className="relative w-12 h-6 rounded-full bg-amber-400 cursor-pointer">
              <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow"/>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Storage Configuration</h2>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
            <p className="text-sm font-semibold">MongoDB Database</p>
            {[
              { label: 'Connection URI', value: 'mongodb://127.0.0.1:27017/multibill' },
              { label: 'Database Name', value: 'multibill' },
            ].map(f => (
              <div key={f.label}><label className="label">{f.label}</label><input defaultValue={f.value} className="input font-mono text-sm"/></div>
            ))}
            <button className="btn-success text-xs">Test Connection</button>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-3">
            <p className="text-sm font-semibold">File Storage (Cloudinary)</p>
            {['Cloud Name','API Key','API Secret'].map(label => (
              <div key={label}><label className="label">{label}</label><input type="password" defaultValue="••••••••" className="input"/></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="card space-y-5">
          <h2 className="font-semibold">Appearance Settings</h2>
          <div>
            <label className="label">Primary Brand Color</label>
            <div className="flex gap-3 flex-wrap">
              {['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'].map(color => (
                <button key={color} className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: color }}/>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input type="url" placeholder="https://..." className="input"/>
          </div>
          <div>
            <label className="label">Custom CSS</label>
            <textarea className="input font-mono text-sm resize-none" rows={4} placeholder="/* Custom overrides */"/>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
