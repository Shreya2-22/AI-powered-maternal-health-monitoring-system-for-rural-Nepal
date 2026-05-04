import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function HealthInsights({ user, language }) {
  const navigate = useNavigate();
  const [healthRecords, setHealthRecords] = useState([]);
  const [generatedInsights, setGeneratedInsights] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);

  const text = language === 'ne' ? {
    title: 'मेरो गर्भावस्था डैशबोर्ड',
    subtitle: 'व्यक्तिगत सलाह र जानकारी',
    back: 'फिर्ता',
    startTracking: 'स्वास्थ्य ट्र्याकिङ शुरु गर्नुहोस्',
    addRecords: 'रेकर्ड थप्नुहोस्',
    noRecords: 'कोनै रेकर्ड छैन।'
  } : {
    title: 'My Pregnancy Dashboard',
    subtitle: 'Personalized advice and information',
    back: 'Back',
    startTracking: 'Start Tracking',
    addRecords: 'Add Records',
    noRecords: 'No records yet.'
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
    generateComprehensiveInsights();
  }, [user, healthRecords, language]);

  const generateComprehensiveInsights = () => {
    const insights = [];
    const weeks = user?.weeks_pregnant || 20;
    const age = user?.age || 25;

    // Trimester insights
    if (weeks <= 13) {
      insights.push({
        icon: '🌱',
        title: language === 'ne' ? 'पहिलो त्रैमासिक' : 'First Trimester',
        category: language === 'ne' ? 'गर्भावस्था' : 'Pregnancy',
        urgency: 'healthy',
        description: language === 'ne' ? 'विकास का महत्वपूर्ण सप्ताह' : 'Critical weeks of development',
        tip: language === 'ne' ? 'विटामिन B6 लिनुहोस्, आराम गर्नुहोस्' : 'Take Vitamin B6, get rest'
      });
    } else if (weeks <= 26) {
      insights.push({
        icon: '🌸',
        title: language === 'ne' ? 'दोस्रो त्रैमासिक' : 'Second Trimester',
        category: language === 'ne' ? 'गर्भावस्था' : 'Pregnancy',
        urgency: 'healthy',
        description: language === 'ne' ? 'सबैभन्दा आरामदायक समय' : 'Most comfortable period',
        tip: language === 'ne' ? 'व्यायाम शुरु गर्नुहोस्, हल्का योग गर्नुहोस्' : 'Start exercise, do light yoga'
      });
    } else {
      insights.push({
        icon: '🍂',
        title: language === 'ne' ? 'तेस्रो त्रैमासिक' : 'Third Trimester',
        category: language === 'ne' ? 'गर्भावस्था' : 'Pregnancy',
        urgency: 'warning',
        description: language === 'ne' ? 'प्रसव नजदिकै छ' : 'Delivery approaching',
        tip: language === 'ne' ? 'प्रसव कक्षा लिनुहोस्' : 'Take delivery classes'
      });
    }

    // Nutrition insights
    insights.push({
      icon: '🥗',
      title: language === 'ne' ? 'पोषण' : 'Nutrition',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'healthy',
      description: language === 'ne' ? 'दैनिक पोषण आवश्यकता' : 'Daily nutritional needs',
      tip: language === 'ne' ? 'दाल, दूध, फल, सब्जी खानुहोस्' : 'Eat lentils, milk, fruits, vegetables'
    });

    // Hydration
    insights.push({
      icon: '💧',
      title: language === 'ne' ? 'पानी पिउनुहोस्' : 'Stay Hydrated',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'healthy',
      description: language === 'ne' ? 'पानी आवश्यक छ' : 'Water is essential',
      tip: language === 'ne' ? 'दैनिक 8-10 गिलास पानी पिनुहोस्' : 'Drink 8-10 glasses daily'
    });

    // Exercise insights
    insights.push({
      icon: '🚶',
      title: language === 'ne' ? 'व्यायाम' : 'Exercise',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'healthy',
      description: language === 'ne' ? 'नियमित गतिविधि' : 'Regular activity',
      tip: language === 'ne' ? 'दैनिक 30 मिनेट हिड्ने वा योग गर्नुहोस्' : 'Walk 30 min or do yoga daily'
    });

    // Sleep
    insights.push({
      icon: '😴',
      title: language === 'ne' ? 'नींद' : 'Sleep',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'healthy',
      description: language === 'ne' ? 'पर्याप्त आराम' : 'Get enough rest',
      tip: language === 'ne' ? '8-9 घण्टा नींद लिनुहोस्' : 'Get 8-9 hours of sleep'
    });

    // Mental Health
    insights.push({
      icon: '🧘',
      title: language === 'ne' ? 'मानसिक स्वास्थ्य' : 'Mental Health',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'healthy',
      description: language === 'ne' ? 'तनाव व्यवस्थापन' : 'Stress management',
      tip: language === 'ne' ? 'ध्यान, संगीत, पढ्न, बरफ़ गर्नुहोस्' : 'Meditate, listen to music, relax'
    });

    // Partner Support
    insights.push({
      icon: '💑',
      title: language === 'ne' ? 'पति/सहयोगी' : 'Partner Support',
      category: language === 'ne' ? 'समर्थन' : 'Support',
      urgency: 'healthy',
      description: language === 'ne' ? 'परिवारको समर्थन महत्वपूर्ण' : 'Family support matters',
      tip: language === 'ne' ? 'आफ्नो साथी संग सवाल-जवाब गर्नुहोस्' : 'Communicate with your partner'
    });

    // Doctor Visits
    insights.push({
      icon: '👨‍⚕️',
      title: language === 'ne' ? 'नियमित जाँच' : 'Regular Checkups',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'warning',
      description: language === 'ne' ? 'डाक्टरसँग नियमित भेट' : 'Regular doctor visits',
      tip: language === 'ne' ? 'महिनामा कम-कम एक पल डाक्टरसँग भेट गर्नुहोस्' : 'See doctor at least monthly'
    });

    // Folic Acid
    insights.push({
      icon: '💊',
      title: language === 'ne' ? 'फोलिक एसिड' : 'Folic Acid',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'warning',
      description: language === 'ne' ? 'महत्वपूर्ण भिटामिन' : 'Essential vitamin',
      tip: language === 'ne' ? 'डाक्टरको सलाह अनुसार फोलिक एसिड लिनुहोस्' : 'Take folic acid as advised'
    });

    // Iron & Calcium
    insights.push({
      icon: '🦴',
      title: language === 'ne' ? 'लोह र क्यालसियम' : 'Iron & Calcium',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'warning',
      description: language === 'ne' ? 'हड्डी र रक्त स्वास्थ्य' : 'Bone and blood health',
      tip: language === 'ne' ? 'दूध, दही, मछली खानुहोस्' : 'Eat milk, yogurt, fish'
    });

    // Sexual Health
    insights.push({
      icon: '💕',
      title: language === 'ne' ? 'यौन स्वास्थ्य' : 'Sexual Health',
      category: language === 'ne' ? 'स्वास्थ्य' : 'Health',
      urgency: 'healthy',
      description: language === 'ne' ? 'सुरक्षित सम्बन्ध' : 'Safe intimacy',
      tip: language === 'ne' ? 'डाक्टरसँग परामर्श गर्नुहोस्' : 'Ask doctor for guidance'
    });

    // Labor Signs
    if (weeks > 36) {
      insights.push({
        icon: '🚨',
        title: language === 'ne' ? 'प्रसवको संकेत' : 'Labor Signs',
        category: language === 'ne' ? 'महत्वपूर्ण' : 'Important',
        urgency: 'critical',
        description: language === 'ne' ? 'जन्मको तयारी' : 'Birth is near',
        tip: language === 'ne' ? 'पीठा, गर्भाशय संकुचन, पानी टपकाउन, अस्पताल जानुहोस्' : 'If contractions, go to hospital'
      });
    }

    // Breastfeeding
    insights.push({
      icon: '👶',
      title: language === 'ne' ? 'स्तनपान' : 'Breastfeeding',
      category: language === 'ne' ? 'तयारी' : 'Preparation',
      urgency: 'healthy',
      description: language === 'ne' ? 'प्रारम्भिक तयारी' : 'Start preparation early',
      tip: language === 'ne' ? 'स्तनपान कक्षा लिनुहोस्' : 'Take breastfeeding classes'
    });

    // Age-based
    if (age < 20) {
      insights.push({
        icon: '⚠️',
        title: language === 'ne' ? 'किशोर गर्भावस्था' : 'Teen Pregnancy',
        category: language === 'ne' ? 'विशेष' : 'Special',
        urgency: 'warning',
        description: language === 'ne' ? 'अतिरिक्त सावधानी' : 'Extra care needed',
        tip: language === 'ne' ? 'नियमित डाक्टरको जाँच गर्नुहोस्' : 'Regular doctor visits crucial'
      });
    } else if (age > 35) {
      insights.push({
        icon: '⚠️',
        title: language === 'ne' ? 'उन्नत मातृत्व' : 'Advanced Age',
        category: language === 'ne' ? 'विशेष' : 'Special',
        urgency: 'warning',
        description: language === 'ne' ? 'अतिरिक्त स्क्रीनिङ' : 'More screening needed',
        tip: language === 'ne' ? 'विशेष स्क्रीनिङ टेस्ट गर्नुहोस्' : 'Get special screening tests'
      });
    }

    // Health metrics based
    if (healthRecords.length > 0) {
      const last = healthRecords[healthRecords.length - 1];
      const sys = parseInt(last.systolic) || 0;
      const dia = parseInt(last.diastolic) || 0;
      
      if (sys > 140 || dia > 90) {
        insights.push({
          icon: '❤️',
          title: language === 'ne' ? 'उच्च रक्तचाप' : 'High BP',
          category: language === 'ne' ? 'महत्वपूर्ण' : 'Important',
          urgency: 'critical',
          description: language === 'ne' ? 'तुरन्त ध्यान' : 'Immediate attention',
          tip: language === 'ne' ? 'डाक्टरसँग सम्पर्क गर्नुहोस्' : 'Contact doctor immediately'
        });
      }
    }

    setGeneratedInsights(insights);
  };

  const getBackgroundColor = (urgency) => {
    if (urgency === 'critical') return 'from-red-100 to-red-50';
    if (urgency === 'warning') return 'from-amber-100 to-amber-50';
    return 'from-green-100 to-green-50';
  };

  const getBorderColor = (urgency) => {
    if (urgency === 'critical') return 'border-red-400';
    if (urgency === 'warning') return 'border-amber-400';
    return 'border-green-400';
  };

  const getTitleColor = (urgency) => {
    if (urgency === 'critical') return 'text-red-900';
    if (urgency === 'warning') return 'text-amber-900';
    return 'text-green-900';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition mb-3"
          >
            ← {text.back}
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{text.title}</h1>
            <p className="text-sm text-slate-600 mt-2">{text.subtitle}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* User Info Bar */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-purple-700 font-bold">Age</p>
              <p className="text-2xl font-bold text-purple-900">{user?.age || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-purple-700 font-bold">Weeks</p>
              <p className="text-2xl font-bold text-purple-900">{user?.weeks_pregnant || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-purple-700 font-bold">Records</p>
              <p className="text-2xl font-bold text-purple-900">{healthRecords.length}</p>
            </div>
            <div>
              <p className="text-sm text-purple-700 font-bold">Insights</p>
              <p className="text-2xl font-bold text-purple-900">{generatedInsights.length}</p>
            </div>
          </div>
        </div>

        {/* Insights Grid */}
        {generatedInsights.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-slate-200">
            <p className="text-slate-600 mb-6 text-lg">{text.noRecords}</p>
            <button
              onClick={() => navigate('/health')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-blue-500 transition"
            >
              {text.addRecords}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {generatedInsights.map((insight, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedInsight(selectedInsight === idx ? null : idx)}
                className={`bg-gradient-to-br ${getBackgroundColor(insight.urgency)} border-2 ${getBorderColor(insight.urgency)} rounded-xl p-6 cursor-pointer transition transform hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{insight.icon}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    insight.urgency === 'critical' 
                      ? 'bg-red-200 text-red-800'
                      : insight.urgency === 'warning'
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {insight.category}
                  </span>
                </div>

                <h3 className={`text-lg font-bold ${getTitleColor(insight.urgency)} mb-2`}>
                  {insight.title}
                </h3>

                <p className={`text-sm ${getTitleColor(insight.urgency).replace('900', '700')} mb-3`}>
                  {insight.description}
                </p>

                {selectedInsight === idx && (
                  <div className="mt-4 pt-4 border-t-2 border-current border-opacity-30 bg-white/60 p-3 rounded-lg">
                    <p className="text-sm font-bold text-slate-900 mb-2">💡 {language === 'ne' ? 'सुझाव' : 'Tip'}:</p>
                    <p className="text-sm text-slate-800">{insight.tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        {healthRecords.length === 0 && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-10 text-center text-white shadow-xl border-2 border-purple-400">
            <h2 className="text-3xl font-bold mb-3">Ready to Start Tracking?</h2>
            <p className="mb-6 text-purple-100 max-w-2xl mx-auto">
              Add your health records now to unlock more personalized insights and recommendations for your pregnancy journey.
            </p>
            <button
              onClick={() => navigate('/health')}
              className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition transform hover:scale-105"
            >
              {text.startTracking}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
