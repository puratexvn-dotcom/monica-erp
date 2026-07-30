'use client';

import React, { useState } from 'react';
import { X, Save, Building, Cog } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyerModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ code: '', name: '', country: '', credit: 0 });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saved Buyer to Supabase:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-blue-100 overflow-hidden">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold"><Building className="w-5 h-5" /> {t('buyer_master')}</div>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-blue-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mã Khách Hàng</label>
            <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Khách Hàng</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Quốc Gia</label>
            <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Lưu Khách Hàng
          </button>
        </form>
      </div>
    </div>
  );
};

export const OperationModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ code: '', name: '', sam: 0 });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saved Operation to Supabase:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-teal-100 overflow-hidden">
        <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold"><Cog className="w-5 h-5" /> {t('operation_master')}</div>
          <button onClick={onClose}><X className="w-5 h-5 hover:text-teal-200" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mã Công Đoạn</label>
            <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Công Đoạn</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">SAM Chuẩn (Phút)</label>
            <input type="number" step="0.01" value={formData.sam} onChange={e => setFormData({...formData, sam: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Lưu Công Đoạn
          </button>
        </form>
      </div>
    </div>
  );
};