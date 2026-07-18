import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/login`, credentials);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg">
              <img src="/jj-logo.jpeg" alt="Logo" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your JJTL account</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input 
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all" 
                  type="email" placeholder="name@company.com" required
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input 
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 pr-12 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all" 
                  type={passwordVisible ? "text" : "password"} placeholder="••••••••" required
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-3.5 text-gray-400 hover:text-cyan-600 transition">
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-cyan-600/20 active:scale-[0.98]"
            >
              {loading ? "Authenticating..." : "Login to System"}
            </button>
          </form>

          <div className="text-center mt-8 space-y-2">
            <button className="text-sm text-gray-400 hover:text-cyan-600 transition">Forgot password?</button>
            <div className="text-sm text-gray-500">
              Don't have an account? <Link to="/register" className="text-cyan-600 font-bold hover:underline">Register</Link>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
          JJTL WMS Enterprise Suite v2.0
        </p>
      </div>
    </div>
  );
};

export default Login;