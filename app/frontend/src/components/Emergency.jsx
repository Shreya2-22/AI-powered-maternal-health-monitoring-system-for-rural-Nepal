import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Emergency({ language }) {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);

  const symptoms = {
    ne: [
      { id: 'bleeding', label: 'भारी रक्तस्राव', severity: 'critical' },
      { id: 'severe_pain', label: 'गम्भीर पेट दर्द', severity: 'critical' },
      { id: 'fever', label: 'बुखार (39°C+)', severity: 'urgent' },
      { id: 'swelling', label: 'अत्यधिक सूजन', severity: 'urgent' },
      { id: 'headache', label: 'गम्भीर सिरदर्द', severity: 'urgent' },
      { id: 'nausea', label: 'मितली', severity: 'mild' },
      { id: 'dizziness', label: 'चक्कर आना', severity: 'mild' }
    ],
    en: [
      { id: 'bleeding', label: 'Heavy Bleeding', severity: 'critical' },
      { id: 'severe_pain', label: 'Severe Abdominal Pain', severity: 'critical' },
      { id: 'fever', label: 'High Fever (39°C+)', severity: 'urgent' },
      { id: 'swelling', label: 'Severe Swelling', severity: 'urgent' },
      { id: 'headache', label: 'Severe Headache', severity: 'urgent' },
      { id: 'nausea', label: 'Nausea', severity: 'mild' },
      { id: 'dizziness', label: 'Dizziness', severity: 'mild' }
    ]
  };

  const text = {
    ne: {
      title: 'आपातकालीन मूल्यांकन',
      back: '⬅️ फिर्ता',
      instruction: 'आप अनुभव गरेको लक्षणहरू चयन गर्नुहोस्:',
      checkBtn: 'मूल्यांकन गर्नुहोस्',
      emergency: '🚨 आपातकालीन - तुरुन्त अस्पताल जानुहोस्!',
      urgent: '⚠️ जरुरी - आज अस्पताल जानुहोस्',
      selfCare: '✅ स्वयं देखभाल - घरमा पर्यवेक्षण गर्नुहोस्',
      disclaimer: 'यो एक सलाहकार उपकरण हो। सधैं चिकित्सकसँग परामर्श गर्नुहोस्।'
    },
    en: {
      title: 'Emergency Assessment',
      back: '⬅️ Back',
      instruction: 'Select the symptoms you are experiencing:',
      checkBtn: 'Assess Risk',
      emergency: '🚨 EMERGENCY - Go to hospital immediately!',
      urgent: '⚠️ URGENT - Visit hospital today',
      selfCare: '✅ SELF-CARE - Monitor at home',
      disclaimer: 'This is an advisory tool. Always consult a doctor.'
    }
  };

  const t = text[language];
  const symp = symptoms[language];

  const assessRisk = () => {
    const hasCritical = selectedSymptoms.some(s => 
      symp.find(sy => sy.id === s)?.severity === 'critical'
    );
    const hasUrgent = selectedSymptoms.some(s => 
      symp.find(sy => sy.id === s)?.severity === 'urgent'
    );

    let riskLevel = 'self-care';
    if (hasCritical) riskLevel = 'emergency';
    else if (hasUrgent) riskLevel = 'urgent';

    setResult(riskLevel);
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const getResultColor = () => {
    if (result === 'emergency') return '#EF4444';
    if (result === 'urgent') return '#F59E0B';
    return '#10B981';
  };

  const getResultText = () => {
    if (result === 'emergency') return t.emergency;
    if (result === 'urgent') return t.urgent;
    return t.selfCare;
  };

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
        <p style={{ marginBottom: '20px', fontSize: '16px', color: '#666' }}>
          {t.instruction}
        </p>

        {/* Symptoms Checkboxes */}
        <div className="symptoms-grid">
          {symp.map(symptom => (
            <label key={symptom.id} className="symptom-checkbox">
              <input
                type="checkbox"
                checked={selectedSymptoms.includes(symptom.id)}
                onChange={() => toggleSymptom(symptom.id)}
              />
              <span className={`symptom-label severity-${symptom.severity}`}>
                {symptom.label}
              </span>
            </label>
          ))}
        </div>

        {/* Assess Button */}
        <button 
          className="assess-button"
          onClick={assessRisk}
          disabled={selectedSymptoms.length === 0}
        >
          {t.checkBtn}
        </button>

        {/* Result */}
        {result && (
          <div 
            className="result-box"
            style={{ borderLeftColor: getResultColor() }}
          >
            <h2 style={{ color: getResultColor(), marginBottom: '10px' }}>
              {getResultText()}
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              {t.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}