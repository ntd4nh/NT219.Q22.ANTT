import React from 'react';
import { ShieldCheck, Camera, Scale, Info, CheckCircle2, AlertTriangle, FileSearch } from 'lucide-react';
import { color } from 'framer-motion';

const GradingStandards = () => {
  return (
    <div className="p-8 space-y-8">
      
      {/* HEADER SECTION */}
      <section className=" rounded-2xl p-8 text-black relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <h1 className="text-3xl font-black text-black tracking-tight mb-2">Bộ Tiêu Chuẩn Phân Cấp </h1>
              <p className="text-black text-sm font-medium uppercase tracking-widest">Shrimp By-Product B2B Grading Standard</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
               <StandardTag label="TCVN 8792:2011" />
               <StandardTag label="QCVN 01-190:2020" />
               <StandardTag label="TCVN 13658:2023" />
            </div>
         </div>
         
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10 pt-8 border-t border-white/10">
            <MetaItem label="Đối tượng" val="Đầu · Vỏ · Đuôi · Vụn thịt" />
            <MetaItem label="Số cấp" val="3 Cấp (A · B · C)" />
            <MetaItem label="Loài áp dụng" val="Tôm sú · Thẻ · Hùm" />
            <MetaItem label="Phiên bản" val="1.0 · May 2026" />
         </div>
      </section>

      {/* PART I: LEGAL BASIS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">01</div>
          <h2 className="text-lg font-bold">Cơ Sở Pháp Lý & Nội Suy</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Mã hiệu</th>
                  <th className="px-6 py-3">Tên tiêu chuẩn</th>
                  <th className="px-6 py-3">Vai trò</th>
                  <th className="px-6 py-3">Chỉ tiêu lấy tham chiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <LegalRow code="TCVN 8792" name="Bột tôm - TĂCN" role="Tài liệu cốt lõi" spec="Độ ẩm, Protein, Cát sạn, Muối" color="text-teal-600" />
                <LegalRow code="QCVN 01-190" name="Quy chuẩn quốc gia - TĂCN" role="Barier bắt buộc" spec="Vi sinh vật, Kim loại nặng" color="text-red-500" />
                <LegalRow code="TCVN 13658" name="Chitosan nguồn gốc tôm" role="Phân cấp Chitin" spec="Tỷ lệ vỏ thân, Độ tinh khiết" color="text-orange-500" />
              </tbody>
           </table>
        </div>
      </section>

      {/* PART II: GRADE CARDS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold text-xs">02</div>
          <h2 className="text-lg font-bold">Định Nghĩa 3 Cấp Phân Loại</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GradeCard 
            title="Premium" grade="Cấp A" accent="bg-orange-400" icon="🏆"
            desc="Chủ yếu vỏ thân (≥ 70%), ít đầu, sạch. Giá trị Chitin/Chitosan cao nhất."
            apps={['Nhà máy chiết xuất Chitin', 'Y tế & Dược phẩm', 'Mỹ phẩm cao cấp']}
          />
          <GradeCard 
            title="Standard" grade="Cấp B" accent="bg-teal-500" icon="⚙️"
            desc="Hỗn hợp vỏ và đầu (30–70% vỏ). Protein cân biến, nạp đạm tốt."
            apps={['Thức ăn thủy sản cao cấp', 'Protein thủy phân (SPH)', 'Chiết xuất Astaxanthin']}
          />
          <GradeCard 
            title="Commercial" grade="Cấp C" accent="bg-blue-500" icon="📦"
            desc="Chủ yếu đầu tôm (≥ 70%), vụn nát cao. Phù hợp các ứng dụng đại trà."
            apps={['TĂ gia súc, gia cầm', 'Phân bón sinh học hữu cơ', 'Nguyên liệu Biogas']}
          />
        </div>
      </section>

      {/* PART III: TECHNICAL TABLE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs">03</div>
          <h2 className="text-lg font-bold">Bảng Thông Số Kỹ Thuật Chi Tiết</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bảng 1 · Thông số Lý - Hóa & Hình thái</span>
              <div className="flex gap-4 text-[10px] font-bold">
                <span className="text-orange-500">● Cấp A</span>
                <span className="text-teal-500">● Cấp B</span>
                <span className="text-blue-500">● Cấp C</span>
              </div>
           </div>
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Mã CT</th>
                  <th className="px-6 py-3">Chỉ tiêu kỹ thuật</th>
                  <th className="px-6 py-3 text-center">Cấp A</th>
                  <th className="px-6 py-3 text-center">Cấp B</th>
                  <th className="px-6 py-3 text-center">Cấp C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                <SpecRow code="VD-01" label="Tỷ lệ vỏ thân (%KL)" vA="≥ 70%" vB="30% - 70%" vC="< 30%" />
                <SpecRow code="VD-03" label="Chitin ước tính (%KL khô)" vA="≥ 20%" vB="12% - 20%" vC="< 12%" />
                <SpecRow code="LH-01" label="Độ ẩm (%KL)" vA="≤ 10%" vB="≤ 12%" vC="≤ 15%" />
                <SpecRow code="LH-02" label="Protein thô (%KL khô)" vA="≥ 38%" vB="≥ 28%" vC="≥ 18%" isBold />
                <SpecRow code="LH-03" label="Cát sạn / Tro không tan HCl" vA="≤ 1.5%" vB="≤ 3.0%" vC="≤ 5.0%" />
                <SpecRow code="LH-04" label="Muối NaCl (%KL)" vA="≤ 3.0%" vB="≤ 5.0%" vC="≤ 8.0%" />
              </tbody>
           </table>
        </div>
        <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg flex gap-3">
          <Info className="text-teal-600 shrink-0" size={20} />
          <p className="text-xs text-teal-700 leading-relaxed">
            <strong>Ghi chú nội suy:</strong> Ngưỡng Protein được điều chỉnh dựa trên TCVN 8792:2011 với hệ số hiệu chỉnh ~0.7 dành cho phụ phẩm thô chưa nghiền mịn. Mọi lô hàng phải kèm theo COA thực đo.
          </p>
        </div>
      </section>

      {/* PART IV: SAFETY BARRIER */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs">04</div>
          <h2 className="text-lg font-bold text-red-600">Barier An Toàn Sinh Học (Bắt Buộc)</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
           <div className="flex gap-4">
              <AlertTriangle className="text-red-600 shrink-0" size={32} />
              <div>
                <h3 className="font-bold text-red-700">Quy chuẩn QCVN 01-190:2020 - Không Phân Cấp</h3>
                <p className="text-sm text-red-600 mt-1">Mọi sản phẩm vi phạm các giới hạn dưới đây bị <strong>CẤM LƯU THÔNG</strong>, bất kể các chỉ tiêu khác đạt loại nào.</p>
              </div>
           </div>
        </div>
        <div className="bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden">
           <table className="w-full text-left text-sm text-black">
              <thead className="bg-red-50 text-[10px]  uppercase font-black border-b border-red-100">
                <tr>
                  <th className="px-6 py-3">Mã</th>
                  <th className="px-6 py-3">Chỉ tiêu an toàn</th>
                  <th className="px-6 py-3">Đơn vị</th>
                  <th className="px-6 py-3">Giới hạn tối đa (Max)</th>
                  <th className="px-6 py-3">Tham chiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 text-[13px]">
                <SafetyRow id="VS-01" label="Salmonella spp." unit="CFU/25g" val="KPH / 25g" urgent />
                <SafetyRow id="VS-02" label="E. coli" unit="MPN/g" val="≤ 10" urgent />
                <SafetyRow id="KL-01" label="Chì (Pb)" unit="mg/kg" val="≤ 5.0" />
                <SafetyRow id="KL-02" label="Cadimi (Cd)" unit="mg/kg" val="≤ 0.5" />
                <SafetyRow id="KL-03" label="Asen (As)" unit="mg/kg" val="≤ 2.0" />
              </tbody>
           </table>
        </div>
      </section>

      {/* PART V: COA & PHOTO PROTOCOL */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold text-xs">05</div>
            <h2 className="text-lg font-bold">Hồ Sơ COA Bắt Buộc</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
             <RequirementItem icon={<CheckCircle2 size={18} className="text-teal-500" />} label="Phòng Lab đạt chuẩn VILAS / ISO 17025" />
             <RequirementItem icon={<CheckCircle2 size={18} className="text-teal-500" />} label="Chu kỳ kiểm định ≤ 3 tháng (Vi sinh/Độc tố)" />
             <RequirementItem icon={<CheckCircle2 size={18} className="text-teal-500" />} label="Hiển thị mã QR xác thực kết quả" />
             <div className="pt-4 border-t mt-4">
                <p className="text-xs text-gray-500 font-mono uppercase tracking-tighter">Xác thực hệ thống:</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-teal-600 font-bold">
                   <FileSearch size={18} /> Tự động đối chiếu mã số Lab nội tuyến
                </div>
             </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold text-xs">06</div>
            <h2 className="text-lg font-bold">Số Hóa Đánh Giá Cảm Quan</h2>
          </div>
          <div className="bg-[#0a192f] text-white rounded-xl p-6 space-y-6">
             <div className="flex items-center gap-4">
                <Camera size={32} className="text-teal-400" />
                <p className="text-sm font-bold">Quy Trình Chụp Mẫu Chuẩn (EXIF metadata)</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <PhotoStep num="1" label="Nền phẳng 1m²" sub="Lót xám/trắng" />
                <PhotoStep num="2" label="Thước đo chuẩn" sub="Có vạch cm rõ" />
                <PhotoStep num="3" label="Góc chụp 90°" sub="Từ trên xuống" />
                <PhotoStep num="4" label="Ánh sáng tự nhiên" sub="10h - 14h" />
             </div>
          </div>
        </section>
      </div>

      {/* DISCLAIMER FOOTER */}
      <section className="bg-gray-100 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex gap-4">
            <Scale className="text-gray-400" size={32} />
            <div className="max-w-2xl text-xs text-gray-500 leading-relaxed">
               <strong>Tuyên bố từ chối trách nhiệm (Disclaimer):</strong> Tài liệu này là Tiêu chuẩn cơ sở (TCCS) phục vụ giao dịch nội bộ AquaTrade. QCVN 01-190:2020 và các quy định của Nhà nước luôn được ưu tiên tuyệt đối. Sàn đóng vai trò trung gian kết nối và xác thực hình thức hồ sơ.
            </div>
         </div>
         <div className="text-right shrink-0">
            <p className="text-[14px] font-black text-teal-600 font-mono tracking-tighter">SBP-GS-2024 · Rev 1.0</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Ban Chính Sách Sàn B2B</p>
         </div>
      </section>
    </div>
  );
};

// ================= COMPONENT CON ĐỘC LẬP =================
const StandardTag = ({ label }) => (
  <span className="text-[10px] font-mono font-bold bg-white/10 border border-white/20 px-3 py-1 rounded text-teal-400 uppercase tracking-tighter">{label}</span>
);

const MetaItem = ({ label, val }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-bold text-black">{val}</span>
  </div>
);

const LegalRow = ({ code, name, role, spec, color }) => (
  <tr className="hover:bg-gray-50 transition cursor-default">
    <td className="px-6 py-4 font-mono font-bold text-gray-800">{code}</td>
    <td className="px-6 py-4 text-gray-700">{name}</td>
    <td className={`px-6 py-4 font-bold ${color}`}>{role}</td>
    <td className="px-6 py-4 text-gray-400 text-xs italic">{spec}</td>
  </tr>
);

const GradeCard = ({ title, grade, desc, apps, accent, icon }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group">
    <div className={`h-1 ${accent}`}></div>
    <div className="p-6">
       <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded border border-gray-200 text-gray-500 group-hover:border-teal-300 transition">{grade}</span>
          <span className="text-2xl">{icon}</span>
       </div>
       <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
       <p className="text-xs text-gray-500 leading-relaxed mb-6">{desc}</p>
       <div className="space-y-2">
          {apps.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] font-medium text-gray-700">
               <div className={`w-1.5 h-1.5 rounded-full ${accent}`}></div>
               {a}
            </div>
          ))}
       </div>
    </div>
  </div>
);

