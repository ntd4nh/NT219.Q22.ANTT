import React, { useState } from 'react';

const LabInput = () => {
  const [state, setState] = useState({
    lotId: '',
    coaNumber: '',
    labSelect: '',
    issueDate: new Date().toISOString().split('T')[0],
    sampleDate: '',
    salmonella: 'negative',
    protein: '',
    moisture: '',
    shellRatio: '',
    tvn: '',
    cadmium: '',
    lead: '',
    mercury: '',
    arsenic: '',
    ecoli: ''
  });

  const [files, setFiles] = useState([]);
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' });
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState('—');

  const GRADE = {
    protein: { A: 38, B: 28 },
    moisture: { A: 10, B: 12 },
    shell: { A: 70 }
  };

  const LIMITS = {
    cadmium: 0.5,
    lead: 1.5,
    mercury: 0.5,
    arsenic: 1.0
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setState(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRadio = (name, value) => {
    setState(prev => ({ ...prev, [name]: value }));
  };

  const p = state.protein !== '' ? parseFloat(state.protein) : null;
  const m = state.moisture !== '' ? parseFloat(state.moisture) : null;
  const s = state.shellRatio !== '' ? parseFloat(state.shellRatio) : null;
  const cd = state.cadmium !== '' ? parseFloat(state.cadmium) : null;
  const pb = state.lead !== '' ? parseFloat(state.lead) : null;
  const hg = state.mercury !== '' ? parseFloat(state.mercury) : null;
  const as = state.arsenic !== '' ? parseFloat(state.arsenic) : null;

  const violations = [];
  if (state.salmonella === 'positive') violations.push('Phát hiện Salmonella spp. — Vi sinh vật gây bệnh nguy hiểm');
  if (cd !== null && cd > LIMITS.cadmium) violations.push(`Cadimi Cd = ${cd.toFixed(2)} mg/kg (giới hạn: ${LIMITS.cadmium})`);
  if (pb !== null && pb > LIMITS.lead) violations.push(`Chì Pb = ${pb.toFixed(2)} mg/kg (giới hạn: ${LIMITS.lead})`);
  if (hg !== null && hg > LIMITS.mercury) violations.push(`Thủy ngân Hg = ${hg.toFixed(2)} mg/kg (giới hạn: ${LIMITS.mercury})`);
  if (as !== null && as > LIMITS.arsenic) violations.push(`Asen As = ${as.toFixed(2)} mg/kg (giới hạn: ${LIMITS.arsenic})`);

  let grade = null;
  if (p !== null && m !== null) {
    const shellOk = s === null || s >= GRADE.shell.A;
    if (p >= GRADE.protein.A && m <= GRADE.moisture.A && shellOk) grade = 'A';
    else if (p >= GRADE.protein.B && m <= GRADE.moisture.B) grade = 'B';
    else grade = 'C';
  }

  const blocked = violations.length > 0;

  const showToast = (msg, type) => {
    setToast({ visible: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3200);
  };

  const updateAutoSaveTime = () => {
    setAutoSaveTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleAutoFill = () => {
    setIsAutoFilling(true);
    setTimeout(() => {
      setState({
        lotId: 'LOT-2026-0847',
        coaNumber: 'COA-2026-08471',
        labSelect: 'quatest3',
        issueDate: '2026-05-15',
        sampleDate: '2026-05-10',
        moisture: '9.2',
        protein: '42.5',
        shellRatio: '73.8',
        tvn: '22.4',
        salmonella: 'negative',
        cadmium: '0.18',
        lead: '0.42',
        mercury: '0.09',
        arsenic: '0.35',
        ecoli: '10'
      });
      setAutoFilled(true);
      setIsAutoFilling(false);
      updateAutoSaveTime();
      showToast('Đã tải dữ liệu mẫu — LOT-2026-0847', 'success');
      setTimeout(() => setAutoFilled(false), 3000);
    }, 850);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const GRADE_CFG = {
    A: {
      label: 'CẤP A — PREMIUM',
      sub: 'Đủ tiêu chuẩn xuất khẩu cao cấp',
      headerCls: 'bg-gradient-to-br from-amber-50 to-emerald-50',
      iconBg: 'bg-amber-100',
      iconCls: 'text-amber-500',
      icon: 'fa-award',
      titleCls: 'text-amber-800',
      border: 'border-emerald-300',
    },
    B: {
      label: 'CẤP B — STANDARD',
      sub: 'Đáp ứng tiêu chuẩn nội địa',
      headerCls: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      iconCls: 'text-teal-600',
      icon: 'fa-certificate',
      titleCls: 'text-teal-800',
      border: 'border-teal-300',
    },
    C: {
      label: 'CẤP C — COMMERCIAL',
      sub: 'Dùng cho chế biến công nghiệp',
      headerCls: 'bg-slate-50',
      iconBg: 'bg-slate-100',
      iconCls: 'text-slate-500',
      icon: 'fa-tag',
      titleCls: 'text-slate-700',
      border: 'border-slate-300',
    },
  };

  return (
    <div className="dot-bg min-h-screen pb-12 font-sans relative">
      <style>{`
        .font-serif { font-family: 'DM Serif Display', serif; }
        @keyframes danger-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
          50%       { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes grade-pop {
          0%   { transform: scale(0.75); opacity: 0; }
          70%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes slide-down {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes btn-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.45); }
          50%       { box-shadow: 0 0 0 10px rgba(13, 148, 136, 0); }
        }
        @keyframes stripe-move {
          from { background-position: 0 0; }
          to   { background-position: 40px 0; }
        }
        @keyframes toast-in {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .danger-pulse  { animation: danger-pulse 1.6s ease-in-out infinite; }
        .flash-anim    { animation: flash 1s ease-in-out infinite; }
        .grade-pop     { animation: grade-pop .35s cubic-bezier(.34,1.56,.64,1) forwards; }
        .slide-down    { animation: slide-down .22s ease-out forwards; }
        .btn-glow      { animation: btn-glow 2.2s ease-in-out infinite; }
        .toast-in      { animation: toast-in .25s ease-out forwards; }

        .dot-bg {
          background-color: #f1f5f9;
          background-image: radial-gradient(circle, #c8d3e0 1px, transparent 1px);
          background-size: 22px 22px;
        }

        .danger-stripe {
          height: 4px;
          background: repeating-linear-gradient(
            90deg,
            #f43f5e 0px, #f43f5e 16px,
            #fb923c 16px, #fb923c 32px
          );
          animation: stripe-move 1.2s linear infinite;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        input[type="date"]:focus,
        select:focus,
        textarea:focus {
          outline: none;
          border-color: #0d9488 !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type="number"] { -moz-appearance: textfield; }

        .drop-zone {
          border: 2px dashed #cbd5e1;
          transition: border-color .2s, background .2s;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: #0d9488;
          background: rgba(13,148,136,.04);
        }

        .metric-bar-fill { transition: width .55s cubic-bezier(.4,0,.2,1); }
        .preview-widget  { transition: border-color .4s, background .4s, box-shadow .4s; }
        .chk-item { transition: color .25s; }
      `}</style>

      <main className="max-w-screen-xl mx-auto px-5 pt-8">
        <div className="mb-6">
          <h1 className="font-bold text-3xl text-slate-900 leading-tight">Nhập kết quả kiểm định</h1>
          <p className="text-slate-500 text-sm mt-1">
            <i className="fas fa-circle-info mr-1.5 text-teal-500"></i>
            Hệ thống tự động phân hạng &amp; kiểm tra rào cản sinh học theo <strong className="text-slate-600">QCVN 01-190</strong>
          </p>
        </div>

        {/* Smart Lot-ID Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 mb-6 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
            <i className="fas fa-barcode text-xl"></i>
          </div>

          <input id="lotId" type="text"
            value={state.lotId}
            onChange={handleChange}
            className="flex-1 min-w-[200px] border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:border-teal-500 focus:shadow-[0_0_0_3px_rgba(13,148,136,.15)]"
            placeholder="Nhập mã lô hàng — VD: LOT-2026-0847" />

          <button onClick={handleAutoFill} disabled={isAutoFilling}
            className={`flex items-center gap-2 ${autoFilled ? 'bg-emerald-600' : 'bg-slate-900'} hover:bg-teal-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0`}>
            {isAutoFilling ? <i className="fas fa-spinner fa-spin text-xs"></i> : autoFilled ? <i className="fas fa-check mr-1"></i> : <i className="fas fa-wand-magic-sparkles text-xs"></i>}
            {isAutoFilling ? ' Đang tải…' : autoFilled ? ' Đã tải xong' : ' Auto-fill mẫu'}
          </button>

          <button className="flex items-center gap-2 border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0">
            <i className="fas fa-magnifying-glass text-xs"></i> Tra cứu
          </button>

          {state.lotId === 'LOT-2026-0847' && (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200 flex-wrap slide-down">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sản phẩm</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">Đầu tôm sú (Sấy khô)</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Khối lượng</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">12.5 Tấn</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Nhà cung cấp</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">Cty TNHH Thủy Sản Minh Phú</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: Form Cards */}
          <div className="xl:col-span-2 space-y-6">

            {/* Card A: Hồ sơ kiểm định */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-file-shield text-slate-600"></i>
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm leading-snug">Hồ sơ kiểm định</h2>
                    <p className="text-xs text-slate-400">Thông tin chứng nhận &amp; phòng thí nghiệm VILAS</p>
                  </div>
                </div>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full tracking-wide">MỤC A</span>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Số phiếu COA</label>
                  <div className="relative">
                    <i className="fas fa-hashtag absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input id="coaNumber" value={state.coaNumber} onChange={handleChange} type="text"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                      placeholder="COA-2026-08471" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phòng thí nghiệm <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <i className="fas fa-flask absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <select id="labSelect" value={state.labSelect} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-3 text-sm text-slate-900 bg-white appearance-none cursor-pointer transition-all duration-200">
                      <option value="">— Chọn phòng thí nghiệm VILAS —</option>
                      <option value="quatest3">Quatest 3 – TP. HCM (VILAS 005)</option>
                      <option value="cafecontrol">Cafecontrol Seafood Lab (VILAS 068)</option>
                      <option value="eurofins">Eurofins Scientific Vietnam (VILAS 112)</option>
                      <option value="intertek">Intertek Testing Services (VILAS 149)</option>
                      <option value="sgs">SGS Vietnam Ltd. (VILAS 221)</option>
                      <option value="bioanalytical">Bioanalytical Lab – Cần Thơ (VILAS 308)</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ngày ban hành COA</label>
                  <div className="relative">
                    <i className="fas fa-calendar-days absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input id="issueDate" value={state.issueDate} onChange={handleChange} type="date"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 transition-all duration-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ngày lấy mẫu</label>
                  <div className="relative">
                    <i className="fas fa-calendar-check absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input id="sampleDate" value={state.sampleDate} onChange={handleChange} type="date"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 transition-all duration-200" />
                  </div>
                </div>
              </div>

              {/* File Drop Zone */}
              <div className="px-6 pb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tài liệu đính kèm (PDF / Ảnh)</label>
                <div 
                  className="drop-zone rounded-xl p-8 text-center cursor-pointer select-none"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                  onDrop={(e) => { e.currentTarget.classList.remove('drag-over'); handleFileDrop(e); }}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <div className="flex flex-col items-center gap-3 pointer-events-none">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <i className="fas fa-cloud-arrow-up text-slate-400 text-2xl"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Kéo &amp; thả file vào đây</p>
                      <p className="text-xs text-slate-400 mt-1">hoặc <span className="text-teal-600 font-semibold hover:underline cursor-pointer">chọn từ máy tính</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">PDF</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">JPG</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">PNG</span>
                      <span>— Tối đa 10 MB</span>
                    </div>
                  </div>
                </div>
                <input type="file" id="fileInput" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileInput} />
                
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 slide-down">
                        <i className={`fas ${file.type === 'application/pdf' ? 'fa-file-pdf text-rose-500' : 'fa-file-image text-blue-500'} flex-shrink-0`}></i>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-700 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-slate-400 hover:text-rose-500 transition-colors p-1">
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card B: Chỉ số Lý - Hóa */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                    <i className="fas fa-atom text-teal-600"></i>
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm leading-snug">Chỉ số Lý - Hóa</h2>
                    <p className="text-xs text-slate-400">Dữ liệu phân tích tự động xác định hạng</p>
                  </div>
                </div>
                <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full tracking-wide">AUTO-GRADING</span>
              </div>

              <div className="p-6 space-y-7">
                {/* Độ ẩm */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Độ ẩm (%)</label>
                    {m !== null && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full slide-down ${m <= GRADE.moisture.A ? 'bg-emerald-100 text-emerald-700' : m <= GRADE.moisture.B ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>
                        {m <= GRADE.moisture.A ? 'Cấp A ✓' : m <= GRADE.moisture.B ? 'Cấp B' : 'Dưới Cấp C'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input id="moisture" value={state.moisture} onChange={handleChange} type="number" step="0.1" min="0" max="100"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-10" placeholder="0.0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">%</span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full metric-bar-fill ${m === null ? 'bg-slate-300' : m <= GRADE.moisture.A ? 'bg-emerald-400' : m <= GRADE.moisture.B ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: m !== null ? `${Math.max(0, (1 - m / 20) * 100)}%` : '0%' }}></div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Cấp A: ≤ 10%</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>Cấp B: ≤ 12%</span>
                      </div>
                      <span className="font-mono text-slate-400">{m !== null ? `${m.toFixed(1)}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Protein thô */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protein thô (%)</label>
                    {p !== null && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full slide-down ${p >= GRADE.protein.A ? 'bg-emerald-100 text-emerald-700' : p >= GRADE.protein.B ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>
                        {p >= GRADE.protein.A ? 'Cấp A ✓' : p >= GRADE.protein.B ? 'Cấp B' : 'Dưới Cấp C'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input id="protein" value={state.protein} onChange={handleChange} type="number" step="0.1" min="0" max="100"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-10" placeholder="0.0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">%</span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full metric-bar-fill ${p === null ? 'bg-slate-300' : p >= GRADE.protein.A ? 'bg-emerald-400' : p >= GRADE.protein.B ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: p !== null ? `${Math.min(100, (p / 60) * 100)}%` : '0%' }}></div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Cấp A: ≥ 38%</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>Cấp B: ≥ 28%</span>
                      </div>
                      <span className="font-mono text-slate-400">{p !== null ? `${p.toFixed(1)}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Tỷ lệ thịt/vỏ */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tỷ lệ thịt/vỏ (%)</label>
                    {s !== null && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full slide-down ${s >= GRADE.shell.A ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s >= GRADE.shell.A ? 'Cấp A ✓' : 'Cấp B/C'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input id="shellRatio" value={state.shellRatio} onChange={handleChange} type="number" step="0.1" min="0" max="100"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-10" placeholder="0.0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">%</span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full metric-bar-fill ${s === null ? 'bg-slate-300' : s >= GRADE.shell.A ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: s !== null ? `${Math.min(100, s)}%` : '0%' }}></div>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Cấp A: ≥ 70%
                      <span className="ml-3 text-slate-400">— Cấp B/C không yêu cầu tối thiểu</span>
                    </div>
                  </div>
                </div>

                {/* TVN */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">TVN – Nitơ bazơ bay hơi (mgN/100g)</label>
                  <div className="relative">
                    <input id="tvn" value={state.tvn} onChange={handleChange} type="number" step="0.1" min="0"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-24" placeholder="0.0" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">mgN/100g</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400"><i className="fas fa-circle-info mr-1 text-teal-400"></i>Giới hạn QCVN: ≤ 35 mgN/100g</p>
                </div>
              </div>
            </div>

            {/* Card C: Rào cản Sinh học & Kim loại nặng */}
            <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-sm transition-all duration-400 relative">
              <div className="danger-stripe"></div>
              <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield-virus text-rose-500"></i>
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm leading-snug">Rào cản Sinh học &amp; Kim loại nặng</h2>
                    <p className="text-xs text-rose-400 font-semibold">Vi phạm → Lô hàng bị khóa NGAY LẬP TỨC</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-triangle-exclamation text-rose-400 flash-anim"></i>
                  <span className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1 rounded-full tracking-wide">HARD-BLOCK</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Salmonella spp. */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Salmonella spp.</div>
                      <div className="text-xs text-slate-500 mt-0.5">Xét nghiệm vi sinh — TCVN 4829:2005</div>
                    </div>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div onClick={() => handleRadio('salmonella', 'negative')} className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all duration-200 border-r border-slate-200 ${state.salmonella === 'negative' ? 'bg-emerald-50' : ''}`}>
                        <i className={`fas fa-circle-check text-sm ${state.salmonella === 'negative' ? 'text-emerald-500' : 'text-slate-300'}`}></i>
                        <span className={`text-xs font-bold ${state.salmonella === 'negative' ? 'text-emerald-700' : 'text-slate-400'}`}>Không phát hiện</span>
                      </div>
                      <div onClick={() => handleRadio('salmonella', 'positive')} className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all duration-200 ${state.salmonella === 'positive' ? 'bg-rose-50' : ''}`}>
                        <i className={`fas fa-circle-xmark text-sm ${state.salmonella === 'positive' ? 'text-rose-500' : 'text-slate-400'}`}></i>
                        <span className={`text-xs font-bold ${state.salmonella === 'positive' ? 'text-rose-700' : 'text-slate-400'}`}>Phát hiện</span>
                      </div>
                    </div>
                  </div>
                  {state.salmonella === 'negative' ? (
                    <div className="mt-3 flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                      <i className="fas fa-shield-check"></i><span>Kết quả âm tính — Không có nguy cơ sinh học</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-rose-600 text-xs font-bold">
                      <i className="fas fa-triangle-exclamation flash-anim"></i><span>PHÁT HIỆN — Lô hàng sẽ bị KHÓA ngay lập tức!</span>
                    </div>
                  )}
                </div>

                {/* Heavy Metals Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Cadmium */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cadimi — Cd <span className="text-rose-400 normal-case font-semibold">(≤ 0.5 mg/kg)</span></label>
                    <div className="relative">
                      <input id="cadmium" value={state.cadmium} onChange={handleChange} type="number" step="0.01" min="0"
                        className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-16 ${cd !== null && cd > LIMITS.cadmium ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`} placeholder="0.00" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">mg/kg</span>
                    </div>
                    {cd !== null && cd > LIMITS.cadmium && <div className="mt-1.5 text-xs text-rose-600 font-bold flex items-center gap-1.5 slide-down"><i className="fas fa-triangle-exclamation"></i> Vượt ngưỡng — sẽ bị khóa!</div>}
                  </div>
                  {/* Lead */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Chì — Pb <span className="text-rose-400 normal-case font-semibold">(≤ 1.5 mg/kg)</span></label>
                    <div className="relative">
                      <input id="lead" value={state.lead} onChange={handleChange} type="number" step="0.01" min="0"
                        className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-16 ${pb !== null && pb > LIMITS.lead ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`} placeholder="0.00" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">mg/kg</span>
                    </div>
                    {pb !== null && pb > LIMITS.lead && <div className="mt-1.5 text-xs text-rose-600 font-bold flex items-center gap-1.5 slide-down"><i className="fas fa-triangle-exclamation"></i> Vượt ngưỡng — sẽ bị khóa!</div>}
                  </div>
                  {/* Mercury */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Thủy ngân — Hg <span className="text-rose-400 normal-case font-semibold">(≤ 0.5 mg/kg)</span></label>
                    <div className="relative">
                      <input id="mercury" value={state.mercury} onChange={handleChange} type="number" step="0.01" min="0"
                        className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-16 ${hg !== null && hg > LIMITS.mercury ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`} placeholder="0.00" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">mg/kg</span>
                    </div>
                    {hg !== null && hg > LIMITS.mercury && <div className="mt-1.5 text-xs text-rose-600 font-bold flex items-center gap-1.5 slide-down"><i className="fas fa-triangle-exclamation"></i> Vượt ngưỡng — sẽ bị khóa!</div>}
                  </div>
                  {/* Arsenic */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Asen — As <span className="text-rose-400 normal-case font-semibold">(≤ 1.0 mg/kg)</span></label>
                    <div className="relative">
                      <input id="arsenic" value={state.arsenic} onChange={handleChange} type="number" step="0.01" min="0"
                        className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-16 ${as !== null && as > LIMITS.arsenic ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`} placeholder="0.00" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">mg/kg</span>
                    </div>
                    {as !== null && as > LIMITS.arsenic && <div className="mt-1.5 text-xs text-rose-600 font-bold flex items-center gap-1.5 slide-down"><i className="fas fa-triangle-exclamation"></i> Vượt ngưỡng — sẽ bị khóa!</div>}
                  </div>
                </div>

                {/* E. coli */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E. coli (CFU/g)</label>
                    <span className="text-xs text-slate-400">Giới hạn QCVN: ≤ 100 CFU/g</span>
                  </div>
                  <div className="relative">
                    <input id="ecoli" value={state.ecoli} onChange={handleChange} type="number" step="1" min="0"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 pr-16" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">CFU/g</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Ghi chú */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                <i className="fas fa-pen-to-square mr-1.5 text-slate-400"></i>Ghi chú kiểm định viên
              </label>
              <textarea rows="3"
                className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 resize-none focus:outline-none"
                placeholder="Nhập ghi chú, quan sát hoặc điều kiện đặc biệt của lô hàng…"></textarea>
            </div>

          </div>

          {/* RIGHT: Sticky Live Preview */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-4">
              
              {/* Main Status Widget */}
              <div className={`preview-widget rounded-2xl border bg-white overflow-hidden shadow-sm ${blocked ? 'border-2 border-rose-500 bg-rose-50 danger-pulse' : grade !== null ? `border-2 ${GRADE_CFG[grade].border}` : 'border-slate-200'}`}>
                
                {/* DEFAULT state */}
                {!blocked && grade === null && (
                  <div className="p-7 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-chart-pie text-slate-400 text-2xl"></i>
                    </div>
                    <div className="font-semibold text-slate-400 text-sm">Chờ nhập liệu</div>
                    <div className="text-slate-300 text-xs mt-1">Kết quả kiểm định sẽ hiện tại đây</div>
                  </div>
                )}

                {/* SAFE/GRADE state */}
                {!blocked && grade !== null && (
                  <div>
                    <div className={`px-6 pt-6 pb-5 ${GRADE_CFG[grade].headerCls}`}>
                      <div className="flex items-start gap-4">
                        <div className={`${GRADE_CFG[grade].iconBg} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 grade-pop`}>
                          <i className={`fas ${GRADE_CFG[grade].icon} ${GRADE_CFG[grade].iconCls} text-2xl`}></i>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Hạng dự kiến</div>
                          <div className={`font-serif text-xl ${GRADE_CFG[grade].titleCls} leading-tight`}>{GRADE_CFG[grade].label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{GRADE_CFG[grade].sub}</div>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6 space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Protein thô</div>
                          <div className="text-lg font-bold text-slate-800">{p !== null ? p.toFixed(1) + '%' : '—'}</div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Độ ẩm</div>
                          <div className="text-lg font-bold text-slate-800">{m !== null ? m.toFixed(1) + '%' : '—'}</div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl px-3 py-1 space-y-0.5">
                        {p !== null && (
                          <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Protein thô</span>
                            <span className={`font-bold ${p >= 38 ? 'text-emerald-600' : p >= 28 ? 'text-amber-600' : 'text-rose-500'}`}>{p.toFixed(1)}% → Cấp {p >= 38 ? 'A' : p >= 28 ? 'B' : 'C'}</span>
                          </div>
                        )}
                        {m !== null && (
                          <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Độ ẩm</span>
                            <span className={`font-bold ${m <= 10 ? 'text-emerald-600' : m <= 12 ? 'text-amber-600' : 'text-rose-500'}`}>{m.toFixed(1)}% → Cấp {m <= 10 ? 'A' : m <= 12 ? 'B' : 'C'}</span>
                          </div>
                        )}
                        {s !== null && (
                          <div className="flex justify-between items-center text-xs py-1.5">
                            <span className="text-slate-500">Tỷ lệ thịt/vỏ</span>
                            <span className="font-bold text-emerald-600">{s.toFixed(1)}% → Cấp {s >= 70 ? 'A' : 'B/C'}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5">
                        <i className="fas fa-shield-check text-emerald-500"></i>
                        <div>
                          <div className="text-xs font-bold text-emerald-700">Rào cản sinh học</div>
                          <div className="text-xs text-emerald-600">Không phát hiện vi phạm</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DANGER state */}
                {blocked && (
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-ban text-rose-600 text-2xl flash-anim"></i>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-0.5">Cảnh báo hệ thống</div>
                        <div className="font-serif text-2xl text-rose-700 leading-tight">CẤM LƯU THÔNG</div>
                        <div className="text-xs text-rose-500 font-semibold">Vi phạm QCVN 01-190</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-2 mb-4 border border-rose-200">
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pt-2 pb-1 flex items-center gap-2">
                        <i className="fas fa-triangle-exclamation"></i> Lý do vi phạm ({violations.length})
                      </div>
                      {violations.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b border-rose-100 last:border-0 text-rose-700">
                          <i className="fas fa-xmark text-rose-500 flex-shrink-0 mt-0.5"></i>
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-900 rounded-xl p-4 text-center">
                      <i className="fas fa-lock text-rose-300 text-xl mb-2 block flash-anim"></i>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Trạng thái lô hàng</div>
                      <div className="text-sm font-bold text-white">BỊ KHÓA — KHÔNG THỂ GIAO DỊCH</div>
                      <div className="text-xs text-rose-400 mt-1">Liên hệ Bộ phận Kiểm định để xử lý khẩn</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Compliance Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <i className="fas fa-clipboard-check mr-1.5 text-teal-500"></i>Checklist QCVN 01-190
                </div>
                <div className="space-y-2.5">
                  <div className={`chk-item flex items-center gap-2.5 text-xs ${state.salmonella === 'negative' ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${state.salmonella === 'negative' ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Salmonella spp. — {state.salmonella === 'negative' ? 'Không phát hiện' : 'Phát hiện'}</span>
                  </div>
                  
                  <div className={`chk-item flex items-center gap-2.5 text-xs ${cd === null ? 'text-slate-400' : cd <= LIMITS.cadmium ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${cd === null ? 'fa-circle-dot text-slate-300' : cd <= LIMITS.cadmium ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Cadimi Cd ≤ 0.5 mg/kg</span>
                  </div>

                  <div className={`chk-item flex items-center gap-2.5 text-xs ${pb === null ? 'text-slate-400' : pb <= LIMITS.lead ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${pb === null ? 'fa-circle-dot text-slate-300' : pb <= LIMITS.lead ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Chì Pb ≤ 1.5 mg/kg</span>
                  </div>

                  <div className={`chk-item flex items-center gap-2.5 text-xs ${hg === null ? 'text-slate-400' : hg <= LIMITS.mercury ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${hg === null ? 'fa-circle-dot text-slate-300' : hg <= LIMITS.mercury ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Thủy ngân Hg ≤ 0.5 mg/kg</span>
                  </div>

                  <div className={`chk-item flex items-center gap-2.5 text-xs ${as === null ? 'text-slate-400' : as <= LIMITS.arsenic ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${as === null ? 'fa-circle-dot text-slate-300' : as <= LIMITS.arsenic ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Asen As ≤ 1.0 mg/kg</span>
                  </div>

                  <div className={`chk-item flex items-center gap-2.5 text-xs ${m === null ? 'text-slate-400' : m <= GRADE.moisture.B ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${m === null ? 'fa-circle-dot text-slate-300' : m <= GRADE.moisture.B ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Độ ẩm ≤ 12% (Cấp B tối thiểu)</span>
                  </div>

                  <div className={`chk-item flex items-center gap-2.5 text-xs ${p === null ? 'text-slate-400' : p >= GRADE.protein.B ? 'text-emerald-700 font-medium' : 'text-rose-600 font-bold'}`}>
                    <i className={`fas ${p === null ? 'fa-circle-dot text-slate-300' : p >= GRADE.protein.B ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'} text-[11px] flex-shrink-0`}></i>
                    <span>Protein thô ≥ 28% (Cấp B tối thiểu)</span>
                  </div>
                </div>
              </div>

              {/* Lot Info Widget */}
              {state.lotId === 'LOT-2026-0847' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm slide-down">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    <i className="fas fa-box-open mr-1.5 text-teal-500"></i>Thông tin lô hàng
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2 text-sm">
                      <span className="text-slate-400 text-xs flex-shrink-0">Mã lô</span>
                      <span className="font-bold text-slate-800 font-mono text-xs">LOT-2026-0847</span>
                    </div>
                    <div className="flex justify-between items-start gap-2 text-sm">
                      <span className="text-slate-400 text-xs flex-shrink-0">Sản phẩm</span>
                      <span className="font-bold text-slate-800 text-xs text-right">Đầu tôm sú (Sấy khô)</span>
                    </div>
                    <div className="flex justify-between items-start gap-2 text-sm">
                      <span className="text-slate-400 text-xs flex-shrink-0">Khối lượng</span>
                      <span className="font-bold text-slate-800 text-xs">12.5 Tấn</span>
                    </div>
                    <div className="flex justify-between items-start gap-2 text-sm border-t border-slate-100 pt-2.5 mt-2.5">
                      <span className="text-slate-400 text-xs flex-shrink-0">Nhà cung cấp</span>
                      <span className="font-bold text-slate-800 text-xs text-right">Cty TNHH Thủy Sản Minh Phú</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm mb-10">
          <div className="text-xs text-slate-400">
            <i className="fas fa-clock mr-1.5"></i>
            Tự động lưu lúc <span className="font-mono text-slate-500">{autoSaveTime}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => { if(window.confirm('Bạn có chắc muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) showToast('Đã hủy thao tác', 'info'); }}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all duration-200 active:scale-95">
              <i className="fas fa-xmark mr-2"></i>Hủy bỏ
            </button>
            <button onClick={() => { updateAutoSaveTime(); showToast('Đã lưu bản nháp thành công', 'success'); }}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 active:scale-95">
              <i className="fas fa-floppy-disk mr-2"></i>Lưu bản nháp
            </button>
            <button disabled={blocked} onClick={() => { if(!blocked) showToast(`Đã duyệt thành công! Hạng: ${grade || 'Chưa xác định'}`, 'success'); }}
              className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-200 flex items-center gap-2 ${blocked ? 'bg-rose-400 cursor-not-allowed opacity-75' : 'bg-teal-600 hover:bg-teal-700 active:scale-95 btn-glow'}`}>
              {blocked ? (
                <><i className="fas fa-ban"></i> Bị khóa — Không thể duyệt <i className="fas fa-lock text-xs"></i></>
              ) : (
                <><i className="fas fa-circle-check"></i> Xác nhận &amp; Duyệt đơn <i className="fas fa-arrow-right text-xs"></i></>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-3 toast-in">
            <i className={`fas text-base ${toast.type === 'success' ? 'fa-check-circle text-emerald-400' : toast.type === 'info' ? 'fa-circle-info text-blue-400' : 'fa-triangle-exclamation text-rose-400'}`}></i>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabInput;