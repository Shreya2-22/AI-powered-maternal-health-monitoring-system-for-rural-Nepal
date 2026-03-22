import { useNavigate } from 'react-router-dom';

export default function Education({ language }) {
  const navigate = useNavigate();
  const text = {
    ne: { title: 'शिक्षा', back: '⬅️ फिर्ता' },
    en: { title: 'Education', back: '⬅️ Back' }
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