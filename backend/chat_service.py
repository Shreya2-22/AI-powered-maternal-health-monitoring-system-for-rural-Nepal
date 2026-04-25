import re
import time
from dataclasses import dataclass
from typing import Deque, Dict, List, Optional, Tuple
from collections import deque

from chatbot_model import PregnancyChatIntentModel


@dataclass
class ChatResult:
    reply: str
    intent: str
    restricted: bool
    emergency: bool
    confidence: float
    context_used: bool
    memory_turns: int


class PregnancyChatService:
    """Rule-based maternal health chat service with strict topic guardrails."""

    def __init__(self) -> None:
        self.confidence_threshold = 0.55
        self.model_confidence_threshold = 0.52
        self.max_sessions = 500
        self.max_messages_per_session = 24
        self.session_ttl_seconds = 1800
        self.sessions: Dict[str, Deque[Dict[str, str]]] = {}
        self.session_last_active: Dict[str, float] = {}
        self.intent_model = PregnancyChatIntentModel()

        self.allowed_topics = {
            "en": [
                "pregnancy nutrition",
                "nausea",
                "bleeding",
                "blood pressure",
                "trimester care",
                "labor signs",
            ],
            "ne": [
                "गर्भावस्था पोषण",
                "मितली",
                "रक्तस्राव",
                "रक्तचाप",
                "तिनमास हेरचाह",
                "प्रसव संकेत",
            ],
        }

        self.topic_keywords = {
            "en": [
                "pregnan", "trimester", "labor", "delivery", "fetus", "baby",
                "prenatal", "antenatal", "morning sickness", "nausea", "vomit",
                "bleed", "spotting", "blood pressure", "bp", "systolic", "diastolic",
                "weight", "swelling", "edema", "heartburn", "constipation", "breathing",
                "kick", "contraction", "water broke", "breastfeed", "breastfeeding",
                "postpartum", "due date", "weeks pregnant", "iron", "hemoglobin",
            ],
            "ne": [
                "गर्भ", "गर्भावस्था", "तिनमास", "प्रसव", "डेलिभरी", "बच्चा",
                "मितली", "उल्टी", "रक्तस्राव", "रक्त", "रक्तचाप", "दबाब",
                "वजन", "सूजन", "जलन", "कब्ज", "सास", "संकुचन", "दूध",
                "स्तनपान", "हप्ता", "महिना", "हेमोग्लोबिन", "आइरन",
            ],
        }

        self.small_talk = {
            "en": {
                "greeting": "Hello. I can help with pregnancy and maternal health questions. What would you like to know?",
                "thanks": "You are welcome. Ask me any pregnancy-related question anytime.",
                "bye": "Take care. Reach out anytime for pregnancy guidance.",
                "identity": "I am the AamaSuraksha maternal health assistant. I only answer pregnancy and maternal care questions.",
                "restricted": "I can only help with pregnancy and maternal health topics. Try asking about nutrition, symptoms, trimester care, danger signs, or delivery preparation.",
                "fallback": "I could not fully understand that. Please ask in one sentence about pregnancy, for example: 'Is nausea normal in first trimester?'",
                "low_confidence": "I want to be safe and accurate. I am not confident yet. Please ask a clearer pregnancy question with specific symptom, week/month, or concern.",
                "emergency": "This may be an emergency. Please contact your doctor or go to the nearest hospital immediately.",
                "context_prefix": "From your previous pregnancy question",
            },
            "ne": {
                "greeting": "नमस्ते। म गर्भावस्था र मातृ स्वास्थ्य सम्बन्धी प्रश्नमा मद्दत गर्छु। तपाईं के जान्न चाहनुहुन्छ?",
                "thanks": "धन्यवाद। तपाईं गर्भावस्थासम्बन्धी अर्को प्रश्न सोध्न सक्नुहुन्छ।",
                "bye": "ध्यान राख्नुहोस्। गर्भावस्था सम्बन्धी मद्दत चाहिँदा फेरि सोध्नुहोस्।",
                "identity": "म AamaSuraksha मातृ स्वास्थ्य सहायक हुँ। म गर्भावस्था र मातृ हेरचाह सम्बन्धी प्रश्नको मात्र उत्तर दिन्छु।",
                "restricted": "म गर्भावस्था र मातृ स्वास्थ्यका विषयमा मात्र मद्दत गर्न सक्छु। पोषण, लक्षण, तिनमास हेरचाह, जोखिम संकेत, वा प्रसव तयारीबारे सोध्नुहोस्।",
                "fallback": "मैले स्पष्ट रूपमा बुझिन। कृपया गर्भावस्थासँग सम्बन्धित प्रश्न एक वाक्यमा सोध्नुहोस्।",
                "low_confidence": "सुरक्षित र सही उत्तर दिन म अझ निश्चित हुन चाहन्छु। कृपया प्रश्न स्पष्ट बनाउनुहोस्: लक्षण, हप्ता/महिना, वा मुख्य चिन्ता उल्लेख गर्नुहोस्।",
                "emergency": "यो आपतकालीन हुन सक्छ। तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस् वा नजिकको अस्पताल जानुहोस्।",
                "context_prefix": "तपाईंको अघिल्लो गर्भावस्था प्रश्नका आधारमा",
            },
        }

        self.responses = {
            "en": {
                "greeting": "Hello. I can help with pregnancy and maternal health questions. What would you like to know?",
                "nausea": "Nausea is common in early pregnancy. Try small frequent meals, hydration, ginger, and rest. Seek medical care if vomiting is severe or persistent.",
                "bleeding": "Bleeding in pregnancy should always be reported. Light spotting can occur, but heavy bleeding, pain, or dizziness needs urgent hospital evaluation.",
                "pain": "Mild cramps can happen, but severe or persistent abdominal pain, especially with bleeding or fever, needs urgent medical assessment.",
                "fever": "Fever during pregnancy should be taken seriously. If temperature is high or persistent, contact your doctor promptly.",
                "nutrition": "Focus on balanced meals: vegetables, fruits, lentils, protein, calcium, and iron-rich foods. Drink enough water and avoid alcohol or smoking.",
                "exercise": "Light activity like walking and prenatal yoga is usually beneficial if your doctor agrees. Avoid high-impact or risky activities.",
                "trimester": "Trimester care changes over time. In early pregnancy focus on folic acid and nausea care; later focus on fetal movement, BP checks, and delivery planning.",
                "labor": "Possible labor signs include regular painful contractions, water breaking, and bloody show. If these occur, contact your hospital immediately.",
                "breastfeeding": "Breastfeeding is best started within the first hour after birth when possible. Good latch and frequent feeding are important.",
            },
            "ne": {
                "greeting": "नमस्ते। म गर्भावस्था र मातृ स्वास्थ्य प्रश्नमा मद्दत गर्छु।",
                "nausea": "गर्भावस्थाको सुरुआती चरणमा मितली सामान्य हुन सक्छ। थोरै-थोरै खाना, पर्याप्त पानी, अदुवा, र आराम उपयोगी हुन्छ। धेरै उल्टी भए तुरुन्त डाक्टरलाई देखाउनुहोस्।",
                "bleeding": "गर्भावस्थामा रक्तस्राव भएमा सधैं स्वास्थ्यकर्मीलाई जानकारी दिनुहोस्। धेरै रक्तस्राव, पेट दुखाइ, वा चक्कर भए तुरुन्त अस्पताल जानुहोस्।",
                "pain": "हल्का पेट दुखाइ हुन सक्छ, तर धेरै वा लगातार दुखाइ भए, विशेष गरी रक्तस्राव वा ज्वरोसँग भए, तुरुन्त जाँच गराउनुहोस्।",
                "fever": "गर्भावस्थामा ज्वरो गम्भीर हुन सक्छ। उच्च ज्वरो वा लामो समय ज्वरो रहेमा तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस्।",
                "nutrition": "सन्तुलित आहार लिनुहोस्: सागसब्जी, फलफूल, दाल, प्रोटिन, क्याल्सियम र आइरनयुक्त खाना। पानी पर्याप्त पिउनुहोस्।",
                "exercise": "डाक्टरको सल्लाह अनुसार हल्का व्यायाम, हिडाइ र प्रेग्नेंसी योग लाभदायक हुन्छ। जोखिमयुक्त व्यायाम नगर्नुहोस्।",
                "trimester": "तिनमास अनुसार हेरचाह फरक हुन्छ। सुरुमा फोलिक एसिड र मितली व्यवस्थापन, पछि बच्चाको चाल, रक्तचाप जाँच, र प्रसव तयारीमा ध्यान दिनुहोस्।",
                "labor": "प्रसवका संकेतमा नियमित दुख्ने संकुचन, पानी फुट्नु, र रगत मिसिएको स्राव समावेश हुन सक्छ। यस्तो भए तुरुन्त अस्पताल सम्पर्क गर्नुहोस्।",
                "breastfeeding": "सम्भव भएसम्म जन्मपछि पहिलो घण्टाभित्र स्तनपान सुरु गर्नु राम्रो हुन्छ। सही पकड र बारम्बार खुवाउनु महत्त्वपूर्ण छ।",
            },
        }

        self.intent_keywords = {
            "greeting": {
                "en": ["hi", "hello", "hey", "namaste"],
                "ne": ["नमस्ते", "हेलो", "हाय"],
            },
            "thanks": {
                "en": ["thanks", "thank you", "thx"],
                "ne": ["धन्यवाद", "थ्यांक"],
            },
            "bye": {
                "en": ["bye", "goodbye", "see you"],
                "ne": ["बाइ", "बिदा", "फेरी भेटौं"],
            },
            "identity": {
                "en": ["who are you", "what are you", "bot"],
                "ne": ["को हौ", "को हुनुहुन्छ", "तपाईं के हो"],
            },
            "nausea": {
                "en": ["nausea", "vomit", "morning sickness"],
                "ne": ["मितली", "उल्टी", "वमन"],
            },
            "bleeding": {
                "en": ["bleeding", "spotting", "blood"],
                "ne": ["रक्तस्राव", "रगत", "खून"],
            },
            "pain": {
                "en": ["pain", "cramp", "abdominal"],
                "ne": ["दुखाइ", "दर्द", "पेट दुख"],
            },
            "fever": {
                "en": ["fever", "temperature"],
                "ne": ["ज्वरो", "बुखार", "तापक्रम"],
            },
            "nutrition": {
                "en": ["diet", "food", "nutrition", "iron", "protein"],
                "ne": ["पोषण", "खाना", "आइरन", "प्रोटिन"],
            },
            "exercise": {
                "en": ["exercise", "walk", "yoga"],
                "ne": ["व्यायाम", "हिँडाइ", "योग"],
            },
            "trimester": {
                "en": ["trimester", "months pregnant", "weeks pregnant"],
                "ne": ["तिनमास", "महिना", "हप्ता"],
            },
            "labor": {
                "en": ["labor", "contraction", "water broke", "delivery"],
                "ne": ["प्रसव", "संकुचन", "पानी फुट्यो", "डेलिभरी"],
            },
            "breastfeeding": {
                "en": ["breastfeeding", "breastfeed", "milk"],
                "ne": ["स्तनपान", "दूध", "निप्पल"],
            },
        }

        self.emergency_patterns = {
            "en": [
                "heavy bleeding", "severe pain", "unconscious", "can't breathe",
                "cannot breathe", "chest pain", "fainting", "emergency",
            ],
            "ne": [
                "धेरै रक्तस्राव", "अत्यधिक दुखाइ", "बेहोस", "सास फेर्न गाह्रो",
                "आपतकाल", "गम्भीर",
            ],
        }

        # Immediate red-flag classifier (runs before intent scoring).
        self.red_flag_patterns = {
            "en": {
                "critical_bleeding": ["heavy bleeding", "soaking pad", "passing clots"],
                "respiratory_distress": ["can't breathe", "cannot breathe", "breathless at rest"],
                "neurologic_risk": ["seizure", "fits", "unconscious", "fainted"],
                "fetal_warning": ["no fetal movement", "reduced fetal movement", "baby not moving"],
                "severe_pain": ["severe abdominal pain", "unbearable pain", "labor before time"],
            },
            "ne": {
                "critical_bleeding": ["धेरै रक्तस्राव", "धेरै रगत बग्यो"],
                "respiratory_distress": ["सास फेर्न गाह्रो", "सास रोकिने"],
                "neurologic_risk": ["बेहोस", "दौरा", "झट्का"],
                "fetal_warning": ["बच्चा चलेन", "भ्रूण नचल्नु", "चाल कम भयो"],
                "severe_pain": ["अत्यधिक दुखाइ", "असह्य पेट दुखाइ"],
            },
        }

        self.follow_up_markers = {
            "en": ["what about", "and now", "this also", "same issue", "more about this", "and this"],
            "ne": ["अब", "त्यो पनि", "यसको बारेमा", "त्यसैको", "थप"],
        }

    def _normalize(self, text: str) -> str:
        return re.sub(r"\s+", " ", re.sub(r"[^\w\s\u0900-\u097F]", " ", str(text).lower())).strip()

    def _language(self, language: str) -> str:
        return "ne" if str(language).lower().startswith("ne") else "en"

    def _match_any(self, message: str, patterns: List[str]) -> bool:
        return any(pattern in message for pattern in patterns)

    def _contains_phrase(self, message: str, phrase: str) -> bool:
        escaped = re.escape(phrase)
        return re.search(rf"(?<!\w){escaped}(?!\w)", message) is not None

    def _tokens(self, message: str) -> List[str]:
        return [token for token in message.split(" ") if token]

    def _is_pregnancy_topic(self, message: str, lang: str) -> bool:
        return self._match_any(message, self.topic_keywords[lang])

    def _session_key(self, session_id: Optional[str]) -> str:
        key = self._normalize(session_id or "global")
        return key if key else "global"

    def _get_session(self, session_id: Optional[str]) -> Deque[Dict[str, str]]:
        key = self._session_key(session_id)
        if key not in self.sessions:
            if len(self.sessions) >= self.max_sessions:
                oldest_key = next(iter(self.sessions))
                self.sessions.pop(oldest_key, None)
                self.session_last_active.pop(oldest_key, None)
            self.sessions[key] = deque(maxlen=self.max_messages_per_session)
        self.session_last_active[key] = time.time()
        return self.sessions[key]

    def _cleanup_inactive_sessions(self) -> int:
        now = time.time()
        expired = [
            sid for sid, last_seen in self.session_last_active.items()
            if (now - last_seen) > self.session_ttl_seconds
        ]
        for sid in expired:
            self.sessions.pop(sid, None)
            self.session_last_active.pop(sid, None)
        return len(expired)

    def _classify_red_flag(self, message: str, lang: str) -> Optional[str]:
        for flag_label, patterns in self.red_flag_patterns[lang].items():
            if self._match_any(message, patterns):
                return flag_label
        return None

    def _remember(self, session: Deque[Dict[str, str]], role: str, text: str, intent: str) -> None:
        session.append({
            "role": role,
            "text": text,
            "intent": intent,
        })

    def _last_assistant_intent(self, session: Deque[Dict[str, str]], memory_turns: int) -> Optional[str]:
        recent_window = list(session)[-(memory_turns * 2):]
        for item in reversed(recent_window):
            if item.get("role") == "assistant":
                return item.get("intent")
        return None

    def _is_follow_up(self, message: str, lang: str) -> bool:
        return self._match_any(message, self.follow_up_markers[lang])

    def _detect_direct_small_talk(self, message: str, lang: str) -> Optional[str]:
        token_count = len(self._tokens(message))
        for intent in ("greeting", "thanks", "bye", "identity"):
            for phrase in self.intent_keywords[intent][lang]:
                if self._contains_phrase(message, phrase) and token_count <= 5:
                    return intent
        return None

    def _keyword_confidence_boost(self, intent: str, message: str, lang: str) -> float:
        phrases = self.intent_keywords.get(intent, {}).get(lang, [])
        for phrase in phrases:
            if self._contains_phrase(message, phrase):
                return 0.72 if " " in phrase else 0.66
        return 0.0

    def _detect_intent(self, message: str, lang: str) -> Tuple[str, Dict[str, float], float]:
        model_result = self.intent_model.predict(message)
        scores = {intent: score for intent, score in model_result.top_intents}
        return model_result.intent, scores, model_result.confidence

    def answer(
        self,
        message: str,
        language: str = "en",
        session_id: str = "global",
        memory_turns: int = 6,
    ) -> ChatResult:
        lang = self._language(language)
        self._cleanup_inactive_sessions()
        normalized = self._normalize(message)
        session = self._get_session(session_id)
        safe_turns = max(1, min(10, int(memory_turns or 6)))

        if not normalized:
            reply = self.small_talk[lang]["fallback"]
            self._remember(session, "assistant", reply, "fallback")
            return ChatResult(reply, "fallback", False, False, 0.0, False, safe_turns)

        if len(normalized) > 600:
            normalized = normalized[:600]

        # Guardrail 1: immediate red-flag classifier and emergency escalation.
        red_flag = self._classify_red_flag(normalized, lang)
        if red_flag is not None or self._match_any(normalized, self.emergency_patterns[lang]):
            reply = self.small_talk[lang]["emergency"]
            self._remember(session, "user", normalized, red_flag or "emergency_signal")
            self._remember(session, "assistant", reply, "emergency")
            return ChatResult(reply, "emergency", False, True, 1.0, False, safe_turns)

        direct_small_talk = self._detect_direct_small_talk(normalized, lang)
        if direct_small_talk is not None:
            reply = self.small_talk[lang][direct_small_talk]
            self._remember(session, "user", normalized, direct_small_talk)
            self._remember(session, "assistant", reply, direct_small_talk)
            return ChatResult(reply, direct_small_talk, False, False, 0.95, False, safe_turns)

        if self._is_follow_up(normalized, lang):
            prior_intent = self._last_assistant_intent(session, safe_turns)
            if prior_intent in self.responses[lang]:
                prefix = self.small_talk[lang]["context_prefix"]
                reply = f"{prefix}: {self.responses[lang][prior_intent]}"
                self._remember(session, "user", normalized, "follow_up")
                self._remember(session, "assistant", reply, prior_intent)
                return ChatResult(reply, prior_intent, False, False, 0.88, True, safe_turns)

        if not self._is_pregnancy_topic(normalized, lang):
            reply = self.small_talk[lang]["restricted"]
            self._remember(session, "user", normalized, "restricted")
            self._remember(session, "assistant", reply, "restricted")
            return ChatResult(reply, "restricted", True, False, 0.0, False, safe_turns)

        best_intent, scores, confidence = self._detect_intent(normalized, lang)
        is_topic = self._is_pregnancy_topic(normalized, lang)

        confidence = max(confidence, self._keyword_confidence_boost(best_intent, normalized, lang))

        context_used = False

        # Strict confidence threshold with safer fallback
        if confidence < self.confidence_threshold or confidence < self.model_confidence_threshold:
            reply = self.small_talk[lang]["low_confidence"]
            self._remember(session, "user", normalized, "low_confidence")
            self._remember(session, "assistant", reply, "low_confidence")
            return ChatResult(reply, "low_confidence", False, False, confidence, context_used, safe_turns)

        # Normal pregnancy response
        if best_intent in self.responses[lang]:
            reply = self.responses[lang][best_intent]
            self._remember(session, "user", normalized, best_intent)
            self._remember(session, "assistant", reply, best_intent)
            return ChatResult(reply, best_intent, False, False, confidence, context_used, safe_turns)

        topics = ", ".join(self.allowed_topics[lang])
        if lang == "ne":
            reply = f"म यो प्रश्न पूर्ण रूपमा वर्गीकृत गर्न सकिन। कृपया फेरि सोध्नुहोस्। उदाहरण विषयहरू: {topics}"
        else:
            reply = f"I understood this is pregnancy-related but need a clearer question. You can ask about: {topics}."

        self._remember(session, "user", normalized, "fallback")
        self._remember(session, "assistant", reply, "fallback")
        return ChatResult(reply, "fallback", False, False, confidence, context_used, safe_turns)
