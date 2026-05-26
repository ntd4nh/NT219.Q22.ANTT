import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, ShieldAlert, FileText, Camera, Check, X 
} from 'lucide-react';

const CategoryConfig = () => {
  const [isActive, setIsActive] = useState(true);
  const [showToast, setShowToast] = useState({ visible: false, message: '', type: 'slate' });

  const triggerToast = (message, type = 'slate') => {
    setShowToast({ visible: true, message, type });
    setTimeout(() => {
      setShowToast({ visible: false, message: '', type: 'slate' });
    }, 3000);
  };

  const [gradingRows, setGradingRows] = useState([
    { id: 1, name: 'Protein thô', unit: '% khối lượng khô', aMin: 42, aMax: 100, bMin: 35, bMax: 42, cMin: 28, cMax: 35 },
    { id: 2, name: 'Độ ẩm', unit: '% khối lượng', aMin: 0, aMax: 10, bMin: 0, bMax: 12, cMin: 0, cMax: 15 },
    { id: 3, name: 'Tạp chất', unit: '% khối lượng', aMin: 0, aMax: 2, bMin: 0, bMax: 5, cMin: 0, cMax: 8 },
  ]);

  const [barrierRows, setBarrierRows] = useState([
    { id: 1, name: 'Salmonella', unit: 'Phát hiện / 25g', max: 0, hardBlock: true },
    { id: 2, name: 'E. Coli', unit: 'CFU/g', max: 10, hardBlock: true },
    { id: 3, name: 'Histamine', unit: 'ppm (mg/kg)', max: 50, hardBlock: false },
  ]);

  const removeGradingRow = (id) => {
    setGradingRows(gradingRows.filter(r => r.id !== id));
  };

  const removeBarrierRow = (id) => {
    setBarrierRows(barrierRows.filter(r => r.id !== id));
  };

  const toggleHardBlock = (id) => {
    setBarrierRows(barrierRows.map(r => r.id === id ? { ...r, hardBlock: !r.hardBlock } : r));
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* PAGE HEADER (Đồng bộ cấu trúc header gọn nhẹ của AdminDashboard) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4 border-b border-gray-200">
        <div>
          <nav className="flex items-center text-xs text-gray-400 mb-1.5 font-medium">
            <span className="hover:text-teal-600 cursor-pointer transition-colors">Quản lý Hệ thống</span>
            <span className="text-gray-300 mx-1.5"><ChevronRight size={14} /></span>
            <span className="hover:text-teal-600 cursor-pointer transition-colors">Danh mục phụ phẩm</span>
            <span className="text-gray-300 mx-1.5"><ChevronRight size={14} /></span>
            <span className="text-gray-600 font-semibold">Chi tiết cấu hình</span>
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Cấu hình Danh mục: <span className="text-teal-600">Phụ phẩm Tôm Sấy/Phơi Khô</span>
            </h1>
            <span className="font-mono text-xs font-semibold bg-teal-50 text-teal-600 border border-teal-200 px-2.5 py-0.5 rounded-md">
              CAT-TOM-01
            </span>
          </div>
        </div>

        {/* Khối Actions & Toggle trạng thái */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {isActive ? 'Hoạt động' : 'Tạm ngưng'}
            </span>
          </div>

          <button onClick={() => triggerToast('Đã hủy các thay đổi', 'slate')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all">
            <X size={16} />
            Hủy
          </button>
          <button onClick={() => triggerToast('✓ Cấu hình đã được lưu thành công!', 'teal')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all">
            <Check size={16} />
            Lưu Cấu Hình
          </button>
        </div>
      </div>

      {/* CONFIGURATION CONTENT BODY */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* CARD 1: THÔNG TIN CHUNG */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Thông tin chung</h2>
            <span className="text-xs text-gray-400 font-mono">General Info</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên danh mục <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" type="text" defaultValue="Phụ phẩm Tôm Sấy/Phơi Khô" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Mã danh mục <span className="text-red-500">*</span></label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" type="text" defaultValue="CAT-TOM-01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">HS Code</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" type="text" defaultValue="2301.20.10" placeholder="VD: 2301.20.10" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Khối lượng tối thiểu – MOQ</label>
                <div className="flex items-center gap-2">
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" type="number" defaultValue="5" min="0" step="0.5" />
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 shrink-0">Tấn</span>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Mô tả ứng dụng</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all min-h-[80px]" rows="3" defaultValue="Phụ phẩm từ quá trình chế biến tôm, bao gồm vỏ, đầu và đuôi tôm được sấy khô/phơi khô. Dùng trong sản xuất chitin, chitosan, bột tôm, thức ăn chăn nuôi và phân bón hữu cơ."></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: MA TRẬN PHÂN CẤP TỰ ĐỘNG */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Ma trận Phân cấp tự động</h2>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">Auto-Grading</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200">
                  <th className="pl-6 py-3 font-semibold text-gray-600">Chỉ tiêu (Parameter)</th>
                  <th className="px-4 py-3 font-semibold text-amber-800 bg-amber-50/30">🥇 Cấp A (Premium)</th>
                  <th className="px-4 py-3 font-semibold text-teal-800 bg-teal-50/30">🥈 Cấp B (Standard)</th>
                  <th className="px-4 py-3 font-semibold text-blue-800 bg-blue-50/30">🥉 Cấp C (Commercial)</th>
                  <th className="w-[48px] py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gradingRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="pl-6 py-4">
                      <div className="font-bold text-gray-800">{row.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{row.unit}</div>
                    </td>
                    <td className="px-4 py-4 bg-amber-50/5">
                      <div className="flex items-center gap-1">
                        <input className="w-16 px-1.5 py-1 border border-amber-200 rounded text-center text-xs bg-white focus:border-amber-500 outline-none" type="number" defaultValue={row.aMin} />
                        <span className="text-gray-300 text-xs">—</span>
                        <input className="w-16 px-1.5 py-1 border border-amber-200 rounded text-center text-xs bg-white focus:border-amber-500 outline-none" type="number" defaultValue={row.aMax} />
                      </div>
                    </td>
                    <td className="px-4 py-4 bg-teal-50/5">
                      <div className="flex items-center gap-1">
                        <input className="w-16 px-1.5 py-1 border border-teal-200 rounded text-center text-xs bg-white focus:border-teal-500 outline-none" type="number" defaultValue={row.bMin} />
                        <span className="text-gray-300 text-xs">—</span>
                        <input className="w-16 px-1.5 py-1 border border-teal-200 rounded text-center text-xs bg-white focus:border-teal-500 outline-none" type="number" defaultValue={row.bMax} />
                      </div>
                    </td>
                    <td className="px-4 py-4 bg-blue-50/5">
                      <div className="flex items-center gap-1">
                        <input className="w-16 px-1.5 py-1 border border-blue-200 rounded text-center text-xs bg-white focus:border-blue-500 outline-none" type="number" defaultValue={row.cMin} />
                        <span className="text-gray-300 text-xs">—</span>
                        <input className="w-16 px-1.5 py-1 border border-blue-200 rounded text-center text-xs bg-white focus:border-blue-500 outline-none" type="number" defaultValue={row.cMax} />
                      </div>
                    </td>
                    <td className="pr-4 py-4 text-center">
                      <button onClick={() => removeGradingRow(row.id)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-all">
              <Plus size={14} /> Thêm chỉ tiêu phân cấp
            </button>
          </div>
        </div>

        {/* CARD 3: RÀO CẢN CHẤT LƯỢNG */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Rào cản Chất lượng (Barriers)</h2>
            <span className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldAlert size={12} /> Rejection Rules
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200">
                  <th className="pl-6 py-3 font-semibold text-gray-600 w-[35%]">Tiêu chuẩn / Vi sinh</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-[25%]">Giới hạn tối đa (Max)</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-[30%]">Hành động nếu vi phạm</th>
                  <th className="w-[10%] py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {barrierRows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="pl-6 py-4">
                      <div className="font-bold text-gray-800">{row.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{row.unit}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-mono">≤</span>
                        <input className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-xs bg-white focus:border-red-500 outline-none" type="number" defaultValue={row.max} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer" checked={row.hardBlock} onChange={() => toggleHardBlock(row.id)} />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${row.hardBlock ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {row.hardBlock ? 'Hard-Block' : 'Tuỳ chọn'}
                        </span>
                      </div>
                    </td>
                    <td className="pr-4 py-4 text-center">
                      <button onClick={() => removeBarrierRow(row.id)} className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-all">
              <Plus size={14} /> Thêm rào cản chất lượng
            </button>
          </div>
        </div>

        {/* CARD 4: CHỨNG TỪ & XÁC THỰC */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Chứng từ & Xác thực</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Cấu hình Chu kỳ COA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-teal-600" />
                  <h3 className="text-sm font-bold text-gray-800">Chu kỳ hiệu lực COA</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Xác định thời gian tối đa chứng nhận phân tích (COA) được coi là hợp lệ kể từ ngày cấp đối với danh mục này.
                </p>
                <div className="flex items-center gap-2">
                  <input className="w-20 text-center px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-bold font-mono text-gray-800 bg-white" type="number" defaultValue="30" />
                  <span className="text-xs font-medium text-gray-600">Ngày</span>
                </div>
              </div>

              {/* Ảnh xác thực bắt buộc */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-teal-600" />
                  <h3 className="text-sm font-bold text-gray-800">Ảnh xác thực bắt buộc (App)</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Các góc chụp bắt buộc tài xế/người giao hàng phải cung cấp trên ứng dụng khi giao nhận lô hàng thuộc danh mục này.
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700 hover:text-teal-600 transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" defaultChecked />
                    <span>Ảnh tổng quan lô hàng (Toàn cảnh)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700 hover:text-teal-600 transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" defaultChecked />
                    <span>Ảnh tem nhãn / Mã QR từng bao</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700 hover:text-teal-600 transition-colors">
                    <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer" />
                    <span>Ảnh chụp ngẫu nhiên mẫu vật phẩm</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-6 right-6 transition-all duration-300 z-50 ${showToast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-md text-sm font-medium ${showToast.type === 'teal' ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-white border-gray-200 text-gray-800'}`}>
          {showToast.type === 'teal' ? <Check size={16} className="text-teal-600" /> : <X size={16} className="text-gray-400" />}
          <span>{showToast.message}</span>
        </div>
      </div>

    </div>
  );
};

export default CategoryConfig;