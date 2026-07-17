import React, { memo } from 'react';
import { Settings, Shield, Bell, Key, Database } from 'lucide-react';

function SystemSettingsTab() {
  const sections = [
    { id: 'general', label: 'General Configuration', icon: Settings, desc: 'Platform name, branding, and global toggles.' },
    { id: 'security', label: 'Security & Auth', icon: Shield, desc: '2FA enforcement, password policies, session timeouts.' },
    { id: 'notifications', label: 'Notification Rules', icon: Bell, desc: 'Email templates and webhook configurations.' },
    { id: 'api', label: 'API Keys', icon: Key, desc: 'Manage third-party integrations and access tokens.' },
    { id: 'database', label: 'Backup & Restore', icon: Database, desc: 'Automated backups and retention policies.' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure core platform behavior and integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <s.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{s.label}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(SystemSettingsTab);