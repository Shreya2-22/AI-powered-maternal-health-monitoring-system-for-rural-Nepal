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
 
export const API = 'http://localhost:8001/api';
 
function App() {
  const [language, setLanguage]           = useState('ne');
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
    name:            (v) => !v.trim() ? 'नाम आवश्यक छ / Name is required' : v.trim().length < 2 ? 'कम्तिमा २ वर्ण / Min 2 chars' : '',
    age:             (v) => !v ? 'उमेर आवश्यक छ / Age is required' : (parseInt(v) < 13 || parseInt(v) > 60) ? 'उमेर १३-६० हुनुपर्छ / Age 13-60' : '',
    phone:           (v) => !v ? 'फोन आवश्यक छ / Phone is required' : !validateNepaliPhone(v) ? 'नेपाल फोन (९७/९८ ले शुरु) / Nepal phone (97/98, 10 digits)' : '',
    district:        (v) => !v.trim() ? 'जिल्ला आवश्यक छ / District is required' : '',
    weeks_pregnant:  (v) => !v ? 'हप्ता आवश्यक छ / Required' : (parseInt(v) < 1 || parseInt(v) > 42) ? 'कम्तिमा १-४२ / Must be 1-42' : '',
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
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        placeholder={placeholder || label}
        value={formData[key]}
        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
        onBlur={() => handleBlur(key)}
        className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
          touched[key] && errors[key]
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
        }`}
      />
      {touched[key] && errors[key] && <p className="text-red-500 text-xs mt-1">❌ {errors[key]}</p>}
    </div>
  );
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🤰</div>
          <h1 className="text-4xl font-bold text-white mb-2">{t.welcome}</h1>
          <p className="text-lg text-white/90">{t.subtitle}</p>
        </div>
 
        <div className="flex gap-4 mb-6">
          {['ne','en'].map(lang => (
            <button key={lang}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                language === lang
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => setLanguage(lang)}
            >
              {lang === 'ne' ? `🇳🇵 ${t.nepali}` : `🇬🇧 ${t.english}`}
            </button>
          ))}
        </div>
 
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name',           t.name,    'text',   t.name)}
            {field('age',            t.age,     'number', 'e.g. 25')}
            {field('phone',          t.phone,   'tel',    'e.g. 9841234567')}
            {field('district',       t.district,'text',   t.district)}
            
            {/* Weeks Pregnant */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.weeks} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 20"
                value={formData.weeks_pregnant}
                onChange={e => handleWeeksChange(e.target.value)}
                onBlur={() => handleBlur('weeks_pregnant')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.weeks_pregnant && errors.weeks_pregnant
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.weeks_pregnant && errors.weeks_pregnant && <p className="text-red-500 text-xs mt-1">❌ {errors.weeks_pregnant}</p>}
            </div>
            
            {/* Due Date (Auto-calculated) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.dueDate} <span className="text-green-600 text-xs">(auto-calculated)</span>
              </label>
              <input
                type="date"
                value={formData.due_date}
                disabled
                className="w-full px-4 py-2 border-2 border-green-300 rounded-lg bg-green-50 text-gray-600"
              />
              <p className="text-xs text-green-600 mt-1">✅ Automatically calculated from weeks</p>
            </div>
 
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
              <p className="text-sm text-gray-700">{t.disclaimer}</p>
            </div>
 
            <button type="submit" disabled={isSubmitting}
              className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '⏳ Processing...' : `${t.getStarted} →`}
            </button>
          </form>
        </div>
 
        <p className="text-center text-white/80 mt-6 text-sm">Made with ❤️ for the mothers of Nepal</p>
        <div className="flex gap-2 justify-center mt-4">
          <p className="text-white text-sm font-semibold">{t.haveAccount}</p>
          <button onClick={onSwitchToLogin}
            className="text-white font-bold underline hover:text-yellow-200 transition-colors text-sm"
          >
            {t.backToLogin}
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default App;