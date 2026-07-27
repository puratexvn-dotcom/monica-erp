'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Lock, User, Shirt, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnxatxbadgrrolwpmxne.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_jFhxcGYaLy_5LAN0PFeWhA_IMOBOUgX';
const supabase = createClient(supabaseUrl, supabaseKey);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultDept = searchParams.get('dept') || '';

  const [username, setUsername] = useState(defaultDept);
  const [password, setPassword] = useState('monica123'); // Mặc định điền sẵn cho lẹ
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (defaultDept) {
      setUsername(defaultDept);
    }
  }, [defaultDept]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase().replace(/-/g, '');
    const cleanPass = password.trim();

    try {
      // Truy vấn kiểm tra qua Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUser)
        .maybeSingle();

      let targetPath = defaultDept || 'giam-doc';
      let fullName = 'Quản trị viên';

      if (!error && data) {
        if (data.is_active === false) {
          throw new Error('Tài khoản này đã bị khóa!');
        }
        if (data.password !== cleanPass && data.password_hash !== cleanPass) {
          throw new Error('Mật khẩu không chính xác! (Mật khẩu mặc định: monica123)');
        }
        targetPath = data.department_path;
        fullName = data.full_name;
      } else {
        // Fallback an toàn nếu DB chưa phản hồi kịp
        if (!['kho', 'subcon', 'totruonghoanthanh', 'totruongcat', 'totruongmay', 'giamdoc', 'md', 'qa', 'ketoan', 'buyer', 'admin'].includes(cleanUser)) {
          throw new Error(`Tài khoản bộ phận "${username}" không tồn tại trong hệ thống!`);
        }
        if (cleanPass !== 'monica123') {
          throw new Error('Mật khẩu không chính xác! (Mật khẩu mặc định: monica123)');
        }
        // Ánh xạ đường dẫn thư mục
        const mapPath: Record<string, string> = {
          'totruonghoanthanh': 'to-truong-hoan-thanh',
          'totruongcat': 'to-truong-cat',
          'totruongmay': 'to-truong-may'
        };
        targetPath = mapPath[cleanUser] || cleanUser;
      }

      // Lưu phiên làm việc
      localStorage.setItem('monica_user', JSON.stringify({
        username: cleanUser,
        department: targetPath,
        name: fullName,
        loginTime: new Date().toISOString()
      }));

      // Chuyển hướng vào phân hệ thực tế
      router.push(`/${targetPath}`);

    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập thất bại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-800">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Shirt className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MONICA ERP</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Cổng Xác Thực Nội Bộ</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <span className="break-all">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tên Bộ Phận / Tài Khoản</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: giamdoc, kho, subcon..." 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mật Khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••" 
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium mb-2">Mật khẩu mặc định toàn hệ thống:</p>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">monica123</span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Đang tải cổng đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  );
}