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
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryIcons = {
    'Nutrition': '🥗',
    'Symptoms': '🩺',
    'Trimester': '📅',
    'Exercise': '💪',
    'Labor': '🏥',
    'Breastfeeding': '👶',
    'Postpartum': '❤️',
    'Lifestyle': '🌟'
  };

  const text = language === 'ne' ? {
    title: 'स्वास्थ्य अन्तर्दृष्टि',
    subtitle: 'व्यक्तिगत स्वास्थ्य सुझाव',
    back: 'फिर्ता',
    personalized: 'तपाईंको व्यक्तिगत स्वास्थ्य मार्गदर्शन',
    loading: 'लोड भइरहेको छ...',
    noInsights: 'अहिले कुनै अन्तर्दृष्टि उपलब्ध छैन',
    viewDetails: 'विवरण हेर्नुहोस्',
    userInfo: 'तपाईंको जानकारी',
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
    addRecords: 'स्वास्थ्य रेकर्ड थप्नुहोस्',
    recentTrends: 'हालको प्रवृत्तिहरू',
    latestWeight: 'नतिजा वजन',
    latestBP: 'नतिजा रक्तचाप',
    totalRecords: 'कुल रेकर्डहरू'
  } : {
    title: 'Health Insights',
    subtitle: 'Personalized Health Guidance',
    back: 'Back',
    personalized: 'Your Personalized Health Guidance',
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
    addRecords: 'Add Health Records',
    recentTrends: 'Recent Health Trends',
    latestWeight: 'Latest Weight',
    latestBP: 'Latest BP',
    totalRecords: 'Total Records'
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
    if (urgency === 'critical') 
      return 'from-red-50 to-red-100 border-l-4 border-red-500 shadow-red-100';
    if (urgency === 'warning') 
      return 'from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 shadow-yellow-100';
    return 'from-green-50 to-green-100 border-l-4 border-green-500 shadow-green-100';
  };

  const getUrgencyBadge = (urgency) => {
    if (urgency === 'critical') return { text: '🚨 Critical', bg: 'bg-red-200', text_color: 'text-red-800' };
    if (urgency === 'warning') return { text: '⚠️ Warning', bg: 'bg-yellow-200', text_color: 'text-yellow-800' };
    return { text: '✅ Healthy', bg: 'bg-green-200', text_color: 'text-green-800' };
  };

  const getCategoryIcon = (category) => {
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (category && category.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return '💡';
  };

  const t = text;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-teal-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition"
          >
            ← {t.back}
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
            <p className="text-xs text-slate-500">{t.subtitle}</p>
          </div>
          <div style={{ width: '80px' }}></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        {/* User Info Card - Enhanced */}
        <div className="bg-linear-to-r from-teal-500 via-teal-600 to-blue-600 text-white rounded-2xl p-8 mb-10 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">👩‍⚕️ {t.userInfo}</h2>
            <div className="text-5xl opacity-20">🤰</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition">
              <p className="text-sm opacity-90 font-medium">{t.age}</p>
              <p className="text-3xl font-bold mt-2">{user?.age || '—'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition">
              <p className="text-sm opacity-90 font-medium">{t.weeks}</p>
              <p className="text-3xl font-bold mt-2">{user?.weeks_pregnant || '—'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition">
              <p className="text-sm opacity-90 font-medium">📊 {t.trends}</p>
              <p className="text-3xl font-bold mt-2">{healthRecords.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition">
              <p className="text-sm opacity-90 font-medium">💡 {t.insights}</p>
              <p className="text-3xl font-bold mt-2">{insights.length}</p>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{t.personalized}</h2>
          <p className="text-slate-600 mb-6">AI-powered recommendations based on your health data</p>

          {isLoading && (
            <div className="text-center py-16">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">{t.loading}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-linear-to-r from-red-50 to-red-100 border border-red-300 rounded-xl p-6 mb-6 shadow-sm">
              <p className="text-red-800 font-semibold">⚠️ {error}</p>
            </div>
          )}

          {!isLoading && insights.length === 0 && !error && (
            <div className="bg-linear-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-12 text-center shadow-sm hover:shadow-md transition">
              <p className="text-blue-900 font-bold text-lg mb-2">💭 {t.noInsights}</p>
              <p className="text-blue-700 text-sm">Start logging health records to get personalized insights</p>
            </div>
          )}

          {!isLoading && insights.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight, idx) => {
                const urgency = getUrgencyBadge(insight.urgency);
                const isExpanded = expandedInsight === idx;
                
                return (
                  <div
                    key={idx}
                    className={`bg-linear-to-br ${getUrgencyColor(insight.urgency)} rounded-2xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                    onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-3xl">{getCategoryIcon(insight.category)}</span>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${urgency.bg} ${urgency.text_color}`}>
                            {urgency.text}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{insight.title}</h3>
                      </div>
                      <div className="text-2xl transition-transform duration-300" style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>
                        ▼
                      </div>
                    </div>

                    {/* Category Badge */}
                    <p className="text-sm font-semibold text-slate-700 mb-3 opacity-80">
                      {t.category}: <span className="text-slate-600">{insight.category || 'Health'}</span>
                    </p>

                    {/* Content Preview */}
                    <p className="text-sm leading-relaxed text-slate-800 line-clamp-2 mb-3">
                      {insight.content}
                    </p>

                    {/* Expanded Content */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="pt-4 border-t-2 border-current border-opacity-10">
                        {/* Full Content */}
                        <p className="text-sm leading-relaxed text-slate-800 mb-4">
                          {insight.content}
                        </p>
                        
                        {/* Recommendations */}
                        {insight.recommendation && (
                          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-current border-opacity-10">
                            <p className="font-bold text-sm mb-2 text-slate-900">✨ {t.recommendations}:</p>
                            <p className="text-sm leading-relaxed text-slate-800">
                              {insight.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Click to expand indicator */}
                    {!isExpanded && (
                      <p className="text-xs text-slate-600 mt-3 opacity-60 hover:opacity-100 transition">
                        👆 Click to learn more
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Health Records Summary */}
        {healthRecords.length > 0 && (
          <div className="mt-12 bg-linear-to-r from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              📊 {t.recentTrends}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition">
                <p className="text-sm font-semibold text-blue-700 mb-2">⚖️ {t.latestWeight}</p>
                <p className="text-3xl font-bold text-blue-900">
                  {healthRecords.length > 0 ? `${healthRecords[healthRecords.length - 1].weight}` : '—'} <span className="text-lg">kg</span>
                </p>
                <div className="text-xs text-blue-600 mt-2">Latest recorded</div>
              </div>
              <div className="bg-linear-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 hover:shadow-lg transition">
                <p className="text-sm font-semibold text-red-700 mb-2">💓 {t.latestBP}</p>
                <p className="text-3xl font-bold text-red-900">
                  {healthRecords.length > 0 
                    ? `${healthRecords[healthRecords.length - 1].systolic}/${healthRecords[healthRecords.length - 1].diastolic}` 
                    : '—'} <span className="text-lg">mmHg</span>
                </p>
                <div className="text-xs text-red-600 mt-2">Latest reading</div>
              </div>
              <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition">
                <p className="text-sm font-semibold text-purple-700 mb-2">📈 {t.totalRecords}</p>
                <p className="text-3xl font-bold text-purple-900">{healthRecords.length}</p>
                <div className="text-xs text-purple-600 mt-2">Health check-ins</div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {healthRecords.length === 0 && !isLoading && (
          <div className="mt-12 bg-linear-to-r from-amber-50 to-orange-100 border-2 border-amber-300 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-amber-900 font-bold text-lg mb-2">{t.noRecords}</p>
            <p className="text-amber-800 mb-6">Start tracking your health to unlock personalized insights!</p>
            <button
              onClick={() => navigate('/health')}
              className="px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              ➕ {t.addRecords}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
