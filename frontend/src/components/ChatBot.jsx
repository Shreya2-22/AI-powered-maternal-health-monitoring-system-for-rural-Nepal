import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatBot({ user, language }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${user.name}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [user.name]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const text = {
    ne: {
      title: 'च्याटबट',
      back: '⬅️ फिर्ता',
      placeholder: 'तपाईंको प्रश्न लेख्नुहोस्...',
      sendBtn: 'पठाउनुहोस्',
      clearBtn: 'साफ गर्नुहोस्',
      welcome: 'नमस्ते! 👋 गर्भावस्था सम्बन्धि कुनै पनि प्रश्न गर्नुहोस्। मैले तपाईंलाई मदत गर्न खुसी छु।'
    },
    en: {
      title: 'Chatbot',
      back: '⬅️ Back',
      placeholder: 'Ask your question...',
      sendBtn: 'Send',
      clearBtn: 'Clear',
      welcome: 'Hello! I\'m here to answer your pregnancy-related questions. Please tell me about your concern.'
    }
  };

  // Intelligent NLP-based chatbot with scoring algorithm
  const getResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();
    const lang = language;

    // MEGA Enhanced keyword mapping - covers ALL pregnancy questions
    const keywords = {
      ne: {
        greeting: ['नमस्ते', 'हेलो', 'हाय', 'कस्तो', 'किसिम'],
        emergency: ['तुरंत', 'आपातकाल', 'गंभीर', 'खतरा', 'बेहोश'],
        bleeding: ['रक्त', 'खून', 'फहराउँदै', 'रक्तस्राव', 'स्पटिङ'],
        nausea: ['मितली', 'उल्टी', 'वमन', 'भोकिएको'],
        pain: ['दर्द', 'पीडा', 'पेट', 'ऐंठन', 'तकलिफ'],
        fever: ['बुखार', 'ज्वरो', 'तापमान', 'गर्म'],
        fatigue: ['थकान', 'कमजोरी', 'निरस्'],
        weight: ['वजन', 'किलो', 'भार', 'मोटो'],
        exercise: ['व्यायाम', 'कसरत', 'हिँड्ने', 'योग'],
        diet: ['खाना', 'भोजन', 'पोषण', 'दाल', 'सब्जी'],
        delivery: ['प्रसव', 'जन्म', 'लेबर', 'बच्चा'],
        swelling: ['सूजन', 'सूजेको', 'पैर', 'हात'],
        heartburn: ['एसिड', 'जलन', 'गर्दु', 'पेट'],
        sleep: ['सुत्ने', 'नींद', 'निद्रा', 'सुत्न'],
        monitor: ['जाँच', 'परीक्षण', 'ट्र्याकिङ', 'अनुगमन'],
        backpain: ['पीठ', 'पीठ दर्द', 'कमर', 'पेठ'],
        craving: ['खोज', 'खाना खोज', 'मन', 'खान मन'],
        breathing: ['सास', 'सासफेरन', 'दुष्कर', 'सांस'],
        constipation: ['कोष्ठ', 'कब्ज', 'पचन', 'पोप'],
        skin: ['छाला', 'र्याश', 'खुजली', 'दाग'],
        mood: ['मुड', 'मानसिक', 'उदास', 'चिन्ता'],
        sexual: ['यौन', 'सम्भोग', 'संबंध', 'साथी'],
        travel: ['यात्रा', 'उडान', 'गाडी', 'बस'],
        work: ['काम', 'अफिस', 'काम गर्ने', 'नोकरी'],
        trimester1: ['पहिलो', 'तिनमास', '3', 'महिना'],
        trimester3: ['तेस्रो', '9', '8', '7', 'महिना', 'अन्तिम'],
        labor: ['प्रसवपीडा', 'संकुचन', 'पानी टुट्यो', 'लेबर'],
        preparation: ['तयारी', 'सिकाउ', 'का लागि', 'गर्नुपर्छ'],
        breastfeeding: ['दूध', 'स्तन', 'स्तनपान', 'निप्पल']
      },
      en: {
        greeting: ['hello', 'hi', 'hey', 'greetings'],
        emergency: ['emergency', 'urgent', 'critical', 'severe', 'help'],
        bleeding: ['bleeding', 'bleed', 'blood', 'spotting', 'bleeding'],
        nausea: ['nausea', 'vomit', 'sick', 'throwing up'],
        pain: ['pain', 'hurt', 'ache', 'cramp', 'abdominal', 'stomach'],
        fever: ['fever', 'temperature', 'hot', 'warm'],
        fatigue: ['fatigue', 'tired', 'exhausted', 'weak'],
        weight: ['weight', 'gain', 'heavy', 'kg'],
        exercise: ['exercise', 'workout', 'walk', 'yoga'],
        diet: ['diet', 'food', 'eat', 'nutrition'],
        delivery: ['delivery', 'birth', 'labor', 'pregnant', 'baby', 'childbirth'],
        swelling: ['swelling', 'swollen', 'puffy', 'edema', 'puffiness'],
        heartburn: ['heartburn', 'acid', 'indigestion', 'reflux', 'burning'],
        sleep: ['sleep', 'sleeping', 'insomnia', 'rest', 'tired'],
        monitor: ['monitor', 'check', 'tracking', 'observation', 'checkup'],
        backpain: ['back pain', 'backache', 'lower back', 'spine', 'back ache', 'back hurt'],
        craving: ['craving', 'want', 'desire', 'craving for', 'crave', 'unusual eating'],
        breathing: ['breathing', 'shortness of breath', 'breathless', 'breath', 'breathing difficulty'],
        constipation: ['constipation', 'constipated', 'bowel', 'hard stool', 'digestion', 'poop'],
        skin: ['skin', 'stretch marks', 'rash', 'itching', 'itch', 'acne', 'spots', 'pigmentation'],
        mood: ['mood', 'depression', 'anxiety', 'sad', 'emotional', 'crying', 'stressed', 'hormones'],
        sexual: ['sex', 'sexual', 'intercourse', 'intimacy', 'contraception'],
        travel: ['travel', 'flying', 'journey', 'driving', 'car ride', 'plane'],
        work: ['work', 'job', 'workplace', 'leave', 'maternity', 'tired at work'],
        trimester1: ['first', 'trimester', '1st', 'early', 'beginning'],
        trimester3: ['third', 'trimester', '3rd', '8 months', '9 months', '7 months', 'final', 'last', 'eight', 'nine'],
        labor: ['labor', 'contractions', 'water broke', 'labor pain', 'signs'],
        preparation: ['prepare', 'do', 'should', 'ready', 'plan'],
        breastfeeding: ['breast', 'nursing', 'breastfeed', 'milk', 'nipple']
      }
    };

    // Dynamic responses based on context
    const getAnswers = () => ({
      ne: {
        greeting: 'नमस्ते! 👋 गर्भावस्था सम्बन्धि कुनै पनि प्रश्न गर्नुहोस्। मैले तपाईंलाई मदत गर्न खुसी छु।',
        emergency: '🚨 तुरंत आपनो डाक्टरसँग सम्पर्क गर्नुहोस् वा निकटतम अस्पताल जानुहोस्! यो गम्भीर छ। देरी न गर्नुहोस्।',
        bleeding: '🚨 भारी रक्तस्राव गम्भीर हो सक्छ। तुरंत आपनो स्वास्थ्य सेवा प्रदानकर्तासँग सम्पर्क गर्नुहोस्। यदि धेरै भारी छ भने जरुरी कक्षमा जानुहोस्।',
        nausea: '😷 गर्भावस्थामा मितली सामान्य छ, विशेषगरी पहिलो तिनमासमा। कोसिस गर्नुहोस्: अदुवाको चिया, साना खानाहरु, भिटामिन B6। यदि गम्भीर छ भने डाक्टरसँग कुरा गर्नुहोस्।',
        pain: '🤒 हल्का पेटको दर्द सामान्य छ, तर तीव्र वा लामो समय सम्मको दर्दको लागि तुरंत डाक्टरसँग मिलनुहोस्। विशेषगरी यदि ऐंठन वा रक्तस्राव छ भने।',
        fever: '🌡️ गर्भावस्थामा बुखारलाई गम्भीरताको साथ लिनुहोस्। यदि तापमान 38°C भन्दा माथि छ भने डाक्टरलाई बताउनुहोस्। प्रबन्ध गर्नुहोस्: ठंडा पानी, हल्का कपडा, आराम। कहिले पनि एस्पिरिन न लिनुहोस्।',
        fatigue: '😴 थकान गर्भावस्थाको सामान्य हिस्सा हो। 8-10 घन्टा नींद लिनुहोस्, आयरन भरपूर खाना खानुहोस् (पालक, मांस, बिनी), हल्का व्यायाम गर्नुहोस्।',
        weight: '⚖️ गर्भावस्थामा 10-15 किलोग्राम वजन बढ्नु सामान्य छ। नियमित जाँच आवश्यक छ। स्वस्थ खाना खानुहोस्, फास्ट फुड बचाउनुहोस्। आपनो डाक्टरसँग वजन लक्ष्य छलफल गर्नुहोस्।',
        exercise: '🏃‍♀️ दिनमा 30 मिनटको हल्का गतिविधि सुरक्षित छ: हिँड्ने, योग, पौडी। डाक्टरको अनुमति पाउनुहोस्। कठोर व्यायाम, तातो योग, र सम्पर्क खेल बचाउनुहोस्।',
        diet: '🥗 पोषण महत्त्वपूर्ण छ: दूध, दही, अण्डा, मांस/माछा, सब्जी, फल, दाल, पूरै अनाज। दैनिक 300 अतिरिक्त क्यालोरी खानुहोस्। पानी खूब पिनुहोस् (8-10 गिलास)।',
        delivery: '👶 प्रसवको तयारी गर्नुहोस्: डाक्टरसँग जन्म योजना बनाउनुहोस्, प्रसव कक्षा लिनुहोस्, आपनो साथीलाई समावेश गर्नुहोस्, चिन्ता कम गर्नुहोस।',
        swelling: '👣 पैरमा सूजन सामान्य छ। कोसिस गर्नुहोस्: पैर माथि गरेर आराम गर्नुहोस्, नमक कम गर्नुहोस्, पर्याप्त पानी पिनुहोस्, समर्थन मोजा लगाउनुहोस्। यदि अत्यधिक छ भने डाक्टरलाई बताउनुहोस्।',
        heartburn: '🔥 अम्लिय भाेजन कम गर्नुहोस्, साना खाना खानुहोस्, सुतेर समय तकिया माथि राखनुहोस्, रातमा ढेर खाना न खानुहोस्। डाक्टरसँग सुरक्षित एन्टासिड मागनुहोस्।',
        sleep: '🌙 नींद सुधार गर्नुहोस्: नियमित समयमा सुत्नुहोस्, सहायक तकिया प्रयोग गर्नुहोस्, क्याफिन कम गर्नुहोस् (विशेषगरी दुई पछि), सुत्नुअघि तातो दूध पिनुहोस्। व्यायाम गर्नुहोस् पर सुत्नु अघि होइन।',
        monitor: '📊 नियमित अनुगमन महत्त्वपूर्ण छ: वजन, रक्तचाप, रक्त परीक्षण, अल्ट्रासाउंड। हरेक विजिटमा डाक्टरसँग जाँच गराउनुहोस्। कुनै पनि अनियमितता तुरंत बताउनुहोस्।',
        backpain: '🔙 पीठको दर्द सामान्य छ। कोसिस गर्नुहोस्: सहायक तकिया, ठीक मुद्रा, बाथसाल्ट, हल्का व्यायाम। गर्मी लागेको कम्बै प्रयोग गर्नुहोस्। यदि गम्भीर छ भने चिकित्सकीय परामर्श लिनुहोस्।',
        craving: '🍕 खाना खोज सामान्य छ र सुरक्षित छ! स्वस्थ विकल्प चुनुहोस्। यदि मिट्टी वा अ-खाद्य वस्तु खान मन गरीरहेको छ भने डाक्टरलाई बताउनुहोस् (आयरन कमी हो सक्छ)।',
        breathing: '🫁 सास फेर्न कठिनाई सामान्य छ। कोसिस गर्नुहोस्: ढिलो गहिरो सास, सिधापन मुद्रा, आराम गरनुहोस्। यदि गम्भीर छ वा छाती दर्द छ भने तुरंत सहायता खोज्नुहोस्।',
        constipation: '💊 पचन समस्या सामान्य छ। कोसिस गर्नुहोस्: रेशे भरपूर खाना (फल, सब्जी, सिरियल), पानी खूब पिनुहोस्, हल्का व्यायाम गर्नुहोस्। डाक्टरसँग परामर्श गरी सुरक्षित जुलाब लिनुहोस्।',
        skin: '✨ त्वचाको परिवर्तन सामान्य छ। पहुँच दाग सामान्यतः बाहिर जान्छ। हाइड्रेट रहनुहोस्, खुजली को लागि नरम लोशन प्रयोग गर्नुहोस्। डाक्टरसँग कुरा गरेर सुरक्षित उपचार लिनुहोस्।',
        mood: '💭 मानसिक परिवर्तन सामान्य छ। समर्थन खोज्नुहोस्, आराम गर्नुहोस्, व्यायाम गर्नुहोस्। यदि उदास वा चिन्तित छु भने डाक्टर वा मानसिक स्वास्थ्य व्यावसायिकसँग कुरा गर्नुहोस्।',
        sexual: '💑 सम्भोग सामान्यतः सुरक्षित छ। यदि समस्या छ वा खून सिमिरीरहेको छ भने डाक्टरसँग कुरा गर्नुहोस्। आपनो साथीलाई समझाउनुहोस् र आरामदायक हुनुहोस्।',
        travel: '✈️ यात्रा सामान्यतः ठीक छ पहिलो वा दोस्रो तिनमासमा (28 हप्तासम्म)। कम्प्रेसन मोजा लगाउनुहोस्, नियमित रूपमा चल्नुहोस्, पानी पिनुहोस्। लामो यात्रा अघि डाक्टरको अनुमति लिनुहोस्।',
        work: '💼 काम गर्न सामान्यतः ठीक छ। पर्याप्त आराम लिनुहोस्, तनाव कम गर्नुहोस्। आवश्यकता अनुसार छुट्टी र घर बसेर काम गर्ने विचार गर्नुहोस्। डाक्टरसँग जन्म पछि छुट्टीको बारेमा कुरा गर्नुहोस्।',
        trimester1: '🤰 पहिलो तिनमास (हप्ता 1-12): मितली, थकान, मेजाज परिवर्तन, स्तन कोमल। प्रसवपूर्व भिटामिन लिनुहोस्। आराम गर्नुहोस्, साना खाना खानुहोस्। गर्भविच्छेद यहाँ सबै भन्दा सामान्य छ, त्यसैले अल्कोहल र धुम्रपान बचाउनुहोस्।',
        trimester3: '🤰 तेस्रो तिनमास (7-9 महिना): बच्चा द्रुत गति से बढ रहा है! संकुचन अनुभव हो सक्छ, पीठ दर्द, सूजन। अस्पताल प्रवेश किट तयार गर्नुहोस्। श्वास व्यायाम अभ्यास गर्नुहोस्। बायाँ तिरमा सुत्नुहोस्। प्रसव संकेत हेरनुहोस्: नियमित संकुचन, पानी टुट्यो, रगत छायो।',
        labor: '🚨 प्रसव संकेत: नियमित संकुचन ५ मिनेट पछि, पानी टुट्यो, रगत छायो (बलघाट)। यदि यस मध्ये कुनै पनि भएमा अस्पताल जानुहोस्। संकुचन Braxton-Hicks भन्दा फरक हुन्छ: नियमित, शक्तिशाली, नजिक हुँदै जान्छ। संकुचनको समयमा ढिलो सास गर्नुहोस्।',
        preparation: '📋 तेस्रो तिनमास तयारी: अस्पताल झोली (कपडा, दस्तावेज, सानसमग्री)। प्रसव साथी छनोट गर्नुहोस्। प्रसव स्थिति सीख्नुहोस्। श्रोणि तल व्यायाम गर्नुहोस्। बच्चा कोठो तयार गर्नुहोस्। शिशु CPR कक्षा लिनुहोस्। आपातकालीन नम्बर तयार गर्नुहोस्। अवकाश योजना गर्नुहोस्। दर्द निवारण विकल्प छलफल गर्नुहोस्।',
        breastfeeding: '🍼 स्तनपान तयारी: स्तनपान कक्षा लिनुहोस्। निप्पल तयार गर्नुहोस् (कठोर साबुन प्रयोग न गर्नुहोस्)। स्तनपान ब्रा लिनुहोस्। लानोलिन क्रिम तयार गर्नुहोस्। पकड अभ्यास गर्नुहोस्। जन्म पछि एक घन्टामा खवाउनुहोस्। पहिलो दूध कोलोस्ट् (पातो पहेलो तरल) - धेरै महत्व्पूर्ण! दिन 2-3 मा सूजन अपेक्षा गर्नुहोस्। गर्म कम्प्रेस मदत गर्छ। यदि दर्दनाक छ भने स्तनपान सलाहकारसँग परामर्श लिनुहोस्।'
      },
      en: {
        greeting: 'Hello! 👋 I\'m glad to help you. Feel free to ask me anything about your pregnancy journey.',
        emergency: '🚨 Contact your doctor or go to the nearest hospital immediately! This requires urgent attention. Don\'t delay!',
        bleeding: '🚨 Bleeding can be serious. Contact your healthcare provider right away. If it\'s very heavy, go to the ER. Always report it to your doctor.',
        nausea: '😷 Nausea is very common in pregnancy, especially in the first trimester. Try: ginger tea, small meals, vitamin B6. Consult doctor if severe or persistent.',
        pain: '🤒 Mild abdominal pain is normal, but severe, sharp, or persistent pain needs immediate medical attention. Especially if accompanied by bleeding or cramping.',
        fever: '🌡️ Take fever seriously during pregnancy. Contact doctor if temp is above 38°C. To manage: cool water, light clothes, rest. Never take aspirin without doctor approval.',
        fatigue: '😴 Tiredness is a normal part of pregnancy. Get 8-10 hours of sleep, eat iron-rich foods (spinach, meat, beans), and do light exercise to boost energy.',
        weight: '⚖️ Gaining 10-15 kg during pregnancy is normal. Regular check-ups are essential. Eat healthy, avoid junk food, exercise lightly. Discuss weight goals with your doctor.',
        exercise: '🏃‍♀️ 30 minutes of light activity daily is safe: walking, yoga, swimming. Get doctor\'s approval first. Avoid strenuous exercise, hot yoga, and contact sports.',
        diet: '🥗 Nutrition is critical: milk, yogurt, eggs, meat/fish, vegetables, fruits, lentils, and whole grains. Eat 300 extra calories daily. Drink plenty of water (8-10 glasses).',
        delivery: '👶 Prepare for delivery: create birth plan with doctor, take childbirth classes, involve your birth partner, manage anxiety with support and relaxation techniques.',
        swelling: '👣 Swelling (edema) is common. Try: elevate feet, reduce salt, drink enough water, wear support socks, rest often. Report excessive swelling to your doctor.',
        heartburn: '🔥 Reduce heartburn: avoid acidic foods, eat smaller meals, keep head elevated while sleeping, avoid eating late. Ask doctor for safe antacid options.',
        sleep: '🌙 Improve sleep: maintain regular bedtime, use supportive pillows, reduce caffeine (especially after 2pm), warm milk before bed. Exercise but not close to bedtime.',
        backpain: '🔙 Back pain is common. Try: supportive pillow, proper posture, warm compress, light stretching, prenatal massage. If severe, consult your doctor for physical therapy.',
        craving: '🍕 Food cravings are normal and safe! Choose healthy alternatives when possible. If craving non-food items (dirt, ice), tell your doctor - may indicate iron deficiency.',
        breathing: '🫁 Shortness of breath is common. Try: slow deep breathing, proper posture, rest when needed. If severe or chest pain occurs, seek medical help immediately.',
        constipation: '💊 Digestive issues are common. Try: fiber-rich foods (fruits, veggies, cereals), drink plenty of water, light exercise. Talk to doctor before taking any laxatives.',
        skin: '✨ Skin changes are normal. Stretch marks usually fade after pregnancy. Stay hydrated, use mild lotion for itching. Consult doctor for any rashes or severe symptoms.',
        mood: '💭 Mood swings are normal. Seek support from family/friends, stay active, practice relaxation. If feeling depressed or anxious, talk to your doctor or counselor.',
        sexual: '💑 Sexual intercourse is usually safe during pregnancy. Talk to your doctor if any concerns. Communicate with your partner and stay comfortable. Stop if bleeding occurs.',
        travel: '✈️ Travel is generally safe in first or second trimester (before 28 weeks). Wear compression socks, walk regularly, stay hydrated. Get doctor\'s approval for long trips.',
        work: '💼 Working during pregnancy is usually fine. Get adequate rest, manage stress. Consider flexible hours or remote work if needed. Discuss maternity leave options with doctor.',
        trimester1: '🤰 First Trimester (Weeks 1-12): Expect nausea, fatigue, mood swings, tender breasts. Take prenatal vitamins with folic acid. Rest well, eat small meals. Most miscarriages happen here, so avoid alcohol and smoking completely.',
        trimester3: '🤰 Third Trimester (7-9 months): Baby is growing rapidly! Expect contractions (Braxton-Hicks), back pain, swelling, frequent urination. Get hospital admission kit ready. Practice breathing exercises. Sleep on left side. Watch for real labor signs carefully.',
        labor: '🚨 LABOR SIGNS - GO TO HOSPITAL IF YOU HAVE: (1) Regular contractions every 5 mins, getting stronger; (2) Water breaking (clear/pinkish fluid); (3) Bloody discharge (mucosal plug); (4) Severe back pain. Contractions differ from Braxton-Hicks: they are regular, very strong, closer together. Breathe slowly during contractions.',
        preparation: '📋 THIRD TRIMESTER CHECKLIST: Pack hospital bag (clothes, documents, toiletries, snacks). Choose birth partner. Learn labor positions (hands-knees, squatting, side-lying). Do pelvic floor exercises daily. Prepare baby room. Take infant CPR class. Have emergency numbers ready. Plan your maternity leave (tell employer). Discuss pain relief options with doctor.',
        breastfeeding: '🍼 BREASTFEEDING PREP: Take a breastfeeding class before baby arrives. Prepare nipples (avoid harsh soaps, massage gently). Get proper nursing bras (2-3). Have lanolin cream or nipple balm ready. Practice latch position. After birth, try to feed within first hour - this is critical! First milk is colostrum (thin yellow liquid) - very valuable for baby\'s immunity! Expect breast engorgement on day 2-3. Use warm compress to help. If feeding is painful, consult a lactation consultant immediately.'
      }
    });

    // Simple fuzzy matching to handle typos (Levenshtein-like similarity)
    const getSimilarityScore = (str1, str2) => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 100;
      
      const editDistance = getEditDistance(longer, shorter);
      return ((longer.length - editDistance) / longer.length) * 100;
    };

    const getEditDistance = (s1, s2) => {
      const costs = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) costs[j] = j;
          else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };

    // Scoring algorithm to find best matching category
    const scoreCategories = () => {
      const scores = {};
      const keywordSet = keywords[lang];

      for (const [category, keywordList] of Object.entries(keywordSet)) {
        let categoryScore = 0;
        
        for (const keyword of keywordList) {
          if (input.includes(keyword)) {
            categoryScore += 10; // Direct match
          } else {
            // Fuzzy matching for typos
            const similarity = getSimilarityScore(input, keyword);
            if (similarity > 70) {
              categoryScore += similarity / 10;
            }
            
            // Check for partial matches
            if (keyword.length > 2 && input.includes(keyword.substring(0, keyword.length - 1))) {
              categoryScore += 5;
            }
          }
        }
        
        // Weight emergency category higher for safety
        if (category === 'emergency' && categoryScore > 0) {
          categoryScore *= 2;
        }
        
        scores[category] = categoryScore;
      }

      return scores;
    };

    const scores = scoreCategories();
    const bestMatch = Object.entries(scores).reduce((best, [key, value]) => 
      value > best.score ? { category: key, score: value } : best, 
      { category: null, score: 0 }
    );

    const answers = getAnswers()[lang];

    // Return appropriate response - aggressiv matching for pregnancy questions
    if (bestMatch.score > 0.5 || (input.includes('pregnant') || input.includes('months') || input.includes('trimester'))) {
      // EARLY PREGNANCY: 1-6 months → First Trimester
      if ((input.includes('1') || input.includes('2') || input.includes('3') || 
           input.includes('4') || input.includes('5') || input.includes('6')) && 
          (input.includes('month') || input.includes('months'))) {
        return answers.trimester1;
      }
      
      // LATE PREGNANCY: 7-9 months → Third Trimester
      if ((input.includes('8') || input.includes('9') || input.includes('7')) && 
          (input.includes('month') || input.includes('months'))) {
        return answers.trimester3;
      }
      
      // Explicit trimester keywords
      if (input.includes('first') && input.includes('trimester')) {
        return answers.trimester1;
      }
      if ((input.includes('third') || input.includes('final') || input.includes('last')) && input.includes('trimester')) {
        return answers.trimester3;
      }
      
      // Backup: check category scoring
      if (bestMatch.score > 0.5) {
        return answers[bestMatch.category];
      }
    }

    // Default response with helpful prompts
    if (lang === 'ne') {
      const prompts = ['स्वास्थ्य', 'जोखिम', 'आपातकाल'];
      return `❓ यो समझ्न सकेन। कृपया फरक तरिकाले सोध्नुहोस्। मैले यो विषयमा मदत गर्न सक्छु: ${prompts.join(', ')}`;
    } else {
      const prompts = ['health', 'risk', 'emergency'];
      return `❓ I didn't quite understand that. Could you rephrase? I can help with: ${prompts.join(', ')}`;
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Save input before clearing
    const originalInput = inputValue;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: originalInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(language === 'ne' ? 'ne-NP' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');

    // Simulate bot thinking
    setIsLoading(true);
    setTimeout(() => {
      const botResponse = getResponse(originalInput);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(language === 'ne' ? 'ne-NP' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      localStorage.setItem(`chat_${user.name}`, JSON.stringify(finalMessages));
      setIsLoading(false);
    }, 500);
  };

  const handleClearChat = () => {
    if (confirm(language === 'ne' ? 'क्या तपाई चैट साफ गर्न चाहनुहुन्छ?' : 'Clear all messages?')) {
      setMessages([]);
      localStorage.removeItem(`chat_${user.name}`);
    }
  };

  const t = text[language];

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-linear-to-r from-teal-700 via-blue-700 to-slate-800 text-white p-6 shadow-lg">
        <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
          <button 
            onClick={() => navigate('/')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 font-semibold transition-all border border-white/20"
          >
            {t.back}
          </button>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <button 
            onClick={handleClearChat}
            className="bg-red-900/40 hover:bg-red-900/60 rounded-lg px-4 py-2 font-semibold transition-all border border-red-600/50"
          >
            {t.clearBtn}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
        <div className="flex-1 overflow-y-auto bg-slate-800/50 rounded-2xl shadow-lg p-6 mb-6 space-y-4 border border-slate-700/50 backdrop-blur-sm">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-teal-200/60 py-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-center text-lg">{t.welcome}</p>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-5 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-linear-to-r from-teal-600 to-cyan-600 text-white shadow-lg'
                    : 'bg-slate-700/70 text-teal-100 border border-slate-600/50'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <span className={`text-xs mt-2 block ${
                    message.sender === 'user' ? 'text-teal-100/70' : 'text-teal-300/60'
                  }`}>{message.timestamp}</span>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700/70 text-teal-100 px-5 py-3 rounded-2xl border border-slate-600/50">
                <span className="inline-block w-2 h-2 bg-teal-400 rounded-full animate-bounce mr-1"></span>
                <span className="inline-block w-2 h-2 bg-teal-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.2s' }}></span>
                <span className="inline-block w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form className="flex gap-3" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder={t.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-5 py-3 bg-slate-700/60 border-2 border-slate-600/50 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none transition text-white placeholder-teal-200/40 disabled:opacity-50 backdrop-blur-sm"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-8 py-3 bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl hover:shadow-xl disabled:opacity-50 transition-all transform hover:scale-105"
          >
            {t.sendBtn}
          </button>
        </form>
      </div>
    </div>
  );
}