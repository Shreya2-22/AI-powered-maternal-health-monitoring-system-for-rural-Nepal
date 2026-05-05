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
    { q: 'यो च्याटबट कसरी काम गर्छ?', a: 'यो AI-संचालित च्याटबट तपाईंको गर्भावस्था सम्बन्धी प्रश्नहरूको उत्तर दिन प्रशिक्षित छ।' },
    { q: 'म कुन विषयहरूको बारेमा सोध्न सक्छु?', a: 'पोषण, व्यायाम, लक्षण, प्रसव तयारी र अन्य गर्भावस्था सम्बन्धी विषयहरू।' },
    { q: 'उत्तर गलत भएमा?', a: 'सधैं तपाईंको डाक्टरसँग परामर्श गर्नुहोस्। यो च्याटबट चिकित्सा सल्लाहको विकल्प होइन।' },
    { q: 'आपतकालीन अवस्थामा के गर्नु?', a: 'यो आपतकालीन सेवा होइन। आपतकालीन अवस्था भएमा तुरुन्त अस्पताल जानुहोस्।' },
    { q: 'मेरो कुरा गोप्य राखिन्छ?', a: 'हो, तपाईंको सम्पूर्ण डेटा सुरक्षित र गोप्य राखिन्छ।' }
  ] : [
    { q: 'How does this chatbot work?', a: 'This AI-powered chatbot is trained to answer your pregnancy-related questions with evidence-based guidance.' },
    { q: 'What topics can I ask about?', a: 'Nutrition, exercise, symptoms, delivery preparation, and other pregnancy-related topics.' },
    { q: 'What if the answer seems wrong?', a: 'Always consult your doctor. This chatbot is not a substitute for medical advice.' },
    { q: 'What if it is an emergency?', a: 'This is not an emergency service. Go to hospital immediately in emergencies.' },
    { q: 'Is my data private?', a: 'Yes, all your data is kept secure and confidential.' }
  ];

  const text = language === 'ne' ? {
    title: 'स्वास्थ्य सहायक',
    subtitle: 'तपाईंको गर्भावस्था यात्राको लागि AI-संचालित साथी',
    back: 'फिर्ता',
    typePlaceholder: 'तपाईंको प्रश्न यहाँ लेख्नुहोस्...',
    send: 'पठाउनुहोस्',
    suggested: 'सुझाव गरिएका प्रश्नहरू',
    howToUse: 'यसलाई कसरी प्रयोग गरें',
    faq: 'सामान्य प्रश्नहरू',
    steps: ['सुझाव गरिएको प्रश्नमा क्लिक गर्नुहोस्', 'वा आफ्नो प्रश्न लेख्नुहोस्', 'पठाउनुहोस् बटनमा क्लिक गर्नुहोस्', 'अनुवर्ती प्रश्नहरू सोध्नुहोस्', 'सधैं डाक्टरसँग परामर्श गर्नुहोस्']
  } : {
    title: 'Health Assistant',
    subtitle: 'AI-powered companion for your pregnancy journey',
    back: 'Back',
    typePlaceholder: 'Type your question here...',
    send: 'Send',
    suggested: 'Suggested Questions',
    howToUse: 'How to Use',
    faq: 'Frequently Asked Questions',
    steps: ['Click a suggested question', 'Or type your own question', 'Click Send', 'Ask follow-ups', 'Always consult your doctor']
  };

  useEffect(() => {
    const storedMessages = localStorage.getItem(`chat_history_${user?.name}`);
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch {
        setMessages([]);
      }
    }
  }, [user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { type: 'user', text: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          language: language,
          session_id: user?.id || user?.name || 'session_' + Date.now()
        })
      });

      const data = await response.json();
      const botMessage = { type: 'bot', text: data.reply || 'I could not generate a response.' };
      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`chat_history_${user?.name}`, JSON.stringify(updatedMessages));
    } catch (error) {
      const errorMessage = { type: 'bot', text: 'Error connecting to server.' };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = async (question) => {
    setInputValue(question);
    const userMessage = { type: 'user', text: question };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          language: language,
          session_id: user?.id || user?.name || 'session_' + Date.now()
        })
      });

      const data = await response.json();
      const botMessage = { type: 'bot', text: data.reply || 'I could not generate a response.' };
      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`chat_history_${user?.name}`, JSON.stringify(updatedMessages));
      setInputValue('');
    } catch (error) {
      const errorMessage = { type: 'bot', text: 'Error connecting to server.' };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-2 border-blue-100 shadow-sm">
        <div className="max-w-full px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            ← {text.back}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {text.title}
            </h1>
            <p className="text-xs text-slate-500">{text.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Layout: Chat (2/3) + Info Panel (1/3) */}
      <div className="flex gap-4 h-[calc(100vh-80px)] p-4 max-w-full">
        {/* Left: Chat Window (2/3) */}
        <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-lg border-2 border-blue-100 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-3">💭</div>
                <p className="text-slate-500 font-medium">{language === 'ne' ? 'कुनै संदेश छैन' : 'No messages yet'}</p>
                <p className="text-xs text-slate-400 mt-1">{language === 'ne' ? 'एक प्रश्नको साथ शुरु गर्नुहोस्' : 'Start with a question'}</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                      msg.type === 'user'
                        ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-br-none'
                        : 'bg-slate-200 text-slate-900 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg rounded-bl-none text-sm animate-bounce">
                  {language === 'ne' ? 'टाइप गर्दै...' : 'Typing...'}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t-2 border-blue-100 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={text.typePlaceholder}
              className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="px-5 py-2 bg-linear-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-lg active:scale-95 transition disabled:opacity-50"
            >
              {text.send}
            </button>
            <button
              onClick={() => setMessages([])}
              disabled={messages.length === 0 || isLoading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={language === 'ne' ? 'सबै संदेशहरू हटाउनुहोस्' : 'Clear all messages'}
            >
              {language === 'ne' ? 'साफ गर्नुहोस्' : 'Clear'}
            </button>
          </div>
        </div>

        {/* Right: Info Panel (1/3) */}
        <div className="w-1/3 flex flex-col gap-3 overflow-y-auto">
          {/* Suggested Questions */}
          <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200 shadow-md">
            <h3 className="font-bold text-blue-700 mb-3 text-sm">{text.suggested}</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="w-full text-left text-xs px-3 py-2 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 transition text-slate-900 font-medium hover:border-blue-400"
                >
                  → {q}
                </button>
              ))}
            </div>
          </div>

          {/* How to Use */}
          <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-md">
            <h3 className="font-bold text-purple-700 mb-3 text-sm">{text.howToUse}</h3>
            <ol className="space-y-2">
              {text.steps.map((step, idx) => (
                <li key={idx} className="flex gap-2 items-start text-xs">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-500 text-white rounded-full font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* FAQ */}
          <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-md">
            <h3 className="font-bold text-green-700 mb-3 text-sm">{text.faq}</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full text-left px-3 py-2 flex justify-between items-center hover:bg-green-50 transition text-xs font-medium text-slate-900"
                  >
                    <span>{item.q}</span>
                    <span className={`transform transition ${expandedFAQ === idx ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {expandedFAQ === idx && (
                    <div className="px-3 py-2 bg-green-50 border-t border-green-200 text-xs text-slate-700">
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
