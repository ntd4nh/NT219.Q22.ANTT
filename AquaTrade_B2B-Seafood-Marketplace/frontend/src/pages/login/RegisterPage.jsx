import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix cho icon mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [registered, setRegistered] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        fullName: "",
        cccd: "",
        position: "",
        phone: "",
        email: "",
        avatar: null,

        companyName: "",
        taxCode: "",
        foundedDate: "",
        businessLicense: null,
        headOfficeAddress: "",
        warehouseAddress: "",

        role: "",

        usernameOrEmail: "",
        password: "",
        confirmPassword: "",
    });

    const steps = ["Người đại diện", "Doanh nghiệp", "Vai trò", "Tạo tài khoản"];

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));

        setError("");
    };

    const validateStep = () => {
        if (step === 1) {
            if (!form.fullName || !form.cccd || !form.position || !form.phone || !form.email) {
                return "Vui lòng nhập đầy đủ thông tin người đại diện.";
            }
        }

        if (step === 2) {
            if (!form.companyName || !form.taxCode || !form.businessLicense || !form.headOfficeAddress) {
                return "Vui lòng nhập đầy đủ thông tin doanh nghiệp.";
            }
        }

        if (step === 3) {
            if (!form.role) {
                return "Vui lòng chọn vai trò tham gia.";
            }
        }

        if (step === 4) {
            if (!form.usernameOrEmail || !form.password || !form.confirmPassword) {
                return "Vui lòng nhập đầy đủ thông tin tài khoản.";
            }

            if (form.password !== form.confirmPassword) {
                return "Mật khẩu xác nhận không khớp.";
            }

            if (!isPasswordValid(form.password)) {
                return "Mật khẩu chưa đạt yêu cầu.";
            }
        }

        return "";
    };

    const nextStep = () => {
        const message = validateStep();

        if (message) {
            setError(message);
            return;
        }

        setError("");

        if (step < 4) {
            setStep(step + 1);
            return;
        }

        setRegistered(true);
    };

    const prevStep = () => {
        setError("");
        if (step > 1) setStep(step - 1);
    };

    const passwordChecks = {
        length: form.password.length >= 8,
        lowercase: /[a-z]/.test(form.password),
        uppercase: /[A-Z]/.test(form.password),
        number: /\d/.test(form.password),
        special: /[^A-Za-z0-9]/.test(form.password),
    };

    const strengthCount = Object.values(passwordChecks).filter(Boolean).length;

    function isPasswordValid(password) {
        return (
            password.length >= 8 &&
            /[a-z]/.test(password) &&
            /[A-Z]/.test(password) &&
            /\d/.test(password) &&
            /[^A-Za-z0-9]/.test(password)
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb] text-[#191c1e] overflow-x-hidden">
            <AuthBrandPanel />

            <header className="md:hidden w-full h-20 aqua-gradient flex items-center px-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#71f8e4] text-3xl">
                        waves
                    </span>
                    <span className="text-2xl text-white font-bold">AquaTrade</span>
                </div>
            </header>

            <main className="w-full md:w-[60%] flex items-center justify-center px-4 py-10 md:p-10 bg-[#f7f9fb]">
                <div className="w-full max-w-[760px]">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 px-8 md:px-10 py-8">
                        {registered ? (
                            <SuccessStep form={form} />
                        ) : (
                            <>
                                <RegisterHeader step={step} />

                                <StepBar steps={steps} currentStep={step} />

                                {error && (
                                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                                        <span className="material-symbols-outlined text-[20px]">
                                            error
                                        </span>
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="mt-8">
                                    {step === 1 && (
                                        <RepresentativeStep form={form} handleChange={handleChange} />
                                    )}

                                    {step === 2 && (
                                        <BusinessStep form={form} handleChange={handleChange} />
                                    )}

                                    {step === 3 && (
                                        <RoleStep form={form} handleChange={handleChange} />
                                    )}

                                    {step === 4 && (
                                        <AccountStep
                                            form={form}
                                            handleChange={handleChange}
                                            showPassword={showPassword}
                                            setShowPassword={setShowPassword}
                                            showConfirmPassword={showConfirmPassword}
                                            setShowConfirmPassword={setShowConfirmPassword}
                                            passwordChecks={passwordChecks}
                                            strengthCount={strengthCount}
                                        />
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() => step === 1 ? navigate("/login") : prevStep()}
                                        className="px-7 py-3 border font-semibold transition flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                                    >
                                        <span>←</span>
                                        Quay lại
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            className="px-7 py-3 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition rounded-xl"
                                        >
                                            Lưu nháp
                                        </button>

                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="px-8 py-3 bg-[#00796B] text-white font-semibold hover:bg-[#00695C] transition flex items-center gap-2 rounded-xl shadow-lg shadow-teal-500/20"
                                        >
                                            {step === 4 ? "Hoàn tất đăng ký" : "Tiếp tục"}
                                            <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-6 px-4">
                        <div className="flex items-center gap-1.5 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">
                                verified_user
                            </span>
                            <span className="text-[12px] font-semibold uppercase tracking-wider">
                                SSL Secured
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-60">
                            <span className="material-symbols-outlined text-[18px]">
                                gavel
                            </span>
                            <span className="text-[12px] font-semibold uppercase tracking-wider">
                                Compliance ready
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function RegisterHeader({ step }) {
    const titles = {
        1: "Đăng ký tham gia",
        2: "Thông tin doanh nghiệp",
        3: "Xác định vai trò của bạn",
        4: "Tạo tài khoản đăng nhập",
    };

    const descriptions = {
        1: "Vui lòng cung cấp thông tin người đại diện hợp pháp của doanh nghiệp.",
        2: "Vui lòng cung cấp chi tiết pháp lý để xác thực tài khoản tổ chức của bạn trên nền tảng AquaTrade.",
        3: "Việc chọn đúng vai trò giúp chúng tôi tùy chỉnh giao diện và công cụ phù hợp nhất cho doanh nghiệp của bạn trên AquaTrade.",
        4: "Thiết lập username hoặc email và mật khẩu để đăng nhập vào AquaTrade.",
    };

    return (
        <header className="mb-8">
            <h1 className="text-[28px] md:text-[30px] font-bold text-gray-800 mb-2">
                {titles[step]}
            </h1>
            <p className="text-gray-500 leading-relaxed">{descriptions[step]}</p>
        </header>
    );
}

function StepBar({ steps, currentStep }) {
    return (
        <div className="w-full">
            <div className="flex items-start justify-between">
                {steps.map((label, index) => {
                    const stepNumber = index + 1;
                    const active = stepNumber === currentStep;
                    const completed = stepNumber < currentStep;

                    return (
                        <div key={label} className="flex-1 relative">
                            <div className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 ${completed
                                            ? "bg-[#00796B] text-white"
                                            : active
                                                ? "bg-[#00796B] text-white"
                                                : "bg-white border-2 border-gray-300 text-gray-400"
                                        }`}
                                >
                                    {completed ? "✓" : stepNumber}
                                </div>

                                {index < steps.length - 1 && (
                                    <div
                                        className={`h-[2px] flex-1 ${completed ? "bg-[#00796B]" : "bg-gray-300"
                                            }`}
                                    />
                                )}
                            </div>

                            <p
                                className={`mt-2 text-xs font-semibold ${active || completed ? "text-[#00796B]" : "text-gray-500"
                                    }`}
                            >
                                {label}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function RepresentativeStep({ form, handleChange }) {
    return (
        <div className="space-y-5">
            <Input
                label="Họ và tên người đại diện *"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    label="Số CCCD *"
                    name="cccd"
                    value={form.cccd}
                    onChange={handleChange}
                    placeholder="12 chữ số"
                />

                <Select
                    label="Chức vụ *"
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                    placeholder="Chọn chức vụ"
                    options={[
                        "Giám đốc",
                        "Phó giám đốc",
                        "Chủ doanh nghiệp",
                        "Đại diện pháp luật",
                        "Trưởng phòng kinh doanh",
                    ]}
                />

                <Input
                    label="Số điện thoại *"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+84"
                />

                <Input
                    label="Email cá nhân/công ty *"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@domain.com"
                />
            </div>

            <FileUpload
                label="Ảnh đại diện (Tùy chọn)"
                name="avatar"
                file={form.avatar}
                onChange={handleChange}
                accept="image/png,image/jpeg,image/gif"
                note="PNG, JPG, GIF tối đa 5MB"
            />
        </div>
    );
}

function BusinessStep({ form, handleChange }) {
    const [showMap, setShowMap] = useState(false);
    const [currentMapField, setCurrentMapField] = useState(null);

    const openMap = (field) => {
        setCurrentMapField(field);
        setShowMap(true);
    };

    const handleMapSelect = (address) => {
        handleChange({ target: { name: currentMapField, value: address } });
        setShowMap(false);
    };

    return (
        <div className="space-y-5">
            <Input
                label="Tên doanh nghiệp đầy đủ *"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="VD: Công ty Cổ phần Thủy sản AquaTrade"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    label="Mã số thuế *"
                    name="taxCode"
                    value={form.taxCode}
                    onChange={handleChange}
                    placeholder="Nhập mã số thuế"
                />

                <Input
                    label="Ngày thành lập"
                    name="foundedDate"
                    type="date"
                    value={form.foundedDate}
                    onChange={handleChange}
                />
            </div>

            <FileUpload
                label="Giấy phép kinh doanh (ERC) *"
                name="businessLicense"
                file={form.businessLicense}
                onChange={handleChange}
                accept="application/pdf,image/png,image/jpeg"
                note="Hỗ trợ PDF, JPG, PNG tối đa 10MB"
            />

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ trụ sở chính *
                </label>
                <div className="flex gap-3">
                    <textarea
                        name="headOfficeAddress"
                        value={form.headOfficeAddress}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ đầy đủ theo giấy phép kinh doanh"
                        rows="3"
                        className="flex-1 w-full border border-gray-300 px-4 py-3 outline-none resize-none focus:border-[#00796B]"
                    />
                    <button
                        type="button"
                        onClick={() => openMap("headOfficeAddress")}
                        className="w-16 border border-gray-300 flex flex-col items-center justify-center hover:bg-gray-50 text-teal-600 transition"
                        title="Chọn trên bản đồ"
                    >
                        <span className="material-symbols-outlined">map</span>
                        <span className="text-[10px] font-semibold mt-1 text-gray-600">Bản đồ</span>
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ kho bãi/nhà máy (Tùy chọn)
                </label>

                <div className="flex gap-3">
                    <input
                        name="warehouseAddress"
                        value={form.warehouseAddress}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ cơ sở"
                        className="flex-1 border border-gray-300 px-4 py-3 outline-none focus:border-[#00796B]"
                    />

                    <button
                        type="button"
                        onClick={() => openMap("warehouseAddress")}
                        className="w-12 border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-teal-600 transition"
                        title="Chọn trên bản đồ"
                    >
                        <span className="material-symbols-outlined">map</span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleChange({
                                target: { name: "warehouseAddress", value: "" },
                            })
                        }
                        className="w-12 border border-gray-300 flex items-center justify-center hover:bg-red-50 text-gray-600 hover:text-red-500 transition"
                        title="Xóa địa chỉ"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>

                <button
                    type="button"
                    className="mt-4 text-[#00796B] font-semibold text-sm hover:underline"
                >
                    + Thêm địa điểm
                </button>
            </div>

            <MapPickerModal
                isOpen={showMap}
                onClose={() => setShowMap(false)}
                onSelect={handleMapSelect}
            />
        </div>
    );
}

function RoleStep({ form, handleChange }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RoleCard
                icon="factory"
                title="Người bán"
                desc="Cung cấp phụ phẩm thủy sản, nguyên liệu thô cho chuỗi cung ứng toàn cầu."
                value="seller"
                selected={form.role === "seller"}
                onChange={handleChange}
            />

            <RoleCard
                icon="shopping_cart"
                title="Người mua"
                desc="Tìm mua nguyên liệu chất lượng cao cho ngành Feed/Biotech."
                value="buyer"
                selected={form.role === "buyer"}
                onChange={handleChange}
            />
        </div>
    );
}

function RoleCard({ icon, title, desc, value, selected, onChange }) {
    return (
        <label className="cursor-pointer h-full relative block">
            <input
                type="radio"
                name="role"
                value={value}
                checked={selected}
                onChange={onChange}
                className="hidden"
            />
            <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`h-full border-2 rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col ${selected
                        ? "border-[#00796B] bg-gradient-to-br from-teal-50 to-white shadow-lg shadow-teal-500/10"
                        : "border-gray-200 bg-white hover:border-teal-300 hover:shadow-md"
                    }`}
            >
                {/* Background ambient glow when selected */}
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute -right-10 -top-10 w-32 h-32 bg-teal-200/50 rounded-full blur-3xl pointer-events-none"
                    />
                )}

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${selected ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/30" : "bg-gray-100/80 text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600"
                        }`}>
                        <span className="material-symbols-outlined text-[28px]">{icon}</span>
                    </div>

                    {/* Checkmark circle */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selected ? "border-teal-500 bg-teal-500 text-white scale-110" : "border-gray-300 text-transparent"
                        }`}>
                        <span className="material-symbols-outlined text-[14px] font-bold" style={{ opacity: selected ? 1 : 0 }}>check</span>
                    </div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-end">
                    <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${selected ? "text-[#00796B]" : "text-gray-800"
                        }`}>{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
                </div>
            </motion.div>
        </label>
    );
}

function AccountStep({
    form,
    handleChange,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordChecks,
    strengthCount,
}) {
    return (
        <div className="space-y-5">
            <Input
                label="Username hoặc Email"
                name="usernameOrEmail"
                value={form.usernameOrEmail}
                onChange={handleChange}
                placeholder="Nhập username hoặc email"
            />

            <PasswordInput
                label="Mật khẩu"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tạo mật khẩu"
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
            />

            <div>
                <div className="grid grid-cols-3 gap-2 mb-1">
                    <div
                        className={`h-1 rounded-full ${strengthCount >= 1 ? "bg-red-400" : "bg-gray-200"
                            }`}
                    />
                    <div
                        className={`h-1 rounded-full ${strengthCount >= 3 ? "bg-yellow-400" : "bg-gray-200"
                            }`}
                    />
                    <div
                        className={`h-1 rounded-full ${strengthCount >= 5 ? "bg-green-500" : "bg-gray-200"
                            }`}
                    />
                </div>

                <p className="text-xs text-right text-gray-500">
                    {strengthCount >= 5 ? "Strong" : strengthCount >= 3 ? "Medium" : "Weak"}
                </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                    Mật khẩu của bạn phải chứa:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <CheckItem checked={passwordChecks.length} text="Tối thiểu 8 ký tự" />
                    <CheckItem checked={passwordChecks.uppercase} text="1 ký tự viết hoa" />
                    <CheckItem checked={passwordChecks.lowercase} text="1 ký tự viết thường" />
                    <CheckItem checked={passwordChecks.number} text="1 chữ số" />
                    <CheckItem checked={passwordChecks.special} text="1 ký tự đặc biệt" />
                </div>
            </div>

            <PasswordInput
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
        </div>
    );
}

function SuccessStep({ form }) {
    return (
        <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#00796B] text-4xl">
                    check_circle
                </span>
            </div>

            <h1 className="text-[28px] font-bold text-gray-800 mb-4">
                Đăng ký thành công
            </h1>

            <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-10">
                Hồ sơ doanh nghiệp của bạn đã được gửi đến AquaTrade. Chúng tôi sẽ kiểm
                tra thông tin pháp lý và giấy tờ xác minh trước khi kích hoạt đầy đủ tài
                khoản.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
                <p className="text-sm font-bold text-gray-500 uppercase mb-5">
                    Thông tin hồ sơ
                </p>

                <InfoRow label="Tên doanh nghiệp" value={form.companyName || "AquaTrade Co."} />
                <InfoRow
                    label="Vai trò"
                    value={
                        form.role === "seller"
                            ? "Người bán"
                            : form.role === "buyer"
                                ? "Người mua"
                                : "Người bán/Người mua"
                    }
                />
                <InfoRow
                    label="Trạng thái"
                    value={<span className="px-3 py-1 rounded-full bg-orange-50 text-orange-500 text-xs font-bold">Chờ xác minh</span>}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/login"
                    className="py-4 bg-[#00796B] text-white font-bold rounded-md hover:bg-[#00695C] transition"
                >
                    Về trang đăng nhập
                </Link>

                <button
                    type="button"
                    className="py-4 border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition"
                >
                    Xem trạng thái hồ sơ
                </button>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-3">
            <span className="text-gray-500 font-semibold">{label}</span>
            <span className="text-gray-800 font-bold text-right">{value}</span>
        </div>
    );
}

function Input({ label, name, value, onChange, placeholder, type = "text" }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00796B] transition-all bg-white hover:border-gray-400"
            />
        </div>
    );
}

function PasswordInput({
    label,
    name,
    value,
    onChange,
    placeholder,
    show,
    onToggle,
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00796B] transition-all bg-white hover:border-gray-400"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <span className="material-symbols-outlined">
                        {show ? "visibility_off" : "visibility"}
                    </span>
                </button>
            </div>
        </div>
    );
}

function Select({ label, name, value, onChange, placeholder, options }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            <div className="relative">
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00796B] bg-white appearance-none transition-all cursor-pointer hover:border-gray-400"
                >
                    <option value="" disabled className="text-gray-500">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option} value={option} className="text-gray-800">
                            {option}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">expand_more</span>
                </div>
            </div>
        </div>
    );
}

function TextArea({ label, name, value, onChange, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows="4"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00796B] transition-all bg-white hover:border-gray-400"
            />
        </div>
    );
}

function FileUpload({ label, name, file, onChange, accept, note }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            <label className="w-full h-32 border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                <span className="material-symbols-outlined text-gray-500 text-3xl mb-2">
                    upload_file
                </span>

                <p className="text-sm text-gray-500">
                    Kéo thả file vào đây hoặc{" "}
                    <span className="text-[#00796B] font-semibold">tải lên</span>
                </p>

                <p className="text-xs text-gray-400 mt-1">{note}</p>

                <input
                    type="file"
                    name={name}
                    accept={accept}
                    onChange={onChange}
                    className="hidden"
                />
            </label>

            {file && (
                <p className="text-sm text-gray-500 mt-2">
                    Đã chọn: <span className="font-semibold">{file.name}</span>
                </p>
            )}
        </div>
    );
}

function CheckItem({ checked, text }) {
    return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
            <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${checked
                        ? "bg-[#00796B] border-[#00796B] text-white"
                        : "border-gray-400"
                    }`}
            >
                {checked ? "✓" : ""}
            </span>
            {text}
        </div>
    );
}

function AuthBrandPanel() {
    return (
        <section className="aqua-gradient w-full md:w-[40%] flex-col justify-center p-10 text-white hidden md:flex relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full border-4 border-[#71f8e4]" />
                <div className="absolute bottom-[10%] left-[-5%] w-32 h-32 rounded-full bg-[#71f8e4] opacity-20" />
            </div>

            <div className="z-10 max-w-md">
                <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-[#71f8e4] text-4xl">
                        waves
                    </span>
                    <h1 className="text-5xl font-bold tracking-tight">AquaTrade</h1>
                </div>

                <h2 className="text-3xl font-semibold mb-6 leading-tight">
                    Nền tảng B2B cho giao dịch phụ phẩm thủy sản minh bạch
                </h2>

                <p className="text-lg mb-12 opacity-90">
                    Chuẩn hóa hồ sơ doanh nghiệp, xác thực giấy tờ và kết nối người mua —
                    người bán trong chuỗi giá trị thủy sản.
                </p>

                <div className="grid grid-cols-1 gap-6">
                    <Feature
                        icon="factory"
                        title="Số hóa nhà máy"
                        desc="Quản lý quy trình sản xuất thông minh"
                    />

                    <Feature
                        icon="set_meal"
                        title="Kiểm soát chất lượng"
                        desc="Tiêu chuẩn thủy sản quốc tế"
                    />

                    <Feature
                        icon="description"
                        title="Hợp đồng thông minh"
                        desc="Giao dịch an toàn, minh bạch"
                    />
                </div>
            </div>
        </section>
    );
}

function Feature({ icon, title, desc }) {
    return (
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-teal-300/20 text-[#71f8e4]">
                <span className="material-symbols-outlined">{icon}</span>
            </div>

            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-sm text-gray-300">{desc}</p>
            </div>
        </div>
    );
}

function MapEvents({ setPosition, setAddress, setIsPinning }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            setIsPinning(true);

            // Reverse Geocoding with Nominatim API
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) {
                        setAddress(data.display_name);
                    } else {
                        setAddress("Không tìm thấy địa chỉ cho vị trí này");
                    }
                })
                .catch(err => {
                    console.error("Geocoding error:", err);
                    setAddress("Lỗi khi lấy địa chỉ");
                })
                .finally(() => {
                    setIsPinning(false);
                });
        },
    });
    return null;
}

function ChangeView({ center, zoom }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

function MapPickerModal({ isOpen, onClose, onSelect }) {
    const [position, setPosition] = useState([10.762622, 106.660172]); // Default: HCM City
    const [address, setAddress] = useState("Vui lòng click trên bản đồ để chọn vị trí");
    const [isPinning, setIsPinning] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const firstResult = data[0];
                const lat = parseFloat(firstResult.lat);
                const lon = parseFloat(firstResult.lon);

                setPosition([lat, lon]);
                setAddress(firstResult.display_name);
            } else {
                alert("Không tìm thấy địa điểm này!");
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("Đã có lỗi xảy ra khi tìm kiếm");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600">map</span>
                        <h3 className="font-bold text-lg text-gray-800">Chọn vị trí trên Bản đồ (Leaflet)</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSearch} className="p-4 flex gap-3 border-b border-gray-100">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập tên đường, quận, thành phố để tìm kiếm..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 flex items-center gap-2 disabled:bg-teal-400 transition"
                    >
                        {isSearching ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : null}
                        Tìm
                    </button>
                </form>

                <div className="h-[400px] w-full bg-gray-100 relative z-0">
                    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                        <ChangeView center={position} zoom={15} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position} />
                        <MapEvents setPosition={setPosition} setAddress={setAddress} setIsPinning={setIsPinning} />
                    </MapContainer>
                </div>

                <div className="p-5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex-1 pr-6">
                        <p className="text-sm font-semibold text-gray-500 mb-1">Vị trí đã ghim:</p>
                        <div className="flex items-center gap-2">
                            {isPinning ? (
                                <span className="material-symbols-outlined animate-spin text-teal-600 text-sm">progress_activity</span>
                            ) : null}
                            <p className="text-gray-800 font-medium line-clamp-1">{address}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition">
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={() => onSelect(address)}
                            disabled={isPinning || address === "Vui lòng click trên bản đồ để chọn vị trí"}
                            className={`px-6 py-2.5 text-white rounded-lg font-semibold transition flex items-center gap-2 ${(isPinning || address === "Vui lòng click trên bản đồ để chọn vị trí") ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                        >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Sử dụng địa chỉ này
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}