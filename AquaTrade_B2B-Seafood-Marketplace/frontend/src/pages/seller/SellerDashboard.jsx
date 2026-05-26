import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fish, Bell, LayoutDashboard, Package, PlusCircle,
  TrendingUp, ScrollText, Star, Building2, FileText,
  MapPin, ImagePlus, FileCheck, Home, ArrowRightLeft, Navigation
} from 'lucide-react';
import BrandLogo from '../../assets/images/logo/brand.png';

const SellerDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* SIDEBAR */}
      <aside className="w-56 bg-[#0a192f] text-gray-300 flex flex-col shrink-0 border-r border-gray-800 overflow-y-auto">
{/* <<<<<<< HEAD
=======
        <div className="p-5 border-b border-gray-800 flex items-center gap-2">
          <img src="/logo.png" alt="AquaTrade Logo" className="h-8 w-auto object-contain" />
          <div className="leading-none">
            <span className="text-[15px] font-black text-white block">AquaTrade</span>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">B2B · Người Bán</span>
          </div>
        </div>
>>>>>>> b1b451263ae0f230bd852a204722c373ff9e64dd */}

        <div className="m-4 p-2.5 bg-teal-900/30 border border-teal-500/30 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shrink-0"></div>
          <div>
            <p className="text-[11px] font-medium text-teal-400">Người Bán · Active</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Nhà Máy Phước An</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 pb-4">
          <NavSection label="Điều hướng chính" />
          <NavItem icon={<LayoutDashboard size={16} />} label="Trang chủ" active onClick={() => navigate('/seller')} />
          <NavItem icon={<ArrowRightLeft size={16} />} label="Sàn giao dịch" onClick={() => navigate('/exchange')} />
          <NavItem icon={<Navigation size={16} />} label="Theo dõi xe" badge="Mới" badgeColor="bg-orange-500" onClick={() => navigate('/route-optimization')} />

          <NavSection label="Quản Lý Lô Hàng" />
          <NavItem icon={<Package size={16} />} label="Lô hàng của tôi" badge="8" badgeColor="bg-teal-500" />
          {/* <NavItem icon={<PlusCircle size={16} />} label="Đăng lô hàng mới" /> */}

          <NavSection label="Kinh Doanh" />
          <NavItem icon={<TrendingUp size={16} />} label="Doanh thu & Thống kê" />
          <NavItem icon={<ScrollText size={16} />} label="Lịch sử giao dịch" badge="2" badgeColor="bg-orange-500" />
          {/* <NavItem icon={<Star size={16} />} label="Đánh giá của tôi" /> */}

          <NavSection label="Tài Khoản" />
          <NavItem icon={<Building2 size={16} />} label="Hồ sơ nhà máy" />
          <NavItem icon={<FileText size={16} />} label="COA & Giấy tờ" />
        </nav>

        <div className="p-4 border-t border-gray-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-900 border border-teal-500/50 flex items-center justify-center text-teal-400 text-xs font-bold">PA</div>
          <div>
            <p className="text-[13px] font-medium text-white">Nguyễn Thị Lan</p>
            <p className="text-[11px] text-gray-500 font-mono">Quản lý kinh doanh</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-15 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="p-5 border-gray-800 flex items-center gap-2">
            <div classNam="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center text-gray-900 shadow-lg shadow-teal-400/20">
              <img src={BrandLogo} alt="AquaMarket Logo" className="h-9 w-auto object-contain" />
            </div>
            <div className="leading-none">
              <span className="text-[15px] font-black text-black block">AquaMarket</span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">B2B · Người Bán</span>
            </div>
          </div>
          <h1 className="text-[17px] font-bold text-gray-900">Dashboard Người Bán</h1>
          <div className="flex items-center gap-2.5">
            <button className="px-4 py-2 border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-300 text-[13px] font-medium rounded-lg transition">Tải COA mới</button>
            <button className="px-4 py-2 bg-teal-500 text-white text-[13px] font-semibold rounded-lg hover:bg-teal-600 transition">+ Đăng Lô Hàng Mới</button>
            <div className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 relative cursor-pointer hover:bg-gray-50">
              <Bell size={16} />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 border border-white rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-[#fafafa]">
          {/* STATS */}
          <div className="grid grid-cols-5 gap-3 mb-7">
            <StatCard title="Lô đang bán" val="5" sub="3 có COA hợp lệ" color="teal" />
            <StatCard title="Lô đã bán (tháng)" val="12" sub="↑ 4 so với tháng trước" color="blue" />
            <StatCard title="Doanh thu tháng" val="312M" sub="VND · 12 giao dịch" color="orange" />
            <StatCard title="Lô sắp hết hạn" val="2" sub="1 hết hạn trong 7 ngày" color="red" />
            <StatCard title="Đánh giá trung bình" val="4.8" sub="Từ 31 người mua" color="blue" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-7">
            {/* LOT LIST */}
            <div className="xl:col-span-7 2xl:col-span-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-gray-900">Lô Hàng Của Tôi</h2>
              </div>
              <div className="flex gap-1 mb-4">
                <button className="px-4 py-1.5 bg-teal-50 border border-teal-200 text-teal-600 text-[13px] rounded-md font-medium">Đang bán (5)</button>
                <button className="px-4 py-1.5 text-gray-500 text-[13px] hover:bg-gray-100 rounded-md">Đã bán (12)</button>
                <button className="px-4 py-1.5 text-gray-500 text-[13px] hover:bg-gray-100 rounded-md">Hết hạn (2)</button>
              </div>

              <div className="space-y-2.5">
                <LotCard
                  name="Vỏ Tôm Sú Sấy – Cà Mau" id="LOT-2024-0841 · Đăng 3 ngày trước"
                  grade="A" status="Đang bán" coa="✔ COA còn 68 ngày"
                  price="18,500" total="5,000 kg · 92.5M VND"
                  vol="5,000 kg" view="247 lượt" dep="1 người" timeLeft="18 ngày"
                  loc="Cà Mau" interaction="82%"
                />
                <LotCard
                  name="Hỗn Hợp Tôm Thẻ – Bạc Liêu" id="LOT-2024-0838 · Đăng 5 ngày trước"
                  grade="B" status="Đang bán" depBadge="⏳ Đã đặt cọc"
                  price="12,300" total="10,000 kg · 123M VND"
                  vol="10,000 kg" view="189 lượt" dep="30% · đã nhận" timeLeft="31 ngày"
                  loc="Bạc Liêu" buyer="Công Ty Hải Vương"
                />
              </div>
            </div>

            {/* FORM NEW LOT */}
            <div className="xl:col-span-5 2xl:col-span-4 bg-white border border-teal-200 rounded-xl overflow-hidden h-fit sticky top-0 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-[14px]">Đăng Lô Hàng Mới</h3>
                <span className="text-[10px] font-mono text-gray-500">Bước 1 / 3</span>
              </div>
              <div className="p-5 space-y-3.5">
                <InputGroup label="Loại phụ phẩm" isSelect />
                <div className="grid grid-cols-2 gap-2.5">
                  <InputGroup label="Loài tôm / cá" isSelect />
                  <InputGroup label="Cấp phân loại" isSelect />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <InputGroup label="Khối lượng (kg)" val="5000" />
                  <InputGroup label="Đơn giá (VND/kg)" val="18500" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-[12px] text-gray-500">Tổng giá trị lô</p>
                    <p className="text-[11.5px] text-gray-400 mt-1">5,000 kg × 18,500 VND/kg</p>
                  </div>
                  <span className="text-xl font-bold text-teal-500">92,500,000</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <InputGroup label="Hạn sử dụng" val="2025-07-15" type="date" />
                  <InputGroup label="Tỉnh / Kho hàng" isSelect />
                </div>

                {/* Upload Khu vực */}
                <div>
                  <label className="text-[9.5px] font-mono uppercase text-gray-500 mb-1 block">Hình ảnh lô hàng</label>
                  <div className="border-[1.5px] border-dashed border-gray-300 rounded-lg p-5 text-center bg-gray-50 cursor-pointer hover:border-teal-400 transition flex flex-col items-center justify-center">
                    <ImagePlus size={24} className="text-gray-400 mb-2" />
                    <p className="text-[12.5px] text-gray-500">Kéo thả hoặc nhấn để tải ảnh</p>
                    <p className="text-[11px] text-gray-400 mt-1">Chuẩn: 1m² nền phẳng, có thước đo</p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck size={20} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-[12.5px] font-medium text-green-700">COA đã tải · VILAS-012 · HCM</p>
                      <p className="text-[11px] text-gray-500">Hiệu lực đến 18/07/2025 · 68 ngày</p>
                    </div>
                  </div>
                  <button className="bg-green-600 text-white text-[11px] px-3 py-1.5 rounded font-medium">Thay thế</button>
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-gray-100 flex gap-2 bg-gray-50">
                <button className="flex-1 py-2 text-[13px] font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-white">Lưu Nháp</button>
                <button className="flex-1 py-2 text-[13px] font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 shadow-sm">Tiếp Theo →</button>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-7" />

          {/* DOANH THU & REVIEWS */}
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Doanh Thu & Thống Kê</h2>
          <div className="grid grid-cols-2 gap-5 mb-7">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[10px] font-mono uppercase text-gray-500 mb-4 tracking-widest">Doanh thu theo tháng (Triệu VND)</p>
              <div className="flex items-end gap-1.5 h-25">
                {[42, 61, 53, 78, 66].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-teal-50 border border-teal-200 rounded-t-sm" style={{ height: `${h}px` }}></div>
                    <span className="text-[9px] font-mono text-gray-400">T{i + 12 > 12 ? i : i + 12}</span>
                  </div>
                ))}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-teal-500 rounded-t-sm" style={{ height: `100px` }}></div>
                  <span className="text-[9px] font-mono text-teal-600 font-bold">T5</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-14 border-teal-500 border-l-orange-400 border-b-teal-200 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <p className="text-sm font-bold leading-none">312M</p>
                  <p className="text-[8px] font-mono text-gray-500">VND</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-mono uppercase text-gray-500 mb-1 tracking-widest">Cơ cấu doanh thu</p>
                <div className="flex justify-between text-[12.5px]"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-orange-400 rounded-sm"></span> Cấp A · Vỏ tôm</span> <span className="font-mono text-[11px] text-gray-500">45%</span></div>
                <div className="flex justify-between text-[12.5px]"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-teal-400 rounded-sm"></span> Cấp B · Hỗn hợp</span> <span className="font-mono text-[11px] text-gray-500">33%</span></div>
                <div className="flex justify-between text-[12.5px]"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-teal-200 rounded-sm"></span> Cấp C · Đầu tôm</span> <span className="font-mono text-[11px] text-gray-500">22%</span></div>
              </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Đánh Giá Từ Người Mua</h2>
            <button className="text-[13px] text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">Xem tất cả 31 đánh giá</button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-sm flex items-center gap-8 mb-4">
            <div className="text-center shrink-0">
              <p className="text-[48px] font-black text-teal-500 leading-none tracking-tighter">4.8</p>
              <div className="flex text-orange-400 justify-center my-1">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>
              <p className="text-[12px] text-gray-500 font-mono">31 đánh giá</p>
            </div>
            <div className="flex-1 space-y-1.5 max-w-xs">
              <ScoreBar star="5★" pct="80%" count="25" />
              <ScoreBar star="4★" pct="13%" count="4" color="bg-teal-400" />
              <ScoreBar star="3★" pct="6%" count="2" color="bg-orange-400" />
              <ScoreBar star="2★" pct="0%" count="0" />
              <ScoreBar star="1★" pct="0%" count="0" />
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <ScoreHi val="100%" label="Giao đúng hạn" />
              <ScoreHi val="97%" label="COA chính xác" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ReviewCard name="Cty TNHH Hải Vương" avatar="HV" lot="LOT-2024-0821 · Cấp A" stars={5} text="Vỏ tôm chất lượng rất tốt, tỷ lệ vỏ thân đúng như công bố 78%. COA khớp hoàn toàn với kết quả kiểm tra nội bộ." tags={['Đúng cấp hàng', 'COA chính xác']} date="12/05/2025" />
            <ReviewCard name="Nhà Máy Bình Phú" avatar="BP" lot="LOT-2024-0809 · Cấp B" stars={4} text="Hàng đúng mô tả, protein đạt 29%. Trừ 1 sao vì ảnh lô hàng chưa đủ chuẩn. Tuy nhiên chất lượng thực tế rất ổn." tags={['Chất lượng tốt', 'Cần cải thiện ảnh']} date="08/05/2025" color="text-blue-500" />
            <ReviewCard name="Cty Dược Biển Xanh" avatar="DB" lot="LOT-2024-0799 · Cấp A" stars={5} text="Chitin tiềm năng cao hơn kỳ vọng. Nhà máy phản hồi nhanh, phối hợp xuất hóa đơn thuận tiện. Đối tác tin cậy." tags={['Chitin cao', 'Đối tác lâu dài']} date="28/04/2025" color="text-orange-500" />
          </div>

        </div>
      </main>
    </div>
  );
};

