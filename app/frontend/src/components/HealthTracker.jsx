import { useNavigate } from 'react-router-dom';

export default function HealthTracker({ user, language }) {
  const navigate = useNavigate();
  const text = {
    ne: { title: 'स्वास्थ्य ट्र्याकर', back: '⬅️ फिर्ता' },
    en: { title: 'Health Tracker', back: '⬅️ Back' }
  };
  const t = text[language];

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          {t.back}
        </button>
        <h1>{t.title}</h1>
        <div style={{ width: '60px' }}></div>
      </div>
      <div className="page-content">
        <p>Coming soon...</p>
      </div>
    </div>
  );
}