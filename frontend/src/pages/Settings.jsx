import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, X } from 'lucide-react';
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
    if (step === 3 && formData.password !== formData.confirmPassword) {
      return alert("Passwords don't match");
    }
    
    try {
      if (step === 1) {
        await sendOTP(formData.email);
        setStep(2);
      } else if (step === 2) {
        await verifyOTP(formData.email, formData.otp);
        setStep(3);
      } else {
        await resetPassword({ email: formData.email, password: formData.password });
        alert("Password updated successfully!");
        setShowModal(false);
        setStep(1);
        setFormData({ email: '', otp: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      alert(err.response?.data?.error || "Operation failed, please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Settings</h2>
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow border border-gray-200 space-y-4">
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-3 w-full p-4 hover:bg-gray-50 rounded-lg transition text-left"
        >
          <Lock className="text-cyan-600 shrink-0" /> 
          <span className="font-medium">Change Password</span>
        </button>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 w-full p-4 hover:bg-red-50 text-red-600 rounded-lg transition text-left"
        >
          <LogOut className="shrink-0" /> 
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm relative shadow-xl">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition"
            >
              <X />
            </button>
            <h3 className="font-bold mb-4 text-lg">
              {step === 1 ? 'Enter Email' : step === 2 ? 'Verify OTP' : 'Set New Password'}
            </h3>
            
            {step === 1 && (
              <input 
                type="email" placeholder="Email Address" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-cyan-600 outline-none" 
              />
            )}
            {step === 2 && (
              <input 
                type="text" placeholder="Enter 6-digit OTP" 
                onChange={(e) => setFormData({...formData, otp: e.target.value})} 
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-cyan-600 outline-none" 
              />
            )}
            {step === 3 && (
              <div className="space-y-3">
                <input 
                  type="password" placeholder="New Password" 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-cyan-600 outline-none" 
                />
                <input 
                  type="password" placeholder="Confirm Password" 
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-cyan-600 outline-none" 
                />
              </div>
            )}
            
            <button 
              onClick={handlePasswordSubmit} 
              className="w-full mt-6 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg transition font-bold"
            >
              {step === 3 ? 'Update Password' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;