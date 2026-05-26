import React, { useState } from 'react';
import {
  ComposedChart, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line
} from 'recharts';
import {
  DollarSign, Activity, Truck, Users, Shield, 
  Download, MapPin, Tag, Calendar, RefreshCw, Filter, Eye, ChevronDown, CheckCircle2, AlertTriangle
} from 'lucide-react';

// ================= DATA =================
const KPI_CARDS = [
  { id: 1, title: "Tổng GMV", val: "₫48.2B", trend: "▲ 12.4%", trendColor: "text-green-600", sub: "so tháng trước", icon: <DollarSign size={28} />, color: "teal" },
  { id: 2, title: "Doanh thu Sàn", val: "₫2.74B", trend: "▲ 8.1%", trendColor: "text-green-600", sub: "so tháng trước", icon: <Activity size={28} />, color: "blue" },
  { id: 3, title: "Phí giao dịch", val: "₫1.15B", trend: "▲ 14.2%", trendColor: "text-green-600", sub: "avg. 2.4% / đơn", icon: <Truck size={28} />, color: "green" },
  { id: 4, title: "Phí thành viên", val: "₫765M", trend: "▼ 3.2%", trendColor: "text-red-500", sub: "127 hội viên", icon: <Users size={28} />, color: "orange" },
  { id: 5, title: "Logistics & QC", val: "₫832M", trend: "▲ 21.7%", trendColor: "text-green-600", sub: "so tháng trước", icon: <Shield size={28} />, color: "red" },
];

const REVENUE_DONUT = [
  { name: "Phí giao dịch", value: 42, color: "red" }, // slate-900
  { name: "Phí thành viên", value: 28, color: "teal" }, // teal-600
  { name: "Kiểm định QC", value: 18, color: "orange" }, // orange-500
  { name: "Logistics", value: 12, color: "green" }, // emerald-500
];

const GMV_TREND = [
  { month: "T1/25", gmv: 32.1, fee: 0.77 },
  { month: "T2/25", gmv: 35.8, fee: 0.86 },
  { month: "T3/25", gmv: 29.4, fee: 0.70 },
  { month: "T4/25", gmv: 41.2, fee: 0.99 },
  { month: "T5/25", gmv: 44.6, fee: 1.07 },
  { month: "T6/25", gmv: 48.2, fee: 1.15 },
];

const SERVICE_ADOPTION = [
  { name: "Kiểm định QC", rate: 67, used: 1836, total: 2740, color: "#0f172a" },
  { name: "Logistics", rate: 54, used: 1480, total: 2740, color: "#0d9488" },
  { name: "Thanh toán TT", rate: 89, used: 2439, total: 2740, color: "#f97316" },
  { name: "Bảo hiểm HH", rate: 23, used: 630, total: 2740, color: "#10b981" },
];

const SUBSCRIPTION_PLANS = [
  { plan: "Basic", count: 58, color: "bg-teal-500", text: "text-teal-600", price: "₫2.4M/th" },
  { plan: "Pro", count: 49, color: "bg-blue-600", text: "text-blue-700", price: "₫5.8M/th" },
  { plan: "VIP", count: 20, color: "bg-orange-500", text: "text-orange-600", price: "₫12M/th" },
];

const EXPIRING_ACCOUNTS = [
  { name: "Công ty CP Hải Sản Cà Mau", plan: "VIP", daysLeft: 2, revenue: "₫142M", urgent: true },
  { name: "DNTN Bạch Tuộc Kiên Giang", plan: "Pro", daysLeft: 4, revenue: "₫67M", urgent: false },
  { name: "HTX Thủy Sản An Giang", plan: "Basic", daysLeft: 5, revenue: "₫23M", urgent: false },
  { name: "Cty TNHH Vỏ Tôm Bạc Liêu", plan: "Pro", daysLeft: 6, revenue: "₫89M", urgent: false },
];

