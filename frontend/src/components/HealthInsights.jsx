import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function HealthInsights({ user, language }) {
  const navigate = useNavigate();
  const [healthRecords, setHealthRecords] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [expandedInsight, setExpandedInsight] = useState(null);

  const text = language === 'ne' ? {
    title: 'गर्भावस्था स्वास्थ्य डैशबोर्ड',
    subtitle: 'व्यक्तिगत सलाह र सिफारिसहरू',
    back: 'फिर्ता',
    addRecords: 'स्वास्थ्य रेकर्ड थप्नुहोस्',
    startTracking: 'स्वास्थ्य ट्र्याकिङ शुरु गर्नुहोस्',
    categories: {
      overview: 'सारांश',
      nutrition: 'पोषण',
      exercise: 'व्यायाम',
      mental: 'मानसिक स्वास्थ्य',
      medical: 'चिकित्सा',
      preparation: 'प्रसव तयारी'
    }
  } : {
    title: 'Pregnancy Wellness Dashboard',
    subtitle: 'Personalized health insights and recommendations',
    back: 'Back',
    addRecords: 'Add Health Records',
    startTracking: 'Start Tracking',
    categories: {
      overview: 'Overview',
      nutrition: 'Nutrition',
      exercise: 'Exercise',
      mental: 'Mental Health',
      medical: 'Medical',
      preparation: 'Preparation'
    }
  };

  const insights = {
    overview: language === 'ne' ? [
      { title: 'गर्भावस्था सारांश', tip: 'आपको गर्भावस्था यात्रा अद्भुत छ। नियमित जाँच र सुस्वास्थ्य संचय जारी राख्नुहोस्।', urgency: 'normal' },
      { title: 'कल्याणकारी लक्ष्य', tip: 'प्रति हप्ता पोषण र व्यायाम को सन्तुलन राख्नुहोस्।', urgency: 'normal' },
      { title: 'समर्थन नेटवर्क', tip: 'परिवार र स्वास्थ्य सेवा प्रदाताहरु को साथ संपर्क राख्नुहोस्।', urgency: 'normal' }
    ] : [
      { title: 'Pregnancy Journey', tip: 'Your pregnancy journey is unique. Continue regular check-ups and wellness tracking.', urgency: 'normal' },
      { title: 'Wellness Goals', tip: 'Maintain balance between nutrition and exercise every week.', urgency: 'normal' },
      { title: 'Support Network', tip: 'Stay connected with family and healthcare providers.', urgency: 'normal' }
    ],
    nutrition: language === 'ne' ? [
      { title: 'दैनिक कैलोरी लक्ष्य', tip: 'दोस्रो र तेस्रो त्रैमासिकमा प्रतिदिन २००-३०० अतिरिक्त कैलोरी खान आवश्यक छ।', urgency: 'normal' },
      { title: 'प्रोटिन सेवन', tip: 'प्रतिदिन कम्तीमा ७०-१०० ग्राम प्रोटिन खानुहोस्। दही, दाल, अण्डा र गोश्त राम्रो स्रोत हो।', urgency: 'normal' },
      { title: 'आयरन समृद्ध खाना', tip: 'पालक, लिभर, पालक र दाल खान रक्तस्राव रोकन मदत गर्छ।', urgency: 'warning' },
      { title: 'क्यालसियम र दूध', tip: 'प्रतिदिन २ कप दूध वा कम्तीमा १०००-१२०० मिलिग्राम क्यालसियम आवश्यक छ।', urgency: 'warning' },
      { title: 'फल र सब्जी', tip: 'विभिन्न रंगको फल र सब्जी खानुहोस्। प्रतिदिन ५ सर्भिङ लक्ष्य गर्नुहोस्।', urgency: 'normal' }
    ] : [
      { title: 'Daily Calorie Intake', tip: 'In 2nd and 3rd trimester, you need 200-300 extra calories per day. Focus on nutrient-dense foods.', urgency: 'normal' },
      { title: 'Protein Requirements', tip: 'Consume 70-100g of protein daily. Good sources: yogurt, lentils, eggs, fish, and meat.', urgency: 'normal' },
      { title: 'Iron & Anemia Prevention', tip: 'Include iron-rich foods like spinach, liver, lentils, and fortified cereals to prevent anemia.', urgency: 'warning' },
      { title: 'Calcium & Bone Health', tip: 'You need 1000-1200mg of calcium daily. Dairy, leafy greens, and fortified foods are excellent sources.', urgency: 'warning' },
      { title: 'Fruits & Vegetables', tip: 'Eat 5+ servings of colorful fruits and vegetables daily for vitamins and minerals.', urgency: 'normal' }
    ],
    exercise: language === 'ne' ? [
      { title: 'दैनिक सक्रियता', tip: 'प्रतिदिन कम्तीमा २०-३० मिनिट हल्का व्यायाम गर्नुहोस्। टहलना राम्रो विकल्प हो।', urgency: 'normal' },
      { title: 'योग र स्ट्रेचिङ', tip: 'सौम्य योग र स्ट्रेचिङ पेशी लचकता राखन र तनाव कम गर्न मदत गर्छ।', urgency: 'normal' },
      { title: 'पेल्विक फ्लोर व्यायाम', tip: 'केगेल व्यायाम श्रोणि फ्लोर मांसपेशी मजबूत गर्न र प्रसव सम्म मदत गर्छ।', urgency: 'normal' },
      { title: 'तैरावट', tip: 'तैरावट न्यून-प्रभाव व्यायाम हो र सम्पूर्ण शरीरको फिटनेस सुधार गर्छ।', urgency: 'normal' },
      { title: 'व्यायाम सावधानी', tip: 'उच्च-प्रभाव क्रीडा र सम्पर्क खेल बचनुहोस्। पहिलो परामर्श गर्नुहोस्।', urgency: 'warning' }
    ] : [
      { title: 'Daily Activity Goal', tip: 'Aim for at least 20-30 minutes of light exercise daily. Walking is excellent for pregnancy.', urgency: 'normal' },
      { title: 'Yoga & Stretching', tip: 'Gentle yoga and stretching maintain flexibility, reduce stress, and prepare for labor.', urgency: 'normal' },
      { title: 'Pelvic Floor Exercises', tip: 'Kegel exercises strengthen pelvic floor muscles, helping with labor and postpartum recovery.', urgency: 'normal' },
      { title: 'Swimming Benefits', tip: 'Swimming is a low-impact exercise that improves overall fitness and relieves back pain.', urgency: 'normal' },
      { title: 'Exercise Precautions', tip: 'Avoid high-impact sports and contact activities. Get clearance from your doctor first.', urgency: 'warning' }
    ],
    mental: language === 'ne' ? [
      { title: 'ध्यान र शान्ति', tip: 'दैनिक १०-२० मिनिट ध्यान गर्नुहोस्। यो चिन्ता र तनाव कम गर्छ।', urgency: 'normal' },
      { title: 'नींद की गुणवत्ता', tip: 'प्रतिदिन ८-९ घन्टा नींद लिनु आवश्यक छ। तकिया र बिस्तर सुविधाजनक बनाउनुहोस्।', urgency: 'normal' },
      { title: 'परिवार को साथ समय', tip: 'अपने प्रियजनों को साथ समय बिताएं। उनका समर्थन महत्वपूर्ण है।', urgency: 'normal' },
      { title: 'पेशेवर सहायता', tip: 'यदि चिन्ता वा अवसाद महसूस होय तो डाक्टर वा परामर्शदातासँग कुरा गर्नुहोस्।', urgency: 'warning' },
      { title: 'तनाव व्यवस्थापन', tip: 'संगीत सुन्नुहोस्, आरामदायक कार्य गर्नुहोस्, प्रकृतिमा समय बिताउनुहोस्।', urgency: 'normal' }
    ] : [
      { title: 'Meditation & Mindfulness', tip: 'Practice 10-20 minutes of meditation daily. It reduces anxiety and promotes relaxation.', urgency: 'normal' },
      { title: 'Sleep Quality Matters', tip: 'Aim for 8-9 hours of sleep nightly. Use comfortable pillows and maintain a cool room.', urgency: 'normal' },
      { title: 'Partner Support', tip: 'Spend quality time with your partner. Communication and emotional support are crucial.', urgency: 'normal' },
      { title: 'Seek Professional Help', tip: 'If experiencing anxiety or depression, reach out to your doctor or counselor immediately.', urgency: 'warning' },
      { title: 'Stress Relief Activities', tip: 'Listen to music, pursue hobbies, spend time in nature, or journal your feelings.', urgency: 'normal' }
    ],
    medical: language === 'ne' ? [
      { title: 'नियमित जाँच', tip: 'प्रतिमास डाक्टर भेट्नुहोस्। नियमित जाँच समस्या जल्दै पहिचान गर्छ।', urgency: 'warning' },
      { title: 'फोलिक एसिड सप्लिमेन्ट', tip: 'दैनिक ४०० माइक्रोग्राम फोलिक एसिड लिनु आवश्यक छ।', urgency: 'warning' },
      { title: 'आयरन सप्लिमेन्ट', tip: 'दोस्रो त्रैमासिकदेखि दैनिक आयरन सप्लिमेन्ट लिनुहोस्।', urgency: 'warning' },
      { title: 'कोविड १९ सुरक्षा', tip: 'गर्भावस्थामा भ्याक्सीन र सुरक्षा उपाय राम्रो हो।', urgency: 'normal' },
      { title: 'लक्षण निरीक्षण', tip: 'गुर्दो रक्तस्राव, तीव्र दर्द, वा अन्य चिन्ताजनक लक्षण देखिए तुरन्त संपर्क गर्नुहोस्।', urgency: 'warning' }
    ] : [
      { title: 'Regular Check-ups', tip: 'Visit your doctor monthly. Regular monitoring helps detect issues early.', urgency: 'warning' },
      { title: 'Folic Acid Supplement', tip: 'Take 400 micrograms of folic acid daily to prevent neural tube defects.', urgency: 'warning' },
      { title: 'Iron Supplement', tip: 'Start iron supplements in 2nd trimester. This prevents anemia during pregnancy.', urgency: 'warning' },
      { title: 'Vaccines & Safety', tip: 'Certain vaccines like flu shot are safe during pregnancy. Consult your doctor.', urgency: 'normal' },
      { title: 'Watch for Warning Signs', tip: 'Report heavy bleeding, severe pain, or unusual symptoms immediately to your doctor.', urgency: 'warning' }
    ],
    preparation: language === 'ne' ? [
      { title: 'प्रसव वर्गहरु', tip: 'प्रसव वर्ग लिनुहोस्। यो शारीरिक र मानसिक तयारी गर्न मदत गर्छ।', urgency: 'normal' },
      { title: 'प्रसव योजना', tip: 'आपनो प्रसव विकल्प र वरीयताहरू निर्धारण गर्नुहोस्। दाई र डाक्टरसँग कुरा गर्नुहोस्।', urgency: 'normal' },
      { title: 'बच्चाको तयारी', tip: 'कपडा, खेलौना, र अन्य आवश्यक चीजहरु तयार गर्नुहोस्।', urgency: 'normal' },
      { title: 'स्तनपान तयारी', tip: 'स्तनपान कोर्सहरु लिनुहोस्। यो सफल स्तनपान सुनिश्चित गर्छ।', urgency: 'normal' },
      { title: 'लेबर संकेत', tip: 'नियमित संकुचन, जल टुट्ने, र रक्तस्राव लेबरको संकेत हो। अस्पताल जानुहोस्।', urgency: 'warning' }
    ] : [
      { title: 'Childbirth Classes', tip: 'Take prenatal classes. They prepare you physically and mentally for labor.', urgency: 'normal' },
      { title: 'Birth Plan Discussion', tip: 'Discuss your delivery preferences with your doctor. Consider pain management options.', urgency: 'normal' },
      { title: 'Baby Preparation', tip: 'Stock essential items: diapers, clothes, blankets, feeding bottles, and car seat.', urgency: 'normal' },
      { title: 'Breastfeeding Prep', tip: 'Learn about breastfeeding techniques. Consider a lactation consultant for guidance.', urgency: 'normal' },
      { title: 'Labor Signs', tip: 'Know the signs: regular contractions, rupture of membranes, bleeding. Go to hospital immediately.', urgency: 'warning' }
    ]
  };

  const overviewStats = [
    { label: language === 'ne' ? 'आयु' : 'Age', value: user?.age || '-', color: 'bg-blue-100 border-blue-300' },
    { label: language === 'ne' ? 'सप्ताह' : 'Weeks', value: user?.weeks_pregnant || '-', color: 'bg-purple-100 border-purple-300' },
    { label: language === 'ne' ? 'रेकर्डहरु' : 'Records', value: healthRecords.length, color: 'bg-green-100 border-green-300' },
    { label: language === 'ne' ? 'संसाधनहरु' : 'Tips', value: Object.values(insights).reduce((a, b) => a + b.length, 0), color: 'bg-orange-100 border-orange-300' }
  ];

  useEffect(() => {
    const storedRecords = localStorage.getItem(`health_records_${user?.name}`);
    if (storedRecords) {
      try {
        setHealthRecords(JSON.parse(storedRecords));
      } catch {
        setHealthRecords([]);
      }
    }
  }, [user?.name]);

  const currentInsights = insights[selectedCategory] || insights.overview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b-2 border-purple-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition"
            >
              ← {text.back}
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {text.title}
              </h1>
              <p className="text-sm text-slate-500">{text.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/health')}
            className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition"
          >
            {text.addRecords}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {overviewStats.map((stat, idx) => (
            <div key={idx} className={`${stat.color} border-2 rounded-xl p-4 text-center shadow-md`}>
              <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-600 mb-3">{language === 'ne' ? 'वर्गहरु छान्नुहोस्' : 'Select Category'}</p>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
            {Object.entries(text.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedCategory === key
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentInsights.map((insight, idx) => (
            <div
              key={idx}
              onClick={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
              className={`p-5 rounded-xl border-2 shadow-md cursor-pointer transition transform hover:scale-105 ${
                insight.urgency === 'warning'
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-lg ${insight.urgency === 'warning' ? 'text-amber-900' : 'text-green-900'}`}>
                  {insight.title}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  insight.urgency === 'warning'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-green-200 text-green-900'
                }`}>
                  {insight.urgency === 'warning' ? '⚠️ Important' : '✓ Healthy'}
                </span>
              </div>
              
              {expandedInsight === idx && (
                <div className={`mt-3 p-3 rounded-lg text-sm leading-relaxed ${
                  insight.urgency === 'warning'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-green-100 text-green-900'
                }`}>
                  💡 {insight.tip}
                </div>
              )}
              {expandedInsight !== idx && (
                <p className="text-sm text-slate-600 italic">{language === 'ne' ? 'विवरणको लागि क्लिक गर्नुहोस्' : 'Click for details'}</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        {healthRecords.length === 0 && (
          <div className="mt-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-8 text-center text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-2">{language === 'ne' ? 'स्वास्थ्य ट्र्याकिङ शुरु गर्नुहोस्' : 'Start Tracking Your Health'}</h3>
            <p className="text-sm mb-4 opacity-90">{language === 'ne' ? 'आपनो स्वास्थ्य रेकर्ड थप्न शुरु गर्नुहोस् र अधिक व्यक्तिगत सिफारिसहरु प्राप्त गर्नुहोस्।' : 'Add your health records to receive more personalized recommendations and insights.'}</p>
            <button
              onClick={() => navigate('/health')}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:shadow-xl transition"
            >
              {text.startTracking}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
