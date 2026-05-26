import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // <-- Cập nhật import motion
import { 
  Fish, LayoutDashboard, BarChart3, ArrowRightLeft, Users, Package, 
  AlertCircle, TestTube2, ClipboardList, ListTree, MapPin, Settings, 
  BookOpen, Bell, Search 
} from 'lucide-react';

import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/login/RegisterPage';
import ForgotPasswordPage from './pages/login/ForgotPasswordPage';
import OtpPage from './pages/login/OtpPage';

import LandingPage from './pages/LandingPage';
import Exchange from './pages/Exchange';
import RouteOptimizationResult from './pages/RouteOptimizationResult';
import ListingCriteria from './pages/ListingCriteria';
import SellerDashboard from './pages/seller/SellerDashboard';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import GradingStandards from './pages/admin/GradingStandards';
import CategoryConfig from './pages/admin/CategoryConfig';
import LabInput from './pages/admin/LabInput';
import AquaMarketReports from './pages/admin/AquaMarketReports';
import BrandLogo from './assets/images/logo/brand.png';

// ================= LAYOUT ĐIỀU HƯỚNG DÙNG CHUNG (ADMIN) =================
const AdminLayout = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-60 bg-[#0a192f] text-gray-300 flex flex-col shrink-0 border-r border-gray-800 overflow-y-auto">

        <div className="p-5 border-b border-gray-800 flex items-center gap-2">
          <img src="/logo.png" alt="AquaTrade Logo" className="h-8 w-auto object-contain" />
          <div className="leading-none">
            <span className="text-[15px] font-black text-white block">AquaTrade</span>
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">Admin Console</span>
          </div>
        </div>
        <div className="m-4 p-2.5 bg-orange-900/30 border border-orange-500/30 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rotate-45 animate-pulse shrink-0"></div>
          <p className="text-[10px] text-orange-400 font-mono uppercase tracking-widest">Admin Sàn — Role 5</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 pb-4">
          <p className="px-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-4 pb-2">Tổng quan</p>
          <Link to="/admin" className={`flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition ${location.pathname === '/admin' ? 'bg-teal-900/40 text-teal-400 border border-teal-500/30 font-bold' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}>
            <LayoutDashboard size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Dashboard</span>
          </Link>
          <Link to="/admin/reports" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <BarChart3 size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Báo cáo & GMV</span>
          </Link>

          <p className="px-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-4 pb-2">Quản lý</p>
          <Link to="/admin/users" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <Users size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Người dùng</span>
            <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">7</span>
          </Link>
          <Link to="/admin/lots" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <Package size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Lô hàng</span>
          </Link>
          <Link to="/admin/disputes" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <AlertCircle size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Tranh chấp</span>
            <span className="bg-orange-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">3</span>
          </Link>

          <p className="px-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-4 pb-2">Kiểm định & Tiêu chuẩn</p>
          <Link to="/admin/grading-standards" className={`flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition ${location.pathname === '/admin/grading-standards' ? 'bg-teal-900/40 text-teal-400 border border-teal-500/30 font-bold' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}>
            <BookOpen size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Bộ tiêu chuẩn B2B</span>
          </Link>
          <Link to="/admin/lab-input" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <TestTube2 size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Nhập kết quả KĐ</span>
          </Link>
          <Link to="/admin/lab-history" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <ClipboardList size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Lịch sử kiểm định</span>
          </Link>

          <p className="px-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-4 pb-2">Cấu hình sàn</p>
          <Link to="/admin/categories" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <ListTree size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Danh mục phụ phẩm</span>
          </Link>
          <Link to="/admin/regions" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <MapPin size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Khu vực địa lý</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition hover:bg-gray-800 text-gray-400 hover:text-white">
            <Settings size={16} className="mr-3 opacity-80" />
            <span className="flex-1">Cài đặt sàn</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-900 border border-teal-500/50 flex items-center justify-center text-teal-400 text-xs font-bold">NT</div>
          <div>
            <p className="text-[13px] font-medium text-white">Nguyễn Thanh</p>
            <p className="text-[11px] text-gray-500 font-mono">super.admin</p>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-15 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="p-5 border-gray-800 flex items-center gap-2">
                      <div classNam="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center text-gray-900 shadow-lg shadow-teal-400/20">
                        <img src={BrandLogo} alt="AquaMarket Logo" className="h-9 w-auto object-contain" />
                      </div>
                      <div className="leading-none">
                        <span className="text-[15px] font-black text-black block">AquaMarket</span>
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Admin console</span>
                      </div>
                    </div>
          <h1 className="text-[16px] font-bold text-gray-900">
            Hệ thống Quản trị AquaTrade
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <input type="text" placeholder="Tìm kiếm..." className="bg-gray-100 border border-gray-200 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64 transition" />
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            
            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse"></span>
              Live · 14/05/2026
            </div>

            <div className="flex gap-2.5">
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-50 transition relative">
                <Bell size={16} />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
              </div>
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                <Settings size={16} />
              </div>
            </div>
          </div>
        </header>

        {/* Nội dung thay đổi của các trang con được đưa vào đây */}
        <div className="flex-1 overflow-auto bg-[#f8fafc]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// ================= COMPONENT BỌC HIỆU ỨNG CHUYỂN TRANG =================
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }} // Trang mới sẽ hơi mờ và nằm thấp xuống 1 chút
      animate={{ opacity: 1, y: 0 }}   // Nổi rõ lên và trượt vào vị trí gốc
      exit={{ opacity: 0, y: -5 }}     // Trang cũ mờ đi và trượt nhẹ lên trên
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// ================= KHỐI ROUTES ĐƯỢC TÁCH RA ĐỂ BẮT ĐƯỢC LOCATION =================
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    // mode="wait" giúp React xóa hẳn trang cũ xong mới bắt đầu render trang mới, triệt tiêu lỗi layout
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        {/* Auth Pages */}
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/verify-otp" element={<PageTransition><OtpPage /></PageTransition>} />

        {/* Main Application Pages */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/exchange" element={<PageTransition><Exchange /></PageTransition>} />
        <Route path="/listing-criteria" element={<PageTransition><ListingCriteria /></PageTransition>} />
        <Route path="/route-optimization" element={<PageTransition><RouteOptimizationResult /></PageTransition>} />
        
        {/* Dashboards */}
        <Route path="/seller" element={<PageTransition><SellerDashboard /></PageTransition>} />
        <Route path="/buyer" element={<PageTransition><BuyerDashboard /></PageTransition>} />

        {/* Admin Section */}
        <Route path="/admin" element={<PageTransition><AdminLayout /></PageTransition>}>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AquaMarketReports />} />
          <Route path="grading-standards" element={<GradingStandards />} />
          <Route path="categories" element={<CategoryConfig />} />
          <Route path="lab-input" element={<LabInput />} />
        </Route>

      </Routes>
    </AnimatePresence>
  );
};

// ================= MAIN APP COMPONENT =================
function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;