import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function HealthInsights({ user, language }) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInsight, setSelectedInsight] = useState(null);

  const text = language === 'ne' ? {
    title: 'स्वास्थ्य अन्तर्दृष्टि',
    back: 'फिर्ता',
    personalized: 'व्यक्तिगत स्वास्थ्य सुझाव',
    loading: 'लोड भइरहेको छ...',
    noInsights: 'अहिले कुनै अन्तर्दृष्टि उपलब्ध छैन',
    viewDetails: 'विवरण हेर्नुहोस्',
    userInfo: 'आपको जानकारी',
    age: 'आयु',
    weeks: 'हप्ता',
    insights: 'अन्तर्दृष्टिहरू',
    category: 'वर्ग',
    urgency: 'तातो',
    summary: 'सारांश',
    recommendations: 'सिफारिशहरू',
    trends: 'प्रवृत्तिहरू',
    healthy: '✅ स्वस्थ',
    warning: '⚠️ सावधानी',
    critical: '🚨 गम्भीर',
    noRecords: 'अहिले कुनै स्वास्थ्य रेकर्ड छैन',
    addRecords: 'स्वास्थ्य रेकर्ड थप्नुहोस्'
  } : {
    title: 'Health Insights',
    back: 'Back',
    personalized: 'Personalized Health Guidance',
    loading: 'Loading...',
    noInsights: 'No insights available yet',
    viewDetails: 'View Details',
    userInfo: 'Your Information',
    age: 'Age',
    weeks: 'Weeks Pregnant',
    insights: 'Insights',
    category: 'Category',
    urgency: 'Urgency',
    summary: 'Summary',
    recommendations: 'Recommendations',
    trends: 'Trends',
    healthy: '✅ Healthy',
    warning: '⚠️ Warning',
    critical: '🚨 Critical',
    noRecords: 'No health records yet',
    addRecords: 'Add Health Records'
  };

  // Fetch health records from localStorage
  useEffect(() => {
    const storedRecords = localStorage.getItem(`health_records_${user?.name}`);
    if (storedRecords) {
      try {
        setHealthRecords(JSON.parse(storedRecords));
      } catch (e) {
        setHealthRecords([]);
      }
    }
  }, [user?.name]);

  // Fetch personalized insights from backend
  useEffect(() => {
    const fetchInsights = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API}/personalized-insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id || user.name,
            health_records: healthRecords,
            user_age: user.age || 25,
            weeks_pregnant: user.weeks_pregnant || 20,
            language: language,
            limit: 3
          })
        });

        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights || []);
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Could not load insights. Try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [user, healthRecords, language]);

  const getUrgencyColor = (urgency) => {
    if (urgency === 'critical') return 'bg-red-50 border-red-500 text-red-900';
    if (urgency === 'warning') return 'bg-yellow-50 border-yellow-500 text-yellow-900';
    return 'bg-green-50 border-green-500 text-green-900';
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === 'critical') return '🚨 Critical';
    if (urgency === 'warning') return '⚠️ Warning';
    return '✅ Healthy';
  };

  const t = text;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            {t.back}
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
          <div style={{ width: '40px' }}></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full p-6 flex-1">
        {/* User Info Card */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg p-6 mb-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">{t.userInfo}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-80">{t.age}</p>
              <p className="text-2xl font-bold">{user?.age || '—'}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">{t.weeks}</p>
              <p className="text-2xl font-bold">{user?.weeks_pregnant || '—'}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Records</p>
              <p className="text-2xl font-bold">{healthRecords.length}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">{t.insights}</p>
              <p className="text-2xl font-bold">{insights.length}</p>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.personalized}</h2>

          {isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">{t.loading}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!isLoading && insights.length === 0 && !error && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
              <p className="text-blue-800 font-medium">{t.noInsights}</p>
              <p className="text-blue-600 text-sm mt-2">Start logging health records to get personalized insights</p>
            </div>
          )}

          {!isLoading && insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${getUrgencyColor(insight.urgency)}`}
                  onClick={() => setSelectedInsight(selectedInsight === idx ? null : idx)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold flex-1">{insight.title}</h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-white bg-opacity-70 rounded">
                      {getUrgencyBadge(insight.urgency)}
                    </span>
                  </div>

                  {/* Category */}
                  <p className="text-sm opacity-75 mb-3">{t.category}: {insight.category || 'Health'}</p>

                  {/* Content Preview */}
                  <p className="text-sm leading-relaxed mb-3">
                    {insight.content?.substring(0, 100)}...
                  </p>

                  {/* Expand indicator */}
                  {selectedInsight === idx && (
                    <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                      <p className="text-sm leading-relaxed mb-3">{insight.content}</p>
                      
                      {insight.recommendation && (
                        <div className="bg-white bg-opacity-50 rounded p-3 mt-3">
                          <p className="font-semibold text-sm mb-1">{t.recommendations}:</p>
                          <p className="text-sm">{insight.recommendation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Records Summary */}
        {healthRecords.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Health Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-blue-600 font-medium">Latest Weight</p>
                <p className="text-2xl font-bold text-blue-900">
                  {healthRecords.length > 0 ? `${healthRecords[healthRecords.length - 1].weight} kg` : '—'}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p className="text-sm text-red-600 font-medium">Latest BP</p>
                <p className="text-2xl font-bold text-red-900">
                  {healthRecords.length > 0 
                    ? `${healthRecords[healthRecords.length - 1].systolic}/${healthRecords[healthRecords.length - 1].diastolic}` 
                    : '—'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-purple-600 font-medium">Total Records</p>
                <p className="text-2xl font-bold text-purple-900">{healthRecords.length}</p>
              </div>
            </div>
          </div>
        )}

        {healthRecords.length === 0 && !isLoading && (
          <div className="mt-8 bg-amber-50 border-2 border-amber-300 rounded-lg p-6 text-center">
            <p className="text-amber-900 font-medium">{t.noRecords}</p>
            <button
              onClick={() => navigate('/health')}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
            >
              {t.addRecords}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
