import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Dashboard = ({ user, language, setLanguage }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  const text = {
    ne: {
      welcome: 'स्वागतम्',
      pregnancyJourney: 'तपाईंको गर्भावस्था यात्रा',
      pregnancyProgress: 'गर्भावस्था प्रगति',
      weekComplete: 'हप्ता पूर्ण',
      daysRemaining: 'दिन बाकी',
      emergency: '🚨 आपातकालीन मूल्यांकन',
      emergencyDesc: 'आपातकालीन लक्षण मूल्यांकन करें',
      chatbot: 'च्याटबट',
      chatbotDesc: 'स्वास्थ्य सलाहकार',
      health: 'स्वास्थ्य ट्र्याकर',
      healthDesc: 'वजन र रक्तचाप',
      appointments: 'नियुक्तिहरू',
      appointmentsDesc: 'जाँच समय सूची',
      education: 'शिक्षा',
      educationDesc: 'स्वास्थ्य जानकारी',
      riskAssessment: 'जोखिम मूल्यांकन',
      riskAssessmentDesc: 'स्वास्थ्य विश्लेषण',
      logout: 'लग आउट',
      language: '🇬🇧 English',
      quickTips: 'त्वरित सुझाव',
      tip1: 'दैनिक ८-१० गिलास पानी पिउनुहोस्',
      tip2: 'पर्याप्त आराम र नींद लिनुहोस्',
      tip3: 'नियमित व्यायाम गर्नुहोस्'
    },
    en: {
      welcome: 'Welcome',
      pregnancyJourney: 'Your pregnancy journey',
      pregnancyProgress: 'Pregnancy Progress',
      weekComplete: 'weeks complete',
      daysRemaining: 'days remaining',
      emergency: '🚨 Emergency Assessment',
      emergencyDesc: 'Assess emergency symptoms',
      chatbot: 'Chatbot',
      chatbotDesc: 'Health advisor',
      health: 'Health Tracker',
      healthDesc: 'Weight & blood pressure',
      appointments: 'Appointments',
      appointmentsDesc: 'Checkup schedule',
      education: 'Education',
      educationDesc: 'Health information',
      riskAssessment: 'Risk Assessment',
      riskAssessmentDesc: 'Health analysis',
      logout: 'Logout',
      language: '🇳🇵 नेपाली',
      quickTips: 'Quick Tips',
      tip1: 'Drink 8-10 glasses of water daily',
      tip2: 'Get adequate rest and sleep',
      tip3: 'Exercise regularly'
    }
  };

  const t = text[language];

  const handleLogout = () => {
    localStorage.removeItem('aamasuraksha_user');
    window.location.reload();
  };

  // Calculate days until due date
  const calculateDaysLeft = () => {
    if (!user.due_date) return 0;
    const dueDate = new Date(user.due_date);
    const today = new Date();
    const diff = dueDate - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft();
  const weeksProgress = user.weeks_pregnant || 0;
  const percentComplete = (weeksProgress / 40) * 100;

  const menuItems = [
    {
      icon: '🤖',
      title_ne: 'च्याटबट',
      title_en: 'Chatbot',
      desc_ne: 'स्वास्थ्य सलाहकार',
      desc_en: 'Health advisor',
      path: '/chat',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/50',
      hoverBorder: 'hover:border-blue-400'
    },
    {
      icon: '📊',
      title_ne: 'स्वास्थ्य ट्र्याकर',
      title_en: 'Health Tracker',
      desc_ne: 'वजन र रक्तचाप',
      desc_en: 'Weight & blood pressure',
      path: '/health',
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/50',
      hoverBorder: 'hover:border-green-400'
    },
    {
      icon: '📅',
      title_ne: 'नियुक्तिहरू',
      title_en: 'Appointments',
      desc_ne: 'जाँच समय सूची',
      desc_en: 'Checkup schedule',
      path: '/appointments',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/50',
      hoverBorder: 'hover:border-purple-400'
    },
    {
      icon: '📚',
      title_ne: 'शिक्षा',
      title_en: 'Education',
      desc_ne: 'स्वास्थ्य जानकारी',
      desc_en: 'Health information',
      path: '/education',
      gradient: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/50',
      hoverBorder: 'hover:border-amber-400'
    },
    {
      icon: '⚖️',
      title_ne: 'जोखिम मूल्यांकन',
      title_en: 'Risk Assessment',
      desc_ne: 'स्वास्थ्य विश्लेषण',
      desc_en: 'Health analysis',
      path: '/risk',
      gradient: 'from-rose-500/20 to-red-500/20',
      borderColor: 'border-rose-500/50',
      hoverBorder: 'hover:border-rose-400'
    }
  ];

  const tips = [
    { icon: '💧', text_ne: t.tip1, text_en: text.en.tip1 },
    { icon: '😴', text_ne: t.tip2, text_en: text.en.tip2 },
    { icon: '🏃', text_ne: t.tip3, text_en: text.en.tip3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-2xl shadow-lg">
                🤰
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">आमा सुरक्षा</h1>
                <p className="text-xs text-slate-500">Maternal Health Companion</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors border border-slate-300"
              >
                {language === 'en' ? '🇳🇵 नेपाली' : '🇬🇧 English'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition-colors border border-red-200"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl shadow-xl p-8 text-white overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute -right-32 -top-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-teal-100 font-semibold text-lg mb-2">{t.welcome},</p>
                  <h2 className="text-5xl font-black mb-2">{user.name} 🤰</h2>
                  <p className="text-teal-50 text-lg">{t.pregnancyJourney}</p>
                </div>
                <div className="text-7xl opacity-30">🤰</div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-teal-100 text-sm font-semibold mb-1">{t.weekComplete}</p>
                  <p className="text-4xl font-bold">{weeksProgress}</p>
                  <p className="text-teal-50 text-xs mt-1">/ 40 weeks</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-teal-100 text-sm font-semibold mb-1">{t.daysRemaining}</p>
                  <p className="text-4xl font-bold">{daysLeft}</p>
                  <p className="text-teal-50 text-xs mt-1">days</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-teal-100 text-sm font-semibold mb-1">{t.pregnancyProgress}</p>
                  <p className="text-4xl font-bold">{Math.round(percentComplete)}%</p>
                  <p className="text-teal-50 text-xs mt-1">complete</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
                  <div
                    className="h-full bg-gradient-to-r from-white to-teal-100 transition-all duration-500 shadow-lg"
                    style={{ width: `${percentComplete}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Alert */}
        <section className="mb-10">
          <button
            onClick={() => navigate('/emergency')}
            className="w-full relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 group-hover:from-red-700 group-hover:to-rose-700 rounded-2xl shadow-lg transition-all duration-300 transform group-hover:scale-105"></div>
            <div className="relative px-8 py-6 flex items-center justify-center gap-4">
              <span className="text-4xl animate-pulse group-hover:animate-bounce">🚨</span>
              <div className="text-left">
                <p className="text-white font-bold text-xl">{t.emergency}</p>
                <p className="text-red-100 text-sm">{t.emergencyDesc}</p>
              </div>
              <span className="ml-auto text-white text-2xl group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>
        </section>

        {/* Quick Tips */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">{t.quickTips}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tips.map((tip, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-lg hover:border-teal-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{tip.icon}</span>
                  <p className="text-slate-700 font-semibold text-sm">
                    {language === 'ne' ? tip.text_ne : tip.text_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Menu Grid */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">
            {language === 'ne' ? 'मुख्य विशेषताएं' : 'Main Features'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative group rounded-2xl border-2 transition-all duration-300 overflow-hidden ${item.borderColor} ${item.hoverBorder} hover:shadow-xl transform hover:-translate-y-1`}
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}></div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative p-6 h-full flex flex-col items-center justify-center text-center">
                  <div className="text-5xl mb-3 group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-300">
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    {language === 'ne' ? item.title_ne : item.title_en}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {language === 'ne' ? item.desc_ne : item.desc_en}
                  </p>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-semibold text-teal-600">
                      {language === 'ne' ? '↓ क्लिक करें' : '↓ Click'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Health Tips Section */}
        <section className="mb-12 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-3xl p-8 border border-teal-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">
            {language === 'ne' ? 'स्वास्थ्य मार्गदर्शन' : 'Health Guidance'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-teal-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-3">
                {language === 'ne' ? 'पोषण' : 'Nutrition'}
              </h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>✓ {language === 'ne' ? 'हरे पत्तेदार सब्जियां खान' : 'Eat leafy vegetables daily'}</li>
                <li>✓ {language === 'ne' ? 'कैल्शियम युक्त खाद्य पदार्थ' : 'Calcium-rich foods'}</li>
                <li>✓ {language === 'ne' ? 'प्रोटीन और आयरन' : 'Protein & iron sources'}</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 border border-cyan-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-3">
                {language === 'ne' ? 'व्यायाम' : 'Exercise'}
              </h4>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li>✓ {language === 'ne' ? 'हल्का व्यायाम 30 मिनट' : '30 minutes light walking'}</li>
                <li>✓ {language === 'ne' ? 'योग और स्ट्रेचिंग' : 'Yoga & stretching'}</li>
                <li>✓ {language === 'ne' ? 'डॉक्टर की सलाह लें' : 'Consult doctor first'}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-slate-200">
          <p className="text-slate-600 text-sm">
            🤰 {language === 'ne' ? 'नेपाली माताओं के लिए प्रेम और देखभाल के साथ बनाया गया' : 'Made with love and care for mothers of Nepal'}
          </p>
          <p className="text-slate-500 text-xs mt-2">
            {language === 'ne' ? '⚠️ सलाहकार उपकरण, चिकित्सा निदान नहीं। हमेशा डॉक्टर से परामर्श लें।' : '⚠️ Advisory tool, not medical diagnosis. Always consult a doctor.'}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;