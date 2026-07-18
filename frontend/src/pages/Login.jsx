import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [credentials, setCredentials] = useState({
    email: "", 
    password: ""
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1929] text-white p-4 font-sans">
      {/* Background Radial Glow */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(30,111,191,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,212,255,0.08) 0%, transparent 50%)'
        }}
      />

      {/* Main Container - Responsive width */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-[#1e293b] border border-[#334155] rounded-[16px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <div className="text-center mb-6 sm:mb-8">
            <img 
              src="/jj-logo.jpeg" 
              alt="JJM Logo" 
              className="w-16 sm:w-20 mx-auto mb-3 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            />
            <h1 className="text-lg sm:text-[22px] font-bold tracking-[2px] text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
              JJTL WAREHOUSE
            </h1>
            <p className="text-[10px] sm:text-[11px] text-[#94a3b8] tracking-[2px] mt-1 uppercase">Management System</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-xs text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm mb-1 text-[#94a3b8]">Email / User ID</label>
              <input 
                className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] focus:outline-none transition-colors" 
                type="text" 
                placeholder="Enter Email or User ID" 
                required
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs sm:text-sm mb-1 text-[#94a3b8]">Password</label>
              <div className="relative">
                <input 
                  className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white pr-10 focus:border-[#00e5ff] focus:outline-none transition-colors" 
                  type={passwordVisible ? "text" : "password"} 
                  placeholder="••••••••" 
                  required
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-[10px] top-[50%] -translate-y-1/2 cursor-pointer text-[#94a3b8] hover:text-[#00e5ff] transition"
                  aria-label="Toggle password visibility"
                >
                  {passwordVisible ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#00e5ff] text-[#0a1929] font-bold py-3 rounded-lg hover:bg-[#00c5dd] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "AUTHENTICATING..." : "LOG IN"}
            </button>
          </form>
          
          <div className="text-center mt-5 flex flex-col gap-2">
            <button className="text-[11px] sm:text-[12px] text-[#94a3b8] hover:text-white transition">Forgot Password?</button>
            <div className="text-[11px] sm:text-[12px] text-[#94a3b8]">
              Don't have an account? 
              <Link to="/register" className="text-[#00e5ff] hover:text-white ml-1 font-bold transition">Register here</Link>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-[10px] sm:text-[11px] text-[#94a3b8] tracking-[1px] uppercase">v2.0 — Enterprise Hardware Suite</p>
      </div>
    </div>
  );
};

export default Login;