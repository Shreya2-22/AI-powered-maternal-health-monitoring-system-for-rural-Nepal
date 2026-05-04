import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function HealthInsights({ user, language }) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedInsight, setExpandedInsight] = useState(null);

  const text = language === 'ne' ? {
    title: 'मेरो स्वास्थ्य',
    subtitle: 'व्यक्तिगत स्वास्थ्य मूल्यांकन र सिफारिशहरु',
    back: 'फिर्ता',
    overview: 'अवलोकन',
    insights_title: 'आपनो अन्तर्दृष्टिहरु',
    loading: 'लोड भइरहेको छ...',
    noInsights: 'अहिले कुनै अन्तर्दृष्टि उपलब्ध छैन।',
    addRecords: 'स्वास्थ्य रेकर्ड थप्नुहोस्',
    recentMetrics: 'हालको मेट्रिक्स',
    healthy: 'स्वस्थ',
    warning: 'चेतावनी',
    critical: 'गम्भीर',
    latestWeight: 'वजन',
    latestBP: 'रक्तचाप',
    totalRecords: 'कुल रेकर्डहरू',
    recommendations: 'सिफारिशहरू',
    category: 'श्रेणी',
    noRecords: 'कुनै स्वास्थ्य रेकर्ड छैन।',
    startTracking: 'स्वास्थ्य ट्र्याकिङ शुरु गर्नुहोस्'
  } : {
    title: 'My Health',
    subtitle: 'Personalized health assessment and recommendations',
    back: 'Back',
    overview: 'Overview',
    insights_title: 'Your Insights',
    loading: 'Loading...',
    noInsights: 'No insights available yet.',
    addRecords: 'Add Health Records',
    recentMetrics: 'Recent Metrics',
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
    latestWeight: 'Weight',
    latestBP: 'Blood Pressure',
    totalRecords: 'Total Records',
    recommendations: 'Recommendations',
    category: 'Category',
    noRecords: 'No health records available.',
    startTracking: 'Start Health Tracking'
  };

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
            limit: 6
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

  const getUrgencyStyle = (urgency) => {
    if (urgency === 'critical') return { bg: 'from-red-50 to-red-100', border: 'border-red-300', dot: 'bg-red-500', text: 'text-red-900', label: '🔴' };
    if (urgency === 'warning') return { bg: 'from-amber-50 to-amber-100', border: 'border-amber-300', dot: 'bg-amber-500', text: 'text-amber-900', label: '🟡' };
    return { bg: 'from-green-50 to-green-100', border: 'border-green-300', dot: 'bg-green-500', text: 'text-green-900', label: '🟢' };
  };

  const t = text;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            ← {t.back}
          </button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
            <p className="text-slate-600 text-sm font-semibold">Age</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{user?.age || '—'}</p>
            <p className="text-xs text-slate-500 mt-1">years old</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
            <p className="text-slate-600 text-sm font-semibold">Progress</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{user?.weeks_pregnant || '—'}w</p>
            <p className="text-xs text-slate-500 mt-1">weeks pregnant</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-green-200 p-6 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
            <p className="text-slate-600 text-sm font-semibold">Records</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{healthRecords.length}</p>
            <p className="text-xs text-slate-500 mt-1">tracked entries</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-pink-200 p-6 shadow-md hover:shadow-lg transition transform hover:-translate-y-1">
            <p className="text-slate-600 text-sm font-semibold">Insights</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{insights.length}</p>
            <p className="text-xs text-slate-500 mt-1">recommendations</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Metrics Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Latest Metrics</h2>
              {healthRecords.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5 border-2 border-blue-300">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Weight</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{healthRecords[healthRecords.length - 1].weight}</p>
                    <p className="text-xs text-blue-700 mt-1">kg • Most recent</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-5 border-2 border-red-300">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Blood Pressure</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">{healthRecords[healthRecords.length - 1].systolic}/{healthRecords[healthRecords.length - 1].diastolic}</p>
                    <p className="text-xs text-red-700 mt-1">mmHg • Last reading</p>
                  </div>
                  <button
                    onClick={() => navigate('/health')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-lg hover:from-slate-800 hover:to-slate-700 transition mt-2"
                  >
                    View All Records
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-600 mb-4">No health data yet</p>
                  <button
                    onClick={() => navigate('/health')}
                    className="w-full px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition"
                  >
                    Add Records
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Insights Cards */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">{t.insights_title}</h2>
              
              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600">{t.loading}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800 text-sm font-medium">
                  {error}
                </div>
              )}

              {!isLoading && insights.length === 0 && !error && (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <p className="text-slate-600 font-medium">{t.noInsights}</p>
                </div>
              )}

              {!isLoading && insights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, idx) => {
                    const style = getUrgencyStyle(insight.urgency);
                    const isExpanded = expandedInsight === idx;
                    
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border-2 ${style.border} bg-gradient-to-br ${style.bg} cursor-pointer transition-all hover:shadow-lg p-5`}
                        onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{style.label}</span>
                              <h3 className={`font-bold text-sm ${style.text}`}>{insight.title}</h3>
                            </div>
                            <p className="text-xs text-slate-600 mb-3">{insight.category}</p>
                            <p className={`text-sm leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''} ${style.text}`}>
                              {insight.content}
                            </p>
                          </div>
                          <div className={`text-lg transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                        </div>

                        {isExpanded && insight.recommendation && (
                          <div className="mt-4 pt-4 border-t-2 border-current border-opacity-20">
                            <p className="text-xs font-bold text-slate-900 mb-2">What to do:</p>
                            <p className="text-sm text-slate-800 leading-relaxed">{insight.recommendation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        {healthRecords.length === 0 && !isLoading && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl border-2 border-indigo-400 p-10 text-center text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-3">Start Your Health Journey</h3>
            <p className="mb-6 text-indigo-100 max-w-2xl mx-auto">
              Track your weight, blood pressure, and symptoms to unlock personalized insights and recommendations tailored to your pregnancy.
            </p>
            <button
              onClick={() => navigate('/health')}
              className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition transform hover:scale-105"
            >
              Begin Health Tracking Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
