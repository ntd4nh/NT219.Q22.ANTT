import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Fish, Home, ArrowRightLeft, Truck, User, LifeBuoy,
  Navigation, Search, AlertTriangle, MoreVertical, MapPin,
  Package, Scale, FolderOpen, CheckCircle2, XCircle, X, ChevronRight
} from 'lucide-react';
import BrandLogo from '../assets/images/logo/brand.png';

const Exchange = () => {
  const navigate = useNavigate();

  // STATE điều khiển Modal chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // === Dữ liệu Biểu đồ Giao dịch ===
  const tradingData = [
    { date: '15/09', buyVolume: 4200, sellVolume: 3800, avgPrice: 125 },
    { date: '16/09', buyVolume: 3900, sellVolume: 4100, avgPrice: 122 },
    { date: '17/09', buyVolume: 5100, sellVolume: 4500, avgPrice: 128 },
    { date: '18/09', buyVolume: 4800, sellVolume: 5200, avgPrice: 130 },
    { date: '19/09', buyVolume: 5500, sellVolume: 5000, avgPrice: 135 },
    { date: '20/09', buyVolume: 6000, sellVolume: 5800, avgPrice: 138 },
    { date: '21/09', buyVolume: 6500, sellVolume: 6200, avgPrice: 142 },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#0a192f] text-white flex flex-col shrink-0 z-10">


        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<Home size={20} />} label="Trang chủ" onClick={() => navigate('/home')} />
          <NavItem icon={<ArrowRightLeft size={20} />} label="Sàn Giao dịch" active onClick={() => navigate('/exchange')} />
          <div className="border-t border-gray-700 mt-4 pt-4">
            <NavItem icon={<Navigation size={20} />} label="Theo dõi xe" badge="Mới" onClick={() => navigate('/route-optimization')} />
          </div>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 z-10">
          <div className="h-16 flex items-center px-6 border-b border-gray-700">
            <img src={BrandLogo} alt="AquaMarket Logo" className="h-8 w-auto object-contain" />
            <span className="text-xl font-bold tracking-wide ml-2">AquaTrade</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-gray-100 border-none rounded-full pl-4 pr-10 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64"
              />
              <Search size={16} className="absolute right-4 top-2 text-gray-400" />
            </div>
            <div className="w-8 h-8 bg-orange-200 text-orange-600 rounded-full flex items-center justify-center font-bold">
              U
            </div>
          </div>
        </header>

        {/* Dashboard Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* BANNER TÓM TẮT ĐẦU TRANG */}
          <section className="bg-[#f0f9fa] border border-[#d1eef6] rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="text-[14.5px] text-gray-800 font-medium">
                Hôm nay: <strong className="font-bold">9 lô hàng</strong> · <strong className="font-bold">18.4 tấn</strong> · Chuyến xe Thứ Ba sắp xuất phát
              </div>
              <button
                onClick={() => setIsDetailModalOpen(true)}
                className="text-red-500 hover:text-red-600 font-bold text-sm hover:underline transition-colors"
              >
                Xem Chi tiết
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <TopSummaryCard title="TỔNG LÔ" value="9" icon={<Package size={24} className="text-gray-400" />} />
              <TopSummaryCard title="TỔNG TẤN" value="18.4 tấn" icon={<Scale size={24} className="text-gray-400" />} />
              <TopSummaryCard title="SỐ CHUYẾN XE TUẦN NÀY" value="5" icon={<Truck size={24} className="text-gray-400" />} />
            </div>
          </section>


          {/* Biểu đồ Thị trường */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Biểu đồ Khối lượng */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Khối lượng Giao dịch (Tấn)</h3>
                <p className="text-xs text-gray-500">7 ngày gần nhất</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tradingData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="buyVolume" name="Khối lượng Mua" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="sellVolume" name="Khối lượng Bán" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Biểu đồ Giá trị */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Giá trị Giao dịch Trung bình (Triệu VNĐ/Tấn)</h3>
                <p className="text-xs text-gray-500">7 ngày gần nhất</p>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tradingData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="avgPrice" name="Giá TB" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>


          {/* Bảng Đơn hàng */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Danh sách Đơn hàng mới</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Mã ĐH</th>
                    <th className="py-3 px-4">Người bán</th>
                    <th className="py-3 px-4">Sản phẩm</th>
                    <th className="py-3 px-4">Số lượng</th>
                    <th className="py-3 px-4">Yêu cầu Vận chuyển</th>
                    <th className="py-3 px-4">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <OrderRow id="MI00001" seller="Người bán nguồn" product="Vỏ Tôm sú" qty="2,000 đ/kg" request="Vận chuyển" time="20/24-09-28" />
                  <OrderRow id="MI00002" seller="Người bán" product="Vỏ Tôm sú" qty="5,000 đ/kg" request="Vận chuyển" time="20/24-09-21" />
                  <OrderRow id="MI00003" seller="Người bán" product="Đầu Mực" qty="1,000 đ/kg" request="Vận chuyển" time="20/24-09-22" />
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>

      {/* ================= MODAL CHI TIẾT LÔ HÀNG ================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">

          <div className="bg-[#f4f7f9] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">

            {/* Nút Đóng */}
            <div className="flex justify-end p-2 pb-0">
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-800 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">

              {/* Top 3 KPI Cards trong Modal */}
              <div className="grid grid-cols-3 gap-4">
                <ModalKpiCard title="TỔNG LÔ NHẬN" value="12" icon={<FolderOpen size={24} className="text-blue-500" />} />
                <ModalKpiCard title="ĐỦ ĐIỀU KIỆN" value="9" icon={<CheckCircle2 size={24} className="text-white fill-green-500" />} color="green" />
                <ModalKpiCard title="TỪ CHỐI" value="3" icon={<XCircle size={24} className="text-white fill-red-500" />} color="red" />
              </div>

              {/* Grid Bảng và Biểu đồ */}
              <div className="grid grid-cols-3 gap-4">

                {/* Bảng Lô bị từ chối */}
                <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <h3 className="font-bold text-gray-800 p-4 border-b border-gray-100 bg-white">Bảng Lô bị Từ chối</h3>
                  <div className="overflow-auto p-2">
                    <table className="w-full text-left text-sm">
                      <thead className="text-gray-600 bg-gray-50/50">
                        <tr>
                          <th className="py-2.5 px-4 font-medium border-b border-gray-100">ID</th>
                          <th className="py-2.5 px-4 font-medium border-b border-gray-100">Tên sản phẩm</th>
                          <th className="py-2.5 px-4 font-medium border-b border-gray-100">Tỉnh</th>
                          <th className="py-2.5 px-4 font-medium border-b border-gray-100">Lý do từ chối</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4 text-gray-700">LOT-003</td>
                          <td className="py-3 px-4 text-gray-700">Phế phẩm cá tra</td>
                          <td className="py-3 px-4 text-gray-700">Đồng Tháp</td>
                          <td className="py-2 px-2">
                            <div className="bg-[#ffe8e8] text-[#c92a2a] text-[13px] px-3 py-1.5 rounded flex items-start gap-1">
                              <X size={14} className="mt-0.5 shrink-0" /> Khối lượng 450kg dưới mức tối thiểu 1.000kg
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-50 bg-[#fff5f5]">
                          <td className="py-3 px-4 text-gray-700">LOT-007</td>
                          <td className="py-3 px-4 text-gray-700">Đầu tôm</td>
                          <td className="py-3 px-4 text-gray-700">Sóc Trăng</td>
                          <td className="py-2 px-2">
                            <div className="bg-[#ffe8e8] text-[#c92a2a] text-[13px] px-3 py-1.5 rounded flex items-start gap-1">
                              <X size={14} className="mt-0.5 shrink-0" /> Chi phí vận chuyển ước tính (280.000đ) chiếm 32% giá trị lô — vượt ngưỡng cho phép 30%
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <td className="py-3 px-4 text-gray-700">LOT-001</td>
                          <td className="py-3 px-4 text-gray-700">Vỏ tôm sú</td>
                          <td className="py-3 px-4 text-gray-700">Cà Mau</td>
                          <td className="py-2 px-2"></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 text-gray-700">LOT-002</td>
                          <td className="py-3 px-4 text-gray-700">Vỏ tôm thẻ</td>
                          <td className="py-3 px-4 text-gray-700">Cà Mau</td>
                          <td className="py-2 px-2"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cột Biểu đồ */}
                <div className="col-span-1 flex flex-col gap-4">
                  {/* Card Biểu đồ */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 flex flex-col items-center">
                    <div className="w-full text-left mb-4">
                      <h3 className="font-bold text-gray-800 text-sm">Biểu đồ Tỷ lệ</h3>
                      <p className="text-[11px] text-gray-500">Kết quả Kiểm tra</p>
                    </div>

                    {/* CSS Pie Chart */}
                    <div className="relative w-36 h-36 rounded-full mb-6 shadow-sm overflow-hidden"
                      style={{ background: 'conic-gradient(#ef4444 0% 25%, #22c55e 25% 100%)' }}>
                      <div className="absolute top-0 right-0 w-1/2 h-1/2 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">25%</span>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1/2 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">75%</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 text-[11px] font-bold text-gray-600 w-full justify-center mt-auto">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#22c55e] rounded-sm"></div> Approved 75%</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#ef4444] rounded-sm"></div> Rejected 25%</div>
                    </div>
                  </div>

                  {/* Nút CTA chuyển sang Listing Criteria */}
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      navigate('/listing-criteria');
                    }}
                    className="w-full bg-gradient-to-r from-emerald-400 to-blue-500 hover:from-emerald-500 hover:to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex justify-between items-center transition-all"
                  >
                    <span>Xem tiêu chí</span>
                    <ChevronRight size={20} />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ================= SUBCOMPONENTS =================

const TopSummaryCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-100 flex justify-between items-center shadow-sm">
    <div className="flex flex-col">
      <span className="text-[11px] text-gray-500 font-semibold mb-1 uppercase tracking-wide">{title}</span>
      <span className="text-2xl font-black text-gray-800 leading-none">{value}</span>
    </div>
    <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const ModalKpiCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200 flex justify-between items-center shadow-sm">
    <div className="flex flex-col">
      <span className="text-[11px] text-gray-500 font-bold mb-1 uppercase tracking-wider">{title}</span>
      <span className="text-3xl font-black text-gray-800 leading-none">{value}</span>
    </div>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color === 'green' ? 'bg-green-50' : color === 'red' ? 'bg-red-50' : 'bg-blue-50'}`}>
      {icon}
    </div>
  </div>
);



const NavItem = ({ icon, label, active, badge, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors ${active ? 'bg-teal-900 text-teal-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
  >
    <div className="mr-3">{icon}</div>
    <span className="flex-1 text-sm font-medium text-left">{label}</span>
    {badge && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const Slider = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-gray-300 mb-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="w-full bg-gray-600 h-1.5 rounded-full relative">
      <div className="bg-teal-500 h-1.5 rounded-full w-2/3"></div>
      <div className="w-3 h-3 bg-white border-2 border-teal-500 rounded-full absolute top-1/2 transform -translate-y-1/2 left-2/3"></div>
    </div>
  </div>
);

const OrderRow = ({ id, seller, product, qty, request, time }) => (
  <tr className="hover:bg-gray-50 transition text-gray-600">
    <td className="py-3 px-4 font-medium">{id}</td>
    <td className="py-3 px-4">{seller}</td>
    <td className="py-3 px-4">{product}</td>
    <td className="py-3 px-4">{qty}</td>
    <td className="py-3 px-4">{request}</td>
    <td className="py-3 px-4">{time}</td>
  </tr>
);

export default Exchange;