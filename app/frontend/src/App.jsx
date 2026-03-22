import { useState, useEffect } from 'react';
import './App.css';
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
    <div className="App">
      {currentUser && (
        <Dashboard user={currentUser} language={language} setLanguage={setLanguage} />
      )}
    </div>
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
      disclaimer: '⚠️ यह एक सलाहकार उपकरण है, चिकित्सा निदान नहीं। हमेशा डॉक्टर से सलाह लें।'
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
    <div className="onboarding-container">
      <div className="onboarding-gradient"></div>
      
      <div className="onboarding-content">
        {/* Header */}
        <div className="onboarding-header">
          <div className="icon" style={{ fontSize: '64px', marginBottom: '20px' }}>🤰</div>
          <h1 className="title">{t.welcome}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>

        {/* Language Toggle */}
        <div className="language-toggle">
          <button
            className={`lang-btn ${language === 'ne' ? 'active' : ''}`}
            onClick={() => setLanguage('ne')}
          >
            🇳🇵 {t.nepali}
          </button>
          <button
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            🇬🇧 {t.english}
          </button>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>{t.name} *</label>
              <input
                type="text"
                placeholder={t.name}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.age} *</label>
              <input
                type="number"
                placeholder={t.age}
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.phone}</label>
              <input
                type="tel"
                placeholder={t.phone}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>{t.district}</label>
              <input
                type="text"
                placeholder={t.district}
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>{t.weeks}</label>
              <input
                type="number"
                placeholder={t.weeks}
                value={formData.weeks_pregnant}
                onChange={(e) => setFormData({...formData, weeks_pregnant: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>{t.dueDate}</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>

            {/* Disclaimer */}
            <div className="disclaimer-box">
              <p>{t.disclaimer}</p>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              {t.getStarted} →
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="footer-text">Made with ❤️ for the mothers of Nepal</p>
      </div>
    </div>
  );
};

export default App;
export { API };