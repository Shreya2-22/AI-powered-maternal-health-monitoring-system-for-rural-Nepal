import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../constants';
 
// ─── Feature metadata ────────────────────────────────────────────────────────
// Covers every key the backend's feature_impact dict may use
const FACTOR_META = {
  // Friendly aliases
  haemoglobin:          { label: { en: 'Haemoglobin',           ne: 'हेमोग्लोबिन'       }, emoji: '🩸' },
  blood_pressure:       { label: { en: 'Blood pressure',        ne: 'रक्तचाप'            }, emoji: '💓' },
  age:                  { label: { en: 'Maternal age',          ne: 'मातृ उमेर'          }, emoji: '👤' },
  weight_gain:          { label: { en: 'Weight gain',           ne: 'वजन वृद्धि'         }, emoji: '⚖️' },
  weight_gain_kg:       { label: { en: 'Weight gain',           ne: 'वजन वृद्धि'         }, emoji: '⚖️' },
  visit_frequency:      { label: { en: 'Visit frequency',       ne: 'जाँच भ्रमण'        }, emoji: '📅' },
  blood_sugar:          { label: { en: 'Blood sugar',           ne: 'रगतमा चिनी'        }, emoji: '🧪' },
  // Raw backend feature names
  systolic_bp:          { label: { en: 'Systolic blood pressure',  ne: 'सिस्टोलिक रक्तचाप'  }, emoji: '💓' },
  diastolic_bp:         { label: { en: 'Diastolic blood pressure', ne: 'डाइस्टोलिक रक्तचाप' }, emoji: '💓' },
  avg_systolic:         { label: { en: 'Avg. systolic BP',         ne: 'औसत सिस्टोलिक'       }, emoji: '📈' },
  avg_diastolic:        { label: { en: 'Avg. diastolic BP',        ne: 'औसत डाइस्टोलिक'      }, emoji: '📉' },
  weight_kg:            { label: { en: 'Body weight',              ne: 'शरीरको तौल'          }, emoji: '⚖️' },
  weeks_pregnant:       { label: { en: 'Weeks pregnant',           ne: 'गर्भावस्था हप्ता'    }, emoji: '🤰' },
  days_between_visits:  { label: { en: 'Days between visits',      ne: 'भ्रमण बीचको दिन'    }, emoji: '📅' },
  prev_complications:   { label: { en: 'Previous complications',   ne: 'पहिलेका जटिलता'     }, emoji: '⚠️' },
};
 
// ─── Safely extract a number from feature_impact entries ─────────────────────
// Backend may return: a plain number, or {importance, value}, or {value}, etc.
function toNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Math.round(v);
  if (typeof v === 'object') {
    // prefer 'value' (0–100 scale), fall back to 'importance' (0–1 scale × 100)
    if (typeof v.value === 'number')      return Math.round(v.value);
    if (typeof v.importance === 'number') return Math.round(v.importance * 100);
  }
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n);
}
 
// ─── Dial SVG ────────────────────────────────────────────────────────────────
function RiskDial({ score, level }) {
  const stroke = level === 'low' ? '#639922' : level === 'medium' ? '#BA7517' : '#E24B4A';
  const r = 30, cx = 36, cy = 36;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <svg viewBox="0 0 72 72" width={72} height={72} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={cx} cy={cy} r={r}
        stroke={stroke} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx} y={cy + 5}
        textAnchor="middle"
        fontSize={13} fontWeight={600}
        fill={stroke}
        fontFamily="inherit"
      >{score}%</text>
    </svg>
  );
}
 
// ─── Bar ─────────────────────────────────────────────────────────────────────
function Bar({ value, colorClass }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-700 ${colorClass}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
 
// ─── AI Insight badge ─────────────────────────────────────────────────────────
function AIInsightBox({ riskData, language }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    if (!riskData || riskData.model_used === 'no_data') return;
 
    setLoading(true);
    setInsight(null);
 
    const facts = Object.entries(riskData.feature_impact || {})
      .map(([k, v]) => [k, toNum(v)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => FACTOR_META[k]?.label?.en || k)
      .join(', ');
 
    const recs = (riskData.recommendations || []).join(' ');
    const langNote = language === 'ne' ? 'Respond in Nepali.' : 'Respond in English.';
 
    const prompt = `You are AamaSuraksha, a warm maternal health AI for Nepal. A pregnant woman's ML risk assessment shows: risk=${riskData.risk_level} (${riskData.score}% confidence). Top risk drivers: ${facts}. Recommendations: ${recs}. Write 2 empathetic sentences directly to her: what does this result mean, and what one action should she prioritise today? No bullet points. No markdown. ${langNote}`;
 
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
      .then(r => r.json())
      .then(d => {
        const text = d.content?.find(b => b.type === 'text')?.text || '';
        setInsight(text.trim());
      })
      .catch(() => setInsight(null))
      .finally(() => setLoading(false));
  }, [riskData, language]);
 
  if (!riskData || riskData.model_used === 'no_data') return null;
 
  return (
    <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center text-white text-xs font-bold">✦</div>
        <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
          {language === 'ne' ? 'AI विश्लेषण' : 'AI Analysis'}
        </span>
      </div>
      {loading ? (
        <p className="text-sm text-violet-400 italic">
          {language === 'ne' ? 'विश्लेषण गर्दै...' : 'Generating personalised insight…'}
        </p>
      ) : insight ? (
        <p className="text-sm text-violet-800 leading-relaxed">{insight}</p>
      ) : (
        <p className="text-sm text-violet-400 italic">
          {language === 'ne' ? 'विश्लेषण उपलब्ध छैन।' : 'AI insight unavailable. See recommendations below.'}
        </p>
      )}
    </div>
  );
}
 
