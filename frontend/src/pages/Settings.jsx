import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, X, Settings as SettingsIcon, ChevronRight, ShieldCheck } from 'lucide-react';
import { sendOTP, verifyOTP, resetPassword } from '../api/authService';

const Settings = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', otp: '', password: '', confirmPassword: '' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handlePasswordSubmit = async () => {
    if (step === 3 && formData.password !== formData.confirmPassword) return alert("Passwords don't match");
    try {
      if (step === 1) { await sendOTP(formData.email); setStep(2); }
      else if (step === 2) { await verifyOTP(formData.email, formData.otp); setStep(3); }
      else {
        await resetPassword({ email: formData.email, password: formData.password });
        alert("Password updated successfully!");
        setShowModal(false); setStep(1);
        setFormData({ email: '', otp: '', password: '', confirmPassword: '' });
      }
    } catch (err) { alert(err.response?.data?.error || "Operation failed."); }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
        <SettingsIcon className="text-cyan-600" /> Account Settings
      </h2>
      
      <div className="space-y-4">
        <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
          <button onClick={() => setShowModal(true)} className="flex items-center justify-between w-full p-4 hover:bg-cyan-50/50 rounded-2xl transition group">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-100 p-3 rounded-xl text-cyan-600"><Lock size={20} /></div>
              <span className="font-semibold text-gray-800">Change Password</span>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-cyan-600 transition" />
          </button>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 hover:bg-rose-50 text-rose-600 rounded-2xl transition font-semibold">
          <div className="bg-rose-100 p-3 rounded-xl"><LogOut size={20} /></div>
          Logout Account
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                <ShieldCheck className="text-cyan-600" /> Reset Password
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-cyan-600' : 'bg-gray-100'}`} />
              ))}
            </div>

            <div className="space-y-4">
              {step === 1 && <input type="email" placeholder="Email Address" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500" />}
              {step === 2 && <input type="text" placeholder="Enter 6-digit OTP" onChange={(e) => setFormData({...formData, otp: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500" />}
              {step === 3 && (
                <>
                  <input type="password" placeholder="New Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500" />
                  <input type="password" placeholder="Confirm Password" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full border border-gray-200 p-4 rounded-2xl outline-none focus:border-cyan-500" />
                </>
              )}
            </div>
            
            <button onClick={handlePasswordSubmit} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-2xl transition font-bold shadow-lg shadow-cyan-600/20">
              {step === 3 ? 'Update Password' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;