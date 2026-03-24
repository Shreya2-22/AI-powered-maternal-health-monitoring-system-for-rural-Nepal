import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user, language, setLanguage }) => {
  const navigate = useNavigate();
  const text = {
    ne: {
      welcome: 'स्वागत छ',
      userInfo: '{name}! 💕',
      weeksInfo: '{weeks} हप्ता गर्भवती',
      emergency: '🚨 आपातकालीन मूल्यांकन',
      chatbot: '🤖 चेटबट',
      chatbotDesc: 'स्वास्थ्य सलाहकार',
      health: '📊 स्वास्थ्य ट्र्याकर',
      healthDesc: 'वजन र रक्तचाप',
      appointments: '📅 नियुक्तिहरू',
      appointmentsDesc: 'जाँच समय सूची',
      education: '📚 शिक्षा',
      educationDesc: 'स्वास्थ्य जानकारी',
      logout: 'लग आउट'
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
      logout: 'Logout'
    }
  };

  const t = text[language];

  const handleLogout = () => {
    localStorage.removeItem('aamasuraksha_user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">आमा सुरक्षा 🏥</h1>
          <div className="flex gap-4">
            <button
              className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 font-semibold transition-all"
              onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
            >
              {language === 'en' ? '🇳🇵 नेपाली' : '🇬🇧 English'}
            </button>
            <button
              className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 font-semibold transition-all"
              onClick={handleLogout}
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* User Card */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {t.welcome}, {user.name}! 💕
          </h2>
          {user.weeks_pregnant && (
            <p className="text-lg text-gray-600">
              {user.weeks_pregnant} {t.weeksInfo}
            </p>
          )}
        </div>

        {/* Emergency Button */}
        <button
          onClick={() => navigate('/emergency')}
          className="w-full mb-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-lg shadow-lg animate-pulse hover:animate-none transition-all"
        >
          {t.emergency}
        </button>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/chat')}
            className="bg-white border-2 border-gray-200 hover:border-pink-500 rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">च्याटबट</h3>
            <p className="text-gray-600">स्वास्थ्य सलाहकार</p>
          </button>

          <button
            onClick={() => navigate('/health')}
            className="bg-white border-2 border-gray-200 hover:border-pink-500 rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">स्वास्थ्य ट्र्याकर</h3>
            <p className="text-gray-600">वजन र रक्तचाप</p>
          </button>

          <button
            onClick={() => navigate('/appointments')}
            className="bg-white border-2 border-gray-200 hover:border-pink-500 rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">नियुक्तिहरू</h3>
            <p className="text-gray-600">जाँच समय सूची</p>
          </button>

          <button
            onClick={() => navigate('/education')}
            className="bg-white border-2 border-gray-200 hover:border-pink-500 rounded-xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">शिक्षा</h3>
            <p className="text-gray-600">स्वास्थ्य जानकारी</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;