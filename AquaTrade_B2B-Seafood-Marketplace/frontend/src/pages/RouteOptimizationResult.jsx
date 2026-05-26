import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Truck, PiggyBank, TrendingUp, Package, ChevronDown,
    MapPin, ArrowDown, ArrowUp, Printer, CheckCircle2, Zap, Cpu,
    Home, ArrowRightLeft, Navigation, Search, Bell, LayoutDashboard
} from "lucide-react";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

import BrandLogo from '../assets/images/logo/brand.png'; // Import Logo thương hiệu

/* ─── MOCK DATA ──────────────────────────────────────────────────────────────── */
const routeStats = { totalRoutes: 2, totalSavings: "11.700.000 đ", savingsPct: "63%", totalVolume: "9 lô / 18.4 tấn" };
const routeDetails = [
    {
        id: "A", name: "Cà Mau → Cần Thơ", distance: "312km", load: "8.2/10 tấn", cost: "6.800.000đ",
        stops: [
            { time: "06:00", type: "Pickup", name: "NM Minh Phú | Cà Mau", weight: "2800kg" },
            { time: "08:30", type: "Pickup", name: "NM Phương Nam | Bạc Liêu", weight: "1500kg" },
            { time: "12:00", type: "Delivery", name: "NM Thức ăn GreenFeed | Cần Thơ", weight: "4300kg" },
        ],
        allocations: [
            { id: "LOT-001", product: "Vỏ tôm sú", weight: "2.800 kg", ratio: 34.1, cost: "2.320.000 đ", oldCost: "6.200.000 đ", savings: "3.880.000 đ", rawOld: 6200000, rawNew: 2320000 },
            { id: "LOT-002", product: "Đầu tôm", weight: "1.500 kg", ratio: 27.5, cost: "1.870.000 đ", oldCost: "4.100.000 đ", savings: "2.230.000 đ", rawOld: 4100000, rawNew: 1870000 },
            { id: "LOT-003", product: "Vỏ tôm thẻ", weight: "3.900 kg", ratio: 38.4, cost: "2.610.000 đ", oldCost: "8.200.000 đ", savings: "5.590.000 đ", rawOld: 8200000, rawNew: 2610000 },
        ],
    },
];
const OLD_COLORS = ["#fb7185", "#f43f5e", "#e11d48"];
const NEW_COLORS = ["#34d399", "#10b981", "#059669"];
const chartData = routeDetails[0].allocations.map(a => ({ name: a.id, "Chi phí đi riêng lẻ": a.rawOld, "Chi phí gom xe": a.rawNew }));
const AI_INSIGHT = "Hệ thống đã gom lô LOT-001 và LOT-003 vào chung chuyến A, tối đa hóa 82% tải trọng xe và cắt giảm 11.7M VNĐ chi phí di chuyển rỗng. Phân bổ chi phí theo trọng số tải trọng đạt độ chính xác 97.3%.";

/* ─── GLOBAL STYLES ─────────────────────────────────────────────────────────── */
const GlobalStyles = () => (
    <style>{`
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes breathGlow{0%,100%{box-shadow:0 0 0 3px rgba(52,211,153,.25),0 0 18px rgba(52,211,153,.12)}50%{box-shadow:0 0 0 6px rgba(52,211,153,.42),0 0 32px rgba(52,211,153,.2)}}
    @keyframes dotPop{from{opacity:0;transform:scale(0.2)}to{opacity:1;transform:scale(1)}}
    @keyframes lineExpandH{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    @keyframes tooltipFade{from{opacity:0;transform:translateY(-5px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    @keyframes savingsBadge{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    @keyframes checkBounce{0%{transform:scale(0) rotate(-15deg)}55%{transform:scale(1.3) rotate(8deg)}80%{transform:scale(.9) rotate(-3deg)}100%{transform:scale(1) rotate(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}50%{box-shadow:0 0 0 7px rgba(52,211,153,0)}}
    @keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}

    .stat-card{animation:fadeSlideUp .55s cubic-bezier(.22,.68,0,1.2) both}
    .glow-savings{animation:breathGlow 2.8s ease-in-out infinite}
    .dot-pop{animation:dotPop .4s cubic-bezier(.34,1.56,.64,1) both}
    .line-expand-h{animation:lineExpandH .75s cubic-bezier(.4,0,.2,1) both;transform-origin:left center}
    .tooltip-anim{animation:tooltipFade .18s ease both}
    .savings-badge{animation:savingsBadge 3s ease-in-out infinite}
    .check-bounce{animation:checkBounce .55s cubic-bezier(.34,1.56,.64,1) both}
    .spinner{animation:spin .7s linear infinite}
    .pulse-ring{animation:pulseRing 2s ease-in-out infinite}
    .ai-gradient-border{background:linear-gradient(270deg,#6366f1,#3b82f6,#10b981,#6366f1);background-size:300% 300%;animation:gradientShift 4s ease infinite}
    .cursor-blink{animation:cursorBlink 1s step-end infinite}
    .row-link{transition:background .18s,box-shadow .18s}
    .export-tooltip{pointer-events:none;opacity:0;transform:translateY(-4px);transition:opacity .2s,transform .2s}
    .export-btn-wrap:hover .export-tooltip{opacity:1;transform:translateY(0)}
  `}</style>
);

