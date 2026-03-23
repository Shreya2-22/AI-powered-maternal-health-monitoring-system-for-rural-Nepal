import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard.jsx';
import ChatBot from './components/ChatBot.jsx';
import HealthTracker from './components/HealthTracker.jsx';
import Appointments from './components/Appointments.jsx';
import Education from './components/Education.jsx';
import Emergency from './components/Emergency.jsx';

const API = 'http://localhost:8001/api';

function App() {
  const [language, setLanguage] = useState('ne');
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('aamasuraksha_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setShowOnboarding(false);
    }
  }, []);

  const handleUserCreation = async (userData) => {
    try {
      const response = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      setCurrentUser(data);
      localStorage.setItem('aamasuraksha_user', JSON.stringify(data));
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating user');
    }
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleUserCreation} language={language} setLanguage={setLanguage} />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Dashboard user={currentUser} language={language} setLanguage={setLanguage} />}
        />
        <Route
          path="/chat"
          element={<ChatBot user={currentUser} language={language} />}
        />
        <Route
          path="/health"
          element={<HealthTracker user={currentUser} language={language} />}
        />
        <Route
          path="/appointments"
          element={<Appointments user={currentUser} language={language} />}
        />
        <Route
          path="/education"
          element={<Education user={currentUser} language={language} />}
        />
        <Route
          path="/emergency"
          element={<Emergency user={currentUser} language={language} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

const Onboarding = ({ onComplete, language, setLanguage }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    district: '',
    weeks_pregnant: '',
    due_date: ''
  });

  const text = {
    ne: {
      welcome: 'आमा सुरक्षामा स्वागत छ!',
      subtitle: 'तपाईंको गर्भावस्था यात्रामा हामी तपाईंसँग छौं',
      name: 'तपाईंको नाम',
      age: 'उमेर',
      phone: 'फोन नम्बर (वैकल्पिक)',
      district: 'जिल्ला',
      weeks: 'कति हप्ताको गर्भवती हुनुहुन्छ?',
      dueDate: 'सम्भावित प्रसव मिति',
      nepali: 'नेपाली',
      english: 'English',
      getStarted: 'सुरु गर्नुहोस्',
      disclaimer: '⚠️ यो एक सलाहकार उपकरण हो, चिकित्सा निदान होइन। सधैं डाक्टरसँग परामर्श गर्नुहोस्।'
    },
    en: {
      welcome: 'Welcome to AamaSuraksha!',
      subtitle: 'Your companion through your pregnancy journey',
      name: 'Your Name',
      age: 'Age',
      phone: 'Phone Number (optional)',
      district: 'District',
      weeks: 'Weeks Pregnant',
      dueDate: 'Expected Due Date',
      nepali: 'नेपाली',
      english: 'English',
      getStarted: 'Get Started',
      disclaimer: '⚠️ This is an advisory tool, not medical diagnosis. Always consult a doctor.'
    }
  };

  const t = text[language];

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      ...formData,
      age: parseInt(formData.age) || 0,
      weeks_pregnant: parseInt(formData.weeks_pregnant) || 0,
      language_preference: language
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤰</div>
          <h1 className="text-4xl font-bold text-white mb-2">{t.welcome}</h1>
          <p className="text-lg text-white/90">{t.subtitle}</p>
        </div>

        {/* Language Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              language === 'ne'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => setLanguage('ne')}
          >
            🇳🇵 {t.nepali}
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              language === 'en'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => setLanguage('en')}
          >
            🇬🇧 {t.english}
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.name} *</label>
              <input
                type="text"
                placeholder={t.name}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.age} *</label>
              <input
                type="number"
                placeholder={t.age}
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.phone}</label>
              <input
                type="tel"
                placeholder={t.phone}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.district}</label>
              <input
                type="text"
                placeholder={t.district}
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.weeks}</label>
              <input
                type="number"
                placeholder={t.weeks}
                value={formData.weeks_pregnant}
                onChange={(e) => setFormData({...formData, weeks_pregnant: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.dueDate}</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition"
              />
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
              <p className="text-sm text-gray-700">{t.disclaimer}</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {t.getStarted} →
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 mt-6 text-sm">Made with ❤️ for the mothers of Nepal</p>
      </div>
    </div>
  );
};

export default App;
export { API };