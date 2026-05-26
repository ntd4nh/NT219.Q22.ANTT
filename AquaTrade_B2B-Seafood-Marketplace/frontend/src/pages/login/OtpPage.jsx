import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function OtpPage() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(59);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const inputRefs = useRef([]);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");
        setSuccess("");

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasted) return;

        const newOtp = ["", "", "", "", "", ""];

        pasted.split("").forEach((char, index) => {
            newOtp[index] = char;
        });

        setOtp(newOtp);

        const focusIndex = pasted.length >= 6 ? 5 : pasted.length;
        inputRefs.current[focusIndex]?.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const otpCode = otp.join("");

        if (otpCode.length < 6) {
            setError("Vui lòng nhập đủ 6 chữ số OTP.");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            const demoOtp = "123456";

            if (otpCode !== demoOtp) {
                setLoading(false);
                setError("Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.");
                return;
            }

            setLoading(false);
            setSuccess("Xác thực OTP thành công. Vui lòng tạo mật khẩu mới.");
        }, 1000);
    };

    const handleResendOtp = () => {
        setCountdown(59);
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setSuccess("Mã OTP mới đã được gửi lại.");
        inputRefs.current[0]?.focus();
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb] text-[#191c1e] overflow-x-hidden">
            {/* Left Panel giống trang đăng nhập */}
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

            {/* Mobile Header giống 2 trang trước */}
            <header className="md:hidden w-full h-20 aqua-gradient flex items-center px-4">
                <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#71f8e4] text-3xl">
            waves
          </span>
                    <span className="text-2xl text-white font-bold">AquaTrade</span>
                </div>
            </header>

            {/* Right Panel */}
            <main className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-10 bg-[#f7f9fb]">
                <div className="w-full max-w-[480px]">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200">
                        <header className="mb-8">
                            <h2 className="text-3xl font-semibold text-[#191c1e] mb-2">
                                Xác thực OTP
                            </h2>

                            <p className="text-base text-gray-600">
                                Nhập mã OTP gồm 6 chữ số đã được gửi đến email hoặc số điện thoại
                                của bạn.
                            </p>
                        </header>

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px]">
                  error
                </span>
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px]">
                  check_circle
                </span>
                                <p className="text-sm font-medium">{success}</p>
                            </div>
                        )}

                        <form className="space-y-8" onSubmit={handleSubmit}>
                            <div className="flex justify-between gap-2 md:gap-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className={`w-11 h-14 md:w-14 md:h-16 text-center text-2xl font-bold bg-white border rounded-xl transition-all outline-none ${
                                            error
                                                ? "border-red-500 focus:ring-4 focus:ring-red-100 focus:border-red-500"
                                                : "border-gray-300 focus:ring-4 focus:ring-teal-100 focus:border-[#14B8A6]"
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Không nhận được mã?
                                    {countdown > 0 ? (
                                        <span className="text-teal-600 font-bold ml-1">
                      Gửi lại mã sau {countdown} giây
                    </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-teal-600 font-bold ml-1 hover:underline"
                                        >
                                            Gửi lại mã ngay
                                        </button>
                                    )}
                                </p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[#14B8A6] hover:bg-[#0D9488] active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                      <span className="material-symbols-outlined animate-spin">
                        progress_activity
                      </span>
                                            Đang xác thực...
                                        </>
                                    ) : (
                                        <>
                                            Xác nhận OTP
                                            <span className="material-symbols-outlined text-xl">
                        arrow_forward
                      </span>
                                        </>
                                    )}
                                </button>

                                <Link
                                    to="/forgot-password"
                                    className="w-full text-gray-600 font-semibold py-3 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
                                >
                  <span className="material-symbols-outlined text-xl">
                    arrow_back
                  </span>
                                    Quay lại
                                </Link>
                            </div>
                        </form>

                        <footer className="mt-10 pt-8 border-t border-gray-200 text-center">
                            <a
                                href="#"
                                className="text-sm text-gray-500 hover:text-teal-600 transition-colors underline underline-offset-4"
                            >
                                Gặp sự cố khi nhận mã? Liên hệ hỗ trợ kỹ thuật
                            </a>
                        </footer>
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