/* ─── COMPONENT NAV ITEM ──────────────────────────────────────────────────────── */
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

/* ─── TYPEWRITER HOOK ───────────────────────────────────────────────────────── */
const useTypewriter = (text, speed = 26, delay = 600) => {
    const [shown, setShown] = useState("");
    const [done, setDone] = useState(false);
    useEffect(() => {
        setShown(""); setDone(false);
        let i = 0, iv;
        const t = setTimeout(() => {
            iv = setInterval(() => {
                i++;
                setShown(text.slice(0, i));
                if (i >= text.length) { clearInterval(iv); setDone(true); }
            }, speed);
        }, delay);
        return () => { clearTimeout(t); clearInterval(iv); };
    }, [text]);
    return { shown, done };
};

/* ─── AI INSIGHT PANEL ──────────────────────────────────────────────────────── */
const AIInsightPanel = () => {
    const { shown, done } = useTypewriter(AI_INSIGHT);
    const chips = [
        { label: "Tải trọng", value: "82%", cls: "bg-blue-50 text-blue-700 border-blue-100" },
        { label: "Chính xác", value: "97.3%", cls: "bg-violet-50 text-violet-700 border-violet-100" },
        { label: "Tiết kiệm", value: "11.7M", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    ];
    return (
        <div className="p-px rounded-2xl ai-gradient-border shadow-md">
            <div
                className="rounded-[15px] p-5"
                style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
            >
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="relative flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-ring" />
                        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-60" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-indigo-500" />
                        <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">MILP Engine Analysis</span>
                    </div>
                    <span className="ml-auto text-[10px] text-slate-400 bg-white/80 border border-slate-100 rounded-full px-2.5 py-0.5 font-semibold">v2.1 · Active</span>
                </div>

                <div className="relative min-h-[3.5rem]">
                    <p className="text-sm text-slate-700 leading-relaxed">
                        {shown}
                        {!done && <span className="cursor-blink inline-block w-[2px] h-4 bg-indigo-400 ml-0.5 align-middle rounded-sm" />}
                    </p>
                </div>

                {done && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100/80" style={{ animation: "fadeSlideUp .4s ease both" }}>
                        {chips.map(c => (
                            <div key={c.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${c.cls}`}>
                                <Zap size={10} /> {c.label}: <span className="font-extrabold">{c.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── STAT CARD ─────────────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent, sub, delay, glow }) => (
    <div
        className={`stat-card bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 ${glow ? "glow-savings" : "shadow-sm hover:shadow-md"} transition-shadow`}
        style={{ animationDelay: delay }}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
    </div>
);

/* ─── EXPORT BUTTON ─────────────────────────────────────────────────────────── */
const ExportButton = () => {
    const [clicked, setClicked] = useState(false);
    return (
        <div className="export-btn-wrap relative">
            <button
                onClick={() => { setClicked(true); setTimeout(() => setClicked(false), 2000); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-200 shadow-sm
          ${clicked ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"}`}
            >
                {clicked ? <CheckCircle2 size={15} /> : <Printer size={15} />}
                {clicked ? "Đã lưu!" : "Xuất báo cáo"}
            </button>
            <div className="export-tooltip absolute -bottom-10 right-0 z-50">
                <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl">
                    In PDF hoặc xuất Excel
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-800 rotate-45" />
                </div>
            </div>
        </div>
    );
};

/* ─── CUSTOM CHART TOOLTIP ──────────────────────────────────────────────────── */
const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const oldV = payload.find(p => p.dataKey === "Chi phí đi riêng lẻ")?.value ?? 0;
    const newV = payload.find(p => p.dataKey === "Chi phí gom xe")?.value ?? 0;
    const saved = oldV - newV;
    const pct = oldV ? Math.round((saved / oldV) * 100) : 0;
    const fmt = v => (v / 1000).toLocaleString("vi-VN") + "K đ";
    return (
        <div className="tooltip-anim bg-white border border-slate-100 rounded-2xl shadow-xl px-5 py-4 min-w-[220px]">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
            <div className="space-y-2 mb-3">
                {payload.map(p => (
                    <div key={p.dataKey} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
                            <span className="text-xs text-slate-500">{p.dataKey}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{fmt(p.value)}</span>
                    </div>
                ))}
            </div>
            <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><TrendingUp size={12} /> Tiết kiệm</span>
                    <span className="text-sm font-extrabold text-emerald-600">{fmt(saved)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${pct}%`, transition: "width .5s" }} />
                </div>
                <p className="text-right text-xs text-emerald-500 font-bold mt-1">{pct}% tiết kiệm</p>
            </div>
        </div>
    );
};

/* ─── HORIZONTAL TRANSIT MAP ────────────────────────────────────────────────── */
const HorizontalTransitMap = ({ stops, visible }) => (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="relative" style={{ minWidth: 480 }}>
            <div
                className="absolute left-[3.6rem] right-[3.6rem] overflow-hidden rounded-full"
                style={{ top: "3.55rem", height: 3, background: "rgba(226,232,240,1)" }}
            >
                <div
                    className="line-expand-h h-full rounded-full"
                    style={{
                        background: "linear-gradient(to right, #60a5fa, #3b82f6, #10b981)",
                        animationPlayState: visible ? "running" : "paused",
                        animationDuration: "0.85s",
                        animationDelay: "80ms",
                    }}
                />
            </div>

            <div className="relative flex justify-between px-3 pt-3">
                {stops.map((stop, i) => {
                    const isDelivery = stop.type === "Delivery";
                    const nd = `${i * 210 + 180}ms`;
                    const td = `${i * 210 + 340}ms`;
                    return (
                        <div key={i} className="flex flex-col items-center gap-1.5 w-36">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{stop.time}</span>
                            <div
                                className={`dot-pop w-11 h-11 rounded-full border-[2.5px] flex items-center justify-center bg-white z-10
                  ${isDelivery ? "border-emerald-500 shadow-emerald-100" : "border-blue-400 shadow-blue-100"} shadow-md`}
                                style={{ animationDelay: nd, animationPlayState: visible ? "running" : "paused" }}
                            >
                                {isDelivery
                                    ? <ArrowDown size={16} className="text-emerald-600" />
                                    : <ArrowUp size={16} className="text-blue-500" />
                                }
                            </div>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDelivery ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                                style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(5px)", transition: `opacity .3s ${nd}, transform .3s ${nd}` }}
                            >
                                {stop.type}
                            </span>
                            <p
                                className="text-[11px] font-semibold text-slate-800 text-center leading-tight px-1"
                                style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)", transition: `opacity .35s ${td}, transform .35s ${td}` }}
                            >
                                {stop.name}
                            </p>
                            <p
                                className="text-[10px] text-slate-400 flex items-center gap-0.5"
                                style={{ opacity: visible ? 1 : 0, transition: `opacity .35s ${td}` }}
                            >
                                <Package size={9} /> {stop.weight}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

/* ─── APPROVE BUTTON ────────────────────────────────────────────────────────── */
const ApproveButton = () => {
    const [state, setState] = useState("idle"); // idle | loading | done
    const handle = () => {
        if (state !== "idle") return;
        setState("loading");
        setTimeout(() => setState("done"), 1500);
    };
    return (
        <button
            onClick={handle}
            disabled={state === "loading"}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 select-none
        ${state === "idle" ? "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-200" : ""}
        ${state === "loading" ? "bg-blue-400 text-white cursor-not-allowed" : ""}
        ${state === "done" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : ""}
      `}
        >
            {state === "idle" && (
                <><CheckCircle2 size={16} /> Duyệt phương án gom xe này</>
            )}
            {state === "loading" && (
                <><div className="spinner w-4 h-4 rounded-full border-2 border-white/30 border-t-white" /> Đang xử lý...</>
            )}
            {state === "done" && (
                <><CheckCircle2 size={16} className="check-bounce" /> Đã duyệt thành công!</>
            )}
        </button>
    );
};

/* ─── ALLOCATION TABLE ──────────────────────────────────────────────────────── */
const AllocationTable = ({ allocations, hoveredLotId, setHoveredLotId }) => {
    const totalOld = allocations.reduce((s, a) => s + a.rawOld, 0);
    const totalNew = allocations.reduce((s, a) => s + a.rawNew, 0);
    const fmt = n => n.toLocaleString("vi-VN") + " đ";
    return (
        <div className="rounded-xl overflow-hidden border border-slate-100">
            <div className="overflow-x-auto max-h-72">
                <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed", minWidth: 620 }}>
                    <thead>
                        <tr style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", background: "rgba(255,255,255,0.86)", borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
                            {["Lô hàng", "Sản phẩm", "Khối lượng", "Tỷ lệ", "Chi phí vận tải", "Chi phí cũ", "Tiết kiệm"].map((h, i) => (
                                <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                                    style={{ width: [88, 128, 98, 108, 128, 108, 108][i] }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allocations.map((a, i) => {
                            const hov = hoveredLotId === a.id;
                            return (
                                <tr key={a.id} className="row-link border-t border-slate-100 cursor-pointer"
                                    onMouseEnter={() => setHoveredLotId(a.id)}
                                    onMouseLeave={() => setHoveredLotId(null)}
                                    style={{ background: hov ? "rgba(251,191,36,.11)" : i % 2 === 0 ? "#fff" : "rgba(248,250,252,.6)", boxShadow: hov ? "inset 3px 0 0 #f59e0b" : "none" }}
                                >
                                    <td className="px-3 py-2.5">
                                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md transition-all duration-200 ${hov ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{a.id}</span>
                                    </td>
                                    <td className="px-3 py-2.5 font-medium text-slate-700 truncate">{a.product}</td>
                                    <td className="px-3 py-2.5 text-slate-600 text-xs">{a.weight}</td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex-1">
                                                <div className={`h-full rounded-full transition-all duration-500 ${hov ? "bg-amber-400" : "bg-blue-400"}`} style={{ width: `${a.ratio}%` }} />
                                            </div>
                                            <span className="text-slate-500 text-xs w-10 text-right">{a.ratio}%</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 font-bold text-emerald-700 text-xs">{a.cost}</td>
                                    <td className="px-3 py-2.5 text-slate-400 line-through text-xs">{a.oldCost}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={`savings-badge inline-block font-bold text-xs px-2 py-0.5 rounded-md transition-all duration-200 ${hov ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                                            −{a.savings}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-800">
                            <td colSpan={4} className="px-3 py-3 font-bold text-white text-xs uppercase tracking-wider">Tổng cộng</td>
                            <td className="px-3 py-3 font-bold text-emerald-300 text-sm">{fmt(totalNew)}</td>
                            <td className="px-3 py-3 text-slate-400 line-through text-xs">{fmt(totalOld)}</td>
                            <td className="px-3 py-3"><span className="text-emerald-300 font-bold text-sm">−{fmt(totalOld - totalNew)}</span></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

/* ─── ROUTE ACCORDION ───────────────────────────────────────────────────────── */
const RouteAccordion = ({ route, defaultOpen, hoveredLotId, setHoveredLotId }) => {
    const [open, setOpen] = useState(defaultOpen);
    const [height, setHeight] = useState(defaultOpen ? "auto" : "0px");
    const [visible, setVisible] = useState(defaultOpen);
    const bodyRef = useRef(null);

    const toggle = useCallback(() => {
        if (!open) {
            setHeight(`${bodyRef.current.scrollHeight}px`);
            setVisible(true);
            setTimeout(() => setHeight("auto"), 430);
        } else {
            setHeight(`${bodyRef.current.scrollHeight}px`);
            requestAnimationFrame(() => requestAnimationFrame(() => setHeight("0px")));
            setTimeout(() => setVisible(false), 430);
        }
        setOpen(o => !o);
    }, [open]);

    return (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-100">
            <button onClick={toggle}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors px-5 py-4 flex items-center justify-between gap-3 text-left">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        <Truck size={13} /> Chuyến {route.id}
                    </span>
                    <span className="text-white font-bold text-sm">{route.name}</span>
                    <span className="text-blue-200 text-xs flex items-center gap-1"><MapPin size={11} /> {route.distance}</span>
                    <span className="text-blue-200 text-xs flex items-center gap-1"><Package size={11} /> {route.load}</span>
                    <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-md">{route.cost}</span>
                </div>
                <div className="flex-shrink-0 text-white transition-transform duration-300" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
                    <ChevronDown size={18} />
                </div>
            </button>

            <div ref={bodyRef} style={{ maxHeight: height, overflow: "hidden", transition: "max-height .42s cubic-bezier(.4,0,.2,1)" }}>
                <div className="bg-white border-t border-blue-100 p-5 space-y-5">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                            <span className="w-1 h-3 bg-blue-500 rounded-full" /> Lịch trình chuyến xe
                        </p>
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                            <HorizontalTransitMap stops={route.stops} visible={visible} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-1 h-3 bg-emerald-500 rounded-full" /> Bảng phân bổ chi phí vận tải
                        </p>
                        <AllocationTable allocations={route.allocations} hoveredLotId={hoveredLotId} setHoveredLotId={setHoveredLotId} />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-slate-300" />
                            Xác nhận để đưa phương án vào hệ thống điều phối
                        </p>
                        <ApproveButton />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── CHART SECTION ─────────────────────────────────────────────────────────── */
const yFmt = v => `${(v / 1_000_000).toFixed(0)}M`;

const ChartSection = ({ hoveredLotId, setHoveredLotId }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
            <div>
                <h2 className="text-base font-bold text-slate-800">So sánh chi phí vận chuyển từng lô hàng</h2>
                <p className="text-xs text-slate-400 mt-0.5">Di chuột vào thanh biểu đồ ↔ làm nổi bật hàng trong bảng</p>
            </div>
            {hoveredLotId && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex-shrink-0" style={{ animation: "fadeSlideUp .22s ease both" }}>
                    <div className="w-2 h-2 rounded-full bg-amber-400" style={{ animation: "pulseRing 1.5s ease-in-out infinite" }} />
                    {hoveredLotId}
                </div>
            )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barGap={6} barCategoryGap="32%"
                onMouseMove={s => s?.activeLabel && setHoveredLotId(s.activeLabel)}
                onMouseLeave={() => setHoveredLotId(null)}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={yFmt} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(241,245,249,.7)", rx: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px", color: "#64748b" }} />
                <Bar dataKey="Chi phí đi riêng lẻ" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {chartData.map((d, i) => {
                        const hov = hoveredLotId === d.name;
                        return <Cell key={i} fill={hov ? "#fbbf24" : OLD_COLORS[i % 3]} opacity={hoveredLotId && !hov ? 0.35 : 1} style={{ transition: "opacity .2s,fill .2s" }} />;
                    })}
                </Bar>
                <Bar dataKey="Chi phí gom xe" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {chartData.map((d, i) => {
                        const hov = hoveredLotId === d.name;
                        return <Cell key={i} fill={hov ? "#f59e0b" : NEW_COLORS[i % 3]} opacity={hoveredLotId && !hov ? 0.35 : 1} style={{ transition: "opacity .2s,fill .2s" }} />;
                    })}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

/* ─── ROOT ──────────────────────────────────────────────────────────────────── */
export default function RouteOptimizationResult() {
    const [hoveredLotId, setHoveredLotId] = useState(null);
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
            <GlobalStyles />

            {/* ================= SIDEBAR (Đồng bộ với Exchange) ================= */}
            <aside className="w-64 bg-[#0a192f] text-white flex flex-col shrink-0 z-10">
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={<Home size={20} />} label="Trang chủ" onClick={() => navigate('/home')} />
                    <NavItem icon={<ArrowRightLeft size={20} />} label="Sàn Giao dịch" onClick={() => navigate('/exchange')} />
                    <div className="border-t border-gray-700 mt-4 pt-4">
                        <NavItem icon={<Navigation size={20} />} label="Theo dõi xe" badge="Mới" active onClick={() => navigate('/route-optimization')} />
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
                            <input type="text" placeholder="Tìm kiếm..." className="bg-gray-100 border-none rounded-full pl-4 pr-10 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64" />
                            <Search size={16} className="absolute right-4 top-2 text-gray-400" />
                        </div>
                        <div className="w-8 h-8 bg-orange-200 text-orange-600 rounded-full flex items-center justify-center font-bold">U</div>
                    </div>
                </header>

                {/* NỘI DUNG CHÍNH: TỐI ƯU TUYẾN ĐƯỜNG */}
                <div className="flex-1 overflow-auto bg-slate-50 p-6">
                    <div className="max-w-6xl mx-auto space-y-7">

                        {/* Header Title */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Truck size={12} /> AquaMarket · Tối ưu tuyến đường
                                </p>
                                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Kết quả Điều phối Vận chuyển</h1>
                                <p className="text-sm text-slate-400 mt-0.5">Phiên gom xe ngày 20/06/2025 · Khu vực đồng bằng sông Cửu Long</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                                    <TrendingUp size={12} /> Đã tối ưu xong
                                </span>
                                <ExportButton />
                            </div>
                        </div>

                        {/* BẢN ĐỒ CHIẾN LƯỢC TỔNG QUAN (ROUTE MAP) */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-[15px] text-gray-900">Bản Đồ Lộ Trình Vận Chuyển Tổng Quan</h3>
                                <span className="text-[12px] font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded-full">Trực tuyến</span>
                            </div>
                            <iframe src="/route-map.html" className="w-full h-[600px] border-none" title="Route Optimization Map"></iframe>
                        </div>


                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={Truck} label="Số chuyến xe tối ưu" value={routeStats.totalRoutes} accent="bg-blue-500" sub="Tuyến đường gom xe" delay="0ms" />
                            <StatCard icon={PiggyBank} label="Tổng tiết kiệm" value={routeStats.totalSavings} accent="bg-emerald-500" sub="So với đi riêng lẻ" delay="85ms" glow />
                            <StatCard icon={TrendingUp} label="% Tiết kiệm so với đi riêng" value={routeStats.savingsPct} accent="bg-violet-500" sub="Hiệu quả tối ưu hóa" delay="170ms" />
                            <StatCard icon={Package} label="Tổng lô hàng điều phối" value={routeStats.totalVolume} accent="bg-amber-500" sub="Đã phân bổ đầy đủ" delay="255ms" />
                        </div>

                        {/* AI Insight Panel */}
                        <AIInsightPanel />

                        {/* Route Accordions */}
                        <div>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Chi tiết tuyến đường</h2>
                            <div className="space-y-4">
                                {routeDetails.map((route, i) => (
                                    <RouteAccordion key={route.id} route={route} defaultOpen={i === 0}
                                        hoveredLotId={hoveredLotId} setHoveredLotId={setHoveredLotId} />
                                ))}
                                {/* Placeholder Chuyến B */}
                                <div className="rounded-2xl overflow-hidden border border-slate-200 opacity-50">
                                    <div className="bg-slate-500 px-5 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-lg"><Truck size={13} /> Chuyến B</span>
                                            <span className="text-white font-bold text-sm">Bạc Liêu → TP. Hồ Chí Minh</span>
                                            <span className="text-slate-200 text-xs hidden sm:block">280km · 10/10 tấn · 4.900.000đ</span>
                                        </div>
                                        <ChevronDown size={18} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Section */}
                        <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-[15px] text-gray-900">Bản Đồ Lộ Trình Vận Chuyển & Phân Phối (MILP)</h3>
                            <span className="text-[12px] font-mono text-teal-600 bg-teal-50 px-2 py-1 rounded-full">Trực tuyến</span>
                          </div>
                          <iframe src="/route-map.html" className="w-full h-[600px] border-none" title="Route Optimization Map"></iframe>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-xs text-slate-300 pb-4">
                            AquaMarket © 2025 · B2B Seafood Byproduct Marketplace · Powered by Route AI Engine v2.1
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}