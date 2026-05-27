import { useState } from "react";
import { Link } from "react-router-dom";
import { startPkceLogin } from "../../api/authApi";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [identity, setIdentity] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handlePkceLogin = async () => {
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            setSuccess(true);
            await startPkceLogin();
        } catch (err) {
            setLoading(false);
            setError("Không thể kết nối đến máy chủ đăng nhập. Vui lòng thử lại.");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        await handlePkceLogin();
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb] text-[#191c1e] overflow-x-hidden">
            {/* Left Panel */}
            <section className="aqua-gradient w-full md:w-[40%] flex-col justify-center p-10 text-white hidden md:flex relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full border-4 border-[#71f8e4]" />
                    <div className="absolute bottom-[10%] left-[-5%] w-32 h-32 rounded-full bg-[#71f8e4] opacity-20" />
                </div>

                <div className="z-10 max-w-md">
                    <div className="flex items-center gap-3 mb-8">
                        <img src="/logo.png" alt="AquaTrade Logo" className="h-12 w-auto object-contain" />
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
                        <Feature icon="factory" title="Số hóa nhà máy" desc="Quản lý quy trình sản xuất thông minh" />
                        <Feature icon="set_meal" title="Kiểm soát chất lượng" desc="Tiêu chuẩn thủy sản quốc tế" />
                        <Feature icon="description" title="Hợp đồng thông minh" desc="Giao dịch an toàn, minh bạch" />
                    </div>
                </div>
            </section>

            {/* Mobile Header */}
            <header className="md:hidden w-full h-20 aqua-gradient flex items-center px-4">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="AquaTrade Logo" className="h-8 w-auto object-contain" />
                    <span className="text-2xl text-white font-bold">AquaTrade</span>
                </div>
            </header>

            {/* Login Form */}
            <main className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-10 bg-[#f7f9fb]">
                <div className="w-full max-w-[480px]">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200">
                        <header className="mb-8">
                            <h2 className="text-3xl font-semibold text-[#191c1e] mb-2">
                                Đăng nhập vào AquaTrade
                            </h2>
                            <p className="text-base text-gray-600">
                                Quản lý hồ sơ doanh nghiệp và tiếp tục giao dịch B2B của bạn.
                            </p>
                        </header>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[20px]">
                                        error
                                    </span>
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold" htmlFor="identity">
                                    Username hoặc Email
                                </label>


                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        person
                                    </span>

                                    <input
                                        id="identity"
                                        type="text"
                                        required
                                        value={identity}
                                        onChange={(e) => {
                                            setIdentity(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Nhập username hoặc email"
                                        className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${error
                                            ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                                            : "border-gray-300 focus:ring-teal-200 focus:border-teal-500"
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold" htmlFor="password">
                                    Mật khẩu
                                </label>

                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        lock
                                    </span>

                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Nhập mật khẩu"
                                        className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl focus:ring-2 outline-none transition-all ${error
                                            ? "border-red-500 focus:ring-red-200 focus:border-red-500"
                                            : "border-gray-300 focus:ring-teal-200 focus:border-teal-500"
                                            }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-teal-500" />
                                    <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-teal-600 hover:underline"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${success
                                    ? "bg-green-500"
                                    : "bg-[#14B8A6] hover:bg-[#0D9488] active:scale-[0.98]"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">
                                            progress_activity
                                        </span>
                                        Đang xử lý...
                                    </>
                                ) : success ? (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Thành công
                                    </>
                                ) : (
                                    <>
                                        Đăng nhập
                                        <span className="material-symbols-outlined">login</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center my-6">
                            <div className="flex-1 border-t border-gray-200"></div>
                            <span className="px-3 text-sm text-gray-500 font-medium">Hoặc trải nghiệm ngay với vai trò</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </div>

                        {/* Quick Login Role Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handlePkceLogin}
                                className="flex flex-col items-center justify-center py-3 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all group"
                            >
                                <span className="material-symbols-outlined text-teal-600 mb-1 group-hover:scale-110 transition-transform">shopping_cart</span>
                                <span className="text-sm font-semibold text-teal-800">Người mua</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePkceLogin}
                                className="flex flex-col items-center justify-center py-3 border border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all group"
                            >
                                <span className="material-symbols-outlined text-orange-600 mb-1 group-hover:scale-110 transition-transform">storefront</span>
                                <span className="text-sm font-semibold text-orange-800">Người bán</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePkceLogin}
                                className="flex flex-col items-center justify-center py-3 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all group"
                            >
                                <span className="material-symbols-outlined text-purple-600 mb-1 group-hover:scale-110 transition-transform">admin_panel_settings</span>
                                <span className="text-sm font-semibold text-purple-800">Admin sàn</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePkceLogin}
                                className="flex flex-col items-center justify-center py-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
                            >
                                <span className="material-symbols-outlined text-gray-600 mb-1 group-hover:scale-110 transition-transform">explore</span>
                                <span className="text-sm font-semibold text-gray-800">Khách</span>
                            </button>
                        </div>

                        <footer className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-gray-600">
                                Chưa có tài khoản?
                                <Link
                                    to="/register"
                                    className="text-teal-600 font-bold hover:underline ml-1"
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </footer>
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