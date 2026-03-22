const Dashboard = ({ user, language, setLanguage }) => {
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
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>आमा सुरक्षा 🏥</h1>
        <div className="dashboard-header-buttons">
          <button 
            className="header-btn"
            onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
          >
            {language === 'en' ? '🇳🇵' : '🇬🇧'}
          </button>
          <button className="header-btn" onClick={handleLogout}>
            {t.logout}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {/* User Card */}
        <div className="user-card">
          <h2>{t.welcome}, {user.name}! 💕</h2>
          {user.weeks_pregnant && (
            <p>{user.weeks_pregnant} {t.weeksInfo}</p>
          )}
        </div>

        {/* Emergency Button */}
        <button className="emergency-button">
          {t.emergency}
        </button>

        {/* Menu Grid */}
        <div className="menu-grid">
          <button className="menu-card">
            <div className="menu-card-icon">🤖</div>
            <div className="menu-card-title">च्याटबट</div>
            <div className="menu-card-desc">स्वास्थ्य सलाहकार</div>
          </button>
          
          <button className="menu-card">
            <div className="menu-card-icon">📊</div>
            <div className="menu-card-title">स्वास्थ्य ट्र्याकर</div>
            <div className="menu-card-desc">वजन र रक्तचाप</div>
          </button>
          
          <button className="menu-card">
            <div className="menu-card-icon">📅</div>
            <div className="menu-card-title">नियुक्तिहरू</div>
            <div className="menu-card-desc">जाँच समय सूची</div>
          </button>
          
          <button className="menu-card">
            <div className="menu-card-icon">📚</div>
            <div className="menu-card-title">शिक्षा</div>
            <div className="menu-card-desc">स्वास्थ्य जानकारी</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;