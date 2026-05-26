import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Fish, Search, Bell, Upload, Settings, LayoutDashboard,
  BarChart3, ArrowRightLeft, Users, Package, AlertCircle,
  TestTube2, ClipboardList, ListTree, MapPin, BookOpen, ShieldCheck
} from 'lucide-react';
import BrandLogo from '../assets/images/logo/brand.png';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">

      {/* ================= SIDEBAR DÙNG CHUNG ================= */}
      <aside className="w-60 bg-[#0a192f] text-gray-300 flex flex-col shrink-0 border-r border-gray-800 overflow-y-auto">
<<<<<<< HEAD
=======
        <div className="p-5 border-b border-gray-800 flex items-center gap-2">
          <img src="/logo.png" alt="AquaTrade Logo" className="h-8 w-auto object-contain" />
          <div className="leading-none">
            <span className="text-[15px] font-black text-white block">AquaTrade</span>
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">Admin Console</span>
          </div>
        </div>
>>>>>>> b1b451263ae0f230bd852a204722c373ff9e64dd

        <nav className="flex-1 px-3 space-y-0.5 py-4">
          <NavSection label="Tổng quan" />
          {/* Lưu ý: Bạn có thể thay thẻ <a> bằng thẻ <Link to="/admin"> của react-router-dom sau này */}
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />

          <NavSection label="Cấu hình sàn" />
          <NavItem icon={<ListTree size={16} />} label="Danh mục phụ phẩm" />
          <NavItem icon={<MapPin size={16} />} label="Khu vực địa lý" />

          <NavSection label="Kiểm định & Tiêu chuẩn" />
          <NavItem icon={<BookOpen size={16} />} label="Bộ tiêu chuẩn B2B" />
          <NavItem icon={<TestTube2 size={16} />} label="Nhập kết quả KĐ" />
        </nav>

        <div className="p-4 border-t border-gray-800 flex items-center gap-2.5 mt-auto">
          <div className="w-8 h-8 rounded-full bg-teal-900 border border-teal-500/50 flex items-center justify-center text-teal-400 text-xs font-bold">NT</div>
          <div className="text-xs">
            <p className="font-medium text-white">Nguyễn Thanh</p>
            <p className="text-[10px] text-gray-500 font-mono">super.admin</p>
          </div>
        </div>
      </aside>

      {/* ================= KHUNG CHỨA NỘI DUNG (MAIN) ================= */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER DÙNG CHUNG */}
        <header className="h-15 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="p-5 border-gray-800 flex items-center gap-2">
            <div className="leading-none">
              <img src={BrandLogo} alt="AquaMarket Logo" className="h-9 w-auto object-contain" />
              <span className="text-[15px] font-black text-white block">AquaMarket</span>
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">Admin Console</span>
            </div>
          </div>
          <h1 className="text-[16px] font-bold text-gray-900">
            Hệ thống Quản trị
          </h1>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-50 transition relative">
              <Bell size={16} /> <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            </div>
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-50 transition"><Settings size={16} /></div>
          </div>
        </header>

        {/* NỘI DUNG CỦA CÁC TRANG SẼ ĐƯỢC ĐỔ VÀO THẺ OUTLET NÀY */}
        <div className="flex-1 overflow-auto bg-[#f8fafc]">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

// Sub-components dùng chung cho Sidebar
const NavSection = ({ label }) => <p className="px-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-5 pb-2">{label}</p>;
const NavItem = ({ icon, label, active }) => (
  <a href="#" className={`flex items-center px-3 py-2.5 rounded-lg text-[13px] transition ${active ? 'bg-teal-900/40 text-teal-400 border border-teal-500/20 font-bold' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}>
    <span className="mr-3 opacity-80">{icon}</span><span className="flex-1">{label}</span>
  </a>
);

export default AdminLayout;