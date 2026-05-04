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

  const suggestedQuestions = language === 'ne' ? [
    'मैले पहिलो त्रैमासिकमा किन मितली अनुभव गरिरहेँ?',
    'गर्भावस्थामा व्यायाम कति सुरक्षित छ?',
    'मेरो रक्तचापमा वृद्धि गर्दै छ, सुरक्षित छ?',
    'प्रसवको संकेत कस्तो पहिचान गरें?',
    'स्तनपान गर्दा दर्द हुँ, यो सामान्य छ?'
  ] : [
    'Why am I experiencing nausea in the first trimester?',
    'How safe is exercise during pregnancy?',
    'My blood pressure is increasing, is it safe?',
    'How do I recognize signs that labor is approaching?',
    'I experience pain while breastfeeding, is this normal?'
  ];

  const faqItems = language === 'ne' ? [
    { q: 'यो चयटबट कसरी काम गर्छ?', a: 'यो AI-संचालित चयटबट तपाइंको गर्भावस्था सम्बन्धी प्रश्नहरूको उत्तर दिन प्रशिक्षित छ।' },
    { q: 'मले कुन विषयहरूको बारेमा सोध्न सक्छु?', a: 'पोषण, व्यायाम, लक्षण, प्रसव तयारी र अन्य गर्भावस्था सम्बन्धी विषयहरू।' },
    { q: 'उत्तर गलत भएमा?', a: 'सधैं आपनो डाक्टरसँग परामर्श गर्नुहोस्। यो चयटबट चिकित्सा सल्लाहको विकल्प होइन।' },
    { q: 'आपतकालीन अवस्थामा के गर्नु?', a: 'यो आपतकालीन सेवा होइन। आपतकाल भएमा तुरन्त अस्पताल जानुहोस्।' },
    { q: 'मेरो कुरा गोप्य राखिन्छ?', a: 'हाँ, आपनो सम्पूर्ण डेटा सुरक्षित र गोप्य राखिन्छ।' }
  ] : [
    { q: 'How does this chatbot work?', a: 'This AI-powered chatbot is trained to answer your pregnancy-related questions with evidence-based guidance.' },
    { q: 'What topics can I ask about?', a: 'Nutrition, exercise, symptoms, delivery preparation, and other pregnancy-related topics.' },
    { q: 'What if the answer seems wrong?', a: 'Always consult your doctor. This chatbot is not a substitute for medical advice.' },
    { q: 'What if it is an emergency?', a: 'This is not an emergency service. Go to hospital immediately in emergencies.' },
    { q: 'Is my data private?', a: 'Yes, all your data is kept secure and confidential.' }
  ];

  const text = language === 'ne' ? {
    title: 'स्वास्थ्य सहायक',
    subtitle: 'आपनो गर्भावस्था यात्राको लागि AI-संचालित साथी',
    back: 'फिर्ता',
    typePlaceholder: 'आपनो प्रश्न यहाँ लेख्नुहोस्...',
    send: 'पठाउनुहोस्',
    suggested: 'सुझाव गरिएका प्रश्नहरू',
    howToUse: 'यसलाई कसरी प्रयोग गरें',
    faq: 'सामान्य प्रश्नहरू',
    steps: ['सुझाव गरिएको प्रश्नमा क्लिक गर्नुहोस्', 'वा आफ्नो प्रश्न लेख्नुहोस्', 'पठाउनुहोस् बटनमा क्लिक गर्नुहोस्', 'अनुवर्ती प्रश्नहरू सोध्नुहोस्', 'सधैं डाक्टरसँग परामर्श गर्नुहोस्']
  } : {
    title: 'Health Assistant',
    subtitle: 'Your AI-powered companion for your pregnancy journey',
    back: 'Back',
    typePlaceholder: 'Ask your question here...',
    send: 'Send',
    suggested: 'Suggested Questions',
    howToUse: 'How to Use',
    faq: 'Frequently Asked Questions',
    steps: ['Click a suggested question', 'Or type your own', 'Press Send', 'Ask follow-ups', 'Always consult your doctor']
  };

  useEffect(() => {
    const storedMessages = localStorage.getItem(`chat_history_${user?.name}`);
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        setMessages([]);
      }
    }
  }, [user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(`chat_history_${user?.name}`, JSON.stringify(messages));
  }, [messages, user?.name]);

  const handleSendMessage = async (question) => {
    const messageText = question || inputValue.trim();
    if (!messageText) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          user_id: user?.id || user?.name,
          language: language,
          chat_history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = { role: 'assistant', content: data.response || 'I understand your concern.' };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            ← {text.back}
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{text.title}</h1>
            <p className="text-xs text-slate-600 mt-1">{text.subtitle}</p>
          </div>
          <div style={{ width: '100px' }}></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Chat Window - Compact */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg mb-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-96">
            
            {/* Messages Area */}
            <div className="lg:col-span-2 border-r border-slate-200 flex flex-col">
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💭</div>
                      <p className="text-slate-500 text-sm">Start chatting...</p>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-none' 
                        : 'bg-slate-200 text-slate-900 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-200 px-4 py-2 rounded-lg rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Access Sidebar */}
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-5 flex flex-col gap-3 overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-blue-700 mb-2 uppercase">Quick Actions</p>
                {suggestedQuestions.slice(0, 3).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left text-xs px-2 py-2 bg-white hover:bg-blue-100 text-slate-700 rounded transition mb-2 line-clamp-2 border border-blue-200 hover:border-blue-400"
                  >
                    ▸ {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={text.typePlaceholder}
                className="flex-1 bg-white border-2 border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-400 disabled:to-slate-400 transition text-sm"
              >
                {text.send}
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid - All visible at once */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Suggested Questions */}
          <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg p-6">
            <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> {text.suggested}
            </h3>
            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left text-sm px-3 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-slate-800 rounded-lg transition border border-blue-200 hover:border-blue-400 font-medium"
                >
                  → {q}
                </button>
              ))}
            </div>
          </div>

          {/* How to Use */}
          <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6">
            <h3 className="text-lg font-bold text-purple-600 mb-4 flex items-center gap-2">
              <span className="text-2xl">📖</span> {text.howToUse}
            </h3>
            <ol className="space-y-3">
              {text.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                  <span className="text-sm text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl border-2 border-green-200 shadow-lg p-6">
            <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
              <span className="text-2xl">❓</span> {text.faq}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-left flex items-center justify-between transition"
                  >
                    <p className="text-sm font-bold text-slate-800">{item.q}</p>
                    <span className={`text-green-600 transition text-lg ${expandedFAQ === idx ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-4 py-3 bg-white border-t border-green-200">
                      <p className="text-sm text-slate-700 leading-relaxed">{item.a}</p>
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
