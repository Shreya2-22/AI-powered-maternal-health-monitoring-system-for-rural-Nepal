import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx';
import ChatBot from './components/ChatBot.jsx';
import HealthTracker from './components/HealthTracker.jsx';
import Appointments from './components/Appointments.jsx';
import Education from './components/Education.jsx';
import Emergency from './components/Emergency.jsx';
import RiskAssessment from './components/RiskAssessment.jsx';

const API = 'http://localhost:8001/api';

function App() {
  const [language, setLanguage] = useState('ne');
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('aamasuraksha_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setTimeout(() => {
        setCurrentUser(parsed);
        setShowOnboarding(false);
      }, 0);
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
        <Route
          path="/risk"
          element={<RiskAssessment user={currentUser} language={language} />}
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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return language === 'ne' ? 'नाम आवश्यक छ' : 'Name is required';
    if (name.trim().length < 2) return language === 'ne' ? 'नाम कम्तिमा २ वर्ण हुनुपर्छ' : 'Name must be at least 2 characters';
    return '';
  };

  const validateAge = (age) => {
    if (!age) return language === 'ne' ? 'उमेर आवश्यक छ' : 'Age is required';
    const ageNum = parseInt(age);
    if (ageNum < 13 || ageNum > 60) return language === 'ne' ? 'उमेर १३-६० बीच हुनुपर्छ' : 'Age should be between 13-60';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return ''; // optional
    const phoneRegex = /^[0-9]{7,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return language === 'ne' ? 'मान्य फोन नम्बर राख्नुहोस्' : 'Please enter a valid phone number';
    }
    return '';
  };

  const validateDistrict = (district) => {
    if (!district.trim()) return language === 'ne' ? 'जिल्ला आवश्यक छ' : 'District is required';
    return '';
  };

  const validateWeeks = (weeks) => {
    if (!weeks) return language === 'ne' ? 'गर्भावस्थाको हप्ता आवश्यक छ' : 'Weeks pregnant is required';
    const weeksNum = parseInt(weeks);
    if (weeksNum < 1 || weeksNum > 42) return language === 'ne' ? 'हप्ता १-४२ बीच हुनुपर्छ' : 'Weeks should be between 1-42';
    return '';
  };

  const validateDueDate = (dueDate) => {
    if (!dueDate) return language === 'ne' ? 'सम्भावित मिति आवश्यक छ' : 'Due date is required';
    const selectedDate = new Date(dueDate);
    const today = new Date();
    if (selectedDate < today) return language === 'ne' ? 'मिति आज भन्दा अगाडि हुनुपर्छ' : 'Due date should be in the future';
    return '';
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    newErrors.name = validateName(formData.name);
    newErrors.age = validateAge(formData.age);
    newErrors.phone = validatePhone(formData.phone);
    newErrors.district = validateDistrict(formData.district);
    newErrors.weeks_pregnant = validateWeeks(formData.weeks_pregnant);
    newErrors.due_date = validateDueDate(formData.due_date);
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched({...touched, [field]: true});
    const fieldValidator = {
      name: () => validateName(formData.name),
      age: () => validateAge(formData.age),
      phone: () => validatePhone(formData.phone),
      district: () => validateDistrict(formData.district),
      weeks_pregnant: () => validateWeeks(formData.weeks_pregnant),
      due_date: () => validateDueDate(formData.due_date)
    };
    const fieldError = fieldValidator[field]?.();
    if (fieldError) {
      setErrors({...errors, [field]: fieldError});
    } else {
      setErrors({...errors, [field]: ''});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({name: true, age: true, phone: true, district: true, weeks_pregnant: true, due_date: true});

    // Check if any errors exist
    if (Object.values(newErrors).some(err => err)) return;

    setIsSubmitting(true);
    try {
      onComplete({
        ...formData,
        age: parseInt(formData.age) || 0,
        weeks_pregnant: parseInt(formData.weeks_pregnant) || 0,
        language_preference: language
      });
    } catch (error) {
      alert(language === 'ne' ? 'त्रुटि भयो। पुनः प्रयास गर्नुहोस्।' : 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-400 via-purple-500 to-blue-500 flex items-center justify-center p-4">
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
                ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => setLanguage('ne')}
          >
            🇳🇵 {t.nepali}
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              language === 'en'
                ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-lg'
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
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.name} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t.name}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                onBlur={() => handleBlur('name')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.name && errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.name && errors.name && <p className="text-red-500 text-xs mt-1">❌ {errors.name}</p>}
            </div>

            {/* Age Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.age} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 25"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                onBlur={() => handleBlur('age')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.age && errors.age ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.age && errors.age && <p className="text-red-500 text-xs mt-1">❌ {errors.age}</p>}
              {touched.age && !errors.age && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📱 {t.phone}</label>
              <input
                type="tel"
                placeholder="e.g., 9841234567"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                onBlur={() => handleBlur('phone')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.phone && errors.phone ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.phone && errors.phone && <p className="text-red-500 text-xs mt-1">❌ {errors.phone}</p>}
              {touched.phone && !errors.phone && formData.phone && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
              {!formData.phone && <p className="text-gray-500 text-xs mt-1">{language === 'ne' ? '(वैकल्पिक)' : '(Optional)'}</p>}
            </div>

            {/* District Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.district} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t.district}
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                onBlur={() => handleBlur('district')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.district && errors.district ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.district && errors.district && <p className="text-red-500 text-xs mt-1">❌ {errors.district}</p>}
            </div>

            {/* Weeks Pregnant Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.weeks} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 20"
                value={formData.weeks_pregnant}
                onChange={(e) => setFormData({...formData, weeks_pregnant: e.target.value})}
                onBlur={() => handleBlur('weeks_pregnant')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.weeks_pregnant && errors.weeks_pregnant ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.weeks_pregnant && errors.weeks_pregnant && <p className="text-red-500 text-xs mt-1">❌ {errors.weeks_pregnant}</p>}
              {touched.weeks_pregnant && !errors.weeks_pregnant && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
            </div>

            {/* Due Date Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 {t.dueDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                onBlur={() => handleBlur('due_date')}
                className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                  touched.due_date && errors.due_date ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
                }`}
              />
              {touched.due_date && errors.due_date && <p className="text-red-500 text-xs mt-1">❌ {errors.due_date}</p>}
              {touched.due_date && !errors.due_date && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
              <p className="text-sm text-gray-700">{t.disclaimer}</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '⏳ ' + (language === 'ne' ? 'प्रक्रियामा...' : 'Processing...') : t.getStarted + ' →'}
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