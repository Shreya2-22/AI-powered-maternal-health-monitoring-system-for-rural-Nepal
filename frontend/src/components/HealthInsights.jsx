import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function HealthInsights({ user, language }) {
  const navigate = useNavigate();
  const [healthRecords, setHealthRecords] = useState([]);
  const [generatedInsights, setGeneratedInsights] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const text = language === 'ne' ? {
    title: 'मेरो स्वास्थ्य अवलोकन',
    subtitle: 'व्यक्तिगत अन्तर्दृष्टि र सिफारिशहरू',
    back: 'फिर्ता',
    loading: 'लोड भइरहेको छ...',
    noRecords: 'कोनै स्वास्थ्य रेकर्ड छैन।',
    addRecords: 'स्वास्थ्य रेकर्ड थप्नुहोस्',
    insights: 'अन्तर्दृष्टिहरू',
    pregnancy: 'गर्भावस्था',
    health: 'स्वास्थ्य',
    week: 'हप्ता',
    age: 'वर्ष',
    recommendation: 'सिफारिश'
  } : {
    title: 'My Health Overview',
    subtitle: 'Personalized insights and recommendations',
    back: 'Back',
    loading: 'Loading...',
    noRecords: 'No health records available.',
    addRecords: 'Add Health Records',
    insights: 'Insights',
    pregnancy: 'Pregnancy',
    health: 'Health',
    week: 'weeks',
    age: 'years',
    recommendation: 'Recommendation'
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
    generatePersonalizedInsights();
  }, [user, healthRecords, language]);

  const generatePersonalizedInsights = () => {
    const insights = [];
    const weeks = user?.weeks_pregnant || 20;
    const age = user?.age || 25;

    // Trimester-based insights
    if (weeks <= 12) {
      insights.push({
        title: language === 'ne' ? 'पहिलो त्रैमासिक' : 'First Trimester Care',
        category: language === 'ne' ? 'गर्भावस्था' : 'Pregnancy',
        urgency: 'healthy',
        description: language === 'ne' 
          ? 'तपाई पहिलो त्रैमासिकमा हुनुहुन्छ। यो समय अत्यन्त महत्वपूर्ण छ।'
          : 'You are in your first trimester. This is a critical time for development.',
        recommendation: language === 'ne'
          ? 'विटामिन B6, जिङ्क र फोलिक एसिड युक्त खाना खानुहोस्। पर्याप्त आराम लिनुहोस्।'
          : 'Consume folic acid, prenatal vitamins, and adequate fluids. Get plenty of rest.'
      });
    } else if (weeks <= 24) {
      insights.push({
        title: language === 'ne' ? 'दोस्रो त्रैमासिक' : 'Second Trimester',
        category: language === 'ne' ? 'गर्भावस्था' : 'Pregnancy',
        urgency: 'healthy',
        description: language === 'ne'
          ? 'तपाई दोस्रो त्रैमासिकमा हुनुहुन्छ। यो सबैभन्दा आरामदायक समय हो।'
          : 'You are in your second trimester. This is often the most comfortable period.',
        recommendation: language === 'ne'
          ? 'नियमित व्यायाम गर्नुहोस्। दैनिक हिड्ने, योग वा तैरानी गर्न सक्नुहुन्छ।'
          : 'Start gentle exercise like walking or prenatal yoga. Stay hydrated.'
      });
    } else {
      insights.push({
        title: language === 'ne' ? 'तेस्रो त्रैमासिक' : 'Third Trimester',
        category: language === 'ne' ? 'गर्भावस्था' : 'Pregnancy',
        urgency: 'warning',
        description: language === 'ne'
          ? 'तपाई तेस्रो त्रैमासिकमा हुनुहुन्छ। प्रसव नजदिकै छ।'
          : 'You are in your third trimester. Delivery is approaching soon.',
        recommendation: language === 'ne'
          ? 'प्रसव तयारीको कक्षा लिनुहोस्। डाक्टरसँग नियमित चेकअप गर्नुहोस्।'
          : 'Take delivery preparation classes. Have regular checkups with your doctor.'
      });
    }

    // Age-based insights
    if (age < 20) {
      insights.push({
        title: language === 'ne' ? 'किशोर गर्भावस्था' : 'Teen Pregnancy Care',
        category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
        urgency: 'warning',
        description: language === 'ne'
          ? 'किशोर गर्भावस्था विशेष ध्यान आवश्यक छ।'
          : 'Teen pregnancy requires special attention and care.',
        recommendation: language === 'ne'
          ? 'परिवार र स्वास्थ्य कर्मचारीको साथ काम गर्नुहोस्। उचित पोषण लिनुहोस्।'
          : 'Work closely with healthcare providers. Ensure proper nutrition and support.'
      });
    } else if (age > 35) {
      insights.push({
        title: language === 'ne' ? 'उन्नत मातृत्व आयु' : 'Advanced Maternal Age',
        category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
        urgency: 'warning',
        description: language === 'ne'
          ? 'आपको उमेर ३५ वर्षभन्दा बढी छ। अतिरिक्त निगरानी आवश्यक छ।'
          : 'You are over 35. Additional monitoring is important.',
        recommendation: language === 'ne'
          ? 'नियमित स्क्रीनिङ टेस्ट गर्नुहोस्। तनाव कम गर्नुहोस्।'
          : 'Get regular screening tests. Manage stress and get adequate sleep.'
      });
    } else {
      insights.push({
        title: language === 'ne' ? 'स्वस्थ गर्भावस्था' : 'Healthy Pregnancy',
        category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
        urgency: 'healthy',
        description: language === 'ne'
          ? 'आपको उमेर गर्भावस्थाको लागि उत्तम है।'
          : 'Your age is optimal for pregnancy.',
        recommendation: language === 'ne'
          ? 'स्वास्थ्यकर जीवनशैली बनाए राख्नुहोस्। दैनिक व्यायाम गर्नुहोस्।'
          : 'Maintain a healthy lifestyle. Exercise regularly and eat nutritious food.'
      });
    }

    // Records-based insights
    if (healthRecords.length > 0) {
      const lastRecord = healthRecords[healthRecords.length - 1];
      const systolic = parseInt(lastRecord.systolic) || lastRecord.systolic_bp || 0;
      const diastolic = parseInt(lastRecord.diastolic) || lastRecord.diastolic_bp || 0;
      const weight = parseFloat(lastRecord.weight) || 0;

      if (systolic > 140 || diastolic > 90) {
        insights.push({
          title: language === 'ne' ? 'उच्च रक्तचाप' : 'High Blood Pressure',
          category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
          urgency: 'critical',
          description: language === 'ne'
            ? `आपको रक्तचाप ${systolic}/${diastolic} है - यह उच्च है।`
            : `Your blood pressure is ${systolic}/${diastolic} - this is elevated.`,
          recommendation: language === 'ne'
            ? 'तुरन्त डाक्टरसँग सम्पर्क गर्नुहोस्। नमक कम गर्नुहोस्। तनाव कम गर्नुहोस्।'
            : 'Contact your doctor immediately. Reduce salt intake. Manage stress.'
        });
      }

      if (weight < 45) {
        insights.push({
          title: language === 'ne' ? 'कम वजन' : 'Low Weight',
          category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
          urgency: 'warning',
          description: language === 'ne'
            ? 'आपको वजन अलिकति कम छ।'
            : 'Your weight is on the lower side.',
          recommendation: language === 'ne'
            ? 'पौष्टिक खाना बढाउनुहोस्। दाल, दूध, अण्डा खानुहोस्।'
            : 'Increase nutritious food intake. Include proteins and whole grains.'
        });
      } else if (weight > 100) {
        insights.push({
          title: language === 'ne' ? 'अधिक वजन' : 'Higher Weight',
          category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
          urgency: 'warning',
          description: language === 'ne'
            ? 'आपको वजन गर्भावस्थामा अधिक छ।'
            : 'Your weight is on the higher side for pregnancy.',
          recommendation: language === 'ne'
            ? 'व्यायाम बढाउनुहोस्। हल्का खाना खानुहोस्।'
            : 'Increase physical activity. Focus on light, healthy meals.'
        });
      }
    }

    setGeneratedInsights(insights);
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === 'critical') return 'from-red-500 to-red-600';
    if (urgency === 'warning') return 'from-amber-500 to-amber-600';
    return 'from-green-500 to-green-600';
  };

  const getUrgencyBg = (urgency) => {
    if (urgency === 'critical') return 'bg-red-50 border-red-200';
    if (urgency === 'warning') return 'bg-amber-50 border-amber-200';
    return 'bg-green-50 border-green-200';
  };

  const getUrgencyText = (urgency) => {
    if (urgency === 'critical') return 'text-red-900';
    if (urgency === 'warning') return 'text-amber-900';
    return 'text-green-900';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            ← {text.back}
          </button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{text.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{text.subtitle}</p>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 hover:shadow-lg transition">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">Age</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{user?.age || '—'}</p>
            <p className="text-xs text-blue-700 mt-1">{text.age}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6 hover:shadow-lg transition">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">Progress</p>
            <p className="text-4xl font-bold text-purple-900 mt-2">{user?.weeks_pregnant || '—'}</p>
            <p className="text-xs text-purple-700 mt-1">{text.week}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 hover:shadow-lg transition">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">Records</p>
            <p className="text-4xl font-bold text-green-900 mt-2">{healthRecords.length}</p>
            <p className="text-xs text-green-700 mt-1">tracked</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-300 rounded-xl p-6 hover:shadow-lg transition">
            <p className="text-slate-600 text-xs font-bold uppercase tracking-wide">Insights</p>
            <p className="text-4xl font-bold text-pink-900 mt-2">{generatedInsights.length}</p>
            <p className="text-xs text-pink-700 mt-1">{text.insights}</p>
          </div>
        </div>

        {/* Latest Metrics */}
        {healthRecords.length > 0 && (
          <div className="mb-10 bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Latest Health Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 border-2 border-blue-300">
                <p className="text-slate-700 font-bold text-sm">Weight</p>
                <p className="text-3xl font-bold text-blue-900 mt-3">{healthRecords[healthRecords.length - 1].weight}</p>
                <p className="text-xs text-blue-700 mt-2">kg • Latest</p>
              </div>
              
              <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-6 border-2 border-red-300">
                <p className="text-slate-700 font-bold text-sm">Blood Pressure</p>
                <p className="text-3xl font-bold text-red-900 mt-3">{healthRecords[healthRecords.length - 1].systolic}/{healthRecords[healthRecords.length - 1].diastolic}</p>
                <p className="text-xs text-red-700 mt-2">mmHg • Last reading</p>
              </div>
              
              <button
                onClick={() => navigate('/health')}
                className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl p-6 hover:from-slate-700 hover:to-slate-600 transition text-center font-bold"
              >
                View All Records
              </button>
            </div>
          </div>
        )}

        {/* Personalized Insights */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Personalized Insights</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600">{text.loading}</p>
              </div>
            </div>
          ) : generatedInsights.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-slate-600 font-medium">{text.noRecords}</p>
              <button
                onClick={() => navigate('/health')}
                className="mt-4 px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition"
              >
                {text.addRecords}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedInsights.map((insight, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedInsight(selectedInsight === idx ? null : idx)}
                  className={`rounded-xl border-2 ${getUrgencyBg(insight.urgency)} cursor-pointer transition transform hover:scale-105 p-6`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex-1`}>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getUrgencyColor(insight.urgency)} mb-3`}>
                        {insight.category}
                      </div>
                      <h3 className={`text-lg font-bold ${getUrgencyText(insight.urgency)}`}>{insight.title}</h3>
                    </div>
                    <span className="text-2xl transition-transform" style={{ transform: selectedInsight === idx ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${getUrgencyText(insight.urgency)}`}>
                    {insight.description}
                  </p>

                  {selectedInsight === idx && (
                    <div className="mt-4 pt-4 border-t-2 border-current border-opacity-30">
                      <p className="text-xs font-bold text-slate-900 mb-2">💡 {text.recommendation}</p>
                      <p className="text-sm text-slate-800 leading-relaxed">{insight.recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {healthRecords.length === 0 && (
          <div className="mt-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-10 text-center text-white shadow-xl border-2 border-indigo-400">
            <h3 className="text-2xl font-bold mb-3">Start Tracking Your Health</h3>
            <p className="mb-6 text-indigo-100 max-w-2xl mx-auto">
              Add your health records to get personalized insights and recommendations tailored to your pregnancy journey.
            </p>
            <button
              onClick={() => navigate('/health')}
              className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition transform hover:scale-105"
            >
              Begin Health Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
