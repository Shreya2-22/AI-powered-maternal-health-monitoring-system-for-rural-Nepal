import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard    from './components/Dashboard.jsx';
import ChatBot      from './components/ChatBot.jsx';
import HealthTracker from './components/HealthTracker.jsx';
import Appointments from './components/Appointments.jsx';
import Education    from './components/Education.jsx';
import Emergency    from './components/Emergency.jsx';
import RiskAssessment from './components/RiskAssessment.jsx';
import Login        from './components/Login.jsx';
import { API } from './constants';
 
// API constant moved to src/constants.js
 
function App() {
  const [language, setLanguage]           = useState('en');
  const [currentUser, setCurrentUser]     = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin]         = useState(true);
 
  // ── Restore session from localStorage on page load ──────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('aamasuraksha_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setShowLogin(false);
        setShowOnboarding(false);
      } catch {
        localStorage.removeItem('aamasuraksha_user');
      }
    }
  }, []);
 
  // ── Register new user ─────────────────────────────────────────────────────
  // Tries backend first, falls back to localStorage-only if backend is offline
  const handleUserCreation = async (userData) => {
    try {
      // Attempt to save to MongoDB via backend
      const response = await fetch(`${API}/users`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(userData),
      });
 
      if (response.ok) {
        // ✅ Backend is online — use the MongoDB _id
        const savedUser = await response.json();
        setCurrentUser(savedUser);
        localStorage.setItem('aamasuraksha_user', JSON.stringify(savedUser));
        // Also keep a copy keyed by ID for login lookup
        localStorage.setItem(`aamasuraksha_user_${savedUser.id}`, JSON.stringify(savedUser));
        setShowOnboarding(false);
        setShowLogin(false);
      } else {
        throw new Error('Backend returned error');
      }
    } catch {
      // ⚠️  Backend offline — save to localStorage only
      console.warn('Backend offline — saving user locally.');
      const userId     = `local_${Date.now()}`;
      const userWithId = {
        ...userData,
        id:         userId,
        _id:        userId,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('aamasuraksha_user', JSON.stringify(userWithId));
      localStorage.setItem(`aamasuraksha_user_${userId}`, JSON.stringify(userWithId));
      setCurrentUser(userWithId);
      setShowOnboarding(false);
      setShowLogin(false);
    }
  };
 
  // ── Login existing user ───────────────────────────────────────────────────
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('aamasuraksha_user', JSON.stringify(userData));
    setShowLogin(false);
  };
 
  // ── Logout function ────────────────────────────────────────────────────────
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aamasuraksha_user');
    setShowLogin(true);
  };
 
  // ── Routing ───────────────────────────────────────────────────────────────
  if (showLogin) {
    return (
      <Login
        onComplete={handleLogin}
        onSwitchToOnboarding={() => { setShowLogin(false); setShowOnboarding(true); }}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }
 
  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={handleUserCreation}
        onSwitchToLogin={() => { setShowOnboarding(false); setShowLogin(true); }}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }
 
  return (
    <Router>
      <Routes>
        <Route path="/"            element={<Dashboard     user={currentUser} language={language} setLanguage={setLanguage} onLogout={handleLogout} />} />
        <Route path="/chat"        element={<ChatBot        user={currentUser} language={language} />} />
        <Route path="/health"      element={<HealthTracker  user={currentUser} language={language} />} />
        <Route path="/appointments" element={<Appointments  user={currentUser} language={language} />} />
        <Route path="/education"   element={<Education      user={currentUser} language={language} />} />
        <Route path="/emergency"   element={<Emergency      user={currentUser} language={language} />} />
        <Route path="/risk"        element={<RiskAssessment user={currentUser} language={language} />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
 
// ═══════════════════════════════════════════════════════════════════════════
// ONBOARDING FORM
// ═══════════════════════════════════════════════════════════════════════════
const Onboarding = ({ onComplete, onSwitchToLogin, language, setLanguage }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', phone: '', district: '', weeks_pregnant: '', due_date: ''
  });
  const [errors, setErrors]       = useState({});
  const [touched, setTouched]     = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const text = {
    ne: {
      welcome: 'आमा सुरक्षामा स्वागत छ!',
      subtitle: 'तपाईंको गर्भावस्था यात्रामा हामी तपाईंसँग छौं',
      name: 'तपाईंको नाम', age: 'उमेर', phone: 'फोन नम्बर',
      district: 'जिल्ला', weeks: 'कति हप्ताको गर्भवती हुनुहुन्छ?',
      dueDate: 'सम्भावित प्रसव मिति', getStarted: 'सुरु गर्नुहोस्',
      disclaimer: '⚠️ यो एक सलाहकार उपकरण हो, चिकित्सा निदान होइन।',
      haveAccount: 'पहिल्यै खाता छ?', backToLogin: 'लगइन गर्नुहोस्',
      nepali: 'नेपाली', english: 'English',
    },
    en: {
      welcome: 'Welcome to AamaSuraksha!',
      subtitle: 'Your companion through your pregnancy journey',
      name: 'Your Name', age: 'Age', phone: 'Phone Number',
      district: 'District', weeks: 'Weeks Pregnant',
      dueDate: 'Expected Due Date', getStarted: 'Get Started',
      disclaimer: '⚠️ This is an advisory tool, not medical diagnosis. Always consult a doctor.',
      haveAccount: 'Already have an account?', backToLogin: 'Login',
      nepali: 'नेपाली', english: 'English',
    }
  };
  const t = text[language];
 
  // ── Helper: Calculate due date from weeks pregnant ──────────────────────
  const calculateDueDate = (weeksPregn) => {
    if (!weeksPregn || weeksPregn < 1) return '';
    const daysRemaining = (40 - parseInt(weeksPregn)) * 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysRemaining);
    return dueDate.toISOString().split('T')[0];
  };
 
  // ── Helper: Validate Nepal phone number (97/98 prefix, 10 digits) ────────
  const validateNepaliPhone = (phone) => {
    const cleaned = phone.replace(/[\s-]/g, '');
    if (!/^(97|98)[0-9]{8}$/.test(cleaned)) return false;
    return true;
  };
 
  const validate = {
    name:            (v) => !v.trim() ? 'Name is required / नाम आवश्यक छ' : v.trim().length < 2 ? 'Min 2 chars / कम्तिमा २ वर्ण' : '',
    age:             (v) => !v ? 'Age is required / उमेर आवश्यक छ' : (parseInt(v) < 13 || parseInt(v) > 60) ? 'Age 13-60 / उमेर १३-६० हुनुपर्छ' : '',
    phone:           (v) => !v ? 'Phone is required / फोन आवश्यक छ' : !validateNepaliPhone(v) ? 'Nepal phone (97/98, 10 digits) / नेपाल फोन (९७/९८ ले शुरु)' : '',
    district:        (v) => !v.trim() ? 'District is required / जिल्ला आवश्यक छ' : '',
    weeks_pregnant:  (v) => !v ? 'Required / आवश्यक छ' : (parseInt(v) < 1 || parseInt(v) > 42) ? 'Must be 1-42 / कम्तिमा १-४२' : '',
  };
 
  // Auto-calculate due_date when weeks_pregnant changes
  const handleWeeksChange = (val) => {
    setFormData(p => ({
      ...p,
      weeks_pregnant: val,
      due_date: calculateDueDate(val)
    }));
  };
 
  const handleBlur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(p => ({ ...p, [field]: validate[field](formData[field]) }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = Object.fromEntries(
      Object.keys(validate).map(k => [k, validate[k](formData[k])])
    );
    setErrors(newErrors);
    setTouched(Object.fromEntries(Object.keys(validate).map(k => [k, true])));
    if (Object.values(newErrors).some(Boolean)) return;
 
    setIsSubmitting(true);
    try {
      await onComplete({
        ...formData,
        age:            parseInt(formData.age)            || 0,
        weeks_pregnant: parseInt(formData.weeks_pregnant) || 0,
        language_preference: language,
      });
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const field = (key, label, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-slate-700 font-medium text-xs mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        placeholder={placeholder || label}
        value={formData[key]}
        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
        onBlur={() => handleBlur(key)}
        className={`w-full px-3 py-2 border rounded-lg outline-none transition text-sm ${
          touched[key] && errors[key]
            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
        } text-slate-900 placeholder-slate-400`}
      />
      {touched[key] && errors[key] && <p className="text-red-500 text-xs mt-0.5">{errors[key]}</p>}
      {touched[key] && !errors[key] && <p className="text-green-600 text-xs mt-0.5">{language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
    </div>
  );
 
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
      <div className="flex-1 flex items-center justify-center p-4 py-6">
        <div className="w-full max-w-2xl">
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
            <p className="text-slate-500 text-xs">{t.subtitle}</p>
          </div>
 
          {/* Registration Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{t.welcome}</h2>
            </div>
 
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Grid for Personal Info */}
              <div className="grid grid-cols-2 gap-3">
                {field('name', t.name, 'text', t.name)}
                {field('age', t.age, 'number', 'e.g. 25')}
              </div>
 
              {/* Phone & District */}
              <div className="grid grid-cols-2 gap-3">
                {field('phone', t.phone, 'tel', 'e.g. 9841234567')}
                {field('district', t.district, 'text', t.district)}
              </div>
 
              {/* Pregnancy Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium text-xs mb-1">
                    {t.weeks} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 20"
                    value={formData.weeks_pregnant}
                    onChange={e => handleWeeksChange(e.target.value)}
                    onBlur={() => handleBlur('weeks_pregnant')}
                    className={`w-full px-3 py-2 border rounded-lg outline-none transition text-sm ${
                      touched.weeks_pregnant && errors.weeks_pregnant
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                    } text-slate-900 placeholder-slate-400`}
                  />
                  {touched.weeks_pregnant && errors.weeks_pregnant && <p className="text-red-500 text-xs mt-0.5">{errors.weeks_pregnant}</p>}
                </div>
 
                <div>
                  <label className="block text-slate-700 font-medium text-xs mb-1">
                    {t.dueDate}
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 font-medium text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-0.5">{language === 'ne' ? 'स्वतः गणना' : 'Auto-calculated'}</p>
                </div>
              </div>
 
              {/* Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mt-3">
                <p className="text-xs text-slate-700">{t.disclaimer}</p>
              </div>
 
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition text-sm"
              >
                {isSubmitting ? (language === 'ne' ? 'प्रक्रिया गरिँदै...' : 'Processing...') : t.getStarted}
              </button>
            </form>
 
            {/* Already have account */}
            <div className="text-center mt-4 pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-xs">
                {t.haveAccount}{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="text-teal-600 hover:text-teal-700 font-medium transition"
                >
                  {t.backToLogin}
                </button>
              </p>
            </div>
          </div>
 
          {/* Footer Disclaimer */}
          <div className="text-center mt-4 px-4">
            <p className="text-slate-500 text-xs leading-relaxed">
              {language === 'ne' ? 'यो सेवा गर्भवती महिलाहरूलाई शैक्षिक सहायता प्रदान गर्दछ।' : 'This service provides educational support for pregnant women.'}
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
};
 
export default App;