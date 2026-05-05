import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';
 
export default function ChatBot({ user, language }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);
  const [questionGuide, setQuestionGuide] = useState(null);
  const messagesEndRef = useRef(null);
 
  // Load chat history from localStorage on mount
  const fetchSuggestedQuestions = useCallback(async (intent = null) => {
    setLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        language,
        count: 3
      });
      if (intent) params.append('intent', intent);

      const response = await fetch(`${API}/chat/suggested-questions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedQuestions(data.suggested_questions || []);
      }
    } catch (error) {
      console.error('Error fetching suggested questions:', error);
    }
    setLoadingSuggestions(false);
  }, [language]);

  const fetchQuestionGuide = useCallback(async () => {
    try {
      const response = await fetch(`${API}/chat/question-types-guide?language=${language}`);
      if (response.ok) {
        const data = await response.json();
        setQuestionGuide(data);
      }
    } catch (error) {
      console.error('Error fetching question guide:', error);
    }
  }, [language]);

  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${user.name}`);
    Promise.resolve().then(() => {
      if (!savedMessages) {
        setMessages([]);
        return;
      }

      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        setMessages([]);
      }
    });

    // Fetch suggested questions on mount
    fetchSuggestedQuestions();
  }, [user.name, fetchSuggestedQuestions]);
 
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch question types guide
  useEffect(() => {
    if (showQuestionGuide && !questionGuide) {
      fetchQuestionGuide();
    }
  }, [showQuestionGuide, questionGuide, fetchQuestionGuide]);
 
  const text = language === 'ne' ? {
    title: 'गर्भावस्था सहायक 🤰',
    subtitle: 'AI-संचालित मातृ स्वास्थ्य परामर्शदाता',
    back: 'फिर्ता',
    placeholder: 'तपाईंको प्रश्न लेख्नुहोस्...',
    sendBtn: 'पठाउनुहोस्',
    clearBtn: 'साफ गर्नुहोस्',
    suggestedQuestionsTitle: 'सुझाव भएका प्रश्नहरू',
    questionGuideBtn: 'प्रश्न प्रकारहरू',
    welcome: 'नमस्ते! 👋 म गर्भावस्था र मातृ स्वास्थ्य सम्बन्धी तपाईंका प्रश्नहरूको उत्तर दिन यहाँ छु। कृपया कुनै प्रश्न सोध्नुहोस्।',
    typing: 'सोच्दै...'
  } : {
    title: 'Pregnancy Assistant 🤰',
    subtitle: 'AI-Powered Maternal Health Advisor',
    back: 'Back',
    placeholder: 'Ask your question...',
    sendBtn: 'Send',
    clearBtn: 'Clear',
    suggestedQuestionsTitle: 'Suggested Questions',
    questionGuideBtn: 'Question Types',
    welcome: 'Hello! 👋 I\'m here to help with your pregnancy and maternal health questions. Feel free to ask me anything!',
    typing: 'Thinking...'
  };
 
  const handleSuggestedQuestionClick = (question) => {
    setInputValue(question);
    // Focus input and trigger send after a small delay
    setTimeout(() => {
      document.querySelector('input[type="text"]')?.focus();
    }, 50);
  };

  const normalizeInput = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
 
  const tokenize = (value) => normalizeInput(value).split(' ').filter(Boolean);
 
  const getTopScoredCategories = (scores, limit = 3) =>
    Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([, score]) => score > 0)
      .slice(0, limit)
      .map(([category]) => category);
 
  // Intelligent NLP-based chatbot with scoring algorithm
  const getResponse = (userInput) => {
    const input = normalizeInput(userInput);
    const inputTokens = tokenize(userInput);
    const lang = language;
 
    // MEGA Enhanced keyword mapping - covers ALL pregnancy questions
    const keywords = {
      ne: {
        greeting: ['नमस्ते', 'हेलो', 'हाय', 'कस्तो', 'किसिम'],
        emergency: ['तुरुन्त', 'आपतकाल', 'गम्भीर', 'खतरा', 'बेहोस'],
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
        greeting: 'नमस्ते! 👋 गर्भावस्था सम्बन्धि कुनै पनि प्रश्न गर्नुहोस्। मैले तपाईंलाई मद्दत गर्न खुसी छु।',
        emergency: '🚨 तुरुन्त तपाईंको डाक्टरसँग सम्पर्क गर्नुहोस् वा नजिकको अस्पताल जानुहोस्! यो गम्भीर छ। ढिला नगर्नुहोस्।',
        bleeding: '🚨 भारी रक्तस्राव गम्भीर हुन सक्छ। तुरुन्त तपाईंको स्वास्थ्य सेवा प्रदायकसँग सम्पर्क गर्नुहोस्। यदि धेरै भारी छ भने आपतकालीन कक्षमा जानुहोस्।',
        nausea: '😷 गर्भावस्थामा मितली सामान्य हुन्छ, विशेषगरी पहिलो तिनमासमा। प्रयास गर्नुहोस्: अदुवा चिया, साना खाना, भिटामिन B6। यदि गम्भीर छ भने डाक्टरसँग परामर्श गर्नुहोस्।',
        pain: '🤒 हल्का पेटसम्बन्धी पीडा सामान्य हुन सक्छ, तर तीव्र वा लामो समयसम्म रहँदा तुरुन्त डाक्टरसँग परामर्श गर्नुहोस्। विशेषगरी यदि ऐंठन वा रक्तस्राव छ भने।',
        fever: '🌡️ गर्भावस्थामा बुखारलाई गम्भीरताका साथ लिनुहोस्। यदि तापमान 38°C भन्दा माथि छ भने डाक्टरलाई जानकारी दिनुहोस्। व्यवस्थापन: चिसो पानी, हल्का लुगा, आराम।',
      },
      en: {
        greeting: 'Hello! 👋 I\'m glad to help you. Feel free to ask me anything about your pregnancy journey.',
        emergency: '🚨 Contact your doctor or go to the nearest hospital immediately! This requires urgent attention. Don\'t delay!',
        bleeding: '🚨 Bleeding can be serious. Contact your healthcare provider right away. If it\'s very heavy, go to the ER immediately.',
        nausea: '😷 Nausea is very common in pregnancy, especially in the first trimester. Try: ginger tea, small meals, vitamin B6. Consult doctor if severe.',
        pain: '🤒 Mild abdominal pain is normal, but severe or persistent pain needs immediate medical attention. Especially if accompanied by bleeding.',
        fever: '🌡️ Take fever seriously during pregnancy. Contact doctor if temp is above 38°C. To manage: cool water, light clothes, rest.',
      }
    });
 
    const smallTalk = {
      ne: {
        thanks: 'धन्यवाद! म सधैं मद्दत गर्न तयार छु। तपाईं अर्को प्रश्न सोध्न सक्नुहुन्छ।',
        bye: 'बिदाइ! ध्यान राख्नुहोस्। कुनै पनी समय फेरी प्रश्न सोध्न सक्नुहुन्छ।',
      },
      en: {
        thanks: 'You are welcome. I am always here to help. You can ask me another question anytime.',
        bye: 'Take care. You can come back anytime if you have more questions.',
      }
    };
 
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
 
    const detectSmallTalk = () => {
      const thanksPatterns = lang === 'ne'
        ? ['धन्यवाद', 'थ्यांक']
        : ['thanks', 'thank you', 'thx'];
      const byePatterns = lang === 'ne'
        ? ['बिदा', 'बाइ']
        : ['bye', 'goodbye'];
 
      if (thanksPatterns.some((p) => input.includes(p))) return 'thanks';
      if (byePatterns.some((p) => input.includes(p))) return 'bye';
      return null;
    };
 
    const hasEmergencyPattern = () => {
      const emergencySignals = lang === 'ne'
        ? ['गम्भीर', 'सास फेर्न गारो', 'बेहोस', 'धेरै रक्तस्राव']
        : ['severe', 'faint', 'unconscious', 'heavy bleeding', 'can\'t breathe'];
 
      return emergencySignals.some((signal) => input.includes(signal));
    };
 
    const scoreCategories = () => {
      const scores = {};
      const keywordSet = keywords[lang];
 
      for (const [category, keywordList] of Object.entries(keywordSet)) {
        let categoryScore = 0;
        
        for (const keyword of keywordList) {
          if (input.includes(keyword)) {
            categoryScore += keyword.includes(' ') ? 18 : 12;
          } else {
            const keywordTokens = tokenize(keyword);
 
            for (const token of inputTokens) {
              if (keywordTokens.includes(token)) {
                categoryScore += 8;
              }
 
              if (token.length >= 4 && keyword.startsWith(token)) {
                categoryScore += 4;
              }
 
              const similarity = getSimilarityScore(token, keyword);
              if (similarity >= 82) {
                categoryScore += similarity / 8;
              }
            }
 
            const phraseSimilarity = getSimilarityScore(input, keyword);
            if (phraseSimilarity >= 74) {
              categoryScore += phraseSimilarity / 14;
            }
          }
        }
        
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
 
    const smallTalkIntent = detectSmallTalk();
    if (smallTalkIntent) {
      return smallTalk[lang][smallTalkIntent];
    }
 
    if (hasEmergencyPattern() && (bestMatch.category === 'bleeding' || bestMatch.category === 'pain' || bestMatch.category === 'breathing' || bestMatch.category === 'emergency')) {
      return answers.emergency;
    }
 
    if (bestMatch.score > 6 || input.includes('pregnant') || input.includes('pregnancy') || input.includes('trimester')) {
      if (bestMatch.score > 6 && bestMatch.category && answers[bestMatch.category]) {
        return answers[bestMatch.category];
      }
    }
 
    const topMatches = getTopScoredCategories(scores, 3);
    if (lang === 'ne') {
      const prompts = topMatches.length ? topMatches : ['स्वास्थ्य', 'जोखिम'];
      return `❓ मैले यो स्पष्ट रूपमा बुझिन। कृपया अलिक स्पष्ट गरी लेख्नुहोस्।`;
    } else {
      return `❓ I did not fully understand that. Please rephrase your question more clearly.`;
    }
  };
 
  const fetchBackendResponse = async (userInput) => {
    const safeOfflineFallback = language === 'ne'
      ? 'अहिले च्याट सेवा उपलब्ध छैन। कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।'
      : 'Chat service is temporarily unavailable. Please try again shortly.';

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userInput,
          language,
          session_id: user?.id || user?.name || 'guest',
          memory_turns: 6
        })
      });
 
      if (!response.ok) {
        throw new Error(`Backend chat failed with ${response.status}`);
      }
 
      const data = await response.json();
      if (typeof data?.reply === 'string' && data.reply.trim()) {
        return data.reply;
      }
 
      return safeOfflineFallback;
    } catch {
      return safeOfflineFallback;
    }
  };
 
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
 
    const originalInput = inputValue;
 
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
 
    setIsLoading(true);
    const botResponse = await fetchBackendResponse(originalInput);
 
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
    
    // Refresh suggested questions
    await fetchSuggestedQuestions();
  };
 
  const handleClearChat = () => {
    if (confirm(language === 'ne' ? 'के तपाईं च्याट सफा गर्न चाहनुहुन्छ?' : 'Clear all messages?')) {
      setMessages([]);
      localStorage.removeItem(`chat_${user.name}`);
    }
  };

  const t = text;

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-50 to-slate-100">
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
          <div className="flex gap-2">
            <button 
              onClick={() => setShowQuestionGuide(!showQuestionGuide)}
              className="px-4 py-2 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
            >
              ℹ️ {t.questionGuideBtn}
            </button>
            <button 
              onClick={handleClearChat}
              className="px-4 py-2 text-sm font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition"
            >
              🗑️ {t.clearBtn}
            </button>
          </div>
        </div>
      </header>

      {/* Question Types Guide Modal */}
      {showQuestionGuide && questionGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl max-h-96 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{questionGuide.title || t.questionGuideBtn}</h2>
              <button
                onClick={() => setShowQuestionGuide(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {questionGuide.categories && questionGuide.categories.map((cat, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
                  <h3 className="font-bold text-slate-900 mb-1">
                    <span className="text-lg mr-2">{cat.emoji}</span>
                    {cat.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">{cat.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.examples && cat.examples.map((ex, exIdx) => (
                      <span key={exIdx} className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                        "{ex}"
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
 
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
        
        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                <div className="text-5xl mb-4">🤰</div>
                <p className="text-center text-base leading-relaxed max-w-sm">{t.welcome}</p>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition ${
                    message.sender === 'user'
                      ? 'bg-linear-to-r from-teal-500 to-teal-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}>
                    <p className="text-sm leading-relaxed wrap-break-word">{message.text}</p>
                    <span className={`text-xs mt-2 block opacity-70 ${
                      message.sender === 'user' ? 'text-teal-100' : 'text-slate-600'
                    }`}>{message.timestamp}</span>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl border border-slate-200 rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {!isLoading && suggestedQuestions.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-600 mb-3">{t.suggestedQuestionsTitle}</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestionClick(question)}
                    className="text-left px-3 py-2 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-lg text-sm transition truncate"
                  >
                    💬 {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form className="flex gap-3" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder={t.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-50 text-slate-900 placeholder-slate-500 disabled:opacity-50 disabled:bg-slate-100 transition"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-sm rounded-lg hover:shadow-md disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-500 transition"
          >
            {isLoading ? t.typing : t.sendBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
