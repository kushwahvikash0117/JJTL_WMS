/**
 * @file Login.jsx
 * @description React component handling user authentication, sign-in, and the multi-step forgot password workflow matching the Settings reset password logic, utilizing react-hot-toast.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, X, ShieldCheck } from 'lucide-react';
import { login as loginApi, sendOTP, verifyOTP, resetPassword as resetPasswordApi } from '../api/authService';
import toast from 'react-hot-toast';

/**
 * Login Component
 * 
 * @returns {JSX.Element} The rendered Login component with forgot password flow
 */
const Login = () => {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  // Forgot Password States (matching Settings.jsx logic)
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', otp: '', password: '', confirmPassword: '' });

  /**
   * Handles form submission for user authentication.
   * 
   * @param {Object} e - Form event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(credentials);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      toast.success('Login successful!');
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets forgot password modal states and closes it.
   */
  const closeForgotPasswordModal = () => {
    setShowModal(false);
    setStep(1);
    setFormData({ email: '', otp: '', password: '', confirmPassword: '' });
  };

  /**
   * Handles multi-step password reset workflow: sending OTP, verifying OTP, and updating the password.
   */
  const handlePasswordSubmit = async () => {
    if (step === 3 && formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      if (step === 1) {
        await sendOTP(formData.email);
        toast.success("OTP sent successfully to your email.");
        setStep(2);
      } else if (step === 2) {
        await verifyOTP(formData.email, formData.otp);
        toast.success("OTP verified successfully.");
        setStep(3);
      } else {
        await resetPasswordApi({ email: formData.email, password: formData.password });
        toast.success("Password updated successfully!");
        setTimeout(() => {
          closeForgotPasswordModal();
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Operation failed.");
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
              <img src="/jj-logo.jpeg" alt="Logo" className="h-18 w-18 object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your JJTL account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input 
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm" 
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
                  className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 pr-12 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm" 
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
            <button 
              type="button" 
              onClick={() => setShowModal(true)} 
              className="text-sm text-gray-400 hover:text-cyan-600 transition"
            >
              Forgot password?
            </button>
            <div className="text-sm text-gray-500">
              Don't have an account? <Link to="/register" className="text-cyan-600 font-bold hover:underline">Register</Link>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
          JJTL WMS Enterprise Suite v2.0
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                <ShieldCheck className="text-cyan-600" /> Reset Password
              </h3>
              <button onClick={closeForgotPasswordModal} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-cyan-600' : 'bg-gray-100'}`} />
              ))}
            </div>

            <div className="space-y-4">
              {step === 1 && <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500 text-sm" />}
              {step === 2 && <input type="text" placeholder="Enter 6-digit OTP" maxLength={6} value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500 text-sm tracking-widest font-mono" />}
              {step === 3 && (
                <>
                  <input type="password" placeholder="New Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500 text-sm" />
                  <input type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500 text-sm" />
                </>
              )}
            </div>
            
            <button 
              onClick={handlePasswordSubmit} 
              disabled={loading}
              className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-2xl transition font-bold shadow-lg shadow-cyan-600/20 text-sm"
            >
              {loading ? "Processing..." : (step === 3 ? 'Update Password' : 'Continue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;