// ─── Main component ───────────────────────────────────────────────────────────
export default function RiskAssessment({ user, language }) {
  const navigate = useNavigate();
  const [riskData, setRiskData]       = useState(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
 
  // ── i18n ──────────────────────────────────────────────────────────────────
  const T = {
    en: {
      title:       'Risk Assessment',
      back:        'Back',
      yourRisk:    'Your Pregnancy Risk',
      noData:      'Add a health record first so the model can assess your risk.',
      noDataSub:   'We need at least one blood pressure and weight reading.',
      factors:     'Clinical risk drivers',
      probBreakdown: 'Risk probability',
      recs:        'Recommendations',
      recalc:      'Recalculate',
      loading:     'Calculating risk profile…',
      lastUpdated: 'Last updated',
      cached:      'cached',
      ml:          'ML · Random Forest',
      rules:       'Rule-based',
      confidence:  'Model confidence',
      low:         'Low Risk', medium: 'Medium Risk', high: 'High Risk',
      lowSub:      'Pregnancy is progressing well. Keep up regular checkups.',
      medSub:      'Some factors need attention. Follow recommendations carefully.',
      highSub:     'Elevated risk. Please consult your healthcare provider soon.',
    },
    ne: {
      title:       'जोखिम मूल्यांकन',
      back:        'फिर्ता',
      yourRisk:    'तपाईंको गर्भावस्था जोखिम',
      noData:      'मोडलले जोखिम मूल्यांकन गर्न कम्तिमा एउटा स्वास्थ्य रेकर्ड चाहिन्छ।',
      noDataSub:   'रक्तचाप र तौल रेकर्ड थप्नुहोस्।',
      factors:     'जोखिम कारकहरू',
      probBreakdown: 'जोखिम सम्भावना',
      recs:        'सिफारिसहरू',
      recalc:      'पुनः गणना',
      loading:     'जोखिम प्रोफाइल गणना हुँदैछ…',
      lastUpdated: 'अन्तिम अपडेट',
      cached:      'क्याश',
      ml:          'ML · रेन्डम फरेस्ट',
      rules:       'नियम-आधारित',
      confidence:  'मोडल आत्मविश्वास',
      low:         'कम जोखिम', medium: 'मध्यम जोखिम', high: 'उच्च जोखिम',
      lowSub:      'गर्भावस्था राम्रो छ। नियमित जाँच जारी राख्नुहोस्।',
      medSub:      'केही कारकहरूमा ध्यान दिन जरुरी छ।',
      highSub:     'जोखिम उच्च छ। तुरुन्त स्वास्थ्यकर्मीसँग सम्पर्क गर्नुहोस्।',
    },
  };
  const t = T[language] || T.en;
 
  // ── Risk colours ──────────────────────────────────────────────────────────
  const riskConfig = {
    low:    { bg: 'bg-green-50 border-green-200',  text: 'text-green-800',  sub: 'text-green-600',  bar: 'bg-green-500',  dot: '#3B6D11' },
    medium: { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-800',  sub: 'text-amber-600',  bar: 'bg-amber-500',  dot: '#854F0B' },
    high:   { bg: 'bg-red-50 border-red-200',      text: 'text-red-800',    sub: 'text-red-600',    bar: 'bg-red-500',    dot: '#A32D2D' },
  };
 
  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRisk = useCallback(async (forceRefresh = false) => {
    const storedRaw  = localStorage.getItem(`health_records_${user.name}`);
    const cacheKey   = `risk_cache_${user.name}_${storedRaw ? storedRaw.length : 0}`;
 
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setRiskData(JSON.parse(cached));
          return;
        }
      } catch { /* ignore */ }
    }
 
    try {
      setIsLoading(true);
      setError('');
 
      const userId = user.id || user._id;
      if (!userId) { setError('User ID not found'); setIsLoading(false); return; }
 
      const healthRecords = storedRaw ? JSON.parse(storedRaw) : [];
 
      const res = await fetch(`${API}/risk-assessment`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, health_records: healthRecords }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to calculate risk');
      }
      const data = await res.json();
      setRiskData(data);
      setLastUpdated(new Date());
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
 
  useEffect(() => { fetchRisk(); }, [fetchRisk]);
 
  const lvl = riskData?.risk_level || 'low';
  const rc  = riskConfig[lvl] || riskConfig.low;
 
  // ── Helpers ───────────────────────────────────────────────────────────────
  const barColor = (v) => v < 35 ? 'bg-green-500' : v < 65 ? 'bg-amber-500' : 'bg-red-500';
 
  const factorImpactSorted = Object.entries(riskData?.feature_impact || {})
    .map(([k, v]) => [k, toNum(v)])
    .sort((a, b) => b[1] - a[1]);
 
 
 
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            ← {t.back}
          </button>
          <h1 className="text-base font-semibold text-slate-900">{t.title}</h1>
          <div className="w-16" />
        </div>
      </header>
 
      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
 
        {/* ── Loading ──────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-violet-200 border-t-violet-600 animate-spin" />
            <p className="text-sm text-slate-500">{t.loading}</p>
          </div>
        )}
 
        {/* ── Error ────────────────────────────────────────────────── */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
 
        {/* ── No data ──────────────────────────────────────────────── */}
        {!isLoading && !error && riskData?.model_used === 'no_data' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">📋</div>
            <p className="font-semibold text-slate-800 mb-1">{t.noData}</p>
            <p className="text-sm text-slate-500">{t.noDataSub}</p>
          </div>
        )}
 
        {/* ── Result ───────────────────────────────────────────────── */}
        {!isLoading && !error && riskData && riskData.model_used !== 'no_data' && (
          <>
            {/* Timestamp + model badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {lastUpdated && (
                  <>
                    {t.lastUpdated}:{' '}
                    <span className="text-slate-600 font-medium">
                      {lastUpdated.toLocaleTimeString(language === 'ne' ? 'ne-NP' : 'en-US', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {' · '}
                    <span className="text-green-600 font-medium">✓ {t.cached}</span>
                  </>
                )}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                riskData.model_used === 'ml'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {riskData.model_used === 'ml' ? t.ml : t.rules}
              </span>
            </div>
 
            {/* ── Risk banner ──────────────────────────────────────── */}
            <div className={`${rc.bg} border rounded-2xl p-5 flex items-center gap-5`}>
              <RiskDial score={riskData.score} level={lvl} />
              <div className="flex-1 min-w-0">
                <p className={`text-2xl font-bold ${rc.text} leading-tight`}>
                  {t[lvl]}
                </p>
                <p className={`text-sm ${rc.sub} mt-1 leading-snug`}>
                  {t[`${lvl}Sub`]}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {t.confidence}: <strong className="text-slate-700">{riskData.score}%</strong>
                </p>
              </div>
            </div>
 
            {/* ── AI Insight ───────────────────────────────────────── */}
            <AIInsightBox riskData={riskData} language={language} />
 
            {/* ── Feature impact ───────────────────────────────────── */}
            {factorImpactSorted.length > 0 && (() => {
              // Normalize so the highest value = 100%, others scale relative to it
              const maxVal = factorImpactSorted[0]?.[1] || 1;
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                    {t.factors}
                  </p>
                  <div className="space-y-3">
                    {factorImpactSorted.map(([key, val], i) => {
                      const meta      = FACTOR_META[key];
                      const label     = meta?.label?.[language] || meta?.label?.en || key.replace(/_/g, ' ');
                      const pct       = Math.round((val / maxVal) * 100);
                      const fillColor = pct >= 66 ? '#E24B4A' : pct >= 33 ? '#BA7517' : '#639922';
                      const bgPill    = pct >= 66 ? 'bg-red-50 text-red-700' : pct >= 33 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700';
                      return (
                        <div key={key} className="flex items-center gap-3">
                          {/* Rank */}
                          <span className="text-xs font-semibold text-slate-300 w-4 flex-shrink-0 text-right">{i + 1}</span>
                          {/* Emoji */}
                          <span className="text-sm w-5 text-center flex-shrink-0">{meta?.emoji || '•'}</span>
                          {/* Label */}
                          <span className="text-sm text-slate-700 flex-1 min-w-0 truncate capitalize">{label}</span>
                          {/* Bar */}
                          <div className="w-28 bg-slate-100 rounded-full h-2 flex-shrink-0 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: fillColor }}
                            />
                          </div>
                          {/* Badge */}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0 w-12 text-center ${bgPill}`}>
                            {val}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-300 mt-4">
                    Bar width shows relative influence. Percentages are model feature importances.
                  </p>
                </div>
              );
            })()}
 
            {/* ── Recommendations ──────────────────────────────────── */}
            {riskData.recommendations?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {t.recs}
                </p>
                <ul className="space-y-3">
                  {riskData.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: rc.dot }}
                      />
                      <span className="text-sm text-slate-700 leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
 
            {/* ── Recalculate ──────────────────────────────────────── */}
            <button
              onClick={() => fetchRisk(true)}
              className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              ↻ {t.recalc}
            </button>
 
            {/* Bottom spacer */}
            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}
 