const SpecRow = ({ code, label, vA, vB, vC, isBold }) => (
  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
    <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{code}</td>
    <td className={`px-6 py-4 ${isBold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</td>
    <td className="px-6 py-4 text-center"><span className="bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1 rounded font-mono font-bold text-xs">{vA}</span></td>
    <td className="px-6 py-4 text-center"><span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded font-mono font-bold text-xs">{vB}</span></td>
    <td className="px-6 py-4 text-center"><span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded font-mono font-bold text-xs">{vC}</span></td>
  </tr>
);

const SafetyRow = ({ id, label, unit, val, urgent }) => (
  <tr className="hover:bg-red-50/30 transition">
    <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{id}</td>
    <td className={`px-6 py-4 ${urgent ? 'font-bold text-gray-700' : 'text-gray-700'}`}>{label}</td>
    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{unit}</td>
    <td className="px-6 py-4"><span className=" text-gray-600 px-3 py-1 rounded font-black text-xs">{val}</span></td>
    <td className="px-6 py-4 text-[10px] text-gray-500 uppercase font-bold tracking-tighter italic">QCVN 01-190</td>
  </tr>
);

const RequirementItem = ({ icon, label }) => (
  <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
    {icon} <span>{label}</span>
  </div>
);

const PhotoStep = ({ num, label, sub }) => (
  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg">
    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center font-black text-[10px] text-gray-900">{num}</div>
    <div>
      <p className="text-[11.5px] font-bold leading-none">{label}</p>
      <p className="text-[10px] text-gray-500 mt-1">{sub}</p>
    </div>
  </div>
);

export default GradingStandards;