const TABLE_DATA = [
  { date: "20/05/2025", id: "LH-2025-0891", gmv: "₫1.24B", fee: "₫29.8M", status: "Hoàn thành", stColor: "green" },
  { date: "19/05/2025", id: "LH-2025-0890", gmv: "₫867M", fee: "₫20.8M", status: "Hoàn thành", stColor: "green" },
  { date: "19/05/2025", id: "LH-2025-0889", gmv: "₫2.1B", fee: "₫50.4M", status: "Đang xử lý", stColor: "orange" },
  { date: "18/05/2025", id: "LH-2025-0888", gmv: "₫430M", fee: "₫10.3M", status: "Hoàn thành", stColor: "green" },
  { date: "18/05/2025", id: "LH-2025-0887", gmv: "₫3.5B", fee: "₫84M", status: "Chờ duyệt", stColor: "blue" },
  { date: "17/05/2025", id: "LH-2025-0886", gmv: "₫760M", fee: "₫18.2M", status: "Hoàn thành", stColor: "green" },
  { date: "17/05/2025", id: "LH-2025-0885", gmv: "₫1.85B", fee: "₫44.4M", status: "Từ chối", stColor: "red" },
  { date: "16/05/2025", id: "LH-2025-0884", gmv: "₫620M", fee: "₫14.9M", status: "Hoàn thành", stColor: "green" },
];

const DATE_OPTIONS = ["Hôm nay", "Tuần này", "Tháng này", "Quý này", "Năm nay"];

