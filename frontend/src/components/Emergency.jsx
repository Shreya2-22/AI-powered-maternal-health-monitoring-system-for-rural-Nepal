import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';
 
// FIX (Bug 1): Accept `user` prop from App.jsx instead of reading
// the wrong localStorage key ('currentUser' → 'aamasuraksha_user').
export default function Emergency({ user, language }) {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

 
  const symptoms = {
    ne: [
      { id: 'bleeding', label: 'भारी रक्तस्राव', severity: 'critical' },
      { id: 'severe_pain', label: 'गम्भीर पेट दर्द', severity: 'critical' },
      { id: 'chest_pain', label: 'छाती दुख्ने', severity: 'critical' },
      { id: 'difficulty_breathing', label: 'सास लिन गाह्रो', severity: 'critical' },
      { id: 'loss_fetal_movement', label: 'बच्चाको चाल नभएको', severity: 'critical' },
      { id: 'seizure', label: 'बेहोस/दौरा पर्ने', severity: 'critical' },
      { id: 'severe_vomiting', label: 'गम्भीर उल्टी', severity: 'urgent' },
      { id: 'fever', label: 'बुखार (39°C+)', severity: 'urgent' },
      { id: 'vaginal_discharge', label: 'असामान्य योनि स्राव/पानी', severity: 'urgent' },
      { id: 'blurred_vision', label: 'धमिलो देखिने', severity: 'urgent' },
      { id: 'severe_headache', label: 'गम्भीर टाउको दुखाइ', severity: 'urgent' },
      { id: 'swelling_face_hands', label: 'अनुहार वा हात धेरै सुन्निने', severity: 'urgent' },
      { id: 'reduced_fetal_movement', label: 'बच्चाको चाल कम भएको', severity: 'urgent' },
      { id: 'nausea', label: 'हल्का वाकवाकी', severity: 'mild' },
      { id: 'dizziness', label: 'हल्का चक्कर', severity: 'mild' }
    ],
    en: [
      { id: 'bleeding', label: 'Heavy Bleeding', severity: 'critical' },
      { id: 'severe_pain', label: 'Severe Abdominal Pain', severity: 'critical' },
      { id: 'chest_pain', label: 'Chest Pain', severity: 'critical' },
      { id: 'difficulty_breathing', label: 'Difficulty Breathing', severity: 'critical' },
      { id: 'loss_fetal_movement', label: 'No Fetal Movement', severity: 'critical' },
      { id: 'seizure', label: 'Seizure/Fainting', severity: 'critical' },
      { id: 'severe_vomiting', label: 'Severe Vomiting', severity: 'urgent' },
      { id: 'fever', label: 'High Fever (39°C+)', severity: 'urgent' },
      { id: 'vaginal_discharge', label: 'Abnormal Vaginal Discharge/Leakage', severity: 'urgent' },
      { id: 'blurred_vision', label: 'Blurred Vision', severity: 'urgent' },
      { id: 'severe_headache', label: 'Severe Headache', severity: 'urgent' },
      { id: 'swelling_face_hands', label: 'Severe Face/Hand Swelling', severity: 'urgent' },
      { id: 'reduced_fetal_movement', label: 'Reduced Fetal Movement', severity: 'urgent' },
      { id: 'nausea', label: 'Mild Nausea', severity: 'mild' },
      { id: 'dizziness', label: 'Mild Dizziness', severity: 'mild' }
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
 
  // FIX (Bug 1): Removed the broken getStoredUser() function that read from
  // localStorage key 'currentUser'. The correct user object is now passed in
  // as a prop from App.jsx (which saves under 'aamasuraksha_user').
  // weeks_pregnant is now read directly from the prop.
 
  const fallbackAssess = () => {
    let score = 0;
    const reasons = [];
    let isEmergency = false;
    let urgentCount = 0;
    let mildCount = 0;

    // Critical immediate-action symptoms (any = emergency)
    const criticalSymptoms = [
      'bleeding',
      'severe_pain',
      'chest_pain',
      'difficulty_breathing',
      'loss_fetal_movement',
      'seizure',
    ];
    
    // Urgent symptoms (escalate to hospital visit)
    const urgentSymptoms = [
      'severe_vomiting',
      'fever',
      'vaginal_discharge',
      'blurred_vision',
      'severe_headache',
      'swelling_face_hands',
      'reduced_fetal_movement',
    ];

    const mildSymptoms = ['nausea', 'dizziness'];

    // Check for critical symptoms (any = emergency)
    for (const symptom of criticalSymptoms) {
      if (selectedSymptoms.includes(symptom)) {
        isEmergency = true;
        break;
      }
    }

    // Add specific reasons for critical symptoms
    if (selectedSymptoms.includes('bleeding')) {
      reasons.push(language === 'ne' ? 'भारी रक्तस्राव - तुरुन्त अस्पताल' : 'Heavy bleeding - go to hospital');
    }
    if (selectedSymptoms.includes('severe_pain')) {
      reasons.push(language === 'ne' ? 'गम्भीर दर्द - तुरुन्त मूल्यांकन' : 'Severe pain - needs immediate care');
    }
    if (selectedSymptoms.includes('chest_pain')) {
      reasons.push(language === 'ne' ? 'छाती दुखाइ - आपातकालीन अवस्था' : 'Chest pain - emergency warning');
    }
    if (selectedSymptoms.includes('difficulty_breathing')) {
      reasons.push(language === 'ne' ? 'सास लिन गाह्रो - तुरुन्त' : 'Breathing difficulty - immediate');
    }
    if (selectedSymptoms.includes('loss_fetal_movement')) {
      reasons.push(language === 'ne' ? 'बच्चाको चाल नभएको' : 'No fetal movement');
    }
    if (selectedSymptoms.includes('seizure')) {
      reasons.push(language === 'ne' ? 'दौरा/बेहोस - तुरुन्त अस्पताल' : 'Seizure/fainting - immediate hospital care');
    }

    // If not emergency, check urgent symptoms
    if (!isEmergency) {
      for (const symptom of selectedSymptoms) {
        if (urgentSymptoms.includes(symptom)) {
          urgentCount += 1;
        }
        if (mildSymptoms.includes(symptom)) mildCount += 1;
      }

      // Add specific urgent reasons
      if (selectedSymptoms.includes('severe_vomiting')) {
        reasons.push(language === 'ne' ? 'गम्भीर उल्टी - डाक्टर सम्पर्क गर्नुहोस्' : 'Severe vomiting - see doctor');
      }
      if (selectedSymptoms.includes('fever')) {
        reasons.push(language === 'ne' ? 'उच्च ज्वरो - संक्रमण संभव' : 'High fever - possible infection');
      }
      if (selectedSymptoms.includes('vaginal_discharge')) {
        reasons.push(language === 'ne' ? 'असामान्य योनि स्राव/पानी' : 'Abnormal discharge or leakage');
      }
      if (selectedSymptoms.includes('blurred_vision')) {
        reasons.push(language === 'ne' ? 'धमिलो देखिने - खतरा संकेत हुन सक्छ' : 'Blurred vision - possible danger sign');
      }
      if (selectedSymptoms.includes('severe_headache')) {
        reasons.push(language === 'ne' ? 'गम्भीर टाउको दुखाइ' : 'Severe headache');
      }
      if (selectedSymptoms.includes('swelling_face_hands')) {
        reasons.push(language === 'ne' ? 'अनुहार/हात अत्यधिक सुन्निने' : 'Severe face or hand swelling');
      }
      if (selectedSymptoms.includes('reduced_fetal_movement')) {
        reasons.push(language === 'ne' ? 'बच्चाको चाल कम भएको' : 'Reduced fetal movement');
      }
      if (selectedSymptoms.includes('nausea')) {
        reasons.push(language === 'ne' ? 'हल्का वाकवाकी - पानी पिउनुहोस्' : 'Mild nausea - hydrate and monitor');
      }
      if (selectedSymptoms.includes('dizziness')) {
        reasons.push(language === 'ne' ? 'हल्का चक्कर - आराम गर्नुहोस्' : 'Mild dizziness - rest and monitor');
      }
    }

    // Determine level
    let level;
    if (isEmergency) {
      level = 'emergency';
      score = 10;
    } else if (urgentCount >= 3) {
      level = 'emergency';
      score = 9;
    } else if (urgentCount > 0) {
      level = 'urgent';
      score = Math.max(5, urgentCount * 3);
    } else {
      level = 'self_care';
      score = mildCount > 0 ? Math.min(3, mildCount) : 0;
    }

    return {
      level,
      score: Math.min(score, 10),
      reasons,
      next_step: level === 'emergency'
        ? (language === 'ne' ? 'तुरुन्त अस्पताल जानुहोस्' : 'Go to hospital immediately')
        : level === 'urgent'
          ? (language === 'ne' ? 'आज चिकित्सकसँग सम्पर्क गर्नुहोस्' : 'Contact your doctor today')
          : (language === 'ne' ? 'लक्षणहरू निगरानी गर्नुहोस्' : 'Monitor symptoms and rest'),
      actions: level === 'emergency'
        ? [language === 'ne' ? 'तुरुन्त अस्पताल जानुहोस्' : 'Go to hospital immediately', 
           language === 'ne' ? 'परिवार सदस्यसँग जानुहोस्' : 'Go with family member']
        : level === 'urgent'
          ? [language === 'ne' ? 'डाक्टरलाई फोन गर्नुहोस्' : 'Call your doctor', 
             language === 'ne' ? 'आराम गर्नुहोस्' : 'Get rest']
          : [language === 'ne' ? 'आराम र पानी' : 'Rest and hydrate', 
             language === 'ne' ? 'लक्षण बढ्दा डाक्टर सम्पर्क गर्नुहोस्' : 'Contact doctor if symptoms worsen'],
    };
  };
 
  const assessRisk = async () => {
    setAnalysisError('');
    setIsAnalyzing(true);
 
    // FIX (Bug 1): Use the `user` prop directly instead of broken getStoredUser()
    const weeksPregnant = Number(user?.weeks_pregnant || 20);
 
    const payload = {
      language,
      selected_symptoms: selectedSymptoms,
      weeks_pregnant: weeksPregnant,

    };
 
    const localAssessment = fallbackAssess();

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
      const levelRank = { self_care: 0, urgent: 1, emergency: 2 };
      const backendLevel = data?.level || 'self_care';
      const localLevel = localAssessment.level;

      // Never allow backend to downgrade dangerous symptom combinations.
      if ((levelRank[backendLevel] ?? 0) < (levelRank[localLevel] ?? 0)) {
        setAnalysis(localAssessment);
        setAnalysisError(language === 'ne'
          ? 'सुरक्षाका लागि स्थानीय आपतकालीन नियम प्रयोग गरिएको छ।'
          : 'Using safer local emergency rules for selected symptoms.');
      } else {
        setAnalysis({
          ...data,
          reasons: Array.isArray(data?.reasons) && data.reasons.length > 0 ? data.reasons : localAssessment.reasons,
          actions: Array.isArray(data?.actions) && data.actions.length > 0 ? data.actions : localAssessment.actions,
          next_step: data?.next_step || localAssessment.next_step,
          score: typeof data?.score === 'number' ? data.score : localAssessment.score,
        });
      }
    } catch (error) {
      setAnalysisError(error.message);
      setAnalysis(localAssessment);
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
            className="px-5 py-3 text-blue-700 hover:text-blue-900 font-bold text-base bg-stone-100 hover:bg-stone-200 rounded-lg transition min-w-fit leading-normal"
          >
            {t.back}
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
 
        <button
          onClick={assessRisk}
          disabled={selectedSymptoms.length === 0 || isAnalyzing}
          className="w-full py-3 px-4 bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6 wrap-break-word"
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