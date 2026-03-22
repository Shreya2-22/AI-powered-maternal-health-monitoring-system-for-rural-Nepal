import { useNavigate } from 'react-router-dom';

export default function ChatBot({ user, language }) {
  const navigate = useNavigate();
  const text = {
    ne: { title: 'च्याटबट', back: '⬅️ फिर्ता' },
    en: { title: 'Chatbot', back: '⬅️ Back' }
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