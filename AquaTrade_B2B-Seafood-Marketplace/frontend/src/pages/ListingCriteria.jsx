import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, ArrowRightLeft, Navigation, Search, Bell, ShieldAlert, DollarSign, ListChecks, CheckCircle2, XCircle
} from 'lucide-react';
import BrandLogo from '../assets/images/logo/brand.png';


const ListingCriteria = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">

      {/* ================= SIDEBAR (Đồng bộ với Exchange) ================= */}
      <aside className="w-64 bg-[#0a192f] text-white flex flex-col shrink-0 z-10">
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<Home size={20} />} label="Trang chủ" onClick={() => navigate('/')} />
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
          <div className="flex space-x-6 text-sm font-medium text-gray-900">
            <div className="h-16 flex items-center px-6 border-gray-700">
              <img src={BrandLogo} alt="AquaMarket Logo" className="h-9 w-auto object-contain" />
              <span className="text-xl font-bold tracking-wide">AquaTrade</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Tìm kiếm..." className="bg-gray-100 border-none rounded-full pl-4 pr-10 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64" />
              <Search size={16} className="absolute right-4 top-2 text-gray-400" />
            </div>
            <div className="w-8 h-8 bg-orange-200 text-orange-600 rounded-full flex items-center justify-center font-bold">U</div>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH: TIÊU CHÍ NIÊM YẾT */}
        <div className="flex-1 overflow-auto p-8 space-y-4 bg-gray-50/50">

          {/* HEADER BANNER */}
          <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] font-mono font-bold bg-gray-100 border border-gray-200 px-3 py-1 rounded text-gray-500 uppercase tracking-widest mb-4 inline-block">DOC · FC-SBP-2024 · REV 1.1</span>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Tiêu Chí <span className="text-teal-600 italic">Niêm Yết</span></h1>
                <p className="text-gray-500 text-sm font-medium mt-2 max-w-2xl">Bộ điều kiện Feasibility Check để một lô phụ phẩm tôm được xuất hiện trên sàn giao dịch B2B — ba lớp lọc tuần tự, lô phải vượt qua đủ 3 lớp.</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="text-[10px] font-mono font-bold bg-gray-50 border border-gray-200 px-3 py-1 rounded text-gray-500">TCVN 8792:2011</span>
                <span className="text-[10px] font-mono font-bold bg-gray-50 border border-gray-200 px-3 py-1 rounded text-gray-500">QCVN 01-190:2020</span>
              </div>
            </div>
          </section>

          {/* LỚP 1: AN TOÀN SINH HỌC (Màu Đỏ) */}
          <div className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-red-50/50 border-b border-red-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border border-red-200">Lớp 1</span>
                <h2 className="text-lg font-bold text-red-700 flex items-center gap-2"><ShieldAlert size={20} /> Barrier An Toàn Sinh Học Bắt Buộc</h2>
              </div>
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Vi phạm Reject</span>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-sm text-red-800 mb-6 leading-relaxed">
                Tất cả chỉ tiêu bên dưới áp dụng <strong>không phân biệt cấp A/B/C</strong>. Sản phẩm vi phạm bị <strong>cấm lưu thông</strong> tại thị trường Việt Nam theo QCVN 01-190:2020.
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">I. Vi sinh vật gây bệnh & Kim loại nặng</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <SpecCard code="VS-01" title="Salmonella spp." val="Không phát hiện" note="KPH/25g · TCVN 4829" colorClass="text-red-500" />
                <SpecCard code="VS-02" title="E. coli sinh nhiệt" val="≤ 10 MPN/g" note="Giới hạn tối đa · TCVN 6846" colorClass="text-red-500" />
                <SpecCard code="KL-01" title="Chì (Pb)" val="≤ 5.0 mg/kg" note="Giới hạn tối đa · QCVN 01-190" colorClass="text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">II. Giấy tờ bắt buộc</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SpecCard code="DOC-01" title="COA xét nghiệm" val="≤ 30 ngày tuổi" note="Do lab chuẩn VILAS cấp" colorClass="text-red-500" />
                <SpecCard code="DOC-02" title="GCN ATTP cơ sở" val="Còn hiệu lực" note="Do cơ quan chức năng cấp" colorClass="text-red-500" />
                <SpecCard code="DOC-03" title="Mã số CS chế biến" val="Hợp lệ" note="Truy xuất Nafiqad" colorClass="text-red-500" />
              </div>
            </div>
          </div>

          {/* MŨI TÊN KẾT NỐI */}
          <Connector text="Đạt Lớp 1 → Kiểm tra Lớp 2" />

          {/* LỚP 2: KINH TẾ LOGISTICS (Màu Cam) */}
          <div className="bg-white border border-orange-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-orange-50/50 border-b border-orange-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border border-orange-200">Lớp 2</span>
                <h2 className="text-lg font-bold text-orange-700 flex items-center gap-2"><DollarSign size={20} /> Điều Kiện Kinh Tế & Logistics</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm text-gray-600 mb-6">
                <strong>Cơ sở tính:</strong> Xe tải 5–10 tấn thuê bao ĐBSCL ~2.000–3.500 đ/km. Sàn chỉ có giá trị khi <strong>chi phí logistics</strong> thực sự tối ưu hơn họ tự thuê xe ngoài.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <SpecCard code="E-01" title="Khối lượng tối thiểu" val="≥ 500 kg" note="Mỗi lô đăng ký mới" colorClass="text-orange-500" bgClass="bg-white" />
                <SpecCard code="E-03" title="Shipping Ratio" val="≤ 25%" note="Cước ước tính / Giá trị lô" colorClass="text-orange-500" bgClass="bg-orange-50 border-orange-200" />
                <SpecCard code="E-04" title="Gross Margin" val="≥ 12%" note="Sau khi trừ cước + phí sàn" colorClass="text-orange-500" bgClass="bg-white" />
              </div>

              <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Giá sàn tối thiểu theo cấp (Chống phá giá)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PriceCard grade="Cấp A · Premium" price="4.000" desc="Chitin/Chitosan · Dược phẩm" colorClass="text-orange-500" bgClass="bg-orange-50/50" />
                <PriceCard grade="Cấp B · Standard" price="2.000" desc="Thức ăn thủy sản cao cấp" colorClass="text-teal-600" bgClass="bg-teal-50/50" />
                <PriceCard grade="Cấp C · Commercial" price="800" desc="Thức ăn gia súc · Phân bón" colorClass="text-blue-500" bgClass="bg-blue-50/50" />
              </div>
            </div>
          </div>

          {/* MŨI TÊN KẾT NỐI */}
          <Connector text="Đạt Lớp 2 → Kiểm tra Lớp 3" />

          {/* LỚP 3: CHẤT LƯỢNG (Màu Teal) */}
          <div className="bg-white border border-teal-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-teal-50/50 border-b border-teal-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border border-teal-200">Lớp 3</span>
                <h2 className="text-lg font-bold text-teal-700 flex items-center gap-2"><ListChecks size={20} /> Điều Kiện Chất Lượng — Phân Cấp</h2>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column A */}
              <div className="border border-orange-200 rounded-xl overflow-hidden">
                <div className="bg-orange-50 p-4 border-b border-orange-100">
                  <span className="text-[10px] font-bold bg-orange-200 text-orange-700 px-2 py-1 rounded uppercase">Cấp A</span>
                  <h3 className="text-xl font-black text-orange-600 mt-2">Premium</h3>
                </div>
                <div className="p-4 space-y-3">
                  <GradeRow label="Vỏ thân tôm" val="≥ 70%" color="text-orange-600" />
                  <GradeRow label="Độ ẩm" val="≤ 10%" color="text-orange-600" />
                  <GradeRow label="Protein thô" val="≥ 38%" color="text-orange-600" />
                </div>
              </div>
              {/* Column B */}
              <div className="border border-teal-200 rounded-xl overflow-hidden">
                <div className="bg-teal-50 p-4 border-b border-teal-100">
                  <span className="text-[10px] font-bold bg-teal-200 text-teal-800 px-2 py-1 rounded uppercase">Cấp B</span>
                  <h3 className="text-xl font-black text-teal-600 mt-2">Standard</h3>
                </div>
                <div className="p-4 space-y-3">
                  <GradeRow label="Vỏ thân tôm" val="30 - 70%" color="text-teal-600" />
                  <GradeRow label="Độ ẩm" val="≤ 12%" color="text-teal-600" />
                  <GradeRow label="Protein thô" val="≥ 28%" color="text-teal-600" />
                </div>
              </div>
              {/* Column C */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 p-4 border-b border-blue-100">
                  <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded uppercase">Cấp C</span>
                  <h3 className="text-xl font-black text-blue-600 mt-2">Commercial</h3>
                </div>
                <div className="p-4 space-y-3">
                  <GradeRow label="Vỏ thân tôm" val="< 30%" color="text-blue-600" />
                  <GradeRow label="Độ ẩm" val="≤ 15%" color="text-blue-600" />
                  <GradeRow label="Protein thô" val="≥ 18%" color="text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* VÍ DỤ REJECT */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-8">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h3 className="font-bold text-gray-800">Ví dụ thông báo lý do reject hiển thị cho người bán</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Tầng Lọc</th>
                  <th className="px-6 py-4">Lý do reject</th>
                  <th className="px-6 py-4">Gợi ý khắc phục</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Lớp 1</span></td>
                  <td className="px-6 py-4 text-gray-700">COA xét nghiệm đã 45 ngày — vượt giới hạn 30 ngày</td>
                  <td className="px-6 py-4 text-gray-500">Gửi lại COA mới từ lab được Bộ NN&PTNT chứng nhận</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Lớp 2</span></td>
                  <td className="px-6 py-4 text-gray-700">Shipping ratio = 38% &gt; ngưỡng 25%</td>
                  <td className="px-6 py-4 text-gray-500">Tăng khối lượng lô để giảm cước/kg, hoặc chờ gom chung chuyến</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Lớp 3</span></td>
                  <td className="px-6 py-4 text-gray-700">Độ ẩm 16% vượt ngưỡng Cấp C (≤ 15%)</td>
                  <td className="px-6 py-4 text-gray-500">Sấy thêm đến độ ẩm ≤ 15% rồi re-submit kèm COA cập nhật</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
};

