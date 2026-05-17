import { useState } from "react";
import { useNavigate } from "react-router-dom";
import rynLogo from "./ryn.png";


export default function Login({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await fetch("http://localhost:8000/api/login.php", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.status === "success") {
      setIsSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        onAuth();
        navigate("/dashboard");
      }, 800);
    } else {
      setError(data.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-[system-ui,-apple-system,BlinkMacSystemFont,'Inter','Segoe_UI',sans-serif]">
      {/* ================= MOBILE LAYOUT ================= */}
      <div className="md:hidden bg-gradient-to-br from-black via-gray-900 to-black min-h-screen flex flex-col justify-between relative overflow-hidden">
        {/* Subtle glow effect with pulse animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-teal-900/10 pointer-events-none animate-pulse"></div>
        
        <div className="relative flex flex-col items-center justify-center flex-grow text-center text-white px-8 py-12 animate-[fadeIn_0.8s_ease-out]">
          <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent animate-[slideDown_0.6s_ease-out]">
            ApexFlow Billing
          </h1>
          <p className="text-lg font-light text-gray-300 tracking-wide animate-[fadeIn_1s_ease-out_0.3s_both]">
            Financial Clarity. Delivered from the Cloud.
          </p>
        </div>

        <div className="relative flex flex-col items-start mb-6 px-8 animate-[fadeIn_1s_ease-out_0.5s_both]">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-medium">Powered by</p>
          <img
            src={rynLogo}
            className="h-16 w-auto opacity-90 brightness-110"
            alt="RYN Logo"
          />
        </div>

        <div className="relative bg-white/95 backdrop-blur-xl rounded-t-[2rem] p-8 shadow-2xl border-t border-gray-200 animate-[slideUp_0.6s_ease-out]">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign in to continue</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-[shake_0.5s_ease-in-out]">
                {error}
              </div>
            )}

            {isSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-[slideDown_0.4s_ease-out] flex items-center gap-2">
                <svg className="w-5 h-5 animate-[scaleIn_0.4s_ease-out]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Login successful! Redirecting...
              </div>
            )}

            <div className="group">
              <input
  placeholder="Username"
  type="text"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 focus:scale-[1.01]"
                aria-label="Email"
                disabled={isLoading || isSuccess}
              />
            </div>

            <div className="group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 focus:scale-[1.01]"
                aria-label="Password"
                disabled={isLoading || isSuccess}
              />
            </div>

            <button 
              disabled={isLoading || isSuccess}
              className="w-full mt-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3.5 rounded-xl text-base shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
              <span className={isLoading ? 'opacity-0' : ''}>Sign in</span>
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            </button>
          </form>
        </div>
      </div>

      {/* ================= DESKTOP LAYOUT ================= */}
      <div className="hidden md:flex h-screen">
        {/* LEFT BRANDING PANEL */}
        <div className="md:w-1/2 bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col justify-between p-16 relative overflow-hidden">
          {/* Subtle texture & glow with pulse */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-teal-900/5 pointer-events-none animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-[float_6s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none animate-[float_8s_ease-in-out_infinite_reverse]"></div>
          
          <div className="relative z-10 mt-16 animate-[fadeIn_0.8s_ease-out]">
            <h1 className="text-6xl font-bold tracking-tight mb-4 leading-tight bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent animate-[slideDown_0.6s_ease-out]">
              ApexFlow Billing
            </h1>
            <p className="text-xl font-light text-gray-400 tracking-wide leading-relaxed max-w-md animate-[fadeIn_1s_ease-out_0.3s_both]">
              Financial Clarity. Delivered from the Cloud.
            </p>
          </div>

          <div className="relative z-10 mb-8 animate-[fadeIn_1s_ease-out_0.5s_both]">
            <p className="text-xs uppercase tracking-widest text-gray-600 mb-3 font-medium">Powered by</p>
            <img
              src={rynLogo}
              className="h-20 w-auto opacity-90 brightness-110 contrast-110 transition-transform duration-300 hover:scale-105"
              alt="RYN Logo"
            />
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="w-full md:w-1/2 flex justify-center items-center relative" style={{ backgroundColor: '#0b6e4f' }}>
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
          
          <div className="relative w-full max-w-md mx-8 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
            {/* Glassmorphic card */}
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-10 animate-[scaleIn_0.5s_ease-out_0.3s_both]">
              <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">Welcome back</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-[shake_0.5s_ease-in-out]">
                    {error}
                  </div>
                )}

                {isSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium animate-[slideDown_0.4s_ease-out] flex items-center gap-2">
                    <svg className="w-5 h-5 animate-[scaleIn_0.4s_ease-out]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Login successful! Redirecting...
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
  Username
</label>
<input
  type="text"
  placeholder="Enter your username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}

                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 focus:scale-[1.01]"
                    disabled={isLoading || isSuccess}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 focus:scale-[1.01]"
                    disabled={isLoading || isSuccess}
                  />
                </div>

                <button 
                  disabled={isLoading || isSuccess}
                  className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  <span className={isLoading ? 'opacity-0' : ''}>Sign in</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}