'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Scissors, Shirt, Package, CheckSquare, Plus, Globe } from 'lucide-react';
import { BuyerModal, OperationModal } from '@/components/MasterDataModals';
import { ChatDrawer } from '@/components/ChatDrawer';

export default function FinishingDashboard() {
  const { t, toggleLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'trimming' | 'pressing' | 'packing' | 'aql'>('pressing');
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);

  // Mock Data
  const kpis = [
    { title: t('thread_trimming'), value: '4,520', unit: 'Pcs', color: 'from-amber-400 to-amber-600', icon: <Scissors className="w-6 h-6 text-white"/>, tab: 'trimming' },
    { title: t('pressing'), value: '3,800', unit: 'Pcs', color: 'from-teal-400 to-teal-600', icon: <Shirt className="w-6 h-6 text-white"/>, tab: 'pressing' },
    { title: t('packing'), value: '3,500', unit: 'Pcs', color: 'from-cyan-400 to-cyan-600', icon: <Package className="w-6 h-6 text-white"/>, tab: 'packing' },
    { title: t('aql_inspection'), value: '98.5', unit: '% Pass', color: 'from-rose-400 to-rose-600', icon: <CheckSquare className="w-6 h-6 text-white"/>, tab: 'aql' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Sinh Động */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">MONICA ERP</h1>
          <p className="text-sm font-semibold text-teal-600">{t('finishing_packing')}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsBuyerModalOpen(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 flex gap-2 items-center">
            <Plus className="w-4 h-4"/> Buyer
          </button>
          <button onClick={() => setIsOpModalOpen(true)} className="px-4 py-2 bg-teal-50 text-teal-700 font-bold rounded-lg hover:bg-teal-100 flex gap-2 items-center">
            <Plus className="w-4 h-4"/> Operation
          </button>
          <button onClick={toggleLang} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 w-10 h-10 transition-colors">
            {t('switch_lang')}
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* KPI Cards (Gradient, High Contrast) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div key={idx} onClick={() => setActiveTab(kpi.tab as any)} className={`p-6 rounded-2xl shadow-lg bg-gradient-to-br ${kpi.color} cursor-pointer transform transition-all hover:-translate-y-1 hover:shadow-xl`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">{kpi.icon}</div>
                {activeTab === kpi.tab && <span className="flex w-3 h-3 bg-white rounded-full animate-pulse"></span>}
              </div>
              <h3 className="text-white/90 font-semibold text-sm mb-1">{kpi.title}</h3>
              <div className="text-3xl font-black text-white">{kpi.value} <span className="text-sm font-medium opacity-80">{kpi.unit}</span></div>
            </div>
          ))}
        </div>

        {/* Bảng Dữ Liệu Tương Tác theo Tab */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-800">
              Chi tiết: {activeTab === 'pressing' ? t('pressing') : activeTab === 'trimming' ? t('thread_trimming') : activeTab === 'packing' ? t('packing') : t('aql_inspection')}
            </h2>
            <button className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-teal-500/20">
              <Plus className="w-5 h-5"/> {t('add_new')} Báo Cáo
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b border-slate-200">PO Number</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Mã Hàng</th>
                  <th className="p-4 font-semibold border-b border-slate-200">{t('passed')}</th>
                  <th className="p-4 font-semibold border-b border-slate-200">{t('rework')}</th>
                  <th className="p-4 font-semibold border-b border-slate-200">{t('rejected')}</th>
                  <th className="p-4 font-semibold border-b border-slate-200">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-indigo-600 font-bold">PO-ZARA-001</td>
                  <td className="p-4">Áo Sơ Mi Nam</td>
                  <td className="p-4 text-emerald-600">1,200</td>
                  <td className="p-4 text-amber-500">15</td>
                  <td className="p-4 text-red-500">2</td>
                  <td className="p-4"><span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">Đang Chạy</span></td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-indigo-600 font-bold">PO-HM-1092</td>
                  <td className="p-4">Váy Nữ Mùa Hè</td>
                  <td className="p-4 text-emerald-600">2,500</td>
                  <td className="p-4 text-amber-500">50</td>
                  <td className="p-4 text-red-500">5</td>
                  <td className="p-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Hoàn Tất</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Global Modals & Chat */}
      <BuyerModal isOpen={isBuyerModalOpen} onClose={() => setIsBuyerModalOpen(false)} />
      <OperationModal isOpen={isOpModalOpen} onClose={() => setIsOpModalOpen(false)} />
      <ChatDrawer />
    </div>
  );
}