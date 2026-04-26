import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
 
const Dashboard = ({ user, language, setLanguage, onLogout }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
 
  const text = {
    ne: {
      welcome: 'स्वागतम्',
      pregnancyJourney: 'तपाईंको गर्भावस्था यात्रा',
      pregnancyProgress: 'गर्भावस्था प्रगति',
      weekComplete: 'हप्ता पूर्ण',
      daysRemaining: 'दिन बाकी',
      emergency: 'आपातकालीन मूल्यांकन',
      emergencyDesc: 'आपातकालीन लक्षण चेक गर्नुहोस्',
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
      language: 'English',
      quickTips: 'स्वास्थ्य सुझाव',
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
      emergency: 'Emergency Assessment',
      emergencyDesc: 'Quick symptom evaluation',
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
      language: 'नेपाली',
      quickTips: 'Health Tips',
      tip1: 'Drink 8-10 glasses of water daily',
      tip2: 'Get adequate rest and sleep',
      tip3: 'Exercise regularly'
    }
  };
 
  const t = text[language];
 
  // ── Calculate health summary from localStorage records ────────────────────
  const getHealthSummary = () => {
    const records = localStorage.getItem(`health_records_${user.name}`);
    if (!records) return { count: 0, latestWeight: null, latestBP: null };
    
    try {
      const parsed = JSON.parse(records);
      if (!parsed.length) return { count: 0, latestWeight: null, latestBP: null };
      
      const latest = parsed[parsed.length - 1];
      return {
        count: parsed.length,
        latestWeight: latest.weight || null,
        latestBP: (latest.systolic && latest.diastolic) ? `${latest.systolic}/${latest.diastolic}` : null,
        avgWeight: (parsed.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0) / parsed.length).toFixed(1)
      };
    } catch {
      return { count: 0, latestWeight: null, latestBP: null };
    }
  };
 
  const healthSummary = getHealthSummary();
 
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
 
  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('aamasuraksha_user');
      window.location.reload();
    }
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
      title_ne: 'संवाद सेवक',
      title_en: 'Chat',
      desc_ne: 'स्वास्थ्य सलाहकार',
      desc_en: 'Health advisor',
      path: '/chat',
      color: 'blue'
    },
    {
      title_ne: 'स्वास्थ्य ट्र्याकर',
      title_en: 'Health Tracker',
      desc_ne: 'वजन र रक्तचाप',
      desc_en: 'Weight & BP',
      path: '/health',
      color: 'green'
    },
    {
      title_ne: 'नियुक्तिहरू',
      title_en: 'Appointments',
      desc_ne: 'देखदक्षता समय',
      desc_en: 'Schedule',
      path: '/appointments',
      color: 'purple'
    },
    {
      title_ne: 'शिक्षा',
      title_en: 'Education',
      desc_ne: 'स्वास्थ्य जानकारी',
      desc_en: 'Health info',
      path: '/education',
      color: 'amber'
    },
    {
      title_ne: 'जोखिम मूल्यांकन',
      title_en: 'Risk Assessment',
      desc_ne: 'स्वास्थ्य विश्लेषण',
      desc_en: 'Health analysis',
      path: '/risk',
      color: 'rose'
    }
  ];
 
  const tips = [
    { text_ne: t.tip1, text_en: text.en.tip1 },
    { text_ne: t.tip2, text_en: text.en.tip2 },
    { text_ne: t.tip3, text_en: text.en.tip3 }
  ];
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo — same SVG heart as Login page */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28 48C28 48 8 35 8 22C8 15.373 13.373 10 20 10C23.5 10 26.5 11.5 28 14C29.5 11.5 32.5 10 36 10C42.627 10 48 15.373 48 22C48 35 28 48 28 48Z" fill="#0F766E"/>
                <circle cx="28" cy="28" r="26" stroke="#0F766E" strokeWidth="1.5" fill="none" opacity="0.3"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">AamaSuraksha</h1>
              <p className="text-xs text-slate-500">{language === 'ne' ? 'गर्भावस्था साथी' : 'Maternal Health Companion'}</p>
            </div>
          </div>
 
          {/* Right Actions */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
            >
              {language === 'en' ? 'नेपाली' : 'English'}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>
        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm border border-slate-200">
              <p className="text-lg font-semibold text-slate-900 mb-1">
                {language === 'ne' ? 'लग आउट गर्न निश्चित हुनुहुन्छ?' : 'Confirm Logout'}
              </p>
              <p className="text-sm text-slate-600 mb-6">
                {language === 'ne' ? 'यस कार्यको पश्चात तपाईं पुनः लगइन गर्नुपर्नेछ।' : 'You will need to login again to access your account.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
                >
                  {language === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition"
                >
                  {language === 'ne' ? 'लग आउट' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        )}      </header>
 
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-1">{user.name}</h2>
          <p className="text-slate-600">{t.pregnancyJourney}</p>
        </section>
 
        {/* Progress Cards */}
        <section className="mb-12">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Weeks Complete</p>
              <p className="text-4xl font-bold text-teal-600 mb-2">{weeksProgress}</p>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all duration-500"
                  style={{ width: `${(weeksProgress / 40) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">of 40 weeks</p>
            </div>
 
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Days Remaining</p>
              <p className="text-4xl font-bold text-blue-600 mb-2">{daysLeft}</p>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 280) * 100))}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">until due date</p>
            </div>
 
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Progress</p>
              <p className="text-4xl font-bold text-indigo-600 mb-2">{Math.round(percentComplete)}%</p>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">complete</p>
            </div>
          </div>
        </section>
 
        {/* Health Summary */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Health Records</h3>
          <div className="grid grid-cols-3 gap-6">
            {(() => {
              const health = getHealthSummary();
              return (
                <>
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Records Logged</p>
                    <p className="text-3xl font-bold text-teal-600">{health.count}</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Latest Weight</p>
                    <p className="text-3xl font-bold text-amber-600">{health.latestWeight || '--'} <span className="text-sm text-slate-500 font-normal">kg</span></p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Blood Pressure</p>
                    <p className="text-3xl font-bold text-rose-600">{health.latestBP || '--'}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
 
        {/* Emergency Alert */}
        <section className="mb-12">
          <button
            onClick={() => navigate('/emergency')}
            className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 rounded-xl p-6 text-red-900 transition shadow-sm hover:shadow-md"
          >
            <p className="font-semibold text-lg">Emergency Assessment</p>
            <p className="text-red-700 text-sm mt-1">Assess symptoms that require immediate attention</p>
          </button>
        </section>
        {/* Quick Tips */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Helpful Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tips.map((tip, idx) => {
              const colors = [
                { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900' },
                { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900' },
                { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' }
              ];
              const color = colors[idx];
              return (
                <div
                  key={idx}
                  className={`${color.bg} ${color.border} rounded-xl p-5 border shadow-sm hover:shadow-md transition`}
                >
                  <p className={`text-sm leading-relaxed ${color.text}`}>
                    {language === 'ne' ? tip.text_ne : tip.text_en}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
 
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {menuItems.map((item, idx) => {
              const colorMap = {
                blue: { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100', text: 'text-blue-900' },
                green: { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100', text: 'text-green-900' },
                purple: { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:bg-purple-100', text: 'text-purple-900' },
                amber: { bg: 'bg-amber-50', border: 'border-amber-200', hover: 'hover:bg-amber-100', text: 'text-amber-900' },
                rose: { bg: 'bg-rose-50', border: 'border-rose-200', hover: 'hover:bg-rose-100', text: 'text-rose-900' }
              };
              const color = colorMap[item.color];
              return (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={`p-4 rounded-lg border ${color.bg} ${color.border} ${color.hover} transition shadow-sm hover:shadow-md`}
                >
                  <h4 className={`text-sm font-semibold ${color.text} mb-1`}>
                    {language === 'ne' ? item.title_ne : item.title_en}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {language === 'ne' ? item.desc_ne : item.desc_en}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
 
        {/* Health Guidance */}
        <section className="mb-12 bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-l-4 border-teal-300 pl-6">
              <h4 className="font-semibold text-slate-900 mb-4">Nutrition</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-3"><span className="inline-block w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5 flex-shrink-0"></span> Eat leafy vegetables daily</li>
                <li className="flex items-start gap-3"><span className="inline-block w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5 flex-shrink-0"></span> Include calcium-rich foods</li>
                <li className="flex items-start gap-3"><span className="inline-block w-1.5 h-1.5 bg-teal-400 rounded-full mt-1.5 flex-shrink-0"></span> Get protein and iron</li>
              </ul>
            </div>
            <div className="border-l-4 border-cyan-300 pl-6">
              <h4 className="font-semibold text-slate-900 mb-4">Exercise</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-3"><span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></span> Light walking 30 minutes</li>
                <li className="flex items-start gap-3"><span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></span> Yoga and stretching</li>
                <li className="flex items-start gap-3"><span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></span> Consult doctor first</li>
              </ul>
            </div>
          </div>
        </section>
 
        {/* Footer */}
        <footer className="border-t border-slate-200 pt-8 pb-4 text-center text-xs text-slate-600">
          <p>Advisory tool for maternal health. Always consult your doctor.</p>
        </footer>
      </main>
    </div>
  );
};
 
export default Dashboard;