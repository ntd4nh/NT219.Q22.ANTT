import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
  Home, ArrowRightLeft, Navigation, Search, AlertTriangle, MapPin, Truck, MoreVertical
} from 'lucide-react';
import BrandLogo from '../assets/images/logo/brand.png';
// Xóa bỏ các import ảnh biểu đồ (giaVoTom, xuHuong) vì đã dùng biểu đồ thật

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Trạng thái mở/đóng menu dropdown cho 2 biểu đồ
  const [openMenu1, setOpenMenu1] = useState(false);
  const [openMenu2, setOpenMenu2] = useState(false);

  // ================= CẤU HÌNH BIỂU ĐỒ 1 =================
  const chart1Series = [{
    name: 'Giá vỏ tôm',
    data: [8500, 9800, 11200, 14200, 12700, 10900, 11600]
  }];
  const chart1Options = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
    colors: ['#0d9488'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.02, stops: [0, 95, 100] },
    },
    markers: { size: 4.5, colors: ['#ffffff'], strokeColors: '#0d9488', strokeWidth: 2, hover: { size: 6.5 } },
    xaxis: {
      categories: ['Ngày 1','Ngày 2','Ngày 3','Ngày 4','Ngày 5','Ngày 6','Ngày 7'],
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#94a3b8', fontSize: '11.5px' } },
    },
    yaxis: {
      min: 6000, max: 15000, tickAmount: 4,
      labels: {
        formatter: val => val.toLocaleString('vi-VN'),
        style: { colors: '#94a3b8', fontSize: '11.5px' },
      },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { left: 4, right: 12, top: 0, bottom: 0 } },
    tooltip: { y: { formatter: val => val.toLocaleString('vi-VN') + ' ₫' } },
    dataLabels: { enabled: false },
  };

  // ================= CẤU HÌNH BIỂU ĐỒ 2 =================
  const chart2Series = [
    { name: 'Cung', data: [12400, 13100, 14500, 15200, 16800, 17500, 18200] },
    { name: 'Cầu', data: [820, 540, 720, 380, 910, 460, 700] },
  ];
  const chart2Options = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
    colors: ['#f59e0b', '#166534'],
    stroke: { curve: 'smooth', width: [2.5, 2.5] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 95, 100] } },
    markers: { size: 4.5, colors: ['#ffffff', '#ffffff'], strokeColors: ['#f59e0b', '#166534'], strokeWidth: 2, hover: { size: 6.5 } },
    xaxis: {
      categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#94a3b8', fontSize: '11.5px' } },
    },
    yaxis: [
      {
        seriesName: 'Cung', min: 10000, max: 20000, tickAmount: 4,
        labels: { formatter: val => val.toLocaleString('vi-VN'), style: { colors: '#f59e0b', fontSize: '11px' } },
        title: { text: 'Cung', style: { color: '#f59e0b', fontSize: '11px', fontWeight: 500 } },
      },
      {
        seriesName: 'Cầu', opposite: true, min: 0, max: 1000, tickAmount: 4,
        labels: { formatter: val => val.toLocaleString('vi-VN'), style: { colors: '#166534', fontSize: '11px' } },
        title: { text: 'Cầu', style: { color: '#166534', fontSize: '11px', fontWeight: 500 } },
      },
    ],
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } }, padding: { left: 4, right: 4, top: 0, bottom: 0 } },
    legend: { show: false },
    tooltip: { shared: true, intersect: false, y: [{ formatter: val => val.toLocaleString('vi-VN') + ' tấn' }, { formatter: val => val.toLocaleString('vi-VN') + ' đơn' }] },
    dataLabels: { enabled: false },
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#0a192f] text-white flex flex-col shrink-0">
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<Home size={20} />} label="Trang chủ" active onClick={() => navigate('/home')} />
          <NavItem icon={<ArrowRightLeft size={20} />} label="Sàn Giao dịch" onClick={() => navigate('/exchange')} />
          <div className="border-t border-gray-700 mt-4 pt-4">
            <NavItem icon={<Navigation size={20} />} label="Theo dõi xe" badge="Mới" onClick={() => navigate('/route-optimization')} />
          </div>
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex space-x-6 text-sm font-medium text-gray-900">
            <div className="h-16 flex items-center px-6 border-gray-700">
              <img src={BrandLogo} alt="AquaMarket Logo" className="h-9 w-auto object-contain" />
              <span className="text-xl font-bold tracking-wide">AquaTrade</span>
            </div>
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
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-teal-700 border border-teal-700 rounded-full hover:bg-teal-50 transition"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 rounded-full hover:bg-teal-800 transition"
            >
              Đăng ký
            </button>
            <div className="w-8 h-8 bg-orange-200 text-orange-600 rounded-full flex items-center justify-center font-bold">
              U
            </div>
          </div>
        </header>

        {/* Dashboard Scrollable Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Sức khỏe Thị trường hôm nay</h2>
                  <p className="text-xs text-gray-500">Cập nhật thời gian thực</p>
                </div>
                <div className="space-x-2 flex">
                  <button className="px-3 py-1.5 border border-teal-600 text-teal-600 text-xs font-medium rounded hover:bg-teal-50 transition whitespace-nowrap">
                    Đăng ký bán
                  </button>
                  <button className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded hover:bg-teal-700 transition whitespace-nowrap">
                    Yêu cầu báo giá
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="py-2 px-3">Loại Phụ phẩm</th>
                      <th className="py-2 px-3">Nguồn cung</th>
                      <th className="py-2 px-3">Đơn vị</th>
                      <th className="py-2 px-3">Giá tham khảo</th>
                      <th className="py-2 px-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <TableRow item="Vỏ Tôm sú" source="Cà Mau" unit="12.5 tấn" price="15,000 đ/kg" status="Sẵn sàng" />
                    <TableRow item="Vỏ Tôm thẻ" source="Cà Mau" unit="12.5 tấn" price="12,000 đ/kg" status="Sẵn sàng" />
                    <TableRow item="Xương Cá" source="Cà Mau" unit="10.0 tấn" price="15,000 đ/kg" status="Sẵn sàng" />
                    <TableRow item="Đầu Mực" source="Cà Mau" unit="5.5 tấn" price="18,000 đ/kg" status="Sẵn sàng" />
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ================= KHU VỰC 2 BIỂU ĐỒ ================= */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Biến động giá */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="px-6 pt-5 flex justify-between items-start">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-800">Biến động giá vỏ tôm</h2>
                  <p className="text-[11.5px] text-gray-400 mt-0.5">7 ngày gần nhất</p>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu1(!openMenu1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                  {openMenu1 && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 text-sm">
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">Tải xuống PNG</div>
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">Xem chi tiết</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 pt-3 pb-1 flex items-center gap-4">
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Giá cao nhất</p>
                  <p className="font-bold text-[22px] text-gray-900 leading-none">14,200</p>
                </div>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Giá thấp nhất</p>
                  <p className="font-bold text-[22px] text-gray-900 leading-none">8,500</p>
                </div>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Xu hướng</p>
                  <span className="inline-flex items-center bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium mt-1">
                    ▲ +4.2%
                  </span>
                </div>
              </div>
              <div className="px-2">
                <Chart options={chart1Options} series={chart1Series} type="area" height={240} />
              </div>
            </div>

            {/* Card 2: Xu hướng Cung - Cầu */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="px-6 pt-5 flex justify-between items-start">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-800">Xu hướng Cung–Cầu</h2>
                  <p className="text-[11.5px] text-gray-400 mt-0.5">Tuần hiện tại</p>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu2(!openMenu2)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                  {openMenu2 && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 text-sm">
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">Tải xuống PNG</div>
                      <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer">Xem chi tiết</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 pt-3 pb-1 flex items-center gap-4">
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Cung TB</p>
                  <p className="font-bold text-[22px] text-gray-900 leading-none">15,840</p>
                </div>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-0.5">Cầu TB</p>
                  <p className="font-bold text-[22px] text-gray-900 leading-none">612</p>
                </div>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div className="flex gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Cung
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-700"></span> Cầu
                  </span>
                </div>
              </div>
              <div className="px-2">
                <Chart options={chart2Options} series={chart2Series} type="area" height={240} />
              </div>
            </div>

          </section>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center text-orange-700">
              <AlertTriangle size={20} className="mr-2 shrink-0" />
              <span className="font-medium text-sm">Cảnh báo hàng sắp hỏng tại trạm thu gom Phú Tân!</span>
            </div>
            <button className="px-4 py-1.5 bg-teal-600 text-white text-sm font-medium rounded hover:bg-teal-700 transition">
              Đăng ký bán hàng
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

// ================= SUBCOMPONENTS =================
const NavItem = ({ icon, label, active, badge, onClick }) => (
  <div onClick={onClick} className={`flex items-center px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-teal-900 text-teal-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
    <div className="mr-3">{icon}</div>
    <span className="flex-1 text-sm font-medium">{label}</span>
    {badge && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{badge}</span>}
  </div>
);

const TableRow = ({ item, source, unit, price, status }) => (
  <tr className="hover:bg-gray-50 transition">
    <td className="py-2 px-3 font-medium text-gray-800">{item}</td>
    <td className="py-2 px-3 text-gray-600">{source}</td>
    <td className="py-2 px-3 text-gray-600">{unit}</td>
    <td className="py-2 px-3 text-gray-600">{price}</td>
    <td className="py-2 px-3 text-center">
      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[11px] font-medium">
        {status}
      </span>
    </td>
  </tr>
);

export default LandingPage;