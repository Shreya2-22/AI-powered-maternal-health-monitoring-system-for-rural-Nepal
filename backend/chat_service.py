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
    top_intents: Optional[List[Tuple[str, float]]] = None
    model_used: str = "tfidf_logreg_v1"
    safety_path: str = ""


class PregnancyChatService:
    """Rule-based maternal health chat service with strict topic guardrails."""

    def __init__(self) -> None:
        self.confidence_threshold = 0.55
        self.model_confidence_threshold = 0.52
        self.max_sessions = 500
        self.max_messages_per_session = 24
        self.session_ttl_seconds = 1800
        self.max_messages_per_minute = 20
        self.request_window_seconds = 60
        self.sessions: Dict[str, Deque[Dict[str, str]]] = {}
        self.session_last_active: Dict[str, float] = {}
        self.session_request_times: Dict[str, Deque[float]] = {}
        self.intent_model = PregnancyChatIntentModel()

        self.allowed_topics = {
            "en": [
                "pregnancy nutrition",
                "nausea",
                "bleeding",
                "blood pressure",
                "trimester care",
                "labor signs",
                "mother recovery",
                "newborn care",
                "breastfeeding",
            ],
            "ne": [
                "गर्भावस्था पोषण",
                "मितली",
                "रक्तस्राव",
                "रक्तचाप",
                "तिनमास हेरचाह",
                "प्रसव संकेत",
                "आमा हेरचाह",
                "नवजात हेरचाह",
                "स्तनपान",
            ],
        }

        self.topic_keywords = {
            "en": [
                "pregnan", "trimester", "labor", "delivery", "fetus", "baby",
                "prenatal", "antenatal", "morning sickness", "nausea", "vomit",
                "bleed", "spotting", "blood pressure", "bp", "systolic", "diastolic",
                "weight", "swelling", "edema", "heartburn", "constipation", "breathing",
                "headache", "head ache", "migraine",
                "kick", "contraction", "water broke", "breastfeed", "breastfeeding",
                "postpartum", "due date", "weeks pregnant", "iron", "hemoglobin",
                "mother", "motherhood", "newborn", "infant", "c section", "cesarean",
                "lactation", "nipple pain", "baby movement", "baby care", "postnatal",
            ],
            "ne": [
                "गर्भ", "गर्भावस्था", "तिनमास", "प्रसव", "डेलिभरी", "बच्चा",
                "मितली", "उल्टी", "रक्तस्राव", "रक्त", "रक्तचाप", "दबाब",
                "वजन", "सूजन", "जलन", "कब्ज", "सास", "संकुचन", "दूध",
                "टाउको दुखाइ", "टाउको दुख्ने", "माइग्रेन",
                "स्तनपान", "हप्ता", "महिना", "हेमोग्लोबिन", "आइरन",
                "आमा", "मातृत्व", "नवजात", "शिशु", "पोस्टपार्टम", "सिजेरियन",
                "दूध कम", "निप्पल दुखाइ", "बच्चाको चाल", "आमा हेरचाह",
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
                "rate_limited": "You are sending messages too quickly. Please wait a moment and ask again so I can respond safely.",
                "emergency": "This may be an emergency. Please contact your doctor or go to the nearest hospital immediately.",
                "context_prefix": "From your previous pregnancy question",
                "short_followup": "I can help right away. Tell me one detail: symptom, pregnancy week/month, or baby concern.",
            },
            "ne": {
                "greeting": "नमस्ते। म गर्भावस्था र मातृ स्वास्थ्य सम्बन्धी प्रश्नमा मद्दत गर्छु। तपाईं के जान्न चाहनुहुन्छ?",
                "thanks": "धन्यवाद। तपाईं गर्भावस्थासम्बन्धी अर्को प्रश्न सोध्न सक्नुहुन्छ।",
                "bye": "ध्यान राख्नुहोस्। गर्भावस्था सम्बन्धी मद्दत चाहिँदा फेरि सोध्नुहोस्।",
                "identity": "म AamaSuraksha मातृ स्वास्थ्य सहायक हुँ। म गर्भावस्था र मातृ हेरचाह सम्बन्धी प्रश्नको मात्र उत्तर दिन्छु।",
                "restricted": "म गर्भावस्था र मातृ स्वास्थ्यका विषयमा मात्र मद्दत गर्न सक्छु। पोषण, लक्षण, तिनमास हेरचाह, जोखिम संकेत, वा प्रसव तयारीबारे सोध्नुहोस्।",
                "fallback": "मैले स्पष्ट रूपमा बुझिन। कृपया गर्भावस्थासँग सम्बन्धित प्रश्न एक वाक्यमा सोध्नुहोस्।",
                "low_confidence": "सुरक्षित र सही उत्तर दिन म अझ निश्चित हुन चाहन्छु। कृपया प्रश्न स्पष्ट बनाउनुहोस्: लक्षण, हप्ता/महिना, वा मुख्य चिन्ता उल्लेख गर्नुहोस्।",
                "rate_limited": "तपाईंले धेरै छिटो-छिटो सन्देश पठाइरहनुभएको छ। कृपया केही समय पर्खेर फेरि सोध्नुहोस्।",
                "emergency": "यो आपतकालीन हुन सक्छ। तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस् वा नजिकको अस्पताल जानुहोस्।",
                "context_prefix": "तपाईंको अघिल्लो गर्भावस्था प्रश्नका आधारमा",
                "short_followup": "म तुरुन्त मद्दत गर्न सक्छु। कृपया एउटा विवरण दिनुहोस्: लक्षण, हप्ता/महिना, वा बच्चासम्बन्धी चिन्ता।",
            },
        }

        self.responses = {
            "en": {
                "greeting": "Hello! I'm here to help with pregnancy and maternal health questions. What would you like to know?",
                "nausea": "Nausea is very common, especially in early pregnancy. Try: small frequent meals, ginger, vitamin B6, hydration, rest, and fresh air. Seek medical care if vomiting is severe or causes dehydration.",
                "bleeding": "Bleeding in pregnancy needs careful attention. Light spotting can occur, but heavy bleeding, pain, or dizziness needs urgent hospital evaluation. Report any bleeding to your doctor.",
                "pain": "Mild cramps can be normal, but severe or persistent abdominal pain—especially with bleeding, fever, or vaginal discharge—needs urgent medical assessment. Don't ignore persistent pain.",
                "fever": "Fever during pregnancy should be taken seriously. If temperature is above 101°F (38.3°C) or persistent, contact your doctor promptly. Fever with other symptoms needs urgent care.",
                "nutrition": "Focus on balanced meals: vegetables, fruits, legumes, protein, dairy for calcium, iron-rich foods. Include prenatal vitamins with folic acid. Drink plenty of water and avoid alcohol or smoking.",
                "exercise": "Light activity like walking and prenatal yoga is usually beneficial with doctor approval. Avoid high-impact sports, heavy lifting, and contact sports. Listen to your body and stop if dizzy.",
                "trimester": "Each trimester has different priorities: 1st—folic acid, nausea, early screening; 2nd—fetal movement, glucose screening; 3rd—BP checks, fetal position, delivery planning. Regular check-ups are essential.",
                "labor": "Possible labor signs: regular painful contractions (every 5-10 min), water breaking, bloody show, back pain with contractions. If these occur, contact your hospital immediately.",
                "breastfeeding": "Breastfeeding is best started within the first hour after birth. Good latch is essential. Seek lactation support for any pain or concerns. Exclusive breastfeeding for 6 months is recommended.",
                "postpartum": "After delivery, prioritize: rest, hydration, nutritious meals (especially iron-rich), wound care, pelvic floor exercises, and mental health support. Seek urgent care for heavy bleeding (soaking pads), high fever, severe headache, breathing difficulty, or severe depression.",
                "swelling": "Mild swelling (edema) is common in pregnancy, especially in legs and feet. Try: elevation, compression socks, hydration, and frequent movement. If sudden swelling or swelling with headache/vision changes, contact your doctor urgently.",
                "dizziness": "Dizziness in pregnancy can be from low blood pressure, anemia, or blood sugar changes. Try: sit or lie down, hydration, frequent small meals, and fresh air. Persistent or severe dizziness needs medical evaluation.",
                "constipation": "Constipation is common in pregnancy due to hormones and the growing uterus. Try: increase fiber (fruits, vegetables), drink lots of water, light exercise, and eat slowly. Ask your doctor about safe stool softeners if needed.",
            },
            "ne": {
                "greeting": "नमस्ते! म गर्भावस्था र मातृ स्वास्थ्य सम्बन्धी प्रश्नमा मद्दत गर्छु। तपाईं के जान्न चाहनुहुन्छ?",
                "nausea": "गर्भावस्थाको सुरुमा मितली सामान्य हुन सक्छ। थोरै-थोरै खाना, अदुवा, विटामिन B६, पानी, र आराम गर्नुहोस्। गम्भीर उल्टी भए तुरुन्त डाक्टरलाई देखाउनुहोस्।",
                "bleeding": "गर्भावस्थामा रक्तस्राव गम्भीर हुन सक्छ। हल्का दाग हुन सक्छ, तर भारी रक्तस्राव, दुखाइ, वा चक्कर भए तुरुन्त अस्पताल जानुहोस्।",
                "pain": "हल्का पेट दुखाइ सामान्य हुन सक्छ। गम्भीर वा लगातार दुखाइ, रक्तस्राव, ज्वरो, वा असामान्य स्राव सहित भए तुरुन्त जाँच गराउनुहोस्।",
                "fever": "गर्भावस्थामा ज्वरो गम्भीर हुन सक्छ। उच्च ज्वरो (३८.३°C भन्दा माथि) वा लामो समय ज्वरो रहेमा तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस्।",
                "nutrition": "सन्तुलित आहार: सागसब्जी, फलफूल, दाल, मासु, दही (क्याल्सियम), आइरनयुक्त खाना। प्रेनेटल भिटामिन फोलिक एसिड सहित लिनुहोस्। पानी पर्याप्त पिनुहोस्।",
                "exercise": "डाक्टरको अनुमति सहित हल्का हिँडाइ र योग गर्नुहोस्। उच्च-प्रभाव खेल, भारी वजन, र सम्पर्क खेल नगर्नुहोस्। शरीर सुन्नुहोस्।",
                "trimester": "हरेक तिनमास फरक अवस्था हुन्छ। १म—फोलिक एसिड, मितली, परीक्षण; २म—बच्चाको चाल, रक्तमा शर्करा परीक्षण; ३म—रक्तचाप, बच्चाको स्थिति, प्रसव तयारी।",
                "labor": "प्रसवका संकेत: नियमित दुख्ने संकुचन (प्रत्येक ५-१० मिनेट), पानी फुट्नु, रगत मिसिएको स्राव। यस्तो भए तुरुन्त अस्पताल सम्पर्क गर्नुहोस्।",
                "breastfeeding": "जन्मपछि पहिलो घण्टाभित्र स्तनपान सुरु गर्नु राम्रो। सही पकड महत्त्वपूर्ण छ। दुखाइ वा समस्या भए स्तनपान सहायक खोज्नुहोस्।",
                "postpartum": "डेलिभरी पछि: आराम, पानी, पोषणयुक्त खाना (आइरन), घाउको हेरचाह, र मानसिक स्वास्थ्य। धेरै रक्तस्राव, उच्च ज्वरो, गम्भीर टाउको दुखाइ, सास फेर्न गाह्रो, वा अवसाद भए तुरुन्त अस्पताल जानुहोस्।",
                "swelling": "गर्भावस्थामा हल्का सूजन सामान्य हुन सक्छ, खासगरी खुट्टामा। समाधान: खुट्टा उठाउनुहोस्, कम्प्रेसन मोजा, पानी, र हिँडाइ। अचानक सूजन वा सूजन सँग टाउको दुखाइ आए तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस्।",
                "dizziness": "गर्भावस्थामा चक्कर कम रक्तचाप, एनिमिया, वा रक्तमा शर्करा कमको कारण हुन सक्छ। समाधान: बस्नुहोस्, पानी पिनुहोस्, थोरै-थोरै खाना, र ताजा हवा। लगातार चक्कर भए जाँच गराउनुहोस्।",
                "constipation": "गर्भावस्थामा कब्ज सामान्य हुन सक्छ। समाधान: रेशा युक्त खाना (साग, फलफूल), पानी, व्यायाम। डाक्टरसँग सुरक्षित दवा बारेमा सोध्नुहोस्।",
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
                "en": ["nausea", "vomit", "morning sickness", "sick", "queasy", "vomiting"],
                "ne": ["मितली", "उल्टी", "वमन", "मित्लाइ", "बिरामी"],
            },
            "bleeding": {
                "en": ["bleeding", "spotting", "blood", "bleed", "hemorrhage"],
                "ne": ["रक्तस्राव", "रगत", "खून", "रुन", "बग्यो"],
            },
            "pain": {
                "en": ["pain", "cramp", "abdominal", "headache", "migraine", "head pain", "ache", "hurt", "sore"],
                "ne": ["दुखाइ", "दर्द", "पेट दुख", "टाउको दुखाइ", "टाउको दुख्ने", "सिरदर्द", "पीडा"],
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
            "postpartum": {
                "en": ["postpartum", "postnatal", "after delivery", "mother recovery", "newborn care", "c section", "cesarean"],
                "ne": ["पोस्टपार्टम", "सुत्केरी", "डेलिभरी पछि", "आमा हेरचाह", "नवजात हेरचाह", "सिजेरियन"],
            },
            "swelling": {
                "en": ["swelling", "edema", "swollen", "puffiness", "puffy"],
                "ne": ["सूजन", "सुन्निएको", "फुलेको"],
            },
            "dizziness": {
                "en": ["dizzy", "dizziness", "vertigo", "lightheaded", "faint"],
                "ne": ["चक्कर", "चक्कर आना", "हल्का हुनु"],
            },
            "constipation": {
                "en": ["constipation", "constipated", "hard stool", "bowel"],
                "ne": ["कब्ज", "पाइखाना कठिन"],
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

        self.short_follow_up_tokens = {
            "en": ["what", "why", "how", "then", "ok", "okay", "huh"],
            "ne": ["के", "किन", "कसरी", "अब", "ठिक", "हजुर"],
        }

        # Trimester and severity indicators for context-aware responses
        self.trimester_indicators = {
            "en": {
                "first": ["first trimester", "1st trimester", "first three months", "early pregnancy", "8 weeks", "10 weeks", "12 weeks"],
                "second": ["second trimester", "2nd trimester", "4 months", "5 months", "6 months", "middle pregnancy", "4th month"],
                "third": ["third trimester", "3rd trimester", "7 months", "8 months", "9 months", "late pregnancy", "due soon"],
            },
            "ne": {
                "first": ["पहिलो तिनमास", "सुरुको तिनमास", "सुरु", "दुई महिना", "तीन महिना"],
                "second": ["दोस्रो तिनमास", "मध्य अवस्था", "चार महिना", "पाँच महिना", "छ महिना"],
                "third": ["तेस्रो तिनमास", "अन्तिम अवस्था", "सात महिना", "आठ महिना", "नौ महिना", "सजिलो हुनु"],
            },
        }

        self.severity_keywords = {
            "en": {
                "mild": ["slight", "little", "mild", "bearable", "manageable"],
                "moderate": ["moderate", "some", "bit", "quite"],
                "severe": ["severe", "intense", "unbearable", "awful", "terrible", "worst", "strong", "very bad"],
            },
            "ne": {
                "mild": ["हल्का", "साना", "कम", "सहन्छु"],
                "moderate": ["मध्यम", "केहि", "धेरै"],
                "severe": ["गम्भीर", "अत्यन्त", "असह्य", "खराब", "भयानक"],
            },
        }

        self.red_flag_symptoms = {
            "en": ["high blood pressure", "vision change", "blurred vision", "epigastric pain", "upper abdominal pain", "swelling", "protein"],
            "ne": ["उच्च रक्तचाप", "दृष्टि परिवर्तन", "धमिलो दृष्टि", "प्रिक्लैम्पसिया", "सूजन", "प्रोटिन"],
        }

    def _normalize(self, text: str) -> str:
        return re.sub(r"\s+", " ", re.sub(r"[^\w\s\u0900-\u097F]", " ", str(text).lower())).strip()

    def _language(self, language: str) -> str:
        return "ne" if str(language).lower().startswith("ne") else "en"

    def _match_any(self, message: str, patterns: List[str]) -> bool:
        tokens = set(self._tokens(message))
        for pattern in patterns:
            p = str(pattern or "").strip().lower()
            if not p:
                continue

            if " " in p:
                if self._contains_phrase(message, p):
                    return True
                continue

            # Allow short stems like "pregnan" to match full token prefixes (pregnancy/pregnant).
            if p in tokens or any(token.startswith(p) for token in tokens):
                return True

        return False

    def _contains_phrase(self, message: str, phrase: str) -> bool:
        escaped = re.escape(phrase)
        return re.search(rf"(?<!\w){escaped}(?!\w)", message) is not None

    def _tokens(self, message: str) -> List[str]:
        return [token for token in message.split(" ") if token]

    def _is_pregnancy_topic(self, message: str, lang: str) -> bool:
        return self._match_any(message, self.topic_keywords[lang])

    def _detect_trimester(self, message: str, lang: str) -> Optional[str]:
        """Detect which trimester the user is likely in (first, second, third, or None)."""
        message_lower = message.lower()
        for trimester, keywords in self.trimester_indicators[lang].items():
            if self._match_any(message_lower, keywords):
                return trimester
        return None

    def _detect_severity(self, message: str, lang: str) -> str:
        """Detect symptom severity level (mild, moderate, severe, or unknown)."""
        message_lower = message.lower()
        for severity, keywords in self.severity_keywords[lang].items():
            if self._match_any(message_lower, keywords):
                return severity
        return "unknown"

    def _has_red_flag_symptom(self, message: str, lang: str) -> bool:
        """Check if message contains red-flag combinations like high BP with headache."""
        message_lower = message.lower()
        return self._match_any(message_lower, self.red_flag_symptoms[lang])

    def _get_session_context(self, session: Deque[Dict[str, str]], limit: int = 3) -> str:
        """Extract recent user context from session memory."""
        recent = list(session)[-limit:]
        user_messages = [msg.get("text", "") for msg in recent if msg.get("role") == "user"]
        return " ".join(user_messages)

    def _build_contextual_response(self, base_response: str, trimester: Optional[str], severity: str, lang: str) -> str:
        """Enhance base response with trimester and severity context."""
        context_parts = []
        
        if severity == "severe":
            if lang == "en":
                context_parts.append("This is serious. ")
            else:
                context_parts.append("यो गम्भीर छ। ")
        
        if trimester:
            if trimester == "first":
                if lang == "en":
                    context_parts.append("In early pregnancy, this is often due to hormonal changes. ")
                else:
                    context_parts.append("गर्भावस्थाको सुरुमा यो सामान्य हार्मोनल परिवर्तनको कारण हुन सक्छ। ")
            elif trimester == "second":
                if lang == "en":
                    context_parts.append("In mid-pregnancy, postural changes and tension can cause this. ")
                else:
                    context_parts.append("गर्भावस्थाको बीचमा शरीरको परिवर्तन र तनावले यो गर्न सक्छ। ")
            elif trimester == "third":
                if lang == "en":
                    context_parts.append("In late pregnancy, this can be related to blood pressure or preeclampsia risk. Monitor closely. ")
                else:
                    context_parts.append("गर्भावस्थाको अन्तमा यो रक्तचाप वा प्रिक्लैम्पसिया सम्भावना सँग सम्बन्धित हुन सक्छ। ध्यान राख्नुहोस्। ")
        
        return "".join(context_parts) + base_response

    def _build_headache_response(self, message: str, lang: str, session: Optional[Deque[Dict[str, str]]] = None) -> str:
        """Build context-aware headache response based on trimester and severity."""
        trimester = self._detect_trimester(message, lang)
        severity = self._detect_severity(message, lang)
        has_red_flag = self._has_red_flag_symptom(message, lang)
        
        if lang == "en":
            base_response = "Headaches are common in pregnancy. "
            
            if has_red_flag or severity == "severe":
                return (
                    "Headache with high blood pressure, vision changes, or upper abdominal pain can indicate preeclampsia. "
                    "This requires urgent medical evaluation. Contact your doctor or go to the hospital immediately."
                )
            
            if trimester == "first":
                if severity == "severe":
                    response = base_response + (
                        "In early pregnancy, severe headaches with hormonal changes need evaluation. "
                        "Try rest, hydration, and safe pain relief. If it persists, contact your doctor."
                    )
                else:
                    response = base_response + (
                        "In early pregnancy, mild to moderate headaches are often hormonal. "
                        "Try: hydration, rest, neck massage, ginger tea, and cool compress. "
                        "If frequent or severe, contact your healthcare provider."
                    )
            elif trimester == "second":
                if severity == "severe":
                    response = base_response + (
                        "In mid-pregnancy, severe headaches warrant evaluation to rule out complications. "
                        "Contact your doctor for assessment."
                    )
                else:
                    response = base_response + (
                        "In mid-pregnancy, posture and tension often cause headaches. "
                        "Solutions: improve posture, prenatal massage, neck stretches, hydration, and rest. "
                        "Safe pain relief options include acetaminophen if approved by your doctor."
                    )
            elif trimester == "third":
                if severity == "severe":
                    response = base_response + (
                        "In late pregnancy, severe headaches need urgent evaluation as they can signal preeclampsia. "
                        "Go to the hospital if accompanied by swelling, vision changes, or upper abdominal pain."
                    )
                else:
                    response = base_response + (
                        "In late pregnancy, monitor for red flags (swelling, vision changes, upper pain). "
                        "Use safe methods: rest, hydration, prenatal massage, and safe pain relief. "
                        "Contact your doctor if headaches worsen or new symptoms appear."
                    )
            else:
                # General response when trimester is unknown
                if severity == "severe":
                    response = base_response + (
                        "For severe headaches: Check if accompanied by swelling, vision changes, or high blood pressure. "
                        "If yes, seek urgent medical care. Otherwise, try hydration, rest, and contact your doctor."
                    )
                else:
                    response = base_response + (
                        "Try: hydration, rest, neck stretches, cool compress, and safe pain relief. "
                        "Contact your doctor if headaches are frequent, severe, or accompanied by other symptoms."
                    )
            
            return response
        
        else:  # Nepali
            base_response = "गर्भावस्थामा टाउको दुखाइ सामान्य हुन सक्छ। "
            
            if has_red_flag or severity == "severe":
                return (
                    "उच्च रक्तचाप, दृष्टि परिवर्तन, वा प्रिक्लैम्पसिया सँग टाउको दुखाइ तुरुन्त जाँच गराउनुहोस्। "
                    "तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस् वा अस्पताल जानुहोस्।"
                )
            
            if trimester == "first":
                if severity == "severe":
                    response = base_response + (
                        "सुरुको गर्भावस्थामा गम्भीर टाउको दुखाइ हार्मोनल परिवर्तनको कारण हुन सक्छ। "
                        "आराम, पानी, र सुरक्षित दवा लिनुहोस्। यदि जारी रहे डाक्टरलाई सम्पर्क गर्नुहोस्।"
                    )
                else:
                    response = base_response + (
                        "सुरुको गर्भावस्थामा हल्का टाउको दुखाइ सामान्य। "
                        "समाधान: पानी पिनुहोस्, आराम गर्नुहोस्, गर्दन मालिस गर्नुहोस्, अदुवा चिया पिनुहोस्, र ठण्डो सेक गर्नुहोस्।"
                    )
            elif trimester == "second":
                if severity == "severe":
                    response = base_response + (
                        "मध्य गर्भावस्थामा गम्भीर टाउको दुखाइ जाँच गराउनुहोस्। डाक्टरसँग सम्पर्क गर्नुहोस्।"
                    )
                else:
                    response = base_response + (
                        "मध्य गर्भावस्थामा मुद्रा र तनाव समस्या हुन सक्छ। "
                        "समाधान: सही मुद्रा राख्नुहोस्, मालिस गर्नुहोस्, गर्दन व्यायाम गर्नुहोस्, र पानी पिनुहोस्।"
                    )
            elif trimester == "third":
                if severity == "severe":
                    response = base_response + (
                        "अन्तिम गर्भावस्थामा गम्भीर टाउको दुखाइ जाँच गराउनुहोस्। "
                        "सूजन, दृष्टि परिवर्तन, वा प्रिक्लैम्पसियाको संकेत हुन सक्छ। अस्पताल जानुहोस्।"
                    )
                else:
                    response = base_response + (
                        "अन्तिम गर्भावस्थामा सूजन र दृष्टि परिवर्तन लक्ष्य गर्नुहोस्। "
                        "समाधान: आराम, पानी, मालिस, र सुरक्षित दवा। नयाँ लक्षण आए डाक्टरलाई बताउनुहोस्।"
                    )
            else:
                # General response when trimester is unknown
                if severity == "severe":
                    response = base_response + (
                        "गम्भीर टाउको दुखाइ: उच्च रक्तचाप वा सूजन छ कि छैन जाँच गर्नुहोस्। "
                        "छ भने तुरुन्त अस्पताल जानुहोस्। नत्र आराम र पानी पिनुहोस्।"
                    )
                else:
                    response = base_response + (
                        "समाधान: पानी पिनुहोस्, आराम गर्नुहोस्, मालिस गर्नुहोस्। "
                        "यदि धेरै भए वा नयाँ लक्षण आए डाक्टरलाई बताउनुहोस्।"
                    )
            
            return response

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
            self.session_request_times.pop(sid, None)
        return len(expired)

    def _is_rate_limited(self, session_key: str) -> bool:
        now = time.time()
        request_times = self.session_request_times.get(session_key)
        if request_times is None:
            request_times = deque(maxlen=self.max_messages_per_minute * 2)
            self.session_request_times[session_key] = request_times

        while request_times and (now - request_times[0]) > self.request_window_seconds:
            request_times.popleft()

        if len(request_times) >= self.max_messages_per_minute:
            return True

        request_times.append(now)
        return False

    def _build_clarifying_question(self, scores: Dict[str, float], lang: str) -> str:
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        top_intents = [intent for intent, _ in ranked[:2] if intent in self.responses[lang]]
        if len(top_intents) < 2:
            return ""

        display_labels = {
            "en": {
                "nausea": "nausea/vomiting",
                "bleeding": "bleeding/spotting",
                "pain": "abdominal pain",
                "fever": "fever",
                "nutrition": "nutrition/diet",
                "exercise": "exercise/activity",
                "trimester": "trimester care",
                "labor": "labor signs",
                "breastfeeding": "breastfeeding",
                "postpartum": "postpartum care",
            },
            "ne": {
                "nausea": "मितली/उल्टी",
                "bleeding": "रक्तस्राव",
                "pain": "पेट दुखाइ",
                "fever": "ज्वरो",
                "nutrition": "पोषण/खाना",
                "exercise": "व्यायाम",
                "trimester": "तिनमास हेरचाह",
                "labor": "प्रसव संकेत",
                "breastfeeding": "स्तनपान",
                "postpartum": "सुत्केरीपछिको हेरचाह",
            },
        }

        first = display_labels[lang].get(top_intents[0], top_intents[0])
        second = display_labels[lang].get(top_intents[1], top_intents[1])
        if lang == "ne":
            return f" के तपाईंको प्रश्न '{first}' कि '{second}' सँग बढी सम्बन्धित छ?"
        return f" Is your question mainly about '{first}' or '{second}'?"

    def _classify_red_flag(self, message: str, lang: str) -> Optional[str]:
        if self._is_fetal_movement_emergency(message, lang):
            return "fetal_warning"
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

    def _is_short_follow_up(self, message: str, lang: str) -> bool:
        tokens = self._tokens(message)
        if not tokens or len(tokens) > 3:
            return False
        return any(token in self.short_follow_up_tokens[lang] for token in tokens)

    def _is_fetal_movement_emergency(self, message: str, lang: str) -> bool:
        tokens = self._tokens(message)
        if lang == "en":
            has_baby_context = any(
                token.startswith(("baby", "fetal", "foetal", "kick", "movement", "mov"))
                for token in tokens
            )
            has_negation = any(
                token in {"not", "no", "reduced", "less", "stopped", "stop", "hardly"}
                for token in tokens
            )
            has_movement_phrase = (
                "not moving" in message
                or "no movement" in message
                or "reduced movement" in message
                or "baby is not moving" in message
                or "baby not moving" in message
            )
            has_duration = (
                "since" in tokens and any(token in {"morning", "night", "yesterday", "hours"} for token in tokens)
            )
            return has_baby_context and (has_movement_phrase or (has_negation and has_duration))

        has_baby_context = any(
            token.startswith(("बच्च", "भ्रूण", "चाल", "हलचल"))
            for token in tokens
        )
        has_negation = any(token in {"न", "छैन", "कम", "घट्यो"} for token in tokens)
        has_movement_phrase = (
            "बच्चा चलेन" in message
            or "बच्चा चल्दैन" in message
            or "चाल कम" in message
            or "भ्रूण नचल्नु" in message
        )
        has_duration = ("देखि" in message) or ("बिहान" in message)
        return has_baby_context and (has_movement_phrase or (has_negation and has_duration))

    def _detect_direct_small_talk(self, message: str, lang: str) -> Optional[str]:
        token_count = len(self._tokens(message))
        for intent in ("greeting", "thanks", "bye", "identity"):
            for phrase in self.intent_keywords[intent][lang]:
                if self._contains_phrase(message, phrase) and token_count <= 5:
                    return intent
        return None

    def _keyword_confidence_boost(self, intent: str, message: str, lang: str) -> float:
        if intent in {"greeting", "thanks", "bye", "identity"}:
            return 0.0
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
        session_key = self._session_key(session_id)
        if self._is_rate_limited(session_key):
            reply = self.small_talk[lang]["rate_limited"]
            session = self._get_session(session_id)
            self._remember(session, "assistant", reply, "rate_limited")
            return ChatResult(
                reply,
                "rate_limited",
                True,
                False,
                0.0,
                False,
                max(1, min(10, int(memory_turns or 6))),
                top_intents=[],
                model_used="tfidf_logreg_v1",
                safety_path="rate_limit",
            )

        session = self._get_session(session_id)
        safe_turns = max(1, min(10, int(memory_turns or 6)))

        if not normalized:
            reply = self.small_talk[lang]["fallback"]
            self._remember(session, "assistant", reply, "fallback")
            return ChatResult(reply, "fallback", False, False, 0.0, False, safe_turns, top_intents=[], safety_path="empty_message")

        if len(normalized) > 600:
            normalized = normalized[:600]

        # Guardrail 1: immediate red-flag classifier and emergency escalation.
        red_flag = self._classify_red_flag(normalized, lang)
        if red_flag is not None or self._match_any(normalized, self.emergency_patterns[lang]):
            reply = self.small_talk[lang]["emergency"]
            self._remember(session, "user", normalized, red_flag or "emergency_signal")
            self._remember(session, "assistant", reply, "emergency")
            return ChatResult(reply, "emergency", False, True, 1.0, False, safe_turns, top_intents=[], safety_path="emergency_guardrail")

        direct_small_talk = self._detect_direct_small_talk(normalized, lang)
        if direct_small_talk is not None and not self._is_pregnancy_topic(normalized, lang):
            reply = self.small_talk[lang][direct_small_talk]
            self._remember(session, "user", normalized, direct_small_talk)
            self._remember(session, "assistant", reply, direct_small_talk)
            return ChatResult(reply, direct_small_talk, False, False, 0.95, False, safe_turns, top_intents=[], safety_path="small_talk")

        if self._is_follow_up(normalized, lang) or self._is_short_follow_up(normalized, lang):
            prior_intent = self._last_assistant_intent(session, safe_turns)
            if prior_intent in self.responses[lang]:
                prefix = self.small_talk[lang]["context_prefix"]
                reply = f"{prefix}: {self.responses[lang][prior_intent]}"
                self._remember(session, "user", normalized, "follow_up")
                self._remember(session, "assistant", reply, prior_intent)
                return ChatResult(reply, prior_intent, False, False, 0.88, True, safe_turns, top_intents=[], safety_path="follow_up_context")

            if self._is_short_follow_up(normalized, lang):
                reply = self.small_talk[lang]["short_followup"]
                self._remember(session, "user", normalized, "follow_up_short")
                self._remember(session, "assistant", reply, "follow_up_short")
                return ChatResult(reply, "follow_up_short", False, False, 0.6, False, safe_turns, top_intents=[], safety_path="follow_up_short")

        if not self._is_pregnancy_topic(normalized, lang):
            reply = self.small_talk[lang]["restricted"]
            self._remember(session, "user", normalized, "restricted")
            self._remember(session, "assistant", reply, "restricted")
            return ChatResult(reply, "restricted", True, False, 0.0, False, safe_turns, top_intents=[], safety_path="topic_guardrail")

        best_intent, scores, confidence = self._detect_intent(normalized, lang)
        top_intents = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:3]

        confidence = max(confidence, self._keyword_confidence_boost(best_intent, normalized, lang))

        context_used = False

        # Strict confidence threshold with safer fallback
        if confidence < self.confidence_threshold or confidence < self.model_confidence_threshold:
            clarification = self._build_clarifying_question(scores, lang)
            reply = f"{self.small_talk[lang]['low_confidence']}{clarification}"
            self._remember(session, "user", normalized, "low_confidence")
            self._remember(session, "assistant", reply, "low_confidence")
            return ChatResult(reply, "low_confidence", False, False, confidence, context_used, safe_turns, top_intents=top_intents, safety_path="confidence_abstain")

        # Normal pregnancy response
        if best_intent in self.responses[lang]:
            reply = self.responses[lang][best_intent]
            
            # Special handling for pain/headache with trimester and severity context
            if best_intent == "pain" and ("headache" in normalized or "migraine" in normalized or "head" in normalized):
                reply = self._build_headache_response(normalized, lang, session)
            
            self._remember(session, "user", normalized, best_intent)
            self._remember(session, "assistant", reply, best_intent)
            return ChatResult(reply, best_intent, False, False, confidence, context_used, safe_turns, top_intents=top_intents, safety_path="model_intent")

        topics = ", ".join(self.allowed_topics[lang])
        if lang == "ne":
            reply = f"म यो प्रश्न पूर्ण रूपमा वर्गीकृत गर्न सकिन। कृपया फेरि सोध्नुहोस्। उदाहरण विषयहरू: {topics}"
        else:
            reply = f"I understood this is pregnancy-related but need a clearer question. You can ask about: {topics}."

        self._remember(session, "user", normalized, "fallback")
        self._remember(session, "assistant", reply, "fallback")
        return ChatResult(reply, "fallback", False, False, confidence, context_used, safe_turns, top_intents=top_intents, safety_path="fallback")
