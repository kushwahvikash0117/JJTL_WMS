import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

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

  const [formData, setFormData] = useState({
    name: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

  const sendOTP = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await axios.post(`${API_URL}/auth/send-otp`, { email });
      setMessage("OTP sent successfully.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      setMessage("OTP verified successfully.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const payload = {
        name: formData.name,
        email,
        userId: formData.userId,
        password: formData.password,
      };
      const res = await axios.post(`${API_URL}/auth/register`, payload);
      setMessage(res.data.message || "Registration successful.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1929] text-white p-4 font-sans">
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(30,111,191,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,212,255,0.08) 0%, transparent 50%)" }} />

      <div className="relative z-10 w-full max-w-sm bg-[#1e293b] border border-[#334155] rounded-[16px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <div className="text-center mb-6 sm:mb-8">
          <img src="/jj-logo.jpeg" alt="JJM Logo" className="w-16 sm:w-20 mx-auto mb-3 rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)]" />
          <h1 className="text-lg sm:text-[22px] font-bold tracking-[2px] text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">USER REGISTRATION</h1>
        </div>

        {message && <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-lg mb-4 text-xs text-center">{message}</div>}
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-xs text-center">{error}</div>}

        {step === 1 && (
          <>
            <label className="block text-xs sm:text-sm mb-1 text-[#94a3b8]">Email Address</label>
            <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] outline-none" />
            <button onClick={sendOTP} disabled={loading} className="w-full bg-[#00e5ff] text-[#0a1929] font-bold py-3 rounded-lg mt-6 hover:bg-[#00c5dd] transition disabled:opacity-50">{loading ? "SENDING..." : "SEND OTP"}</button>
          </>
        )}

        {step === 2 && (
          <>
            <label className="block text-xs sm:text-sm mb-1 text-[#94a3b8]">Enter OTP</label>
            <input type="text" placeholder="6 Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] outline-none" />
            <button onClick={verifyOTP} disabled={loading} className="w-full bg-[#00e5ff] text-[#0a1929] font-bold py-3 rounded-lg mt-6 hover:bg-[#00c5dd] transition disabled:opacity-50">{loading ? "VERIFYING..." : "VERIFY OTP"}</button>
          </>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] outline-none" />
            <input type="text" placeholder="User ID" value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] outline-none" />
            
            <div className="relative">
              <input type={passwordVisible ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] outline-none" />
              <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-3 top-3 text-[#94a3b8] hover:text-[#00e5ff]">👁</button>
            </div>

            <div className="relative">
              <input type={confirmVisible ? "text" : "password"} placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-[#0d2238] border border-[#334155] p-3 rounded-lg text-white focus:border-[#00e5ff] outline-none" />
              <button type="button" onClick={() => setConfirmVisible(!confirmVisible)} className="absolute right-3 top-3 text-[#94a3b8] hover:text-[#00e5ff]">👁</button>
            </div>

            <button onClick={registerUser} disabled={loading} className="w-full bg-[#00e5ff] text-[#0a1929] font-bold py-3 rounded-lg hover:bg-[#00c5dd] transition disabled:opacity-50">{loading ? "REGISTERING..." : "REGISTER"}</button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-[#00e5ff] hover:text-white text-xs transition">Already have an account? Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;