// SUB-COMPONENTS
const NavSection = ({ label }) => <p className="px-3 text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-4 pb-2">{label}</p>;
const NavItem = ({ icon, label, active, badge, badgeColor, onClick }) => (
  <a href="#" onClick={(e) => { e.preventDefault(); if(onClick) onClick(); }} className={`flex items-center px-3 py-2.5 rounded-lg text-[13.5px] transition ${active ? 'bg-teal-900/40 text-teal-400 border border-teal-500/30' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}>
    <span className="mr-3 opacity-80">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge && <span className={`${badgeColor} text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full`}>{badge}</span>}
  </a>
);

const StatCard = ({ title, val, sub, color }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
    <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-${color === 'teal' ? 'teal-500' : color === 'blue' ? 'blue-500' : color === 'orange' ? 'orange-500' : 'red-500'}`}></div>
    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">{title}</p>
    <p className="text-[24px] font-bold text-gray-900 leading-none">{val}</p>
    <p className="text-[11.5px] text-gray-500 mt-1.5">{sub}</p>
  </div>
);

const LotCard = ({ name, id, grade, status, coa, depBadge, price, total, vol, view, dep, timeLeft, loc, interaction, buyer }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition">
    <div className="flex justify-between items-start mb-3">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
          <Fish size={24} />
        </div>
        <div>
          <h4 className="font-bold text-[14.5px] text-gray-900 leading-tight mb-1">{name}</h4>
          <p className="text-[10px] font-mono text-gray-400">{id}</p>
          <div className="flex gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 bg-orange-50 text-orange-500 border border-orange-200 text-[10px] font-mono rounded-full">Cấp {grade}</span>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-200 text-[10px] font-mono rounded-full">● {status}</span>
            {coa && <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 text-[10px] font-mono rounded-full">{coa}</span>}
            {depBadge && <span className="px-2 py-0.5 bg-orange-50 text-orange-500 border border-orange-200 text-[10px] font-mono rounded-full">{depBadge}</span>}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[19px] font-bold text-teal-500 leading-none">{price}</p>
        <p className="text-[11px] text-gray-500 mt-1">VND / kg</p>
        <p className="text-[12px] text-gray-500 mt-0.5">{total}</p>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2 mb-3">
      <Spec k="Khối lượng" v={vol} />
      <Spec k="Đã xem" v={view} color="text-teal-600" />
      <Spec k="Đặt cọc" v={dep} color="text-orange-500" />
      <Spec k="Còn lại" v={timeLeft} />
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
      <div className="flex gap-4">
        <span className="text-[12px] text-gray-500 flex items-center gap-1"><MapPin size={12} /> {loc}</span>
        {interaction && (
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
            <div className="w-14 h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{ width: interaction }}></div></div>
            {interaction} tương tác
          </div>
        )}
        {buyer && <span className="text-[12px] text-gray-500">Người mua: <strong className="text-gray-800">{buyer}</strong></span>}
      </div>
      <div className="flex gap-1.5">
        <button className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50">Xem hợp đồng</button>
        <button className="px-3 py-1.5 text-[12px] bg-teal-500 text-white rounded-lg font-medium shadow-sm">Xác nhận giao hàng</button>
      </div>
    </div>
  </div>
);

const Spec = ({ k, v, color = "text-gray-800" }) => (
  <div className="bg-gray-50 rounded-lg p-2">
    <p className="text-[9px] font-mono uppercase text-gray-500 mb-0.5">{k}</p>
    <p className={`text-[13px] font-medium ${color}`}>{v}</p>
  </div>
);

const InputGroup = ({ label, isSelect, val, type = "text" }) => (
  <div>
    <label className="text-[9.5px] font-mono uppercase text-gray-500 mb-1 block">{label}</label>
    {isSelect ? (
      <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] text-gray-800 outline-none focus:border-teal-400"><option>Vui lòng chọn...</option></select>
    ) : (
      <input type={type} defaultValue={val} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] text-gray-800 outline-none focus:border-teal-400" />
    )}
  </div>
);

