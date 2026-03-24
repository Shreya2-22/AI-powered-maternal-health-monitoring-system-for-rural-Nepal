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

  const getResultBgColor = () => {
    if (result === 'emergency') return 'bg-red-50 border-red-500';
    if (result === 'urgent') return 'bg-yellow-50 border-yellow-500';
    return 'bg-green-50 border-green-500';
  };

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

  const getResultTextColor = () => {
    if (result === 'emergency') return 'text-red-600';
    if (result === 'urgent') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getResultText = () => {
    if (result === 'emergency') return t.emergency;
    if (result === 'urgent') return t.urgent;
    return t.selfCare;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-linear-to-r from-pink-500 to-purple-500 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 font-semibold transition-all"
          >
            {t.back}
          </button>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <div style={{ width: '60px' }}></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6">
        <p className="text-gray-600 mb-6 text-base">
          {t.instruction}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {symp.map(symptom => (
            <label key={symptom.id} className="flex items-center p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-pink-300 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={selectedSymptoms.includes(symptom.id)}
                onChange={() => toggleSymptom(symptom.id)}
                className="w-5 h-5 rounded accent-pink-500"
              />
              <span className={`ml-3 font-semibold ${
                symptom.severity === 'critical'
                  ? 'text-red-600'
                  : symptom.severity === 'urgent'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {symptom.label}
              </span>
            </label>
          ))}
        </div>

        <button 
          onClick={assessRisk}
          disabled={selectedSymptoms.length === 0}
          className="w-full py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6"
        >
          {t.checkBtn}
        </button>

        {result && (
          <div className={`border-l-4 p-6 rounded ${getResultBgColor()}`}>
            <h2 className={`text-xl font-bold mb-2 ${getResultTextColor()}`}>
              {getResultText()}
            </h2>
            <p className="text-gray-600 text-sm">
              {t.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}