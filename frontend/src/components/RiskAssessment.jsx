import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../App';

export default function RiskAssessment({ user, language }) {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const text = {
    ne: {
      title: 'जोखिम मूल्यांकन',
      back: '⬅️ फिर्ता',
      yourRisk: 'तपाईंको गर्भावस्था जोखिम',
      low: 'कम जोखिम',
      medium: 'मध्यम जोखिम',
      high: 'उच्च जोखिम',
      noData: 'जोखिम गणना गर्न स्वास्थ्य डेटा आवश्यक छ',
      factors: 'जोखिम कारकहरू',
      bloodPressure: 'रक्तचाप',
      weightGain: 'वजन वृद्धि',
      age: 'उमेर',
      trackingFreq: 'ट्र्याकिङ आवृत्ति',
      recommendations: 'सिफारिसहरू',
      recalculate: 'पुनः गणना गर्नुहोस्',
      loading: 'लोड हो रहेको...'
    },
    en: {
      title: 'Risk Assessment',
      back: '⬅️ Back',
      yourRisk: 'Your Pregnancy Risk',
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
      noData: 'Health data needed to calculate risk',
      factors: 'Risk Factors',
      bloodPressure: 'Blood Pressure',
      weightGain: 'Weight Gain',
      age: 'Age',
      trackingFreq: 'Tracking Frequency',
      recommendations: 'Recommendations',
      recalculate: 'Recalculate',
      loading: 'Loading...'
    }
  };

  const t = text[language];

  useEffect(() => {
    fetchRiskAssessment();
  }, [user]);

  const fetchRiskAssessment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API}/risk-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate risk');
      }
      
      const data = await response.json();
      setRiskData(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level) => {
    return level === 'low' ? 'bg-green-100 border-green-400' :
           level === 'medium' ? 'bg-yellow-100 border-yellow-400' :
           'bg-red-100 border-red-400';
  };

  const getRiskTextColor = (level) => {
    return level === 'low' ? 'text-green-700' :
           level === 'medium' ? 'text-yellow-700' :
           'text-red-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-pink-600"
        >
          {t.back}
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
        <div className="w-8"></div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600 text-lg">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : !riskData ? (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded text-center">
          {t.noData}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Risk Score Card */}
          <div className={`${getRiskColor(riskData.risk_level)} border-2 rounded-lg p-6`}>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{t.yourRisk}</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-4xl font-bold ${getRiskTextColor(riskData.risk_level)}`}>
                  {riskData.score}
                </p>
                <p className={`text-lg font-semibold ${getRiskTextColor(riskData.risk_level)}`}>
                  {riskData.risk_level === 'low' ? t.low :
                   riskData.risk_level === 'medium' ? t.medium : t.high}
                </p>
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-current flex items-center justify-center">
                <span className={`text-3xl font-bold ${getRiskTextColor(riskData.risk_level)}`}>
                  {riskData.score}%
                </span>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.factors}</h3>
            <div className="space-y-4">
              {Object.entries(riskData.factors).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">
                      {key === 'blood_pressure' ? t.bloodPressure :
                       key === 'weight_gain' ? t.weightGain :
                       key === 'age' ? t.age : t.trackingFreq}
                    </span>
                    <span className="font-semibold text-gray-800">{value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        value < 35 ? 'bg-green-500' :
                        value < 65 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.recommendations}</h3>
            <ul className="space-y-2">
              {riskData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">•</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recalculate Button */}
          <button
            onClick={fetchRiskAssessment}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {t.recalculate}
          </button>
        </div>
      )}
    </div>
  );
}