const ScoreBar = ({ star, pct, count, color = "bg-teal-500" }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-mono text-gray-500 w-4 text-right">{star}</span>
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: pct }}></div>
    </div>
    <span className="text-[10px] font-mono text-gray-400 w-4">{count}</span>
  </div>
);

const ScoreHi = ({ val, label }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center w-28">
    <p className="text-[18px] font-bold text-gray-800 leading-none">{val}</p>
    <p className="text-[11px] font-mono text-gray-500 mt-1">{label}</p>
  </div>
);

const ReviewCard = ({ name, avatar, lot, stars, text, tags, date, color = "text-teal-500" }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-[11px] font-bold ${color}`}>{avatar}</div>
        <div>
          <p className="text-[13px] font-medium text-gray-800">{name}</p>
          <p className="text-[11px] font-mono text-gray-500">{lot}</p>
        </div>
      </div>
      <div className="flex text-orange-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={12} fill={i < stars ? "currentColor" : "none"} className={i >= stars ? "text-gray-300" : ""} />
        ))}
      </div>
    </div>
    <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3">{text}</p>
    <div className="flex flex-wrap gap-1 mb-3">
      {tags.map(t => <span key={t} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-[10px] text-gray-500 rounded-full">{t}</span>)}
    </div>
    <p className="text-[10px] font-mono text-gray-400">{date}</p>
  </div>
);

export default SellerDashboard;