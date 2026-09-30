import React, { useState } from 'react';
import { UserPlus, Search, Building, Phone, Shield, X, Mail, MapPin } from 'lucide-react';
import { Visitor } from '../types';
import { api } from '../services/api';

interface VisitorsDeskProps {
  visitors: Visitor[];
  onRefresh: () => void;
}

export const VisitorsDesk: React.FC<VisitorsDeskProps> = ({ visitors, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [formData, setFormData] = useState({
    FullName: '',
    Email: '',
    Phone: '',
    Company: '',
    GovtIdNumber: '',
    Address: '',
  });

  const filteredVisitors = visitors.filter((v) =>
    v.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.Company && v.Company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    v.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.registerVisitor(formData);
    setShowAddDrawer(false);
    setFormData({ FullName: '', Email: '', Phone: '', Company: '', GovtIdNumber: '', Address: '' });
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Visitors Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage pre-registered guests, visitor credentials, and security clearance.
          </p>
        </div>

        <button
          onClick={() => setShowAddDrawer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Visitor</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter visitors by full name, company, or email address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
        />
      </div>

      {/* Visitors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Visitor</th>
                <th className="px-6 py-3.5">Company / Organization</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Govt / National ID</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVisitors.map((v) => (
                <tr key={v.VisitorId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                        {v.FullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{v.FullName}</div>
                        <div className="text-xs text-slate-400">{v.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.Company || 'Independent'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{v.Phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.GovtIdNumber || 'Verified on Arrival'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                      Approved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Visitor Drawer from Right Side */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setShowAddDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register Visitor</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pre-register incoming guests for security access</p>
                </div>
                <button
                  onClick={() => setShowAddDrawer(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="visitor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter visitor full name (e.g. John Doe)"
                    value={formData.FullName}
                    onChange={(e) => setFormData({ ...formData, FullName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter visitor email address (e.g. john.doe@example.com)"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter visitor phone number (e.g. +880 1712-345678)"
                    value={formData.Phone}
                    onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="Enter company or organization name (e.g. Acme Innovations Ltd.)"
                    value={formData.Company}
                    onChange={(e) => setFormData({ ...formData, Company: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Govt ID / National ID / Passport Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter national ID or passport number (e.g. NID-1982736450)"
                    value={formData.GovtIdNumber}
                    onChange={(e) => setFormData({ ...formData, GovtIdNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Visitor Office Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter visitor office address (e.g. Level 4, Tower B, Dhaka)"
                    value={formData.Address}
                    onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDrawer(false)}
                  className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  form="visitor-form"
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20"
                >
                  Register Visitor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
