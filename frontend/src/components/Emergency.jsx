import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function Emergency({ language }) {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [durationHours, setDurationHours] = useState(6);
  const [painScale, setPainScale] = useState(4);
  const [temperatureC, setTemperatureC] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [reducedFetalMovement, setReducedFetalMovement] = useState(false);

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
      back: 'फिर्ता',
      instruction: 'आप अनुभव गरेको लक्षणहरू चयन गर्नुहोस्:',
      advanced: 'उन्नत क्लिनिकल इनपुट',
      duration: 'लक्षण सुरु भएको समय (घण्टा)',
      painScale: 'दुखाइ स्तर (०-१०)',
      temp: 'तापक्रम (°C)',
      bpSys: 'सिस्टोलिक BP',
      bpDia: 'डायस्टोलिक BP',
      movement: 'बच्चाको चाल कम भएको छ',
      checkBtn: 'मूल्यांकन गर्नुहोस्',
      emergency: '🚨 आपातकालीन - तुरुन्त अस्पताल जानुहोस्!',
      urgent: '⚠️ जरुरी - आज अस्पताल जानुहोस्',
      selfCare: '✅ स्वयं देखभाल - घरमा पर्यवेक्षण गर्नुहोस्',
      reasons: 'मुख्य कारणहरू',
      steps: 'तुरुन्त गर्ने कामहरू',
      score: 'जोखिम स्कोर',
      analyzing: 'विश्लेषण भइरहेको छ...',
      disclaimer: 'यो एक सलाहकार उपकरण हो। सधैं चिकित्सकसँग परामर्श गर्नुहोस्।'
    },
    en: {
      title: 'Emergency Assessment',
      back: 'Back',
      instruction: 'Select the symptoms you are experiencing:',
      advanced: 'Advanced Clinical Inputs',
      duration: 'Symptom duration (hours)',
      painScale: 'Pain level (0-10)',
      temp: 'Temperature (°C)',
      bpSys: 'Systolic BP',
      bpDia: 'Diastolic BP',
      movement: 'Reduced fetal movement',
      checkBtn: 'Assess Risk',
      emergency: '🚨 EMERGENCY - Go to hospital immediately!',
      urgent: '⚠️ URGENT - Visit hospital today',
      selfCare: '✅ SELF-CARE - Monitor at home',
      reasons: 'Top reasons',
      steps: 'Immediate actions',
      score: 'Risk score',
      analyzing: 'Analyzing...',
      disclaimer: 'This is an advisory tool. Always consult a doctor.'
    }
  };

  const t = text[language];
  const symp = symptoms[language];

  const getResultBgColor = () => {
    if (analysis?.level === 'emergency') return 'bg-red-50 border-red-500';
    if (analysis?.level === 'urgent') return 'bg-yellow-50 border-yellow-500';
    return 'bg-green-50 border-green-500';
  };

  const getStoredUser = () => {
    const active = localStorage.getItem('currentUser');
    if (active) {
      return JSON.parse(active);
    }
    return null;
  };

  const fallbackAssess = () => {
    let score = 0;
    const reasons = [];

    selectedSymptoms.forEach((id) => {
      const weights = {
        bleeding: 5,
        severe_pain: 5,
        fever: 3,
        swelling: 3,
        headache: 3,
        dizziness: 2,
        nausea: 1,
      };
      score += weights[id] || 0;
    });

    if (selectedSymptoms.includes('bleeding') && selectedSymptoms.includes('severe_pain')) {
      reasons.push(language === 'ne' ? 'रक्तस्रावसँग अत्यधिक दुखाइ' : 'Bleeding with severe pain');
      score += 2;
    }
    if (reducedFetalMovement) {
      reasons.push(language === 'ne' ? 'बच्चाको चाल कम' : 'Reduced fetal movement');
      score += 2;
    }
    if (Number(temperatureC) >= 39) {
      reasons.push(language === 'ne' ? 'उच्च ज्वरो (>=39°C)' : 'High fever (>=39C)');
      score += 2;
    }
    if (Number(systolicBp) >= 140 || Number(diastolicBp) >= 90) {
      reasons.push(language === 'ne' ? 'उच्च रक्तचाप' : 'High blood pressure');
      score += 2;
    }

    const level = score >= 8 ? 'emergency' : score >= 5 ? 'urgent' : 'self_care';
    return {
      level,
      score: Math.min(score, 10),
      reasons,
      next_step: level === 'emergency'
        ? (language === 'ne' ? 'तुरुन्त अस्पताल जानुहोस्।' : 'Go to hospital immediately.')
        : level === 'urgent'
          ? (language === 'ne' ? 'आजै डाक्टरसँग सम्पर्क गर्नुहोस्।' : 'Contact your doctor today.')
          : (language === 'ne' ? 'लक्षणहरू निगरानी गर्नुहोस्।' : 'Monitor your symptoms closely.'),
      actions: level === 'emergency'
        ? [language === 'ne' ? 'परिवारसँग तुरुन्त अस्पताल जानुहोस्।' : 'Go to hospital now with someone.']
        : level === 'urgent'
          ? [language === 'ne' ? '१ घण्टाभित्र BP/तापक्रम फेरि जाँच गर्नुहोस्।' : 'Re-check BP/temperature within 1 hour.']
          : [language === 'ne' ? 'आराम गर्नुहोस् र पानी पिउनुहोस्।' : 'Rest and hydrate.'],
    };
  };

  const assessRisk = async () => {
    setAnalysisError('');
    setIsAnalyzing(true);
    const user = getStoredUser();
    const weeksPregnant = Number(user?.weeks_pregnant || 20);

    const payload = {
      language,
      selected_symptoms: selectedSymptoms,
      weeks_pregnant: weeksPregnant,
      duration_hours: Number(durationHours),
      pain_scale: Number(painScale),
      temperature_c: temperatureC ? Number(temperatureC) : null,
      systolic_bp: systolicBp ? Number(systolicBp) : null,
      diastolic_bp: diastolicBp ? Number(diastolicBp) : null,
      reduced_fetal_movement: reducedFetalMovement,
    };

    try {
      const res = await fetch(`${API}/emergency-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Backend emergency assessment failed');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error.message);
      setAnalysis(fallbackAssess());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const getResultTextColor = () => {
    if (analysis?.level === 'emergency') return 'text-red-600';
    if (analysis?.level === 'urgent') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getResultText = () => {
    if (analysis?.level === 'emergency') return t.emergency;
    if (analysis?.level === 'urgent') return t.urgent;
    return t.selfCare;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
          <div style={{ width: '40px' }}></div>
        </div>
      </header>

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

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">{t.advanced}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-slate-600">
              {t.duration}
              <input
                type="number"
                min="1"
                max="168"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm text-slate-600">
              {t.painScale}
              <input
                type="number"
                min="0"
                max="10"
                value={painScale}
                onChange={(e) => setPainScale(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm text-slate-600">
              {t.temp}
              <input
                type="number"
                step="0.1"
                value={temperatureC}
                onChange={(e) => setTemperatureC(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="e.g. 38.6"
              />
            </label>

            <label className="text-sm text-slate-600">
              {t.bpSys}
              <input
                type="number"
                value={systolicBp}
                onChange={(e) => setSystolicBp(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="e.g. 140"
              />
            </label>

            <label className="text-sm text-slate-600">
              {t.bpDia}
              <input
                type="number"
                value={diastolicBp}
                onChange={(e) => setDiastolicBp(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="e.g. 90"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 mt-6 md:mt-0">
              <input
                type="checkbox"
                checked={reducedFetalMovement}
                onChange={(e) => setReducedFetalMovement(e.target.checked)}
                className="w-4 h-4 accent-pink-500"
              />
              {t.movement}
            </label>
          </div>
        </div>

        <button 
          onClick={assessRisk}
          disabled={selectedSymptoms.length === 0 || isAnalyzing}
          className="w-full py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6"
        >
          {isAnalyzing ? t.analyzing : t.checkBtn}
        </button>

        {analysisError && (
          <p className="text-xs text-amber-700 mb-3">{analysisError}</p>
        )}

        {analysis && (
          <div className={`border-l-4 p-6 rounded ${getResultBgColor()}`}>
            <h2 className={`text-xl font-bold mb-2 ${getResultTextColor()}`}>
              {getResultText()}
            </h2>
            <p className="text-sm text-slate-700 mb-3">
              {t.score}: <span className="font-semibold">{analysis.score ?? 0}/10</span>
            </p>

            {Array.isArray(analysis.reasons) && analysis.reasons.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-800 mb-1">{t.reasons}</p>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {analysis.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.next_step && (
              <p className="text-sm text-slate-800 font-medium mb-2">{analysis.next_step}</p>
            )}

            {Array.isArray(analysis.actions) && analysis.actions.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-slate-800 mb-1">{t.steps}</p>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {analysis.actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-gray-600 text-sm">
              {t.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}