// ================= MAIN COMPONENT =================
const AquaMarketReports = () => {
  const [dateFilter, setDateFilter] = useState("Tháng này");

  // Recharts custom labels/tooltips
  const DonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    return (
      <text x={cx + r * Math.cos(-midAngle * Math.PI / 180)} y={cy + r * Math.sin(-midAngle * Math.PI / 180)} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 rounded-lg p-3 shadow-xl border border-gray-700">
        <p className="text-[11px] text-gray-400 mb-1.5">{label}</p>
        {payload.map((e, i) => (
          <p key={i} className="text-[12px] font-bold m-0" style={{ color: e.color }}>
            {e.name}: {e.value < 10 ? `₫${e.value.toFixed(2)}B` : `₫${e.value}B`}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter size={16} />
            <span className="text-[11px] font-bold uppercase tracking-widest font-mono">Bộ lọc:</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {DATE_OPTIONS.map(opt => (
              <button 
                key={opt} onClick={() => setDateFilter(opt)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition ${dateFilter === opt ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-gray-200 hidden xl:block"></div>
          <div className="flex gap-2">
            <select className="text-[12px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
              <option>Khu vực: Tất cả</option>
              <option>Cà Mau</option>
              <option>Bạc Liêu</option>
            </select>
            <select className="text-[12px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer">
              <option>Phân loại: Tất cả</option>
              <option>Đầu tôm</option>
              <option>Xương cá</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-[12px] font-bold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="flex items-center gap-2 text-[12px] font-bold text-teal-600 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition">
            <Download size={14} /> Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {KPI_CARDS.map(card => (
          <KpiCard key={card.id} {...card} />
        ))}
      </div>

      {/* CHARTS: DONUT & LINE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* REVENUE DONUT */}
        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <h3 className="text-[14px] font-bold text-gray-800">Cơ cấu Nguồn thu</h3>
            </div>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={REVENUE_DONUT} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" labelLine={false} label={DonutLabel}>
                    {REVENUE_DONUT.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-y-3 mt-4">
              {REVENUE_DONUT.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono leading-tight">{item.name}</div>
                    <div className="text-[13px] font-bold text-gray-800">{item.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GMV TREND */}
        <div className="xl:col-span-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <h3 className="text-[14px] font-bold text-gray-800">Xu hướng GMV & Phí giao dịch</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-teal-500 rounded-full"></div><span className="text-[11px] text-gray-500 font-mono">GMV</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-orange-500 border-t border-dashed border-white rounded-full"></div><span className="text-[11px] text-gray-500 font-mono">Phí GD</span></div>
            </div>
          </div>
          <div className="p-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={GMV_TREND} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₫${v}B`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `₫${v}B`} />
                <Tooltip content={<ChartTip />} />
                <Area yAxisId="left" type="monotone" dataKey="gmv" name="GMV" fill="url(#gmvGrad)" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="fee" name="Phí GD" stroke="#f97316" strokeWidth={2.5} strokeDasharray="6 4" dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SUBSCRIPTION & ACCOUNTS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-[14px] font-bold text-gray-800">Hội viên Enterprise</h3>
            </div>
            <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1"><Users size={10}/> 127 Active</span>
          </div>
          <div className="p-5 border-b border-gray-100">
            <div className="flex gap-4 mb-4">
              {SUBSCRIPTION_PLANS.map((plan, i) => (
                <div key={i} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <div className={`text-[22px] font-black leading-none mb-1 ${plan.text}`}>{plan.count}</div>
                  <div className="text-[12px] font-bold text-gray-800">{plan.plan}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{plan.price}</div>
                </div>
              ))}
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex w-full">
              {SUBSCRIPTION_PLANS.map((plan, i) => <div key={i} style={{ flex: plan.count }} className={plan.color}></div>)}
            </div>
          </div>
          
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-red-50/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <h3 className="text-[12px] font-bold text-red-600 uppercase tracking-widest font-mono">Sắp hết hạn (7 ngày)</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {EXPIRING_ACCOUNTS.map((acct, i) => (
              <div key={i} className="px-5 py-3.5 hover:bg-gray-50 transition flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-gray-800">{acct.name}</div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">Gói {acct.plan} · DT: {acct.revenue}</div>
                </div>
                <div className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border ${acct.urgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                  {acct.daysLeft} ngày
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SERVICE ADOPTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <h3 className="text-[14px] font-bold text-gray-800">Tỷ lệ sử dụng Dịch vụ chéo</h3>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">Tổng 2,740 đơn</span>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {SERVICE_ADOPTION.map((svc, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[11px] font-bold text-gray-700">{svc.name}</span>
                    <span className="text-[14px] font-black" style={{ color: svc.color }}>{svc.rate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full" style={{ width: `${svc.rate}%`, backgroundColor: svc.color }}></div>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">{svc.used.toLocaleString()} đơn</div>
                </div>
              ))}
            </div>
            <div className="h-[180px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SERVICE_ADOPTION} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={v => [`${v}%`, 'Tỷ lệ']} cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', background: '#0f172a', color: 'white', fontSize: '12px' }} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {SERVICE_ADOPTION.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
            <h3 className="text-[14px] font-bold text-gray-800">Chi tiết Lô hàng</h3>
          </div>
          <div className="text-[11px] text-gray-500 font-mono">Hiển thị 8 / 2,740 kết quả</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              <tr>
                <th className="px-5 py-3">Ngày</th>
                <th className="px-5 py-3">Mã Lô Hàng</th>
                <th className="px-5 py-3">Giá trị lô (GMV)</th>
                <th className="px-5 py-3">Phí thu được</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] divide-y divide-gray-100">
              {TABLE_DATA.map((row, i) => (
                <TxRow key={i} {...row} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-center bg-gray-50">
           <div className="flex gap-1.5">
              {[1, 2, 3, "...", 48].map((page, i) => (
                <button key={i} className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-mono font-bold transition ${page === 1 ? 'bg-teal-600 text-white border border-teal-600' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                  {page}
                </button>
              ))}
           </div>
        </div>
      </div>

    </div>
  );
};

// ================= COMPONENT CON ĐỘC LẬP =================
const KpiCard = ({ title, val, trend, trendColor, sub, icon, color }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-teal-300 transition">
    <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-${color === 'teal' ? 'teal-500' : color === 'blue' ? 'blue-500' : color === 'orange' ? 'orange-500' : color === 'green' ? 'green-500' : 'red-500'}`}></div>
    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">{title}</div>
    <div className={`text-[26px] font-black leading-none mb-2 ${color === 'teal' ? 'text-teal-600' : color === 'orange' ? 'text-orange-500' : color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : 'text-red-500'}`}>{val}</div>
    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
      <span className={`font-mono font-bold ${trendColor}`}>{trend}</span> {sub}
    </div>
    <div className="absolute top-5 right-5 opacity-10 text-gray-500">{icon}</div>
  </div>
);

const TxRow = ({ date, id, gmv, fee, status, stColor }) => (
  <tr className="hover:bg-gray-50 transition cursor-pointer">
    <td className="px-5 py-3 text-gray-500 font-mono text-[11.5px]">{date}</td>
    <td className="px-5 py-3 font-mono text-[11.5px] font-bold text-teal-600">{id}</td>
    <td className="px-5 py-3 font-bold text-gray-800">{gmv}</td>
    <td className="px-5 py-3 font-bold text-green-600">{fee}</td>
    <td className="px-5 py-3"><Chip label={status} color={stColor} /></td>
    <td className="px-5 py-3 text-right text-gray-400 hover:text-teal-600 transition">
      <Eye size={16} className="inline-block" />
    </td>
  </tr>
);

const Chip = ({ label, color }) => {
  const styles = {
    green: "bg-green-100 text-green-700 border-green-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${styles[color]}`}>
      <span className="text-[6px]">●</span> {label}
    </span>
  );
};

export default AquaMarketReports;