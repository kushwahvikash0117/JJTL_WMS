import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Mail, ShieldCheck, Hash } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [formData, setFormData] = useState({ name: "", userId: "", password: "", confirmPassword: "" });
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

  const handleAction = async (fn, endpoint, data, nextStep) => {
    setLoading(true); setError(""); setMessage("");
    try {
      await axios.post(`${API_URL}${endpoint}`, data);
      if (nextStep) setStep(nextStep);
      else { setMessage("Registration successful! Redirecting..."); setTimeout(() => navigate("/login"), 1500); }
    } catch (err) { setError(err.response?.data?.error || "An error occurred."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg">
              <img src="/jj-logo.jpeg" alt="Logo" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join the JJTL WMS system</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-cyan-600' : 'bg-gray-100'}`} />
            ))}
          </div>

          {message && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-emerald-100">{message}</div>}
          {error && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-medium border border-rose-100">{error}</div>}

          <div className="space-y-5">
            {step === 1 && (
              <>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl focus:border-cyan-500 outline-none transition-all" placeholder="name@company.com" />
                </div>
                <button onClick={() => handleAction(axios.post, "/auth/send-otp", { email }, 2)} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-cyan-600/20">{loading ? "Sending..." : "Send OTP"}</button>
              </>
            )}

            {step === 2 && (
              <>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Verification Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl focus:border-cyan-500 outline-none transition-all text-center text-xl tracking-[0.5em]" placeholder="000000" />
                <button onClick={() => handleAction(axios.post, "/auth/verify-otp", { email, otp }, 3)} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-cyan-600/20">{loading ? "Verifying..." : "Verify OTP"}</button>
              </>
            )}

            {step === 3 && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input type="text" placeholder="Full Name" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl focus:border-cyan-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input type="text" placeholder="User ID" onChange={(e) => setFormData({...formData, userId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl focus:border-cyan-500 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input type={passwordVisible ? "text" : "password"} placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 pr-12 rounded-2xl focus:border-cyan-500 outline-none transition-all" />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-4 top-3.5 text-gray-400">{passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input type={confirmVisible ? "text" : "password"} placeholder="Confirm Password" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 pr-12 rounded-2xl focus:border-cyan-500 outline-none transition-all" />
                  <button type="button" onClick={() => setConfirmVisible(!confirmVisible)} className="absolute right-4 top-3.5 text-gray-400">{confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <button onClick={() => handleAction(axios.post, "/auth/register", { ...formData, email }, null)} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-cyan-600/20">{loading ? "Registering..." : "Complete Registration"}</button>
              </>
            )}
          </div>

          <div className="text-center mt-8 text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-cyan-600 font-bold hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;