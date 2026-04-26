import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const getHealthSummaryFromStorage = (userName) => {
  try {
    const raw = localStorage.getItem(`health_records_${userName}`);
    if (!raw) return { count: 0, latestWeight: null, latestBP: null };

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { count: 0, latestWeight: null, latestBP: null };
    }

    const latest = parsed[parsed.length - 1];
    return {
      count: parsed.length,
      latestWeight: latest.weight || null,
      latestBP: (latest.systolic && latest.diastolic) ? `${latest.systolic}/${latest.diastolic}` : null,
    };
  } catch {
    return { count: 0, latestWeight: null, latestBP: null };
  }
};
 
const Dashboard = ({ user, language, setLanguage, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentTip, setCurrentTip]               = useState(0);
  const [healthSummary]                            = useState(() => getHealthSummaryFromStorage(user.name));
  const navigate = useNavigate();
 
  const t = {
    ne: {
      greeting:'नमस्ते', sub:'तपाईंको गर्भावस्था यात्रामा स्वागत छ',
      of40:'/ ४०', weeksComplete:'हप्ता पूर्ण', tillDue:'सम्भावित मिति सम्म',
      features:'मुख्य सेवाहरू', statsTitle:'स्वास्थ्य सारांश',
      recordsLogged:'रेकर्डहरू', latestWeight:'ताजा वजन', bloodPressure:'रक्तचाप',
      emergency:'🚨 आपातकालीन मूल्यांकन', emergencySub:'तत्काल लक्षणहरू जाँच गर्नुहोस्',
      tips:'दैनिक सुझावहरू',
      tip1:'८–१० गिलास पानी पिउनुहोस्', tip2:'पर्याप्त आराम र निद्रा लिनुहोस्', tip3:'हल्का व्यायाम र योग गर्नुहोस्',
      guidelines:'स्वास्थ्य निर्देशिका', nutrition:'पोषण', exercise:'व्यायाम',
      n1:'दैनिक हरियो तरकारी खानुहोस्', n2:'क्याल्सियमयुक्त खाना खानुहोस्', n3:'प्रोटिन र फलाम पाउनुहोस्',
      e1:'हल्का हिँडाइ — ३० मिनेट', e2:'योग र स्ट्रेचिङ', e3:'पहिले डाक्टरसँग सल्लाह गर्नुहोस्',
      disclaimer:'यो एक सलाहकार उपकरण हो। सधैं डाक्टरसँग परामर्श गर्नुहोस्।',
      logout:'लग आउट', logoutConfirm:'लग आउट गर्न निश्चित हुनुहुन्छ?',
      logoutSub:'तपाईंले पुनः लगइन गर्नुपर्नेछ।', cancel:'रद्द गर्नुहोस्', kg:'किलो',
      open:'खोल्नुहोस्', addFirst:'पहिलो थप्नुहोस् →',
    },
    en: {
      greeting:'Hello', sub:'Your pregnancy companion is here',
      of40:'/ 40', weeksComplete:'Weeks', tillDue:'until due date',
      features:'Your Features', statsTitle:'Health Summary',
      recordsLogged:'Records', latestWeight:'Latest Weight', bloodPressure:'Blood Pressure',
      emergency:'🚨 Emergency Assessment', emergencySub:'Check symptoms needing immediate attention',
      tips:'Daily Tips',
      tip1:'Drink 8–10 glasses of water daily', tip2:'Get adequate rest and sleep', tip3:'Light exercise and yoga',
      guidelines:'Health Guidelines', nutrition:'Nutrition', exercise:'Exercise',
      n1:'Eat leafy vegetables daily', n2:'Include calcium-rich foods', n3:'Get protein and iron',
      e1:'Light walking — 30 minutes', e2:'Yoga and stretching', e3:'Consult your doctor first',
      disclaimer:'Advisory tool only. Always consult your doctor for medical decisions.',
      logout:'Logout', logoutConfirm:'Confirm Logout',
      logoutSub:'You will need to login again.', cancel:'Cancel', kg:'kg',
      open:'Open', addFirst:'Add first →',
    },
  }[language] || {};
 
  useEffect(() => {
    const id = setInterval(() => setCurrentTip(p => (p + 1) % 3), 4000);
    return () => clearInterval(id);
  }, []);
 
  const tips = [t.tip1, t.tip2, t.tip3];
  const weeksProgress   = user.weeks_pregnant || 0;
  const percentComplete = Math.min(100, (weeksProgress / 40) * 100);
  const daysLeft        = (() => {
    if (!user.due_date) return 0;
    return Math.max(0, Math.ceil((new Date(user.due_date) - new Date()) / 86400000));
  })();
  const trimester = weeksProgress <= 13 ? 1 : weeksProgress <= 26 ? 2 : 3;
  const trimesterColor = trimester === 1
    ? 'bg-violet-100 text-violet-700'
    : trimester === 2 ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700';
 
  // ── ALL 5 features are equally important — same card size ─────────────────
  const features = [
    {
      path:    '/health',
      icon:    '❤️',
      label_ne:'स्वास्थ्य ट्र्याकर',
      label_en:'Health Tracker',
      desc_ne: 'वजन र रक्तचाप ट्र्याक गर्नुहोस्',
      desc_en: 'Track weight & blood pressure',
      accent:  '#0F766E',
      bg:      '#F0FDFA',
      border:  '#99F6E4',
    },
    {
      path:    '/appointments',
      icon:    '📅',
      label_ne:'नियुक्तिहरू',
      label_en:'Appointments',
      desc_ne: 'जाँच तालिका व्यवस्थापन गर्नुहोस्',
      desc_en: 'Manage your checkup schedule',
      accent:  '#7C3AED',
      bg:      '#F5F3FF',
      border:  '#DDD6FE',
    },
    {
      path:    '/risk',
      icon:    '🧠',
      label_ne:'जोखिम मूल्यांकन',
      label_en:'Risk Assessment',
      desc_ne: 'ML-आधारित स्वास्थ्य विश्लेषण',
      desc_en: 'ML-powered health analysis',
      accent:  '#DC2626',
      bg:      '#FFF1F2',
      border:  '#FECDD3',
    },
    {
      path:    '/chat',
      icon:    '💬',
      label_ne:'AI च्याटबट',
      label_en:'AI Chatbot',
      desc_ne: 'स्वास्थ्य प्रश्नहरूको उत्तर पाउनुहोस्',
      desc_en: 'Get answers to health questions',
      accent:  '#0369A1',
      bg:      '#F0F9FF',
      border:  '#BAE6FD',
    },
    {
      path:    '/education',
      icon:    '📖',
      label_ne:'शिक्षा',
      label_en:'Education',
      desc_ne: 'स्वास्थ्य जानकारी र लेखहरू',
      desc_en: 'Health articles & resources',
      accent:  '#B45309',
      bg:      '#FFFBEB',
      border:  '#FDE68A',
    },
  ];
 
  const ArrowIcon = ({ color }) => (
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
      <path d="M2 8L8 2M8 2H4M8 2V6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
 
  return (
    <div style={{ fontFamily: "'DM Sans','Nunito',system-ui,sans-serif" }} className="min-h-screen bg-[#F8F7F4]">
 
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
              <path d="M28 48C28 48 8 35 8 22C8 15.373 13.373 10 20 10C23.5 10 26.5 11.5 28 14C29.5 11.5 32.5 10 36 10C42.627 10 48 15.373 48 22C48 35 28 48 28 48Z" fill="#0F766E"/>
              <circle cx="28" cy="28" r="26" stroke="#0F766E" strokeWidth="1.5" fill="none" opacity="0.25"/>
            </svg>
            <span className="font-bold text-stone-800 text-sm tracking-tight">AamaSuraksha</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
              {language === 'en' ? 'नेपाली' : 'English'}
            </button>
            <button onClick={() => setShowLogoutConfirm(true)}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              {t.logout}
            </button>
          </div>
        </div>
      </header>
 
      <main className="max-w-5xl mx-auto px-5 pb-16">
 
        {/* ── SECTION 1: WELCOME + PROGRESS ──────────────────────────────── */}
        <section className="pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-1">{t.greeting}</p>
              <h1 className="text-3xl font-bold text-stone-900 leading-tight">{user.name}</h1>
              <p className="text-stone-500 text-sm mt-1">{t.sub}</p>
            </div>
            <div className={`shrink-0 mt-1 px-3 py-1.5 rounded-full text-xs font-bold ${trimesterColor}`}>
              T{trimester}
            </div>
          </div>
 
          <div className="mt-6 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-4xl font-black text-teal-700">{weeksProgress}</span>
                <span className="text-stone-400 text-sm ml-1">{t.of40} {t.weeksComplete}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-stone-700">{daysLeft}</span>
                <p className="text-xs text-stone-400">{t.tillDue}</p>
              </div>
            </div>
            <div className="relative h-3 bg-stone-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{ width:`${percentComplete}%`, background:'linear-gradient(90deg,#0F766E 0%,#14B8A6 100%)' }}/>
              {[13,26].map(w => (
                <div key={w} className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white border-2 border-teal-400"
                  style={{ left:`${(w/40)*100}%` }}/>
              ))}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-stone-400">
              <span>Week 1</span><span>T1 · 13w</span><span>T2 · 26w</span><span>Week 40</span>
            </div>
          </div>
        </section>
 
        {/* ── SECTION 2: ALL 5 FEATURES — EQUAL SIZE ─────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.features}</h2>
 
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {features.slice(0, 3).map((f) => (
              <button key={f.path} onClick={() => navigate(f.path)}
                className="group text-left rounded-2xl p-5 border transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                style={{ background: f.bg, borderColor: f.border }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-200 group-hover:scale-110"
                  style={{ background:`${f.accent}15` }}>
                  {f.icon}
                </div>
                <p className="font-bold text-stone-800 text-sm leading-tight mb-1">
                  {language === 'ne' ? f.label_ne : f.label_en}
                </p>
                <p className="text-xs text-stone-500 leading-relaxed mb-3">
                  {language === 'ne' ? f.desc_ne : f.desc_en}
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: f.accent }}>
                  {t.open} <ArrowIcon color={f.accent}/>
                </div>
              </button>
            ))}
          </div>
 
          {/* Row 2: 2 cards — SAME HEIGHT as row 1 */}
          <div className="grid grid-cols-2 gap-3">
            {features.slice(3).map((f) => (
              <button key={f.path} onClick={() => navigate(f.path)}
                className="group text-left rounded-2xl p-5 border transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                style={{ background: f.bg, borderColor: f.border }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-200 group-hover:scale-110"
                  style={{ background:`${f.accent}15` }}>
                  {f.icon}
                </div>
                <p className="font-bold text-stone-800 text-sm leading-tight mb-1">
                  {language === 'ne' ? f.label_ne : f.label_en}
                </p>
                <p className="text-xs text-stone-500 leading-relaxed mb-3">
                  {language === 'ne' ? f.desc_ne : f.desc_en}
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: f.accent }}>
                  {t.open} <ArrowIcon color={f.accent}/>
                </div>
              </button>
            ))}
          </div>
        </section>
 
        {/* ── SECTION 3: HEALTH SUMMARY ───────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.statsTitle}</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">{t.recordsLogged}</p>
              <p className="text-3xl font-black text-teal-700">{healthSummary.count || '—'}</p>
              {healthSummary.count === 0 && (
                <button onClick={() => navigate('/health')}
                  className="mt-2 text-[10px] text-teal-600 font-semibold underline underline-offset-2">
                  {t.addFirst}
                </button>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">{t.latestWeight}</p>
              {healthSummary.latestWeight
                ? <p className="text-3xl font-black text-amber-600">{healthSummary.latestWeight}<span className="text-sm font-normal text-stone-400 ml-1">{t.kg}</span></p>
                : <p className="text-2xl font-black text-stone-300">—</p>}
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">{t.bloodPressure}</p>
              {healthSummary.latestBP
                ? <p className="text-2xl font-black text-rose-600">{healthSummary.latestBP}<span className="text-[10px] font-normal text-stone-400 ml-1">mmHg</span></p>
                : <p className="text-2xl font-black text-stone-300">—</p>}
            </div>
          </div>
        </section>
 
        {/* ── SECTION 4: EMERGENCY ────────────────────────────────────────── */}
        <section className="mb-8">
          <button onClick={() => navigate('/emergency')}
            className="group w-full text-left rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all duration-200 p-5 flex items-center gap-5 shadow-sm hover:shadow-md active:scale-[0.99]">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-100 group-hover:bg-red-200 flex items-center justify-center text-2xl transition-colors">🚨</div>
            <div className="flex-1">
              <p className="font-bold text-red-800 text-base">{t.emergency}</p>
              <p className="text-sm text-red-600 mt-0.5">{t.emergencySub}</p>
            </div>
            <svg className="shrink-0 text-red-400 group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </section>
 
        {/* ── SECTION 5: ROTATING TIP ─────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.tips}</h2>
          <div className="relative bg-teal-700 rounded-2xl p-5 overflow-hidden min-h-[80px] flex items-center">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-teal-600 opacity-40"/>
            <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-teal-800 opacity-30"/>
            <p className="relative text-white font-medium text-sm leading-relaxed">{tips[currentTip]}</p>
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {tips.map((_,i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i === currentTip ? '#fff' : 'rgba(255,255,255,0.35)' }}/>
              ))}
            </div>
          </div>
        </section>
 
        {/* ── SECTION 6: GUIDELINES ───────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">{t.guidelines}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🥦</span>
                <h3 className="font-bold text-stone-800 text-sm">{t.nutrition}</h3>
              </div>
              <ul className="space-y-2.5">
                {[t.n1,t.n2,t.n3].map((item,i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 shrink-0 w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="block w-1.5 h-1.5 rounded-full bg-teal-600"/>
                    </span>
                    <span className="text-xs text-stone-600 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🧘‍♀️</span>
                <h3 className="font-bold text-stone-800 text-sm">{t.exercise}</h3>
              </div>
              <ul className="space-y-2.5">
                {[t.e1,t.e2,t.e3].map((item,i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 shrink-0 w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center">
                      <span className="block w-1.5 h-1.5 rounded-full bg-violet-600"/>
                    </span>
                    <span className="text-xs text-stone-600 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
 
        <footer className="border-t border-stone-200 pt-6 text-center">
          <p className="text-[11px] text-stone-400 leading-relaxed max-w-sm mx-auto">{t.disclaimer}</p>
          <p className="text-[10px] text-stone-300 mt-2">© 2025 AamaSuraksha</p>
        </footer>
      </main>
 
      {/* ── LOGOUT MODAL ─────────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 w-full max-w-xs">
            <p className="font-bold text-stone-900 text-base mb-1">{t.logoutConfirm}</p>
            <p className="text-sm text-stone-500 mb-6">{t.logoutSub}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition">
                {t.cancel}
              </button>
              <button onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                  else { localStorage.removeItem('aamasuraksha_user'); window.location.reload(); }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition">
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Dashboard;