import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


export default function ForgotPasswordPage() {
    const [contact, setContact] = useState("");
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const isPhone = /^\d+$/.test(contact.replace(/\s/g, ""));

    const handleSubmit = (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!contact.trim()) {
            setError("Vui lòng nhập email hoặc số điện thoại.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

        const isValidEmail = emailRegex.test(contact);
        const isValidPhone = phoneRegex.test(contact.replace(/\s/g, ""));

        if (!isValidEmail && !isValidPhone) {
            setError("Email hoặc số điện thoại không hợp lệ. Vui lòng kiểm tra lại.");
            return;
        }
        setTimeout(() => {
            navigate("/verify-otp");
        }, 1000);
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            setSuccess(
                isPhone
                    ? "Mã OTP đã được gửi đến số điện thoại của bạn."
                    : "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn."
            );
        }, 1200);
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

            {/* Mobile Header giống trang đăng nhập */}
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
                                Quên mật khẩu
                            </h2>

                            <p className="text-base text-gray-600">
                                Nhập email hoặc số điện thoại đã đăng ký để nhận mã xác thực OTP
                                hoặc liên kết đặt lại mật khẩu.
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

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-semibold text-gray-700 block"
                                    htmlFor="contact-input"
                                >
                                    Email hoặc Số điện thoại
                                </label>

                                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors">
                    {isPhone ? "smartphone" : "mail"}
                  </span>

                                    <input
                                        id="contact-input"
                                        type="text"
                                        value={contact}
                                        onChange={(e) => {
                                            setContact(e.target.value);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        placeholder="example@company.com hoặc 0901234567"
                                        className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${
                                            error
                                                ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                                                : "border-gray-300 focus:ring-teal-200 focus:border-teal-500"
                                        }`}
                                    />
                                </div>

                                <p className="text-sm text-gray-500 italic px-1">
                                    Gợi ý: Nhập số điện thoại để nhận mã OTP qua SMS.
                                </p>
                            </div>

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
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        Gửi liên kết đặt lại mật khẩu
                                        <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                                    </>
                                )}
                            </button>
                        </form>

                        <footer className="mt-10 pt-8 border-t border-gray-200 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-gray-600 font-semibold hover:text-teal-600 transition-colors group"
                            >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                                Quay lại đăng nhập
                            </Link>
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