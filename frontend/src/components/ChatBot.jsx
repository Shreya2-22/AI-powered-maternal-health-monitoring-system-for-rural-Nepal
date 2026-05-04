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
    faq: 'सामान्य प्रश्नहरू'
  } : {
    title: 'Health Assistant',
    subtitle: 'Your AI-powered companion for your pregnancy journey',
    back: 'Back',
    typePlaceholder: 'Ask your question here...',
    send: 'Send',
    suggested: 'Suggested Questions',
    howToUse: 'How to Use',
    faq: 'Frequently Asked Questions'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/50 border-b border-blue-500/20">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition"
            >
              ← {text.back}
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">{text.title}</h1>
              <p className="text-xs text-slate-400 mt-1">{text.subtitle}</p>
            </div>
            <div style={{ width: '100px' }}></div>
          </div>
        </header>

        {/* Main Container */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chat Area - 2/3 width */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl h-[600px] flex flex-col overflow-hidden">
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl mb-4">💬</div>
                        <p className="text-slate-400 text-sm">Start a conversation by asking a question</p>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-3 rounded-xl ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none' 
                          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-100 px-4 py-3 rounded-xl rounded-bl-none border border-slate-700">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-blue-500/20 p-4 bg-slate-900/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={text.typePlaceholder}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputValue.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 transition"
                    >
                      {text.send}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              
              {/* Suggested Questions */}
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <span>✨</span> {text.suggested}
                </h3>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="w-full text-left text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 rounded-lg transition line-clamp-2"
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* How to Use */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-xl rounded-xl border border-blue-500/40 p-4">
                <h3 className="text-sm font-bold text-blue-300 mb-3">📖 {text.howToUse}</h3>
                <ol className="text-xs text-slate-300 space-y-2">
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">1.</span> <span>Click a suggested question</span></li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">2.</span> <span>Or type your own</span></li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">3.</span> <span>Press Send</span></li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">4.</span> <span>Ask follow-ups</span></li>
                  <li className="flex gap-2"><span className="text-blue-400 font-bold">5.</span> <span>Always see a doctor</span></li>
                </ol>
              </div>

              {/* FAQ */}
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4 max-h-96 overflow-y-auto">
                <h3 className="text-sm font-bold text-cyan-400 mb-3">❓ {text.faq}</h3>
                <div className="space-y-2">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                        className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between transition"
                      >
                        <p className="text-xs font-semibold text-slate-300">{item.q}</p>
                        <span className={`text-slate-500 transition ${expandedFAQ === idx ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {expandedFAQ === idx && (
                        <div className="px-3 py-2 bg-slate-900 border-t border-slate-700">
                          <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
