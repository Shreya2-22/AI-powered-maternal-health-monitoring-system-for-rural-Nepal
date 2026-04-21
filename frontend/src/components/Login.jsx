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
      disclaimer: '⚠️ This is an advisory tool, not medical diagnosis. Always consult a doctor.'
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-teal-900 to-blue-900 flex items-center justify-center p-4">
      {/* Top Language Toggle */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
        className="absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-lg px-4 py-2 font-semibold transition-all border border-white/30"
      >
        {language === 'en' ? '🇳🇵 नेपाली' : '🇬🇧 English'}
      </button>

      {/* Login Container */}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-6xl font-black mb-2">🤰 आमा सुरक्षा</h1>
          <p className="text-xl font-semibold opacity-90">{t.subtitle}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
              {t.loginTitle}
            </h2>
            <p className="text-center text-gray-600 text-sm">{t.subtitle}</p>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                {t.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ne' ? 'नाम लेख्नुहोस्' : 'Enter name'}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200 text-gray-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                {t.phone}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={language === 'ne' ? 'फोन नम्बर' : 'Enter phone number'}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-200 text-gray-800 font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (language === 'ne' ? 'लोड हो रहेको...' : 'Loading...') : t.login}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">{language === 'ne' ? 'वा' : 'or'}</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Switch to Onboarding */}
          <button
            type="button"
            onClick={onSwitchToOnboarding}
            className="w-full border-2 border-gray-300 hover:border-teal-600 text-gray-700 hover:text-teal-600 font-bold py-3 rounded-lg transition-all"
          >
            {t.noAccount} {t.createAccount}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-white/80 text-xs mt-6 px-4">
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}