// ================= COMPONENT CON =================
const NavItem = ({ icon, label, active, badge, onClick }) => (
  <div onClick={onClick} className={`flex items-center px-4 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-teal-900 text-teal-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
    <div className="mr-3">{icon}</div>
    <span className="flex-1 text-sm font-medium">{label}</span>
    {badge && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{badge}</span>}
  </div>
);

const SpecCard = ({ code, title, val, note, colorClass, bgClass = "bg-gray-50" }) => (
  <div className={`${bgClass} border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow`}>
    <p className="text-[10px] font-mono text-gray-400 mb-1 tracking-widest">{code}</p>
    <p className="text-[13px] font-bold text-gray-800 mb-2 h-10">{title}</p>
    <p className={`text-lg font-black mb-1 ${colorClass}`}>{val}</p>
    <p className="text-[11px] text-gray-500 leading-relaxed">{note}</p>
  </div>
);

const PriceCard = ({ grade, price, desc, colorClass, bgClass }) => (
  <div className={`${bgClass} border border-gray-200 rounded-xl p-4 text-center`}>
    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${colorClass}`}>{grade}</p>
    <p className={`text-2xl font-black mb-1 ${colorClass}`}>{price}</p>
    <p className="text-[11px] text-gray-500 mb-2">đ / kg tối thiểu</p>
    <p className="text-[11px] text-gray-600 italic">{desc}</p>
  </div>
);

const Connector = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-1">
    <div className="w-px h-6 bg-gray-300"></div>
    <span className="text-[10px] font-bold text-gray-500 uppercase bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">{text}</span>
    <div className="w-px h-6 bg-gray-300"></div>
  </div>
);

const GradeRow = ({ label, val, color }) => (
  <div className="flex justify-between items-center border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className={`text-sm font-bold font-mono ${color}`}>{val}</span>
  </div>
);

export default ListingCriteria;