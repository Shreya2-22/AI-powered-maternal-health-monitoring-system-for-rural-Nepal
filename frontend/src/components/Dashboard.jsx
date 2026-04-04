import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user, language, setLanguage }) => {
  const navigate = useNavigate();
  const text = {
    ne: {
      welcome: 'स्वागत छ',
      userInfo: '{name}! 💕',
      weeksInfo: '{weeks} हप्ता गर्भवती',
      emergency: '🚨 आपातकालीन मूल्यांकन',
      chatbot: '🤖 च्याटबट',
      chatbotDesc: 'स्वास्थ्य सलाहकार',
      health: '📊 स्वास्थ्य ट्र्याकर',
      healthDesc: 'वजन र रक्तचाप',
      appointments: '📅 नियुक्तिहरू',
      appointmentsDesc: 'जाँच समय सूची',
      education: '📚 शिक्षा',
      educationDesc: 'स्वास्थ्य जानकारी',
      riskAssessment: '⚖️ जोखिम मूल्यांकन',
      riskAssessmentDesc: 'स्वास्थ्य विश्लेषण',
      logout: 'लग आउट',
      language: '🇬🇧 English',
      daysLeft: '{days} दिन बाकी छ',
      completionStatus: 'गर्भावस्था प्रगति'
    },
    en: {
      welcome: 'Welcome',
      userInfo: '{name}! 💕',
      weeksInfo: '{weeks} weeks pregnant',
      emergency: '🚨 Emergency Assessment',
      chatbot: '🤖 Chatbot',
      chatbotDesc: 'Health advisor',
      health: '📊 Health Tracker',
      healthDesc: 'Weight & blood pressure',
      appointments: '📅 Appointments',
      appointmentsDesc: 'Checkup schedule',
      education: '📚 Education',
      educationDesc: 'Health information',
      riskAssessment: '⚖️ Risk Assessment',
      riskAssessmentDesc: 'Health Analysis',
      logout: 'Logout',
      language: '🇳🇵 नेपाली',
      daysLeft: '{days} days left',
      completionStatus: 'Pregnancy Progress'
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
      color: 'hover:border-blue-400'
    },
    {
      icon: '📊',
      title_ne: 'स्वास्थ्य ट्र्याकर',
      title_en: 'Health Tracker',
      desc_ne: 'वजन र रक्तचाप',
      desc_en: 'Weight & blood pressure',
      path: '/health',
      color: 'hover:border-green-400'
    },
    {
      icon: '📅',
      title_ne: 'नियुक्तिहरू',
      title_en: 'Appointments',
      desc_ne: 'जाँच समय सूची',
      desc_en: 'Checkup schedule',
      path: '/appointments',
      color: 'hover:border-purple-400'
    },
    {
      icon: '📚',
      title_ne: 'शिक्षा',
      title_en: 'Education',
      desc_ne: 'स्वास्थ्य जानकारी',
      desc_en: 'Health information',
      path: '/education',
      color: 'hover:border-yellow-400'
    },
    {
      icon: '⚖️',
      title_ne: 'जोखिम मूल्यांकन',
      title_en: 'Risk Assessment',
      desc_ne: 'स्वास्थ्य विश्लेषण',
      desc_en: 'Health Analysis',
      path: '/risk',
      color: 'hover:border-pink-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black">💝 आमा सुरक्षा</h1>
          </div>
          <div className="flex gap-3 items-center">
            <button
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg px-4 py-2 font-semibold transition-all border border-white/30"
              onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
            >
              {language === 'en' ? '🇳🇵 नेपाली' : '🇬🇧 English'}
            </button>
            <button
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg px-4 py-2 font-semibold transition-all border border-white/30"
              onClick={handleLogout}
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl shadow-lg p-8 mb-8 border-2 border-pink-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                {t.welcome}, 
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"> 
                  {user.name}
                </span>
                ! 💕
              </h2>
              {user.weeks_pregnant && (
                <p className="text-xl text-gray-700 font-semibold">
                  {user.weeks_pregnant} {language === 'ne' ? 'हप्ता गर्भवती' : 'weeks pregnant'}
                </p>
              )}
            </div>
            <div className="text-6xl">🤰</div>
          </div>

          {/* Progress Section */}
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">
              {language === 'ne' ? 'गर्भावस्था प्रगति' : 'Pregnancy Progress'}
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-600">
                    {language === 'ne' ? 'पूर्णताप्रतिशत' : 'Completion'}
                  </span>
                  <span className="text-sm font-bold text-pink-600">{Math.round(percentComplete)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${percentComplete}%` }}
                  ></div>
                </div>
              </div>
              {daysLeft > 0 && (
                <div className="text-center bg-red-100 rounded-xl p-4 min-w-max">
                  <p className="text-3xl font-black text-red-600">{daysLeft}</p>
                  <p className="text-xs text-red-700 font-semibold">
                    {language === 'ne' ? 'दिन बाकी' : 'days left'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Button */}
        <button
          onClick={() => navigate('/emergency')}
          className="w-full mb-8 py-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl animate-pulse hover:animate-none transition-all border-2 border-red-400"
        >
          🚨 {language === 'ne' ? 'आपातकालीन मूल्यांकन' : 'Emergency Assessment'}
        </button>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl border-2 border-gray-200 ${item.color} transition-all transform hover:-translate-y-2 group`}
            >
              <div className="text-6xl mb-4 group-hover:scale-125 transition-transform duration-300">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {language === 'ne' ? item.title_ne : item.title_en}
              </h3>
              <p className="text-gray-600 font-medium">
                {language === 'ne' ? item.desc_ne : item.desc_en}
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-pink-600 font-semibold text-sm">
                  {language === 'ne' ? '→ अन्वेषण गर्नुहोस्' : '→ Explore'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>💗 {language === 'ne' ? 'नेपाली माताहरूको लागि सेवाको साथ बनाइएको' : 'Made with love for the mothers of Nepal'}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;