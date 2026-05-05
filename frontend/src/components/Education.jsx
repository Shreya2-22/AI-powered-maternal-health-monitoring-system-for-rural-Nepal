import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Education({ user, language }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('nutrition');
  const [savedArticles, setSavedArticles] = useState(() => {
    const saved = localStorage.getItem(`saved_articles_${user?.name}`);
    return saved ? JSON.parse(saved) : [];
  });

  const currentWeek = user?.weeks_pregnant || 20;

  const text = language === 'ne' ? {
    title: 'शिक्षा',
    back: 'फिर्ता',
    thisWeek: 'यस हप्ताको सलाह',
    categories: {
      nutrition: 'पोषण',
      exercise: 'व्यायाम',
      symptoms: 'लक्षणहरू',
      delivery: 'प्रसव तयारी'
    },
    readMore: 'अधिक पढ्नुहोस्',
    save: 'सेभ गर्नुहोस्',
    saved: 'सेभ भयो',
    unsave: 'अनसेभ गर्नुहोस्',
    savedArticles: 'सेभ गरिएका लेखहरू',
    noSaved: 'कुनै सेभ गरिएको लेख छैन'
  } : {
    title: 'Education',
    back: 'Back',
    thisWeek: 'This Week\'s Tips',
    categories: {
      nutrition: 'Nutrition',
      exercise: 'Exercise',
      symptoms: 'Symptoms',
      delivery: 'Delivery Prep'
    },
    readMore: 'Read More',
    save: 'Save',
    saved: 'Saved',
    unsave: 'Unsave',
    savedArticles: 'Saved Articles',
    noSaved: 'No saved articles yet'
  };

  const articles = {
    nutrition: {
      ne: [
        {
          id: 'nut1',
          title: 'संतुलित आहार',
          excerpt: 'गर्भावस्थामा सही पोषण अत्यन्त महत्वपूर्ण छ।',
          content: 'गर्भावस्थामा तपाईंको शरीरलाई अतिरिक्त क्यालोरी र पोषक तत्वहरूको आवश्यकता हुन्छ। दुध, दही, पनीर जस्ता क्याल्सियम युक्त खाना खानुहोस्। फलामयुक्त खाना जस्तै मासु, माछा, हरियो साग खानुहोस्। मेवा र बिउ खानुहोस्। साथै फलफूल र विविध तरकारीहरू समावेश गर्नुहोस्।',
          tips: ['प्रतिदिन ३ गिलास दुध पिउनुहोस्', 'हरियो साग खान्नुहोस्', 'दैनिक ५०-६० ग्राम प्रोटिन लिनुहोस्']
        },
        {
          id: 'nut2',
          title: 'फोलिक एसिड को महत्व',
          excerpt: 'बच्चाको विकासको लागि आवश्यक।',
          content: 'फोलिक एसिड बच्चाको मस्तिष्क र मेरुदण्डको विकास रोकथाम गर्न मदद गर्छ। यो विटामिन पालक, मेथी, अलसी र मुग दालमा पाइन्छ। डाक्टरले दिएको फोलिक एसिड की गोली नियमित खान्नुहोस्।',
          tips: ['पालक र मेथी नियमित खान्नुहोस्', 'फोलिक एसिड की गोली खान्नुहोस्', 'दालहरू खान्नुहोस्']
        },
        {
          id: 'nut3',
          title: 'पानी को सेवन',
          excerpt: 'पर्याप्त पानी पिउनु आवश्यक छ।',
          content: 'गर्भावस्थामा प्रतिदिन कम्तीमा १०-१२ गिलास पानी पिउनुहोस्। पानीले तपाईंको शरीरलाई हाइड्रेटेड राख्छ। यसले कब्जको समस्या कम गर्छ र संक्रमणको जोखिम घटाउँछ।',
          tips: ['सुबह खाली पेट २ गिलास पानी पिउनुहोस्', 'दिनभर पानी पिन्नुहोस्', 'शुद्ध पानी पिउनुहोस्']
        }
      ],
      en: [
        {
          id: 'nut1',
          title: 'Balanced Diet',
          excerpt: 'Proper nutrition is crucial during pregnancy.',
          content: 'During pregnancy, your body needs extra calories and nutrients. Eat calcium-rich foods like milk, yogurt, and cheese. Include iron-rich foods like meat, fish, and leafy greens. Nuts and seeds are excellent. Make sure to include fresh fruits and vegetables in every meal.',
          tips: ['Drink 3 glasses of milk daily', 'Eat leafy greens regularly', 'Get 50-60g of protein daily']
        },
        {
          id: 'nut2',
          title: 'Importance of Folic Acid',
          excerpt: 'Essential for baby\'s development.',
          content: 'Folic acid helps prevent birth defects in the baby\'s brain and spinal cord. It\'s found in spinach, fenugreek, flaxseed, and lentils. Take the folic acid supplements prescribed by your doctor regularly.',
          tips: ['Eat spinach and fenugreek regularly', 'Take folic acid supplements', 'Include lentils in meals']
        },
        {
          id: 'nut3',
          title: 'Stay Hydrated',
          excerpt: 'Drinking enough water is essential.',
          content: 'Drink at least 10-12 glasses of water daily during pregnancy. Staying hydrated helps prevent constipation and reduces the risk of infections. Make it a habit to drink water throughout the day.',
          tips: ['Drink water on an empty stomach in morning', 'Drink water throughout the day', 'Drink clean water only']
        }
      ]
    },
    exercise: {
      ne: [
        {
          id: 'ex1',
          title: 'सुरक्षित व्यायाम',
          excerpt: 'नियमित व्यायाम स्वास्थ्य राखमा मदद गर्छ।',
          content: 'गर्भावस्थामा हल्का व्यायाम अत्यन्त फाइदाजनक छ। हिँड्नु, पौडी खेल्नु वा प्रेनेटल योग प्रयास गर्न सकिन्छ। व्यायाम गर्दा आफ्नो शरीरमा ध्यान दिनुहोस्। थाकेको महसुस भए व्यायाम रोकिनुहोस्।',
          tips: ['दिनमा ३० मिनेट हिँड्नुस्', 'प्रेनेटल योग प्रयास गर्नुहोस्', 'आफ्नो शरीरको संकेतहरू सुन्नुहोस्']
        },
        {
          id: 'ex2',
          title: 'पेल्भिक फ्लोर व्यायाम',
          excerpt: 'प्रसव पीडा कम गर्न मदद गर्छ।',
          content: 'पेल्भिक फ्लोर व्यायाम प्रसवको समयमा गर्भाशय र पेल्भिक मांसपेशीलाई बलियो बनाउन महत्वपूर्ण हुन्छ। यस व्यायामले प्रसवको पीडा कम गर्न मद्दत गर्छ र प्रसवलाई सहज बनाउँछ।',
          tips: ['दिनमा १० वारी २० बारी करते गर्नुहोस्', 'नियमित अभ्यास गर्नुहोस्', 'योगी शिक्षकको निर्देशन लिनुहोस्']
        },
        {
          id: 'ex3',
          title: 'स्ट्रेचिङ व्यायाम',
          excerpt: 'शरीरको लचकपन बढाउन मदद गर्छ।',
          content: 'सहज स्ट्रेचिङ व्यायामले गर्भावस्थामा शरीरको लचकता बढाउँछ। यसले कमरको दुखाइ कम गर्छ र मांसपेशीको तनाव घटाउँछ। छोटो अन्तरालमा स्ट्रेच गर्नुहोस् र आफ्नो सीमालाई सम्झनुहोस्।',
          tips: ['धीरे-धीरे स्ट्रेच गर्नुहोस्', 'पीडा नआउञ्जेल मात्र स्ट्रेच गर्नुहोस्', 'दुवै तर्फ समान रूपमा स्ट्रेच गर्नुहोस्']
        }
      ],
      en: [
        {
          id: 'ex1',
          title: 'Safe Exercise',
          excerpt: 'Regular exercise helps maintain health during pregnancy.',
          content: 'Light exercise during pregnancy is very beneficial. Walking, swimming, or prenatal yoga are great options. Listen to your body while exercising. Stop if you feel exhausted or dizzy.',
          tips: ['Walk for 30 minutes daily', 'Try prenatal yoga', 'Listen to your body\'s signals']
        },
        {
          id: 'ex2',
          title: 'Pelvic Floor Exercises',
          excerpt: 'Helps reduce labor pain.',
          content: 'Pelvic floor exercises strengthen the muscles around the uterus and pelvis, which is important for delivery. These exercises can reduce labor pain and make delivery easier. Do them regularly under guidance.',
          tips: ['Do 10-20 repetitions daily', 'Practice regularly', 'Get guidance from yoga instructor']
        },
        {
          id: 'ex3',
          title: 'Stretching Exercises',
          excerpt: 'Increases body flexibility.',
          content: 'Gentle stretching exercises help increase flexibility during pregnancy. They reduce leg cramps and muscle tension. Do stretches slowly and know your limits.',
          tips: ['Stretch slowly and gently', 'Stretch until you feel tension', 'Do bilateral stretches']
        }
      ]
    },
    symptoms: {
      ne: [
        {
          id: 'sym1',
          title: 'मर्निङ सिकनेस',
          excerpt: 'प्रथम त्रैमासिकमा सामान्य छ।',
          content: 'मर्निङ सिकनेस गर्भावस्थामा सामान्य समस्या हो जुन धेरैजसो महिलालाई पहिलो तीन महिनामा देखिन्छ। खाली पेट हुँदा बढी हुन सक्छ। अदुवा चिया वा कागतीको पानी पिउनुहोस्। सानो सानो भोजनहरू नियमित रूपमा खानुहोस्।',
          tips: ['बिस्तारै उठ्नुहोस्', 'बदाम खानुहोस्', 'कागतीको पानी पिउनुहोस्']
        },
        {
          id: 'sym2',
          title: 'पेठमा दर्द',
          excerpt: 'सामान्य परिवर्तन हो।',
          content: 'गर्भावस्थामा कमर दुखाइ सामान्य हुन सक्छ किनकि तपाईंको शरीर विस्तार भइरहेको छ। हल्का दुखाइ चिन्ताको विषय नहुन सक्छ तर गम्भीर दुखाइ भएमा डाक्टरसँग परामर्श गर्नुहोस्। पर्याप्त आराम लिनुहोस्।',
          tips: ['तातो पानीको बोतल प्रयोग गर्नुहोस्', 'पर्याप्त विश्राम लिनुहोस्', 'तनाव घटाउनुहोस्']
        },
        {
          id: 'sym3',
          title: 'थकान',
          excerpt: 'शक्तिको कमी हुन सक्छ।',
          content: 'थकान सामान्य अनुभूति हो। तपाईंको शरीरले अतिरिक्त काम गरिरहेको हुन्छ। पर्याप्त निद्रा लिनुहोस्, पोषक खाना खानुहोस् र हल्का व्यायाम गर्नुहोस्।',
          tips: ['८-१० घण्टा निद्रा लिनुहोस्', 'पोषक खाना खान्नुहोस्', 'तनाव कम गर्नुहोस्']
        }
      ],
      en: [
        {
          id: 'sym1',
          title: 'Morning Sickness',
          excerpt: 'Common in first trimester.',
          content: 'Morning sickness is a common symptom during pregnancy, especially in the first three months. It often happens on an empty stomach. Drink ginger tea or lemon water. Eat light meals frequently.',
          tips: ['Get up slowly from bed', 'Eat almonds', 'Drink lemon water']
        },
        {
          id: 'sym2',
          title: 'Abdominal Pain',
          excerpt: 'A normal change during pregnancy.',
          content: 'Abdominal pain during pregnancy is normal because your body is expanding. Light pain is not a concern, but severe pain requires a doctor\'s consultation. Get adequate rest.',
          tips: ['Apply warm water bottle', 'Get adequate rest', 'Reduce stress']
        },
        {
          id: 'sym3',
          title: 'Fatigue',
          excerpt: 'Loss of energy is common.',
          content: 'Fatigue is a normal feeling during pregnancy. Your body is working harder than usual. Get adequate sleep, eat nutritious food, and do light exercise.',
          tips: ['Sleep 8-10 hours daily', 'Eat nutritious food', 'Reduce stress']
        }
      ]
    },
    delivery: {
      ne: [
        {
          id: 'del1',
          title: 'प्रसव पूर्व जाँच',
          excerpt: 'नियमित जाँच अत्यन्त महत्वपूर्ण छ।',
          content: 'नियमित प्रसव पूर्व जाँच गरवाउनु अत्यन्त महत्वपूर्ण छ। यसले डाक्टरलाई बच्चामा कुनै समस्या छ कि छैन भनी जान्न मदद गर्छ। प्रत्येक महिनामा कम्तीमा एक वारी जाँचमा जान्नुपर्छ।',
          tips: ['महिनामा एक वारी जान्नुहोस्', 'सबै जाँच पूरा गर्नुहोस्', 'डाक्टरको सुझाब मान्नुहोस्']
        },
        {
          id: 'del2',
          title: 'प्रसवको स्थान तय गर्नुहोस्',
          excerpt: 'समय रहे योजना बनाउनुहोस्।',
          content: 'अस्पताल वा क्लिनिक तय गर्नुहोस् जहाँ तपाईंले प्रसव गर्न चाहनुहुन्छ। घर नजिकको अस्पताल छान्नुहोस् र यातायातको व्यवस्था सोच्नुहोस्। एक सहायक व्यक्तिलाई तयार राख्नुहोस्।',
          tips: ['अस्पताल तय गर्नुहोस्', 'यातायातको व्यवस्था गर्नुहोस्', 'सहायक व्यक्ति तयार गर्नुहोस्']
        },
        {
          id: 'del3',
          title: 'प्रसव सामग्री तयार गर्नुहोस्',
          excerpt: 'आवश्यक वस्तु सङ्गै राख्नुहोस्।',
          content: 'अस्पतालमा लैजानुपर्ने सामग्री तयार राख्नुहोस्। बच्चाको कपडा, तपाईंको कपडा, परिचयपत्र, बीमा कार्ड आदिसँगै राख्नुहोस्। आठौं महिनामा यी सबै तयारी गरिसक्नुहोस्।',
          tips: ['आठौं महिनामा सबै तयारी गर्नुहोस्', 'जरुरी कागजात अलग राख्नुहोस्', 'कपडा राम्ररी प्याक गर्नुहोस्']
        }
      ],
      en: [
        {
          id: 'del1',
          title: 'Prenatal Checkups',
          excerpt: 'Regular checkups are very important.',
          content: 'Regular prenatal checkups are essential. They help the doctor identify any problems with the baby early. Visit for a checkup at least once a month, and more frequently as delivery approaches.',
          tips: ['Visit monthly for checkups', 'Complete all tests', 'Follow doctor\'s advice']
        },
        {
          id: 'del2',
          title: 'Choose a Delivery Place',
          excerpt: 'Plan ahead of time.',
          content: 'Decide where you want to deliver - find a hospital or clinic near home. Plan for transportation. Have a birthing companion ready. Discuss your preferences with your doctor.',
          tips: ['Choose a hospital', 'Arrange transportation', 'Prepare a birth companion']
        },
        {
          id: 'del3',
          title: 'Prepare Delivery Bag',
          excerpt: 'Keep necessary items ready.',
          content: 'Prepare a hospital bag with necessary items. Include baby clothes, your clothes, identity documents, and insurance card. Have everything ready by the 8th month.',
          tips: ['Prepare by 8th month', 'Keep important documents separately', 'Wash clothes beforehand']
        }
      ]
    }
  };

  // Save article to localStorage
  const handleSaveArticle = (article) => {
    const isAlreadySaved = savedArticles.some(a => a.id === article.id);
    let updatedSaved;
    
    if (isAlreadySaved) {
      updatedSaved = savedArticles.filter(a => a.id !== article.id);
    } else {
      updatedSaved = [...savedArticles, article];
    }
    
    setSavedArticles(updatedSaved);
    localStorage.setItem(
      `saved_articles_${user?.name}`,
      JSON.stringify(updatedSaved)
    );
  };

  const isSaved = (articleId) => {
    return savedArticles.some(a => a.id === articleId);
  };

  const t = text;
  const categoryArticles = articles[selectedCategory][language];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-5 py-3 text-blue-700 hover:text-blue-900 font-bold text-base bg-stone-100 hover:bg-stone-200 rounded-lg transition min-w-fit leading-normal"
          >
            Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
          <div style={{ width: '40px' }}></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6">
        <div className="bg-linear-to-r from-green-100 to-teal-100 border-2 border-green-500 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-green-800 mb-2">📅 {t.thisWeek} ({currentWeek} हप्ता)</h2>
          <p className="text-green-900">
            {currentWeek <= 16 && (language === 'ne' 
              ? 'यो समयमा तपाईंको शरीरमा प्राकृतिक परिवर्तनहरू सुरु हुन्छन्। पोषक खाना खानुहोस् र पर्याप्त विश्राम लिनुहोस्।'
              : 'Your body is experiencing natural changes. Focus on nutrition and rest.'
            )}
            {currentWeek > 16 && currentWeek <= 28 && (language === 'ne'
              ? 'यो समयमा बच्चा दोब्बर गतिमा बढिरहेको छ। हल्का व्यायाम र नियमित जाँच जारी राख्नुहोस्।'
              : 'Your baby is growing rapidly. Continue light exercises and regular checkups.'
            )}
            {currentWeek > 28 && (language === 'ne'
              ? 'प्रसव नजिकको समय हो। पर्याप्त विश्राम लिनुहोस् र प्रसवको लागि तयारी गर्नुहोस्।'
              : 'You are in the final stretch. Get adequate rest and prepare for delivery.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(t.categories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-5 py-3 rounded-lg font-bold text-base transition-all leading-normal ${
                selectedCategory === key
                  ? 'bg-linear-to-r from-green-500 to-teal-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {categoryArticles.map(article => (
            <div key={article.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-800 flex-1">{article.title}</h3>
                <button
                  onClick={() => handleSaveArticle(article)}
                  className={`ml-4 px-5 py-3 rounded-lg font-bold text-base transition-all leading-normal ${
                    isSaved(article.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {isSaved(article.id) ? t.saved : t.save}
                </button>
              </div>

              <p className="text-gray-600 italic mb-3">{article.excerpt}</p>

              <div className="text-gray-700 mb-3">
                <p>{article.content}</p>
              </div>

              {article.tips && article.tips.length > 0 && (
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <strong className="text-green-800">{language === 'ne' ? 'सुझावहरू:' : 'Tips:'}</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {article.tips.map((tip, idx) => (
                      <li key={idx} className="text-green-700 text-sm">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {savedArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.savedArticles}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedArticles.map(article => (
                <div key={article.id} className="bg-linear-to-br from-green-100 to-teal-100 rounded-lg shadow-md p-4 border-2 border-green-500">
                  <h4 className="font-bold text-gray-800 mb-3">{article.title}</h4>
                  <button
                    onClick={() => handleSaveArticle(article)}
                    className="w-full px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-base rounded-lg transition-all leading-normal"
                  >
                    {t.unsave}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}