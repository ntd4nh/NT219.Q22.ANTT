import React, { useState } from 'react';
import {
  Fish, Store, ShoppingCart, Wallet, Heart, BellRing,
  Search, Bell, User, ArrowUpDown, List, Grid,
  MapPin, FileCheck, Lock, Building2, Calendar,
  FileText, Phone, ChevronDown, Play, Box,
  X, Paperclip, Sparkles, Home, ArrowRightLeft, Navigation, LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import shrimp_head_main from '../../assets/images/productimg/dau-tom-su-dong-lanh.jpg';
import pangasius_powder_main from '../../assets/images/productimg/bot-ca-tra.jpg';
import pangasius_oil_main from '../../assets/images/productimg/mo-ca-tra.jpg';
import BrandLogo from '../../assets/images/logo/brand.png';



const placeholderImage = 'https://via.placeholder.com/600x600?text=Ảnh+Sản+Phẩm';
const shrimp_shell_main = 'https://via.placeholder.com/600x600/fff3e0/e65100?text=Vỏ+Tôm+Sú';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  // 1. DỮ LIỆU ĐỘNG (MOCK DATA)
  const mockLots = [
    {
      id: "BCT-60-DT-2025",
      hsCode: "2301.20.10",
      species: "Pangasianodon hypophthalmus",
      name: "Bột Cá Tra Phụ Phẩm 60% Đạm – Nguyên liệu thức ăn thủy sản & gia súc gia cầm, đóng bao 50kg, xuất từ nhà máy Đồng Tháp",
      tags: [
        { label: "Thức ăn chăn nuôi", color: "bg-red-50 text-red-600 border-red-100" },
        { label: "Đang có hàng", color: "bg-green-50 text-green-700 border-green-100" },
        { label: "Mới đăng", color: "bg-yellow-400 text-gray-900 border-yellow-500 font-bold" }
      ],
      specs: [
        { label: "Đạm thô (CP)", val: "≥60", unit: "%" },
        { label: "Độ ẩm", val: "≤12", unit: "%" },
        { label: "Béo thô", val: "≤12", unit: "%" },
        { label: "Tro", val: "≤22", unit: "%" }
      ],
      priceBlock: {
        main: "8.500.000",
        unit: "đồng / Tấn (1.000 kg)",
        sub: "≈ 8.500 đ/kg · Giá CIF +150.000–300.000đ/tấn tùy tỉnh"
      },
      logistics: [
        { label: "SL TỐI THIỂU (MOQ)", val: "5 Tấn / đơn" },
        { label: "KHẢ NĂNG CUNG ỨNG", val: "500 T/tháng" },
        { label: "NƠI XUẤT HÀNG", val: "Đồng Tháp" },
        { label: "GIAO HÀNG", val: "Xe tải 5–20T" }
      ],
      pricingTable: [
        { qty: "5 – 20 tấn", price: "9.000.000", payment: "CK 30% trước, 70% khi nhận hàng", time: "3–5 ngày" },
        { qty: "21 – 50 tấn", price: "8.700.000", payment: "CK 50% – 50%, hợp đồng KT", time: "5–7 ngày" },
        { qty: ">50 tấn (HĐ dài hạn) ★", price: "8.200.000", payment: "Net 15 ngày (đối tác uy tín)", time: "7–10 ngày" }
      ],
      seller: {
        name: "CÔNG TY TNHH CHẾ BIẾN TS ĐỒNG THÁP HẢI",
        avatar: "ĐTH",
        type: "Nhà máy sản xuất",
        loc: "Huyện Châu Thành, Đồng Tháp",
        est: "Thành lập 2008",
        certs: ["HACCP", "ISO 22000", "Giấy ATTP", "ASC CoC"]
      },
      shortPrice: "8,500",
      shortTotal: "8.5M / Tấn",
      imageUrls: {
        main: pangasius_powder_main,
        thumbs: [pangasius_powder_main]
      }
    },
    {
      id: "LOT-2024-0841",
      hsCode: "0511.91.00",
      species: "Penaeus monodon",
      name: "Vỏ Tôm Sú Sấy – Cà Mau (Premium Cấp A)",
      tags: [
        { label: "Chiết xuất Chitin", color: "bg-blue-50 text-blue-600 border-blue-100" },
        { label: "Đang có hàng", color: "bg-green-50 text-green-700 border-green-100" }
      ],
      specs: [
        { label: "Đạm thô", val: "≥38", unit: "%" },
        { label: "Độ ẩm", val: "≤9.2", unit: "%" },
        { label: "Tỷ lệ vỏ thân", val: "≥78", unit: "%" },
        { label: "Tạp chất", val: "≤1", unit: "%" }
      ],
      priceBlock: {
        main: "18.500.000",
        unit: "đồng / Tấn",
        sub: "≈ 18.500 đ/kg · Giá tại kho Cà Mau"
      },
      logistics: [
        { label: "SL TỐI THIỂU (MOQ)", val: "2 Tấn / đơn" },
        { label: "KHẢ NĂNG CUNG ỨNG", val: "50 T/tháng" },
        { label: "NƠI XUẤT HÀNG", val: "Cà Mau" },
        { label: "GIAO HÀNG", val: "Xe tải 8T" }
      ],
      pricingTable: [
        { qty: "2 – 10 tấn", price: "18.500.000", payment: "Tiền mặt / CK 100%", time: "1–2 ngày" },
        { qty: ">10 tấn", price: "18.000.000", payment: "Hợp đồng nguyên tắc", time: "3–5 ngày" }
      ],
      seller: {
        name: "CTY TNHH THỦY SẢN CÀ MAU",
        avatar: "CM",
        type: "Xưởng sơ chế",
        loc: "Năm Căn, Cà Mau",
        est: "Thành lập 2015",
        certs: ["Giấy ATTP"]
      },
      shortPrice: "18,500",
      shortTotal: "92.5M / Lô",
      imageUrls: {
        main: shrimp_shell_main,
        thumbs: [shrimp_shell_main]
      }
    },
    {
      id: "MCT-TL-AG-2025",
      hsCode: "1504.20.10",
      species: "Pangasius bocourti / hypophthalmus",
      name: "Mỡ Cá Tra / Basa Tinh Luyện – Dầu cá nội địa đa dụng: thức ăn chăn nuôi, biodiesel, đóng bao 50kg, xuất từ nhà máy An Giang",
      tags: [
        { label: "Thức ăn chăn nuôi", color: "bg-red-50 text-red-600 border-red-100" },
        { label: "Đang có hàng", color: "bg-green-50 text-green-700 border-green-100" },
        { label: "Hàng tồn kho nhiều", color: "bg-blue-50 text-blue-700 border-blue-100" }
      ],
      specs: [
        { label: "Đạm thô (CP)", val: "≥62", unit: "%" },
        { label: "Độ ẩm", val: "≤10", unit: "%" },
        { label: "Béo thô", val: "≤15", unit: "%" },
        { label: "Tro", val: "≤20", unit: "%" }
      ],
      priceBlock: {
        main: "22.000.000",
        unit: "đồng / Tấn (1.000 kg)",
        sub: "≈ 22.000 đ/kg · Giá FOB chưa bao gồm bao bì 50kg"
      },
      logistics: [
        { label: "SL TỐI THIỂU (MOQ)", val: "3 Tấn / đơn" },
        { label: "KHẢ NĂNG CUNG ỨNG", val: "200 T/tháng" },
        { label: "NƠI XUẤT HÀNG", val: "An Giang" },
        { label: "GIAO HÀNG", val: "Xe tải 5–20T" }
      ],
      pricingTable: [
        { qty: "3 – 10 tấn", price: "23.000.000", payment: "CK 30% trước, 70% khi nhận hàng", time: "2–4 ngày" },
        { qty: "11 – 30 tấn", price: "22.500.000", payment: "CK 50% – 50%, hợp đồng KT", time: "3–5 ngày" },
        { qty: ">30 tấn (HĐ dài hạn) ★", price: "21.500.000", payment: "Net 15 ngày (đối tác uy tín)", time: "5–7 ngày" }
      ],
      seller: {
        name: "CÔNG TY CP THỦY SẢN AN GIANG FOOD (AGF)",
        avatar: "AGF",
        type: "Nhà sản xuất",
        loc: "TP. Châu Đốc, An Giang",
        est: "Thành lập 2003",
        certs: ["HACCP", "ISO 22000", "Giấy ATTP", "CODEX Grade"]
      },
      shortPrice: "22,000",
      shortTotal: "22M / Tấn",
      imageUrls: {
        main: pangasius_oil_main,
        thumbs: [pangasius_oil_main]
      }
    },
    {
      id: "DTS-IQF-CM-2025",
      hsCode: "0306.99.90",
      species: "Penaeus monodon",
      name: "Đầu Tôm Sú Đông Lạnh IQF – Nguyên liệu chiết xuất Chitin/Chitosan công nghiệp & thức ăn thủy sản, đóng bao 10kg, xuất tại Cà Mau",
      tags: [
        { label: "TĂCN thủy sản", color: "bg-orange-50 text-orange-600 border-orange-100" },
        { label: "Đang có hàng", color: "bg-green-50 text-green-700 border-green-100" },
        { label: "Hàng tồn kho nhiều", color: "bg-blue-50 text-blue-700 border-blue-100" }
      ],
      specs: [
        { label: "Độ ẩm", val: "≤78", unit: "%" },
        { label: "Đạm", val: "≥18", unit: "%" },
        { label: "Béo", val: "≤5", unit: "%" },
        { label: "Độ tươi IQF", val: "≥90", unit: "%" }
      ],
      priceBlock: {
        main: "4.500.000",
        unit: "đồng / Tấn (1.000 kg)",
        sub: "≈ 4.500 đ/kg · Giá CIF +150.000–300.000đ/tấn tùy tỉnh"
      },
      logistics: [
        { label: "SL TỐI THIỂU (MOQ)", val: "3 Tấn / đơn" },
        { label: "KHẢ NĂNG CUNG ỨNG", val: "800 T/tháng" },
        { label: "NƠI XUẤT HÀNG", val: "Cà Mau" },
        { label: "GIAO HÀNG", val: "Xe đông lạnh" }
      ],
      pricingTable: [
        { qty: "3 – 10 tấn", price: "5.000.000", payment: "CK 30% trước, 70% khi nhận hàng", time: "3–5 ngày" },
        { qty: "11 – 30 tấn", price: "4.700.000", payment: "CK 50% – 50%, hợp đồng KT", time: "5–8 ngày" },
        { qty: ">30 tấn (HĐ dài hạn) ★", price: "4.200.000", payment: "Net 15 ngày (đối tác uy tín)", time: "7–12 ngày" }
      ],
      seller: {
        name: "CÔNG TY CP CHẾ BIẾN TS CÀ MAU QUỐC TẾ (CMQ)",
        avatar: "CMQ",
        type: "Nhà sản xuất",
        loc: "KCN Khánh An, Cà Mau",
        est: "Thành lập 2010",
        certs: ["HACCP", "ISO 22000", "BAP 4-Star", "Giấy ATTP", "ASC CoC"]
      },
      shortPrice: "4,500",
      shortTotal: "4.5M / Tấn",
      imageUrls: {
        main: shrimp_head_main,
        thumbs: [shrimp_head_main]
      }
    }
  ];

  const [selectedLot, setSelectedLot] = useState(mockLots[0]);
  const [selectedDetailImage, setSelectedDetailImage] = useState(selectedLot.imageUrls.main);

  // STATE ĐỂ HIỂN THỊ MODAL BÁO GIÁ
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const handleSelectLot = (lot) => {
    setSelectedLot(lot);
    setSelectedDetailImage(lot.imageUrls.main);
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">

      {/* SIDEBAR */}
      <aside className="w-60 bg-[#0a192f] text-white flex flex-col shrink-0">
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem label="Trang chủ" active icon={<LayoutDashboard size={16} />} onClick={() => navigate('/buyer')} />
          <NavItem label="Sàn giao dịch" icon={<ArrowRightLeft size={16} />} onClick={() => navigate('/exchange')} />
          <NavItem label="Theo dõi xe" badge="Mới" icon={<Navigation size={16} />} onClick={() => navigate('/route-optimization')} />
          
          <p className="px-4 text-[10px] text-gray-500 uppercase font-bold py-2 mt-6">Cá nhân</p>
          <NavItem label="Đơn hàng của tôi" badge="3" icon={<ShoppingCart size={16} />} />
          <NavItem label="Chi tiêu & Ngân sách" icon={<Wallet size={16} />} />
          <NavItem label="Lô hàng yêu thích" icon={<Heart size={16} />} />
          <NavItem label="Thông báo giá" icon={<BellRing size={16} />} />
        </nav>
        <div className="p-4 border-t border-gray-700 flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center font-bold text-gray-900">VH</div>
          <div className="text-xs">
            <p className="font-bold">Vũ Hoàng Nam</p>
            <p className="text-gray-400">CT Hải Vương</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="h-15 bg-white border-b flex items-center gap-6 px-8 shrink-0">
          <div className="p-5 border-gray-800 flex items-center gap-2">
            <div classNam="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center text-gray-900 shadow-lg shadow-teal-400/20">
              <img src={BrandLogo} alt="AquaMarket Logo" className="h-9 w-auto object-contain" />
            </div>
            <div className="leading-none">
              <span className="text-[15px] font-black text-black block">AquaMarket</span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">B2B · Người Bán</span>
            </div>
          </div>
          <h1 className="text-[16px] font-bold whitespace-nowrap">Danh Sách Lô Hàng</h1>
          <div className="flex-1 max-w-md relative">
            <input placeholder="Tìm lô hàng, tỉnh, loài tôm..." className="w-full bg-gray-100 border-none rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" />
            <Search size={16} className="absolute left-4 top-2.5 text-gray-400" />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-500"><Bell size={16} /></div>
            <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-500"><User size={16} /></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 space-y-6">
          {/* STATS */}
          <div className="grid grid-cols-4 gap-4">
            <StatSmall label="Lô hàng khả dụng" value="142" sub="↑ 18 lô mới" color="teal" />
            <StatSmall label="Đơn đang xử lý" value="3" sub="2 đang vận chuyển" color="orange" />
            <StatSmall label="Chi tiêu tháng" value="148M" sub="VND • 6 đơn" color="blue" />
            <StatSmall label="Lô hoàn thành" value="31" sub="Từ 14 nhà máy" color="green" />
          </div>

          {/* FILTERS */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-4 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Lọc:</span>
            <div className="flex gap-2">
              <Chip label="Tất cả" />
              <Chip label="Vỏ tôm" />
              <Chip label="Đầu tôm" />
              <Chip label="Bột cá" active />
            </div>
            <div className="flex gap-2 ml-4 border-l border-gray-200 pl-4">
              <SelectFilter options={['Tỉnh: Tất cả', 'Cà Mau', 'Đồng Tháp', 'An Giang']} />
              <SelectFilter options={['Mọi cấp', 'Cấp A', 'Cấp B', 'Cấp C']} />
            </div>
            <button className="ml-auto text-xs font-bold text-gray-500 flex items-center gap-1.5 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
              <ArrowUpDown size={14} /> Giá tăng dần
            </button>
          </div>

          {/* GRID: DANH SÁCH BÊN TRÁI - CHI TIẾT BÊN PHẢI */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* DANH SÁCH SẢN PHẨM (Cột Trái) */}
            <div className="xl:col-span-4 2xl:col-span-5 flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <p>Hiển thị <strong>{mockLots.length}</strong> kết quả</p>
              </div>

              {/* Danh sách List Lô Hàng */}
              <div className="space-y-4">
                {mockLots.map((lot) => (
                  <div
                    key={lot.id}
                    onClick={() => handleSelectLot(lot)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex justify-between items-center ${selectedLot.id === lot.id ? 'bg-blue-50/30 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0 bg-gray-50 overflow-hidden">
                        <img
                          src={lot.imageUrls.main}
                          alt={lot.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x100/e0f2f1/00796b?text=SP'; }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-[13px] line-clamp-2">{lot.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">{lot.id}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[16px] font-black text-[#E96513] leading-none">{lot.shortPrice}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">{lot.shortTotal}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* PHÂN TRANG (PAGINATION) */}
              <div className="flex justify-end items-center gap-1.5 mt-2">
                {[1, 2, 3, '...', 12].map((p, i) => (
                  <button
                    key={i}
                    disabled={p === '...'}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border text-[13px] font-bold transition-colors ${p === 1
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : p === '...'
                          ? 'bg-transparent text-gray-500 border-transparent cursor-default'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-teal-500 hover:text-teal-600'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

            </div>

            {/* PANEL THÔNG TIN CHI TIẾT (Cột Phải) */}
            <div className="xl:col-span-8 2xl:col-span-7">
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 sticky top-4 flex gap-6">

                {/* Cột Ảnh & Thumbnails */}
                <div className="w-48 shrink-0 flex flex-col gap-2">
                  <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg relative overflow-hidden">
                    <img
                      src={selectedDetailImage}
                      alt={selectedLot.name}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 relative z-10">
                    {selectedLot.imageUrls.thumbs.slice(0, 3).map((thumbSrc, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDetailImage(thumbSrc)}
                        className={`aspect-square border rounded-lg cursor-pointer flex items-center justify-center p-1 ${selectedDetailImage === thumbSrc
                            ? 'border-[#E96513] bg-red-50/50'
                            : 'border-gray-200 bg-white hover:border-teal-400'
                          }`}
                      >
                        <img src={thumbSrc} alt={`Thumb ${index}`} className="w-full h-full object-cover rounded" />
                      </div>
                    ))}

                    <ThumbBox icon={<Box size={14} />} label="HACCP" />
                    <ThumbBox icon={<FileCheck size={14} />} label="COA" />
                    <ThumbBox icon={<Building2 size={14} />} label="NM" />
                    <ThumbBox icon={<Play size={14} />} label="Vid" color="text-blue-600" />
                  </div>
                </div>

                {/* Cột Thông tin chi tiết */}
                <div className="flex-1 min-w-0 flex flex-col">

                  {/* Header: Tags & Nút Lưu */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedLot.tags.map(t => (
                        <span key={t.label} className={`px-2 py-0.5 text-[11px] font-medium border rounded ${t.color}`}>
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-[11px] font-medium">
                      <Heart size={14} /> Lưu
                    </button>
                  </div>

                  {/* Tiêu đề & Meta */}
                  <h2 className="text-[18px] font-bold text-gray-900 leading-snug mb-2">
                    {selectedLot.name}
                  </h2>
                  <div className="text-[12px] text-gray-500 font-medium mb-5 flex flex-wrap gap-x-2 gap-y-1">
                    <span>Mã SP: <span className="font-mono text-gray-400">{selectedLot.id}</span></span>
                    <span className="text-gray-300">|</span>
                    <span>Mã HS: <span className="font-mono text-gray-400">{selectedLot.hsCode}</span></span>
                    <span className="text-gray-300">|</span>
                    <span>Loài: <i className="text-gray-500">{selectedLot.species}</i></span>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {selectedLot.specs.map(s => (
                      <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-[11px] text-gray-500 font-medium mb-1 line-clamp-1">{s.label}</p>
                        <p className="text-[16px] font-bold text-gray-900 leading-none mt-1">
                          {s.val} <span className="text-[11px] font-normal text-gray-400">{s.unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Giá & Logistics */}
                  <div className="flex gap-4 mb-6">
                    <div className="w-[45%] bg-[#fffcfc] border border-red-200 rounded-lg p-4">
                      <p className="text-[11px] font-bold text-[#E96513] mb-1">GIÁ TẠI KHO (VNĐ)</p>
                      <p className="text-[26px] font-black text-[#E96513] leading-none mb-1">{selectedLot.priceBlock.main}</p>
                      <p className="text-[12px] text-gray-600 font-medium">{selectedLot.priceBlock.unit}</p>
                      <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">{selectedLot.priceBlock.sub}</p>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {selectedLot.logistics.map(l => (
                        <div key={l.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col justify-center">
                          <p className="text-[9.5px] text-gray-500 uppercase tracking-tight mb-1">{l.label}</p>
                          <p className="text-[13px] font-bold text-gray-900">{l.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BẢNG GIÁ THEO SỐ LƯỢNG */}
                  <div className="mb-6">
                    <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-3">Bảng giá theo số lượng</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-[#1a2332] text-white text-[11px] font-medium">
                          <tr>
                            <th className="py-2.5 px-4">Số lượng đặt</th>
                            <th className="py-2.5 px-4">Đơn giá (đ/tấn)</th>
                            <th className="py-2.5 px-4">Phương thức / Đóng gói</th>
                            <th className="py-2.5 px-4">Thời gian giao</th>
                          </tr>
                        </thead>
                        <tbody className="text-[12.5px] text-gray-800 font-medium divide-y divide-gray-100">
                          {selectedLot.pricingTable.map((row, i) => (
                            <tr key={i} className={i === selectedLot.pricingTable.length - 1 ? "bg-red-50/30" : ""}>
                              <td className="py-3 px-4">{row.qty}</td>
                              <td className="py-3 px-4 font-bold text-[#E96513]">{row.price}</td>
                              <td className="py-3 px-4 text-gray-600">{row.payment}</td>
                              <td className="py-3 px-4 text-gray-600">{row.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* KHỐI NHÀ CUNG CẤP & ACTION */}
                  <div className="flex flex-col gap-4 border-t border-gray-100 pt-5">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-[#1a2332] text-white rounded flex items-center justify-center font-bold text-lg shrink-0">
                        {selectedLot.seller.avatar}
                      </div>

                      <div className="flex-1">
                        <h4 className="text-[14px] font-bold text-gray-900 uppercase mb-1.5">
                          {selectedLot.seller.name}
                        </h4>
                        <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-2.5">
                          <span className="flex items-center gap-1"><Building2 size={12} /> {selectedLot.seller.type}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {selectedLot.seller.loc}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {selectedLot.seller.est}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLot.seller.certs.map(c => (
                            <span key={c} className="px-2 py-0.5 border border-green-500 text-green-600 text-[10px] font-medium rounded-sm">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-2 shrink-0">
                        <button
                          onClick={() => setIsQuoteModalOpen(true)}
                          className="px-5 py-2 border border-[#E96513] text-[#E96513] rounded font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-red-50"
                        >
                          <FileText size={16} /> Yêu cầu báo giá
                        </button>
                        <button className="px-5 py-2 bg-[#E96513] text-white rounded font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-red-700 shadow-md shadow-red-600/20">
                          <Phone size={16} fill="currentColor" /> Liên hệ ngay
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-start">
                    <button className="flex items-center gap-1 text-[#E96513] text-[13px] font-bold hover:underline">
                      Xem chi tiết đầy đủ (thông số kỹ thuật · ảnh mô tả · hồ sơ nhà cung cấp) <ChevronDown size={16} />
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL GỬI YÊU CẦU BÁO GIÁ (Mô phỏng Alibaba style) */}
      {/* ========================================================= */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

            {/* Header Modal */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Gửi yêu cầu báo giá</h3>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">

              {/* To Seller Info */}
              <div className="flex items-center gap-2 text-[13.5px]">
                <span className="text-gray-500">Tới:</span>
                <div className="w-5 h-5 bg-teal-100 text-teal-700 font-bold rounded flex items-center justify-center text-[10px]">
                  {selectedLot.seller.avatar}
                </div>
                <span className="font-bold text-gray-800">{selectedLot.seller.name}</span>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Gian hàng đảm bảo</span>
              </div>

              {/* Product Card & Quantity */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <img
                  src={selectedDetailImage}
                  alt="Sản phẩm"
                  className="w-16 h-16 object-cover rounded bg-white border border-gray-200"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x100/e0f2f1/00796b?text=SP'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 line-clamp-2">{selectedLot.name}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">Mã SP: {selectedLot.id}</p>
                </div>
                <div className="flex flex-col gap-1.5 w-40 shrink-0">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Số lượng đặt</label>
                  <div className="flex border border-gray-300 rounded overflow-hidden shadow-sm bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                    <input
                      type="number"
                      defaultValue="5"
                      min="1"
                      className="w-full px-3 py-1.5 text-sm font-bold text-gray-800 outline-none"
                    />
                    <span className="bg-gray-50 px-3 py-1.5 text-[13px] border-l border-gray-300 text-gray-600 font-medium">Tấn</span>
                  </div>
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <textarea
                  rows="6"
                  className="w-full border border-gray-300 rounded-lg p-4 text-sm text-gray-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-inner resize-none leading-relaxed"
                  placeholder="Mô tả chi tiết yêu cầu của bạn về thông số kỹ thuật, số lượng dự kiến, địa điểm giao hàng hoặc các yêu cầu đóng gói đặc biệt..."
                ></textarea>
              </div>

              {/* Smart AI Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-orange-600 text-sm font-bold">
                  <Sparkles size={16} /> <p>Thử các câu hỏi gợi ý bởi AI</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3.5 py-1.5 border border-orange-200 bg-orange-50/50 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-100 hover:border-orange-300 transition-colors">
                    ↳ Có cung cấp mẫu thử (sample) miễn phí không?
                  </button>
                  <button className="px-3.5 py-1.5 border border-orange-200 bg-orange-50/50 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-100 hover:border-orange-300 transition-colors">
                    ↳ Chi phí vận chuyển đến kho Long An là bao nhiêu?
                  </button>
                  <button className="px-3.5 py-1.5 border border-orange-200 bg-orange-50/50 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-100 hover:border-orange-300 transition-colors">
                    ↳ Có chính sách chiết khấu nếu tôi ký hợp đồng bao tiêu 6 tháng?
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
              <button className="flex items-center gap-2 text-gray-600 text-[13px] font-medium hover:text-teal-600 hover:bg-teal-50 px-3 py-2 rounded-lg transition-colors">
                <Paperclip size={18} /> Thêm tệp đính kèm (COA/Specs)
              </button>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="bg-[#eb672b] hover:bg-[#d6551b] text-white font-bold py-2.5 px-8 rounded-lg shadow-md transition-colors"
              >
                Gửi yêu cầu ngay
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// ================= SUB-COMPONENTS DÙNG CHUNG =================

const ThumbBox = ({ icon, label, active, color = "text-gray-500" }) => (
  <div className={`flex flex-col items-center justify-center py-2.5 border rounded-lg cursor-pointer transition ${active ? 'border-[#E96513] bg-red-50/50 text-[#E96513]' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-500'}`}>
    <div className={`mb-1 ${active ? 'text-[#E96513]' : color}`}>{icon}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </div>
);

const StatSmall = ({ label, value, sub, color }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
    <div className={`absolute bottom-0 left-0 h-1 w-full bg-${color === 'teal' ? 'teal-500' : color === 'orange' ? 'orange-500' : color === 'blue' ? 'blue-500' : 'green-500'}`}></div>
    <p className="text-[9px] uppercase font-bold text-gray-500 mb-1 tracking-widest">{label}</p>
    <p className="text-[26px] font-black text-gray-800 tracking-tight">{value}</p>
    <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
  </div>
);

const Chip = ({ label, active }) => (
  <button className={`px-4 py-1.5 rounded-full text-[11.5px] font-bold border transition ${active ? 'bg-teal-500 text-white border-teal-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 hover:text-teal-600'}`}>
    {label}
  </button>
);

const SelectFilter = ({ options }) => (
  <select className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-gray-600 outline-none focus:border-teal-500 cursor-pointer">
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
);

const NavItem = ({ label, active, badge, icon, onClick }) => (
  <a href="#" onClick={(e) => { e.preventDefault(); if(onClick) onClick(); }} className={`flex items-center px-4 py-2.5 rounded-lg transition ${active ? 'bg-teal-500 text-white shadow-md font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
    <span className={`mr-3 ${active ? 'opacity-100' : 'opacity-80'}`}>{icon}</span>
    <span className="flex-1 text-sm">{label}</span>
    {badge && <span className={`${active ? 'bg-white text-teal-600' : 'bg-orange-500 text-white'} text-[9px] font-bold px-2 py-0.5 rounded-full`}>{badge}</span>}
  </a>
);

export default BuyerDashboard;