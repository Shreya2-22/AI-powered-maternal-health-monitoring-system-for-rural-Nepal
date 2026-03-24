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
      welcome: 'नमस्ते! मैं आपकी गर्भावस्था से संबंधित प्रश्नों का उत्तर देने के लिए यहाँ हूँ। कृपया अपनी समस्या के बारे में बताएं।'
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

  // Knowledge base with bilingual responses
  const getResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();

    const responses = {
      ne: {
        greeting: ['नमस्ते', 'हाउ', 'हेलो', 'हाय'],
        bleeding: ['रक्त', 'रक्तस्राव', 'खून'],
        nausea: ['मितली', 'उल्टी', 'मतली'],
        pain: ['दर्द', 'दुःख', 'पीड़ा'],
        fever: ['बुखार', 'तापमान', 'गर्म'],
        fatigue: ['थकान', 'थक', 'कमजोरी'],
        weight: ['वजन', 'वेट', 'मोटापा'],
        exercise: ['व्यायाम', 'खेल', 'कसरत'],
        diet: ['खाना', 'डाइट', 'भोजन'],
        delivery: ['प्रसव', 'जन्म', 'बच्चा']
      },
      en: {
        greeting: ['hello', 'hi', 'hey', 'hola'],
        bleeding: ['bleeding', 'bleed', 'blood', 'heavy'],
        nausea: ['nausea', 'vomit', 'sick', 'queasy'],
        pain: ['pain', 'hurt', 'ache', 'cramp'],
        fever: ['fever', 'temperature', 'hot'],
        fatigue: ['fatigue', 'tired', 'exhausted', 'weak'],
        weight: ['weight', 'gain', 'heavy'],
        exercise: ['exercise', 'workout', 'walk', 'activity'],
        diet: ['diet', 'food', 'eat', 'nutrition'],
        delivery: ['delivery', 'birth', 'labor', 'pregnant']
      }
    };

    const answerBase = {
      ne: {
        greeting: 'आपका साथ बात करके खुशी हूँ! मैं आपकी सेवा के लिए यहाँ हूँ।',
        bleeding: 'यदि आप भारी रक्तस्राव का अनुभव कर रहे हैं, तो तुरंत अपने डॉक्टर से संपर्क करें। यह आपातकालीन स्थिति हो सकती है।',
        nausea: 'गर्भावस्था में मितली आम है। धीरे-धीरे खाएं, अदरक की चाय लें, और अपने डॉक्टर से सलाह लें।',
        pain: 'हल्का पेट दर्द आम है, लेकिन गंभीर दर्द के लिए तुरंत डॉक्टर से मिलें।',
        fever: 'यदि आपको बुखार है, तो हल्का व्यायाम करें और खूब पानी पिएं। अगर बुखार 39°C से अधिक है तो डॉक्टर से संपर्क करें।',
        fatigue: 'गर्भावस्था में थकान सामान्य है। पर्याप्त आराम लें, स्वस्थ भोजन करें, और हल्का व्यायाम करें।',
        weight: 'गर्भावस्था में वजन बढ़ना सामान्य है। आपके डॉक्टर से सुझाव लें कि स्वस्थ वजन बढ़ना क्या है।',
        exercise: 'हल्का व्यायाम (जैसे चलना, योग) सुरक्षित है। अपने डॉक्टर से सलाह लें और अत्यधिक परिश्रम न करें।',
        diet: 'पोषक भोजन खाएं: दूध, अंडे, हरी सब्जियाँ, फल और प्रोटीन युक्त खाने मदद करते हैं।',
        delivery: 'प्रसव यात्रा अलग होती है हर महिला के लिए। अपने डॉक्टर से प्रसव योजना के बारे में बात करें।'
      },
      en: {
        greeting: 'I\'m happy to chat with you! How can I help you today?',
        bleeding: 'If you\'re experiencing heavy bleeding, contact your doctor immediately. This could be an emergency.',
        nausea: 'Nausea is common in pregnancy. Eat slowly, try ginger tea, and consult your doctor.',
        pain: 'Mild abdominal pain is normal, but severe pain requires immediate medical attention.',
        fever: 'If you have a fever, rest and drink plenty of water. Contact your doctor if fever exceeds 39°C.',
        fatigue: 'Tiredness is common in pregnancy. Get enough rest, eat healthy foods, and do light exercise.',
        weight: 'Weight gain during pregnancy is normal. Ask your doctor about healthy weight gain.',
        exercise: 'Light exercise (like walking, yoga) is safe. Consult your doctor and avoid overexertion.',
        diet: 'Eat nutritious foods: milk, eggs, vegetables, fruits, and protein-rich foods help tremendously.',
        delivery: 'Delivery experiences differ for every woman. Discuss your birth plan with your doctor.'
      }
    };

    const lang = language;
    const keywordMap = responses[lang];
    const answers = answerBase[lang];

    // Check keywords
    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return answers[category];
      }
    }

    // Default response
    return lang === 'ne'
      ? 'मुझे समझ में नहीं आया। कृपया स्पष्ट करें या प्रसव-संबंधित कोई अन्य प्रश्न पूछें।'
      : 'I didn\'t understand that. Please clarify or ask a pregnancy-related question.';
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputValue,
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
      const botResponse = getResponse(inputValue);
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
    if (confirm(language === 'ne' ? 'क्या आप चैट साफ करना चाहते हैं?' : 'Clear all messages?')) {
      setMessages([]);
      localStorage.removeItem(`chat_${user.name}`);
    }
  };

  const t = text[language];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-linear-to-r from-purple-500 to-pink-500 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 font-semibold transition-all"
          >
            {t.back}
          </button>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <button 
            onClick={handleClearChat}
            className="bg-red-500 hover:bg-red-600 rounded-lg px-3 py-2 font-semibold transition-all"
          >
            {t.clearBtn}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-sm p-4 mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-center">{t.welcome}</p>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  <p>{message.text}</p>
                  <span className={`text-xs mt-1 block ${
                    message.sender === 'user' ? 'text-white/70' : 'text-gray-600'
                  }`}>{message.timestamp}</span>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <span className="inline-block w-2 h-2 bg-gray-600 rounded-full animate-bounce mr-1"></span>
                <span className="inline-block w-2 h-2 bg-gray-600 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.2s' }}></span>
                <span className="inline-block w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="flex gap-2" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder={t.placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {t.sendBtn}
          </button>
        </form>
      </div>
    </div>
  );
}