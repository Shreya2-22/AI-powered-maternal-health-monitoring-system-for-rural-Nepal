import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';

export default function ChatBot({ user, language }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const messagesEndRef = useRef(null);

  // Pre-loaded suggested questions
  const suggestedQuestions = language === 'ne' ? [
    'मैले पहिलो त्रैमासिकमा किन मितली अनुभव गरिरहेँ?',
    'गर्भावस्थामा व्यायाम कति सुरक्षित छ?',
    'मेरो रक्तचापमा वृद्धि गर्दै छ, यो चिन्ताको विषय हो?',
    'प्रसवको समय नजदिकिएको सनिंग पहिचान कस्तो गरें?',
    'स्तनपान गर्दा दर्द हुँ, यो सामान्य छ?'
  ] : [
    'Why am I experiencing nausea in the first trimester?',
    'How safe is exercise during pregnancy?',
    'My blood pressure is increasing, should I be worried?',
    'How do I recognize signs that labor is approaching?',
    'I experience pain while breastfeeding, is this normal?'
  ];

  const faqItems = language === 'ne' ? [
    {
      q: 'यो चैटबट कसरी काम गर्छ?',
      a: 'यह AI-संचालित स्वास्थ्य सहायक हो जो गर्भावस्था र मातृ स्वास्थ्य सम्बन्धी प्रश्नको उत्तर दिन्छ। तपाई आफ्नो प्रश्न टाइप गर्नुहोस् वा सुझाव भएका प्रश्नहरु मध्य एकमा क्लिक गर्नुहोस्।'
    },
    {
      q: 'मैले कुन विषयहरुमा सोज्न सक्छु?',
      a: 'पोषण, लक्षणहरु, व्यायाम, प्रसव तयारी, स्तनपान, प्रसवपछिको देखभाल, र अन्य गर्भावस्था सम्बन्धी विषयहरु।'
    },
    {
      q: 'यदि मेरो प्रश्नको जवाब गलत भएमा?',
      a: 'सधैं आपनो डाक्टरसँग परामर्श गर्नुहोस्। यह चैटबट शिक्षामूलक उद्देश्यको लागि मात्र हो, चिकित्सा सलाह होइन।'
    },
    {
      q: 'यदि मेरो रोगको अवस्था आपातकालीन छ भने?',
      a: 'तुरंत आपनो डाक्टरसँग सम्पर्क गर्नुहोस् वा अस्पतालमा जानुहोस्। यह चैटबट आपातकालीन सेवा नहो।'
    },
    {
      q: 'मेरा संवाद कहाँ सेभ हुन्छन्?',
      a: 'आपनो संवाद आपनो डिभाइसमा स्थानीय रूपमा सेभ हुन्छन्। यह निजी र सुरक्षित छ।'
    }
  ] : [
    {
      q: 'How does this chatbot work?',
      a: 'This is an AI-powered health assistant that answers questions about pregnancy and maternal health. Simply type your question or click on any of the suggested questions to get instant answers.'
    },
    {
      q: 'What topics can I ask about?',
      a: 'Nutrition, pregnancy symptoms, exercise, labor preparation, breastfeeding, postpartum care, and many other pregnancy-related topics.'
    },
    {
      q: 'What if the answer seems wrong?',
      a: 'Always consult your doctor. This chatbot is for educational purposes only, not medical advice.'
    },
    {
      q: 'What if my condition is an emergency?',
      a: 'Contact your doctor immediately or go to the hospital. This chatbot is not an emergency service.'
    },
    {
      q: 'Where are my conversations saved?',
      a: 'Your conversations are saved locally on your device. They are private and secure.'
    }
  ];

  const text = language === 'ne' ? {
    title: 'स्वास्थ्य सहायक',
    subtitle: 'आपनो गर्भावस्था यात्राको लागि AI-शक्तिशाली साथी',
    back: 'फिर्ता',
    placeholder: 'आपनो प्रश्न यहाँ लेख्नुहोस्...',
    send: 'पठाउनुहोस्',
    suggested: 'सुझाव भएका प्रश्नहरु',
    howToUse: 'कसरी प्रयोग गरें',
    faq: 'प्रायः सोधिने प्रश्नहरु',
    typing: 'उत्तर खोजिरहेको छ...',
    welcome: 'आपनो स्वास्थ्य सहायकमा स्वागतम',
    welcomeText: 'मैं आपनो गर्भावस्था यात्रामा साथ छु। कुनै पनि प्रश्न सोध्नुहोस् र मैं तुरंत उत्तर दिन्छु।'
  } : {
    title: 'Health Assistant',
    subtitle: 'Your AI-powered companion for your pregnancy journey',
    back: 'Back',
    placeholder: 'Ask your question here...',
    send: 'Send',
    suggested: 'Suggested Questions',
    howToUse: 'How to Use',
    faq: 'Frequently Asked Questions',
    typing: 'Searching for answer...',
    welcome: 'Welcome to Your Health Assistant',
    welcomeText: 'I\'m here to support your pregnancy journey. Ask me anything and I\'ll provide instant answers.'
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${user.name}`);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        setMessages([]);
      }
    }
  }, [user.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchBackendResponse = async (userInput) => {
    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          language,
          session_id: user?.id || user?.name || 'guest',
          memory_turns: 6
        })
      });

      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      return data?.reply || (language === 'ne' ? 'उत्तर उपलब्ध नहो' : 'Answer not available');
    } catch {
      return language === 'ne' ? 'सेवा अस्थायी अनुपलब्ध छ। कृपया फेरि प्रयास गर्नुहोस्।' : 'Service temporarily unavailable. Please try again.';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      time: new Date().toLocaleTimeString(language === 'ne' ? 'ne-NP' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    const botReply = await fetchBackendResponse(inputValue);
    const botMessage = {
      id: Date.now() + 1,
      text: botReply,
      sender: 'bot',
      time: new Date().toLocaleTimeString(language === 'ne' ? 'ne-NP' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const finalMessages = [...updatedMessages, botMessage];
    setMessages(finalMessages);
    localStorage.setItem(`chat_${user.name}`, JSON.stringify(finalMessages));
    setIsLoading(false);
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true })), 50);
  };

  const t = text;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 sticky top-0 z-10 backdrop-blur-md bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            ← {t.back}
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{t.subtitle}</p>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col h-[600px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{t.welcome}</h3>
                  <p className="text-slate-400 max-w-sm">{t.welcomeText}</p>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md rounded-2xl p-4 shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none'
                          : 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600'
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                        <span className={`text-xs mt-2 block opacity-60 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 text-slate-300 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-600">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 p-4 bg-slate-800 rounded-b-2xl">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  placeholder={t.placeholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-slate-500 disabled:opacity-50 transition"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm rounded-xl hover:shadow-lg disabled:opacity-50 disabled:from-slate-600 disabled:to-slate-600 transition"
                >
                  {isLoading ? t.typing : t.send}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Suggested Questions & FAQ */}
        <div className="lg:col-span-1 space-y-6">
          {/* Suggested Questions */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">✨</span> {t.suggested}
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg border border-slate-600 hover:border-cyan-500 transition group"
                >
                  <span className="text-cyan-400 group-hover:text-cyan-300 mr-2">→</span>
                  {question.substring(0, 35)}...
                </button>
              ))}
            </div>
          </div>

          {/* How to Use */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2">
              <span className="text-xl">📖</span> {t.howToUse}
            </h3>
            <ol className="space-y-2 text-sm text-slate-300">
              <li><span className="font-bold text-cyan-400">1.</span> Click a suggested question OR</li>
              <li><span className="font-bold text-cyan-400">2.</span> Type your own question</li>
              <li><span className="font-bold text-cyan-400">3.</span> Press "Send" to get instant answer</li>
              <li><span className="font-bold text-cyan-400">4.</span> Ask follow-up questions</li>
              <li><span className="font-bold text-cyan-400">5.</span> Always consult your doctor</li>
            </ol>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-xl">❓</span> {t.faq}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border border-slate-600 rounded-lg overflow-hidden hover:border-cyan-500 transition">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full px-3 py-2 text-left text-sm font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 transition flex items-center justify-between"
                  >
                    <span>{item.q}</span>
                    <span className={`text-xs transition-transform ${expandedFAQ === idx ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-3 py-2 bg-slate-750 text-xs text-slate-400 border-t border-slate-600">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
