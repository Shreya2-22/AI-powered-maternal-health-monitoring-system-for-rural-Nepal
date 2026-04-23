import React, { useState } from 'react';
import { API } from '../App';

export default function Login({ onComplete, onSwitchToOnboarding, language, setLanguage }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const text = {
    ne: {
      title: 'आमा सुरक्षामा स्वागत छ',
      subtitle: 'तपाईंको गर्भावस्था यात्रामा हामी तपाईंसँग छौं',
      loginTitle: 'लगइन गर्नुहोस्',
      name: 'तपाईंको नाम प्रविष्ट गर्नुहोस्',
      phone: 'फोन नम्बर',
      login: 'लगइन गर्नुहोस्',
      noAccount: 'खाता छैन?',
      createAccount: 'नयाँ खाता बनाउनुहोस्',
      language: '🇳🇵 नेपाली',
      englishBtn: '🇬🇧 English',
      enterName: 'कृपया नाम प्रविष्ट गर्नुहोस्',
      enterPhone: 'कृपया फोन नम्बर प्रविष्ट गर्नुहोस्',
      userNotFound: 'प्रयोगकर्ता भेटिएन। नयाँ खाता बनाउनुहोस्।',
      disclaimer: '⚠️ यो एक सलाहकार उपकरण हो, चिकित्सा निदान होइन। सधैं डाक्टरसँग परामर्श गर्नुहोस्।'
    },
    en: {
      title: 'Welcome to AamaSuraksha',
      subtitle: 'Your companion through your pregnancy journey',
      loginTitle: 'Login',
      name: 'Enter your name',
      phone: 'Phone Number',
      login: 'Login',
      noAccount: "Don't have an account?",
      createAccount: 'Create a new account',
      language: '🇳🇵 नेपाली',
      englishBtn: '🇬🇧 English',
      enterName: 'Please enter your name',
      enterPhone: 'Please enter your phone number',
      userNotFound: 'User not found. Create a new account.',
      disclaimer: 'Advisory tool only. Always consult a doctor.'
    }
  };

  const t = text[language];

  // ── Validate Nepal phone number (97/98 prefix, 10 digits) ────────────────
  const validateNepaliPhone = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, '');
    if (!/^(97|98)[0-9]{8}$/.test(cleaned)) return false;
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(language === 'ne' ? 'कृपया नाम प्रविष्ट गर्नुहोस्' : 'Please enter your name');
      return;
    }

    if (!phone.trim()) {
      setError(language === 'ne' ? 'कृपया फोन नम्बर प्रविष्ट गर्नुहोस्' : 'Please enter your phone number');
      return;
    }

    if (!validateNepaliPhone(phone)) {
      setError(language === 'ne' ? 'नेपाली फोन (97/98 ले शुरु, 10 अंक)' : 'Nepal phone: 97/98 prefix, 10 digits');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Check all stored users in localStorage
      let allUsers = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('aamasuraksha_user_')) {
          const userStr = localStorage.getItem(key);
          if (userStr) {
            allUsers.push(JSON.parse(userStr));
          }
        }
      }
      
      // Look for existing user
      const existingUser = allUsers.find(u => u.name.toLowerCase() === name.trim().toLowerCase() && u.phone === phone.trim());
      
      if (existingUser) {
        onComplete(existingUser);
      } else {
        // User not found - show message to create account
        throw new Error(language === 'ne' ? 'प्रयोगकर्ता भेटिएन। नयाँ खाता बनाउनुहोस्।' : 'User not found. Create a new account.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Language Toggle - Hover based */}
      <div className="absolute top-8 right-8 flex gap-3 z-10">
        <button
          onMouseEnter={() => setLanguage('en')}
          className={`px-3 py-1.5 text-sm font-medium transition ${
            language === 'en'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          English
        </button>
        <span className="text-slate-300">/</span>
        <button
          onMouseEnter={() => setLanguage('ne')}
          className={`px-3 py-1.5 text-sm font-medium transition ${
            language === 'ne'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          नेपाली
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header Section */}
          <div className="text-center mb-6">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-3">
              <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Heart shape representing care */}
                <path d="M28 48C28 48 8 35 8 22C8 15.373 13.373 10 20 10C23.5 10 26.5 11.5 28 14C29.5 11.5 32.5 10 36 10C42.627 10 48 15.373 48 22C48 35 28 48 28 48Z" fill="#0F766E"/>
                {/* Protective circle */}
                <circle cx="28" cy="28" r="26" stroke="#0F766E" strokeWidth="1.5" fill="none" opacity="0.3"/>
              </svg>
            </div>
            
            {/* Branding */}
            <h1 className="text-2xl font-bold text-slate-900 mb-1">AamaSuraksha</h1>
            <p className="text-slate-500 text-xs">{language === 'ne' ? 'गर्भावस्था साथी' : 'Maternal Health Companion'}</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            {/* Header */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t.loginTitle}</h2>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Name Input */}
              <div>
                <label className="block text-slate-700 font-medium text-xs mb-1">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ne' ? 'नाम लेख्नुहोस्' : 'Your name'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder-slate-400 transition text-sm"
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-slate-700 font-medium text-xs mb-1">
                  {t.phone}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === 'ne' ? 'फोन नम्बर' : '97/98xxxxxxxx'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder-slate-400 transition text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition mt-4 text-sm"
              >
                {isLoading ? (language === 'ne' ? 'लोड हो रहेको...' : 'Loading...') : t.login}
              </button>
            </form>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-500">{language === 'ne' ? 'वा' : 'or'}</span>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="button"
              onClick={onSwitchToOnboarding}
              className="w-full border border-slate-300 hover:border-teal-300 bg-slate-50 hover:bg-teal-50 text-slate-700 font-medium py-2 rounded-lg transition text-sm"
            >
              {t.noAccount}
            </button>
          </div>

          {/* Footer Disclaimer */}
          <div className="text-center mt-4 px-4">
            <p className="text-slate-500 text-xs leading-relaxed">
              {language === 'ne' ? 'यो एक सलाहकार उपकरण हो। चिकित्सकीय सलाहको विकल्प होइन।' : 'Advisory tool only. Not a substitute for medical advice.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-slate-500 text-xs">
        <p>© 2024 AamaSuraksha</p>
      </div>
    </div>
  );
}
