import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';
 
export default function RiskAssessment({ user, language }) {
  const navigate = useNavigate();
  const [riskData, setRiskData]   = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
 
  const text = {
    ne: {
      title:         'जोखिम मूल्यांकन',
      back:          'फिर्ता',
      yourRisk:      'तपाईंको गर्भावस्था जोखिम',
      low:           'कम जोखिम',
      medium:        'मध्यम जोखिम',
      high:          'उच्च जोखिम',
      noData:        'जोखिम गणना गर्न स्वास्थ्य डेटा आवश्यक छ। पहिले स्वास्थ्य रेकर्ड थप्नुहोस्।',
      factors:       'जोखिम कारकहरू',
      bloodPressure: 'रक्तचाप',
      weightGain:    'वजन वृद्धि',
      age:           'उमेर',
      trackingFreq:  'ट्र्याकिङ आवृत्ति',
      lowProb:       'कम जोखिम सम्भावना',
      medProb:       'मध्यम जोखिम सम्भावना',
      highProb:      'उच्च जोखिम सम्भावना',
      recommendations: 'सिफारिसहरू',
      recalculate:   'पुनः गणना गर्नुहोस्',
      loading:       'लोड हो रहेको...',
      mlBadge:       'ML मोडल (Random Forest)',
      rulesBadge:    'नियम-आधारित',
      confidence:    'आत्मविश्वास स्कोर',
    },
    en: {
      title:         'Risk Assessment',
      back:          'Back',
      yourRisk:      'Your Pregnancy Risk Level',
      low:           'Low Risk',
      medium:        'Medium Risk',
      high:          'High Risk',
      noData:        'Please add health records first so the model can calculate your risk.',
      factors:       'Risk Factors',
      bloodPressure: 'Blood Pressure',
      weightGain:    'Weight Gain',
      age:           'Age',
      trackingFreq:  'Tracking Frequency',
      lowProb:       'Low Risk Probability',
      medProb:       'Medium Risk Probability',
      highProb:      'High Risk Probability',
      recommendations: 'Recommendations',
      recalculate:   'Recalculate',
      loading:       'Calculating risk...',
      mlBadge:       'ML Model (Random Forest)',
      rulesBadge:    'Rule-based',
      confidence:    'Confidence Score',
    }
  };
 
  const t = text[language] || text['en'];
 
  // ── Fetch risk from backend ────────────────────────────────────────────────
  const fetchRisk = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Handle both user.id (from backend) and user._id (from localStorage)
      const userId = user.id || user._id;
      
      if (!userId) {
        setError('User ID not found');
        setIsLoading(false);
        return;
      }
      
      // Get health records from localStorage (user can have multiple records)
      const storedRecords = localStorage.getItem(`health_records_${user.name}`);
      const healthRecords = storedRecords ? JSON.parse(storedRecords) : [];
      
      const res = await fetch(`${API}/risk-assessment`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ 
          user_id: userId,
          health_records: healthRecords  // Send records from localStorage
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to calculate risk');
      }
      const data = await res.json();
      setRiskData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
 
  useEffect(() => { fetchRisk(); }, [fetchRisk]);
 
  // ── Colours ────────────────────────────────────────────────────────────────
  const riskBg   = (lvl) => lvl === 'low' ? 'bg-green-50 border-green-400'
                          : lvl === 'medium' ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-red-50 border-red-400';
 
  const riskText = (lvl) => lvl === 'low' ? 'text-green-700'
                          : lvl === 'medium' ? 'text-yellow-700'
                          : 'text-red-700';
 
  const barColor = (v) => v < 35 ? 'bg-green-500' : v < 65 ? 'bg-yellow-500' : 'bg-red-500';
 
  // ── Label for a factor key ─────────────────────────────────────────────────
  const factorLabel = (key) => {
    const map = {
      blood_pressure:     t.bloodPressure,
      weight_gain:        t.weightGain,
      age:                t.age,
      tracking_frequency: t.trackingFreq,
      low:                t.lowProb,
      medium:             t.medProb,
      high:               t.highProb,
    };
    return map[key] || key;
  };
 
  // ── Risk level label ───────────────────────────────────────────────────────
  const riskLabel = (lvl) =>
    lvl === 'low' ? t.low : lvl === 'medium' ? t.medium : t.high;
 
  // ══════════════════════════════════════════════════════════════════════════
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

      <div className="max-w-6xl mx-auto w-full px-6 py-8">
 
      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent" />
          <p className="text-gray-600 text-lg">{t.loading}</p>
        </div>
      )}
 
      {/* Error */}
      {!isLoading && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
 
      {/* No data yet */}
      {!isLoading && !error && riskData?.model_used === 'no_data' && (
        <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-6 rounded-lg text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-semibold">{t.noData}</p>
        </div>
      )}
 
      {/* Main result */}
      {!isLoading && !error && riskData && riskData.model_used !== 'no_data' && (
        <div className="max-w-2xl mx-auto space-y-5">
 
          {/* Model badge */}
          <div className="flex justify-end">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              riskData.model_used === 'ml'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {riskData.model_used === 'ml' ? t.mlBadge : t.rulesBadge}
            </span>
          </div>
 
          {/* Risk Score Card */}
          <div className={`${riskBg(riskData.risk_level)} border-2 rounded-2xl p-6`}>
            <h2 className="text-base font-semibold text-gray-600 mb-4">{t.yourRisk}</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-5xl font-extrabold ${riskText(riskData.risk_level)}`}>
                  {riskLabel(riskData.risk_level).toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t.confidence}: <strong>{riskData.score}%</strong>
                </p>
              </div>
 
              {/* Circle gauge */}
              <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center
                ${riskData.risk_level === 'low'    ? 'border-green-500'
                : riskData.risk_level === 'medium' ? 'border-yellow-500'
                : 'border-red-500'}`}>
                <span className={`text-2xl font-bold ${riskText(riskData.risk_level)}`}>
                  {riskData.score}%
                </span>
              </div>
            </div>
          </div>
 
          {/* Risk Factors */}
          {riskData.factors && Object.keys(riskData.factors).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.factors}</h3>
              <div className="space-y-4">
                {Object.entries(riskData.factors).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{factorLabel(key)}</span>
                      <span className="text-sm font-semibold text-gray-800">{value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${barColor(value)}`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {/* Recommendations */}
          {riskData.recommendations?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.recommendations}</h3>
              <ul className="space-y-2">
                {riskData.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span className="text-gray-700 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
 
          {/* Recalculate */}
          <button
            onClick={fetchRisk}
            className="w-full bg-pink-600 hover:bg-pink-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all"
          >
            🔄 {t.recalculate}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}