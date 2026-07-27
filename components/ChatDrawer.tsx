'use client';

import React, { useState } from 'react';
import { MessageSquare, X, Send, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export const ChatDrawer = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isRedFlag, setIsRedFlag] = useState(false);

  // Mock messages for UI layout
  const [messages, setMessages] = useState([
    { id: 1, dept: 'QA', text: 'PO-M2601 có tỷ lệ lỗi bỏ mũi cao ở chuyền 3.', redFlag: true },
    { id: 2, dept: 'Finishing', text: 'Đã tiếp nhận, tổ Ủi đang chờ lô bù.', redFlag: false }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { id: Date.now(), dept: 'Me', text: message, redFlag: isRedFlag }]);
    setMessage('');
    setIsRedFlag(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-40"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-in slide-in-from-right">
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 font-bold">
              <MessageSquare className="w-5 h-5 text-pink-500" /> {t('chat_hub')}
            </div>
            <button onClick={() => setIsOpen(false)}><X className="w-5 h-5 hover:text-slate-300" /></button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`p-3 rounded-lg text-sm shadow-sm ${msg.dept === 'Me' ? 'bg-pink-100 ml-8' : 'bg-white border border-slate-200 mr-8'} ${msg.redFlag ? 'border-2 border-red-400 bg-red-50' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold ${msg.dept === 'Me' ? 'text-pink-700' : 'text-slate-700'}`}>{msg.dept}</span>
                  {msg.redFlag && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
                <p className="text-slate-800">{msg.text}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsRedFlag(!isRedFlag)}
                className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${isRedFlag ? 'bg-red-100 text-red-700 border-red-300' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
              >
                <AlertTriangle className="w-3 h-3" /> {t('red_flag')}
              </button>
              <button className="px-3 py-1 text-xs font-bold rounded-full border bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Ảnh
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..." 
                className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button onClick={handleSend} className="bg-pink-600 text-white p-3 rounded-xl hover:bg-pink-700">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};