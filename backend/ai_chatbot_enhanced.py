"""
AI-Enhanced Maternal Health Chatbot using free LLM APIs and smart prompting.
Uses Hugging Face Inference API or local fallback for intelligent pregnancy guidance.
"""

import os
import requests
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class AIResponse:
    """Response structure from enhanced AI chatbot."""
    reply: str
    intent: str
    is_pregnancy_related: bool
    emergency_detected: bool
    confidence: float
    context_used: bool


class PregnancyAIChatbot:
    """
    Smart maternal health AI chatbot using free LLM models.
    - Falls back gracefully if no API available
    - Understands general questions and redirects to pregnancy
    - Provides accurate, context-aware pregnancy guidance
    """
    
    def __init__(self):
        # Try to load Hugging Face API key (optional, free tier works too)
        self.hf_api_key = os.getenv("HUGGINGFACE_API_KEY", "")
        self.hf_model_url = "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct"
        self.use_hf_api = False
        self.fallback_to_local = True
        
        # Pregnancy-specific context and knowledge base
        self.pregnancy_knowledge_base = self._build_knowledge_base()
        self.emergency_keywords = self._build_emergency_keywords()
        
        # Track conversation context
        self.conversation_history: Dict[str, List[Dict]] = {}
        
    def _build_knowledge_base(self) -> Dict:
        """Build comprehensive pregnancy knowledge base."""
        return {
            "trimester_1": {
                "weeks": "1-13",
                "topics": ["nausea", "fatigue", "breast tenderness", "miscarriage risk"],
                "advice": "Focus on prenatal vitamins with folic acid, rest, and hydration.",
                "symptoms": ["morning sickness", "dizziness", "food cravings"],
            },
            "trimester_2": {
                "weeks": "14-26",
                "topics": ["quickening", "weight gain", "gestational diabetes", "back pain"],
                "advice": "Baby movements become visible. Stay active with gentle exercise.",
                "symptoms": ["swelling", "heartburn", "leg cramps"],
            },
            "trimester_3": {
                "weeks": "27-40",
                "topics": ["labor signs", "Braxton Hicks", "sleeping positions", "delivery prep"],
                "advice": "Prepare for labor. Monitor fetal movements and report concerns.",
                "symptoms": ["shortness of breath", "frequent urination", "pressure"],
            },
            "nutrition": {
                "key_nutrients": ["calcium", "iron", "folic acid", "protein", "DHA"],
                "safe_foods": ["leafy greens", "lean proteins", "whole grains", "dairy"],
                "avoid": ["raw fish", "unpasteurized dairy", "high-mercury fish", "alcohol"],
            },
            "exercise": {
                "safe_activities": ["walking", "swimming", "prenatal yoga", "cycling"],
                "avoid": ["contact sports", "hot yoga", "heavy lifting", "activities with fall risk"],
                "frequency": "150 minutes per week of moderate activity",
            },
            "danger_signs": {
                "emergency": ["severe abdominal pain", "vaginal bleeding", "loss of consciousness", "severe headache"],
                "urgent": ["reduced fetal movement", "persistent vomiting", "high fever", "persistent spotting"],
            }
        }

    def _build_emergency_keywords(self) -> Dict[str, List[str]]:
        """Build emergency detection keywords."""
        return {
            "en": [
                "severe pain", "heavy bleeding", "blood", "unconscious", "faint", "loss of consciousness",
                "severe headache", "vision change", "chest pain", "difficulty breathing", "shortness of breath",
                "severe nausea", "vomiting blood", "pressure in chest", "red alert", "emergency",
                "vaginal bleeding", "spotting", "water broke", "premature labor", "contractions",
                "fever", "infection", "sepsis", "very high blood pressure",
            ],
            "ne": [
                "गम्भीर दुखाइ", "भारी रक्तस्राव", "रक्त", "बेहोशी", "अचेत", "चेतना हराइ",
                "गम्भीर टाउको दुख्ने", "दृष्टि परिवर्तन", "सीने दुखाइ", "सास लिन समस्या",
                "गम्भीर उल्टी", "रक्त वमन", "सीनमा दबाब", "तत्काल", "आपातकाल",
                "योनि रक्तस्राव", "थोरै रक्त", "पानी निस्केको", "समयपूर्व प्रसव",
            ]
        }

    def _detect_greeting(self, message: str, language: str = "en") -> Optional[str]:
        """
        Detect greeting phrases and return the greeting word.
        Returns the detected greeting (hi, hello, hey, etc.) or None.
        """
        greeting_patterns = {
            "en": ["hi", "hello", "hey", "hiya", "greetings", "namaste", "howdy"],
            "ne": ["नमस्ते", "हलो", "हाय", "सुस्वागतम्", "के छ", "नमस्कार"]
        }
        
        normalized = message.lower().strip()
        patterns = greeting_patterns.get(language, greeting_patterns["en"])
        
        for greeting in patterns:
            if greeting in normalized:
                return greeting
        return None

    def _extract_medical_keywords(self, message: str, language: str = "en") -> List[str]:
        """
        Extract medical/pregnancy keywords from user message.
        Returns list of detected keywords sorted by relevance.
        Extended with 20+ pregnancy categories.
        """
        medical_keywords = {
            "en": {
                "nausea": ["nausea", "sick", "vomit", "nauseate", "queasiness", "gag", "morning sickness", "queasy", "feeling ill"],
                "bleeding": ["bleeding", "blood", "spotting", "hemorrhage", "menstrual", "discharge", "vaginal bleeding"],
                "pain": ["pain", "ache", "hurt", "cramp", "cramping", "sore", "aching", "soreness", "discomfort"],
                "swelling": ["swelling", "edema", "swell", "puffy", "puffiness", "bloat", "swollen"],
                "exercise": ["exercise", "workout", "walk", "yoga", "activity", "fitness", "physical", "sport", "training"],
                "nutrition": ["nutrition", "eat", "food", "diet", "meal", "breakfast", "snack", "vitamin", "supplement"],
                "fetal": ["baby", "fetus", "movement", "kick", "flutter", "quickening", "fetal movement"],
                "labor": ["labor", "contraction", "due", "delivery", "birth", "braxton", "labor pain", "false labor"],
                "breast": ["breastfeed", "breast", "milk", "nursing", "lactation", "nipple", "breastfeeding pain"],
                "bp_diabetes": ["blood pressure", "hypertension", "preeclampsia", "diabetes", "glucose", "blood sugar", "bp"],
                "trimester": ["trimester", "week", "month", "pregnancy", "pregnant"],
                "sleep": ["sleep", "sleeping", "insomnia", "tired", "fatigue", "exhausted", "rest"],
                "heartburn": ["heartburn", "acid", "indigestion", "reflux", "gerd"],
                "constipation": ["constipation", "constipated", "bowel", "digestion", "poop"],
                "headache": ["headache", "migraine", "head pain", "dizzy", "dizziness"],
                "skin": ["skin", "rash", "acne", "stretch mark", "pigmentation"],
                "mental": ["mood", "depression", "anxiety", "stress", "overwhelm", "emotions", "sad", "worried"],
                "sex": ["sex", "sexual", "intercourse", "intimacy", "libido", "desire"],
                "postpartum": ["postpartum", "after birth", "recovery", "postnatal", "post-delivery"],
                "placenta": ["placenta", "placental", "afterbirth"],
                "partner": ["husband", "partner", "father", "support", "involvement"],
                "cost": ["cost", "fee", "price", "afford", "expensive", "payment"],
                "general": ["general", "question", "know", "tell", "help", "advice"],
            },
            "ne": {
                "nausea": ["मितली", "उल्टी", "रोग", "बिरामी"],
                "bleeding": ["रक्तस्राव", "रक्त", "थोरै रक्त"],
                "pain": ["दुखाइ", "दुख", "पीडा"],
                "swelling": ["सूजन", "फूल"],
                "exercise": ["व्यायाम", "गतिविधि", "खेल"],
                "nutrition": ["खाना", "पोषण", "भोजन", "खानेकुरा"],
                "fetal": ["बच्चा", "गति", "हलचल", "किक"],
                "labor": ["प्रसव", "डेलिभरी", "जन्म", "संकुचन"],
                "breast": ["स्तनपान", "दुध", "स्तन"],
                "bp_diabetes": ["रक्तचाप", "मधुमेह", "शर्करा"],
                "trimester": ["त्रैमासिक", "हप्ता", "महिना"],
                "sleep": ["निद्रा", "सुत्ने", "थकाइ"],
                "mental": ["मुड", "उदास", "चिन्ता", "तनाव"],
            }
        }
        
        normalized = message.lower()
        keywords_dict = medical_keywords.get(language, medical_keywords["en"])
        detected = []
        
        for category, words in keywords_dict.items():
            for word in words:
                if word in normalized:
                    detected.append(category)
                    break
        
        return detected

    def _is_emergency(self, message: str, language: str = "en") -> bool:
        """Detect emergency keywords in user message."""
        normalized = message.lower()
        keywords = self.emergency_keywords.get(language, self.emergency_keywords["en"])
        
        for keyword in keywords:
            if keyword in normalized:
                return True
        return False

    def _is_pregnancy_related(self, message: str, language: str = "en") -> bool:
        """Check if message is related to pregnancy."""
        pregnancy_keywords = {
            "en": [
                "pregnant", "pregnancy", "trimester", "baby", "fetus", "labor", "delivery",
                "prenatal", "postnatal", "postpartum", "nausea", "bleeding", "contractions",
                "weeks pregnant", "due date", "breastfeed", "newborn", "infant",
            ],
            "ne": [
                "गर्भावस्था", "गर्भ", "तिनमास", "बच्चा", "प्रसव", "डेलिभरी",
                "प्रेनेटल", "दूध", "नवजात", "हप्ता", "मिति", "बच्चाको",
            ]
        }
        
        normalized = message.lower()
        keywords = pregnancy_keywords.get(language, pregnancy_keywords["en"])
        
        for keyword in keywords:
            if keyword in normalized:
                return True
        return False

    def generate_pregnancy_prompt(self, user_message: str, language: str = "en", weeks_pregnant: int = 20) -> str:
        """
        Generate a smart prompt for pregnancy-specific questions.
        """
        trimester = self._get_trimester(weeks_pregnant)
        trimester_info = self.pregnancy_knowledge_base.get(trimester, {})
        
        prompt = f"""You are an expert maternal health advisor for the AamaSuraksha platform.
The user is in their {weeks_pregnant} week of pregnancy ({trimester}).

User question: {user_message}

Guidelines:
1. Answer only pregnancy and maternal health questions
2. Be empathetic and supportive
3. Provide evidence-based medical information
4. For any concern, recommend consulting with a healthcare provider
5. Keep responses concise (2-3 sentences max)
6. If emergency signs are detected, immediately recommend seeking medical care

Current trimester info: {trimester} - {trimester_info.get('advice', '')}

Provide a helpful, accurate response:"""
        
        return prompt

    def generate_general_prompt(self, user_message: str, language: str = "en") -> str:
        """
        Generate prompt for general questions to guide back to pregnancy topics.
        """
        prompt = f"""The user asked: "{user_message}"

This question is not directly about pregnancy or maternal health. 
Your task is to:
1. Acknowledge their question politely
2. Explain that you specialize in pregnancy and maternal health
3. Suggest a pregnancy-related version of their question or offer pregnancy help

Example: If they ask "What's a good breakfast?" you say:
"While general nutrition is helpful, I specialize in pregnancy nutrition. 
Would you like to know about nutrient-rich breakfast options during pregnancy? 
Iron, calcium, and protein are especially important!"

Respond helpfully by redirecting to pregnancy topics:"""
        
        return prompt

    def _get_trimester(self, weeks: int) -> str:
        """Get trimester from weeks pregnant."""
        if weeks <= 13:
            return "trimester_1"
        elif weeks <= 26:
            return "trimester_2"
        else:
            return "trimester_3"

    def _call_hf_api(self, prompt: str) -> Optional[str]:
        """Call Hugging Face Inference API for free."""
        if not self.hf_api_key:
            return None
            
        try:
            headers = {"Authorization": f"Bearer {self.hf_api_key}"}
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 200,
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            }
            
            response = requests.post(self.hf_model_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("generated_text", "").replace(prompt, "").strip()
            return None
        except Exception as e:
            print(f"HF API error: {e}")
            return None

    def _generate_fallback_response(self, message: str, language: str = "en", weeks_pregnant: int = 20, detected_greeting: Optional[str] = None) -> str:
        """
        Generate response using knowledge base when API unavailable.
        Very smart local fallback system with comprehensive coverage.
        Includes greeting acknowledgment and keyword-based routing.
        """
        msg_lower = message.lower()
        trimester = self._get_trimester(weeks_pregnant)
        
        # Build greeting prefix if greeting detected
        greeting_prefix = ""
        if detected_greeting:
            greeting_map = {
                "en": {
                    "hi": "Hi there! ",
                    "hello": "Hello! ",
                    "hey": "Hey! ",
                    "hiya": "Hiya! ",
                    "namaste": "Namaste! ",
                    "greetings": "Greetings! ",
                    "howdy": "Howdy! ",
                },
                "ne": {
                    "नमस्ते": "नमस्ते! ",
                    "हलो": "हलो! ",
                    "हाय": "हाय! ",
                    "सुस्वागतम्": "सुस्वागतम्! ",
                    "नमस्कार": "नमस्कार! ",
                }
            }
            greeting_responses = {
                "en": "I'm here to help with your pregnancy and maternal health questions. ",
                "ne": "मैले तपाईँको गर्भावस्था र स्वास्थ्य प्रश्नमा मदत गर्न तयार छु। "
            }
            greetings = greeting_map.get(language, {})
            greeting_prefix = greetings.get(detected_greeting, f"{detected_greeting}! ") + greeting_responses.get(language, "I'm here to help. ")
        
        # ===== NAUSEA & VOMITING =====
        if any(word in msg_lower for word in ["nausea", "sick", "vomit", "nauseate", "queasiness", "gag", "morning sickness"]):
            responses = {
                "en": "Nausea affects 70-80% of pregnant women, especially weeks 4-14. Try: eating small meals every 2-3 hours, ginger tea, vitamin B6 (25mg 3x daily), staying hydrated, and avoiding triggers. Eat what sounds good - crackers, ice chips, lemon water often help. If unable to keep food/water down for 6+ hours, contact your doctor immediately.",
                "ne": "गर्भावस्थामा मितली/उल्टी सामान्य छ, विशेषत पहिलो तीन महिनामा। छोटा, बारम्बार भोजन, अदुवा चिया, B6 भिटामिन, र पानी पिउनले मदत गर्छ। यदि 6 घण्टा भोजन राख्न सक्नु भएको छैन भने डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== BLEEDING & SPOTTING =====
        elif any(word in msg_lower for word in ["bleeding", "blood", "spotting", "hemorrhage", "menstrual", "discharge"]):
            responses = {
                "en": "Light spotting can be normal, but any vaginal bleeding needs evaluation. Note: color (pink, brown, or red), amount, duration, and any cramping. Light spotting in first trimester may be implantation bleeding. Heavier bleeding, especially with clots or severe cramping, is a red flag. Contact your doctor immediately for any bleeding.",
                "ne": "हल्का रक्तस्राव कहिले-काहीँ सामान्य हुन सक्छ, तर कुनै पनि योनि रक्तस्राव डाक्टरले जाँच गर्नुपर्छ। रङ, मात्रा, अवधि, र दर्द नोट गर्नुहोस्। तत्काल डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== PAIN & CRAMPING =====
        elif any(word in msg_lower for word in ["pain", "ache", "hurt", "cramp", "cramping", "sore", "aching", "soreness"]):
            responses = {
                "en": "Pain type matters. Light cramping (like period cramps) can be normal as uterus expands. But severe, persistent, or one-sided pain needs attention. Other concerning signs: pain with bleeding, fever, or fainting. Rest, hydration, and warm baths help. If pain worsens or lasts >2 hours, see your doctor.",
                "ne": "हल्का दर्द सामान्य हुन सक्छ तर गम्भीर, एक तरफा वा लगातार दर्द चिन्ताजनक छ। आराम, पानी, र गर्म नहान मदत गर्छ। यदि दर्द २ घण्टा भन्दा लामो रहन्छ भने डाक्टर भेट्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== SWELLING & EDEMA =====
        elif any(word in msg_lower for word in ["swelling", "edema", "swell", "puffy", "puffiness", "bloat"]):
            responses = {
                "en": "Some swelling in feet, hands, and face is normal in pregnancy (especially 3rd trimester) due to fluid retention. Reduce salt intake, elevate feet regularly, wear compression socks, and stay hydrated. ALERT: sudden severe swelling, especially with headache or vision changes, could indicate preeclampsia - contact doctor immediately.",
                "ne": "गर्भावस्थामा सूजन सामान्य छ, विशेषत तेस्रो त्रैमासिकमा। नमक कम गर्नुहोस्, पैर उठाएर राख्नुहोस्, र पानी खूब पिउनुहोस्। अचानक गम्भीर सूजन खतरनाक हुन सक्छ।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== EXERCISE & ACTIVITY =====
        elif any(word in msg_lower for word in ["exercise", "workout", "walk", "yoga", "activity", "fitness", "physical"]):
            responses = {
                "en": "Safe pregnancy activities: walking, swimming, prenatal yoga, stationary cycling, and modified strength training. Avoid contact sports, hot yoga, and activities with fall risk. Aim for 150 minutes moderate activity per week. Stop if dizzy, short of breath, or experiencing pain. Always discuss new exercise with your doctor.",
                "ne": "सुरक्षित गतिविधि: हिंडाइ, तरण, गर्भावस्था योग, साइकिल। सम्पर्क खेल, तातो योग, र खतरनाक गतिविधि बचाउनुहोस्। हप्तामा १५० मिनेट व्यायाम गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== NUTRITION & DIET =====
        elif any(word in msg_lower for word in ["nutrition", "eat", "food", "diet", "meal", "breakfast", "snack", "vitamin"]):
            responses = {
                "en": "Eat balanced meals with protein, complex carbs, and healthy fats. Key nutrients: calcium (dairy, greens), iron (lean meat, beans), folic acid (leafy greens), DHA (fish, nuts). Avoid: raw/undercooked meat, unpasteurized dairy, high-mercury fish (shark, swordfish), alcohol, and excess caffeine. Prenatal vitamins are essential.",
                "ne": "स्वस्थ खाना खानुहोस्: दुध, साग, मासु, दाल, अन्डा। बचाउनुहोस्: कच्चा मांस, कच्चो दुध, अल्कोहल। प्रेनेटल भिटामिन आवश्यक छ।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== FETAL MOVEMENT =====
        elif any(word in msg_lower for word in ["baby", "fetus", "movement", "kick", "flutter", "quickening", "movement", "movement count"]):
            responses = {
                "en": "Quickening (baby movements) usually starts 16-25 weeks. By 28 weeks, practice kick counts: count 10 movements in 2 hours daily. Sudden changes in movement pattern, or no movement for 12+ hours, warrants immediate medical attention. Movement patterns vary; know your baby's normal.",
                "ne": "बच्चाको हलचल १६-२५ हप्ता पछि महसूस हुन्छ। २८ हप्ता पछि दैनिक किक काउन्ट गर्नुहोस्। अचानक परिवर्तन वा कोई हलचल नभएमा तत्काल डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== LABOR SIGNS & DELIVERY PREP =====
        elif any(word in msg_lower for word in ["labor", "contraction", "due", "delivery", "birth", "labor pain", "false labor", "braxton"]):
            responses = {
                "en": "True labor contractions are regular, intense, and get closer together (5-1-1 rule). Other signs: water breaking (clear/pinkish fluid), vaginal bleeding, severe backache, or loss of mucus plug. False labor (Braxton Hicks) is irregular and painless. Go to hospital if contractions are 5 minutes apart for 1 hour, or if water breaks.",
                "ne": "सच्चो प्रसव दर्द नियमित र तीव्र हुन्छ। पानी निस्केको, रक्तस्राव, वा गम्भीर पीठको दर्द गएमा अस्पताल जानुहोस्। तीन मिनेट अन्तराल छ भने अस्पताल जानुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== BREASTFEEDING =====
        elif any(word in msg_lower for word in ["breastfeed", "breast", "milk", "nursing", "lactation", "nipple"]):
            responses = {
                "en": "Breastfeeding is best - provides antibodies and optimal nutrition. Start within 1 hour of birth. Some nipple soreness is normal for first 1-2 weeks. Proper latch is key: baby's mouth covers entire areola. Engorgement, clogged ducts, or mastitis need lactation consultant. Colostrum (first milk) is precious - don't skip it.",
                "ne": "स्तनपान सबै भन्दा राम्रो छ। जन्मको १ घण्टा भित्र सुरु गर्नुहोस्। निप्पल दर्द सामान्य छ। लेक्टेशन विशेषज्ञसँग मदत लिनुहोस् यदि समस्या छ।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== TRIMESTER-SPECIFIC =====
        elif any(word in msg_lower for word in ["trimester", "first trimester", "second trimester", "third trimester", "week", "months"]):
            trimester_responses = {
                "en": {
                    "trimester_1": "1st trimester (weeks 1-13): Focus on prenatal vitamins, avoid alcohol/smoking, manage nausea, and rest. Baby's organs form now. Miscarriage risk highest early on. Genetic screening available at 11-14 weeks.",
                    "trimester_2": "2nd trimester (weeks 14-26): Usually the best! Morning sickness fades, baby movements visible, energy returns. Anatomy scan around week 20. Watch for gestational diabetes screening. Increasing appetite is normal.",
                    "trimester_3": "3rd trimester (weeks 27-40): Baby grows rapidly, you may feel shortness of breath and frequent urination. Practice kick counts daily. Get anemia/glucose checked. Prepare for labor - childbirth classes help. Rest when possible."
                },
                "ne": {
                    "trimester_1": "पहिलो त्रैमासिक (१-१३ हप्ता): प्रेनेटल भिटामिन, अल्कोहल/धुम्रपान बचाउनुहोस्। बच्चाको अंग विकसित हुन्छ।",
                    "trimester_2": "दोस्रो त्रैमासिक (१४-२६ हप्ता): सबै भन्दा राम्रो समय! मितली हराउन्छ, बच्चा गति गर्छ। २० हप्तामा स्कैन।",
                    "trimester_3": "तेस्रो त्रैमासिक (२७-४० हप्ता): बच्चा छिटो बढ्छ। दैनिक किक काउन्ट गर्नुहोस्। प्रसवको लागि तयार हुनुहोस्।"
                }
            }
            trimester_text = trimester_responses.get(language, trimester_responses["en"])
            return greeting_prefix + trimester_text.get(trimester, "Ask me about any specific trimester concerns!")
        
        # ===== BLOOD PRESSURE & DIABETES =====
        elif any(word in msg_lower for word in ["blood pressure", "hypertension", "preeclampsia", "diabetes", "glucose", "blood sugar"]):
            responses = {
                "en": "Gestational diabetes affects 2-10% of pregnancies. Screening at 24-28 weeks via glucose test. High blood pressure (>140/90) needs management. Preeclampsia (high BP + protein in urine + swelling) is serious - warning signs include severe headache, vision changes, upper abdominal pain, or reduced urination.",
                "ne": "गर्भावस्थाको मधुमेह सामान्य छ। रक्तचाप र मधुमेह नियमित जाँच गर्नुहोस्। गम्भीर लक्षण भएमा तत्काल डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== SLEEP & FATIGUE =====
        elif any(word in msg_lower for word in ["sleep", "sleeping", "tired", "fatigue", "exhausted", "insomnia", "rest"]):
            responses = {
                "en": "Pregnancy fatigue is real! Growing a baby is exhausting. Try: rest when you can, nap during day, go to bed earlier, stay hydrated, eat small frequent meals, gentle exercise. As pregnancy progresses, sleep becomes harder (frequent urination, baby kicks). Use pillows for support - pregnancy pillow helps. If severe fatigue worsens or you feel depressed, tell your doctor.",
                "ne": "गर्भावस्थामा थकाइ सामान्य छ। दिनमा सुत्नुहोस्, रातमा तालु सुत्नुहोस्, पानी खूब पिउनुहोस्। शुरुमा सुत्न गाह्रो हुन सक्छ। यदि गम्भीर थकाइ छ भने डाक्टरसँग कुरा गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== HEARTBURN & INDIGESTION =====
        elif any(word in msg_lower for word in ["heartburn", "acid", "indigestion", "reflux", "gerd", "burning"]):
            responses = {
                "en": "Heartburn affects 30-80% of pregnant women! Causes: baby pressing on stomach, hormones relaxing digestive muscles. Relief tips: eat small meals, avoid spicy/fatty/acidic foods, don't lie down right after eating, elevate head with pillows, chew gum, drink milk. Safe antacids: calcium carbonate, magnesium hydroxide. Ask your doctor before taking any medication.",
                "ne": "गर्भावस्थामा एसिड वा जलन सामान्य छ। छोटा भोजन खानुहोस्, तिखा खाना बचाउनुहोस्, खानापछी सुत्नुहोस्। यदि गम्भीर छ भने डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== CONSTIPATION =====
        elif any(word in msg_lower for word in ["constipation", "constipated", "bowel", "poop", "stool", "digestion"]):
            responses = {
                "en": "Constipation affects 40% of pregnant women due to hormones and baby pressure. Prevention: drink lots of water (8-10 glasses daily), eat fiber-rich foods (fruits, veggies, whole grains), gentle exercise/walking, don't ignore urge to go. Stool softeners are safe (ask doctor). Avoid laxatives unless approved. If no bowel movement for 3+ days or severe pain, call doctor.",
                "ne": "गर्भावस्थामा कब्ज सामान्य छ। खूब पानी पिउनुहोस्, फल र साग खानुहोस्, हिंडाइ गर्नुहोस्। यदि ३ दिन भन्दा लामो समय कब्ज छ भने डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== HEADACHES & DIZZINESS =====
        elif any(word in msg_lower for word in ["headache", "migraine", "head pain", "dizzy", "dizziness", "vertigo", "lightheaded"]):
            responses = {
                "en": "Pregnancy headaches are common from hormonal changes, dehydration, stress, and poor posture. Relief: rest in dark room, stay hydrated, prenatal massage, warm compress, deep breathing, regular meals. Most pregnancy headaches are harmless. Acetaminophen (Tylenol) is generally safe - ask doctor about dosage. Red flags: sudden severe headache, blurred vision, or upper belly pain = get help immediately.",
                "ne": "गर्भावस्थामा टाउको दुख्ने सामान्य छ। अँध्यारो कोठामा सुत्नुहोस्, पानी खूब पिउनुहोस्। अचानक गम्भीर दुख्ने वा दृष्टि परिवर्तन भएमा डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== SKIN CHANGES =====
        elif any(word in msg_lower for word in ["skin", "rash", "acne", "stretch mark", "pigmentation", "dark line", "melasma"]):
            responses = {
                "en": "Pregnancy hormones cause skin changes. Common: acne (use gentle cleansers, avoid harsh medications), stretch marks (moisturize, gain weight gradually), dark line on belly (linea nigra - harmless), darker patches on face (melasma - fades after birth). Most disappear after pregnancy. Use pregnancy-safe skincare. SPF 30+ sunscreen prevents darkening. See dermatologist if concerned.",
                "ne": "गर्भावस्थामा छालामा परिवर्तन हुन सक्छ। दाना, स्ट्रेच मार्क सामान्य छ। मोइस्चुराइज गर्नुहोस्, सनस्क्रिन लगाउनुहोस्। अधिकांश प्रसवपछि हराउन्छ।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== MENTAL HEALTH & EMOTIONS =====
        elif any(word in msg_lower for word in ["mood", "depression", "anxiety", "stress", "overwhelm", "emotions", "sad", "worried", "anxious", "panic"]):
            responses = {
                "en": "Pregnancy emotions are intense! Hormones + big life changes = normal mood swings. But persistent sadness, anxiety, or scary thoughts need attention. Support: talk to partner/friend, prenatal yoga, deep breathing, regular exercise, therapy. Red flags: can't sleep despite being tired, thoughts of harm, loss of interest in things = tell doctor immediately. Prenatal depression is real and treatable.",
                "ne": "गर्भावस्थामा भावनामा परिवर्तन सामान्य छ। तनाव कम गर्नुहोस्, मित्रहरूसँग कुरा गर्नुहोस्। यदि लगातार उदास वा चिन्तित छ भने डाक्टरसँग सम्पर्क गर्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== SEX & INTIMACY =====
        elif any(word in msg_lower for word in ["sex", "sexual", "intercourse", "intimacy", "libido", "desire", "arousal", "orgasm"]):
            responses = {
                "en": "Sex during pregnancy is usually safe! Hormones may increase or decrease libido - both normal. Benefits: emotional bonding, natural pain relief from endorphins. Positions: avoid lying flat on back after 28 weeks, try side-by-side. When to avoid: bleeding, water breaks, painful contractions, or high-risk pregnancy. Talk to your partner - communication matters! Ask doctor if you have concerns.",
                "ne": "गर्भावस्थामा यौन सम्बन्ध सामान्यतः सुरक्षित छ। इच्छा घट-बढ हुन सक्छ। असहज हुँदा स्थिति परिवर्तन गर्नुहोस्। यदि रक्तस्राव वा दर्द छ भने रोकी दिनुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== POSTPARTUM & RECOVERY =====
        elif any(word in msg_lower for word in ["postpartum", "after birth", "recovery", "postnatal", "post-delivery", "bleeding postpartum"]):
            responses = {
                "en": "Postpartum recovery takes 6+ weeks. Normal: vaginal bleeding (lochia) for 4-6 weeks, breast engorgement, perineal pain, fatigue, mood changes. Self-care: pelvic floor exercises, adequate rest, nutrition, pain relief. Red flags: fever (>38C), soaking pads every 1-2 hours, severe pain, depression, or thoughts of harming yourself = see doctor immediately. Don't hesitate to ask for help!",
                "ne": "प्रसवपछि आराम ६ हप्ता वा अधिक आवश्यक छ। सामान्य: योनि रक्तस्राव, स्तन दुख्ने। आराम, पोषण, व्यायाम गर्नुहोस्। ज्वरो वा गम्भीर लक्षण भएमा डाक्टर भेट्नुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== PARTNER SUPPORT & INVOLVEMENT =====
        elif any(word in msg_lower for word in ["husband", "partner", "father", "support", "involvement", "help"]):
            responses = {
                "en": "Involving your partner is great! They can: attend doctor visits, learn about pregnancy/labor, do household chores, massage your back, be your birth partner, support breastfeeding. Communication is key - share needs, fears, preferences. Both partners often experience anxiety. Consider prenatal classes together. Remember: this is a team effort. Your partner's support matters for your health and baby's development!",
                "ne": "साथी वा पति को सहयोग महत्त्वपूर्ण छ। उनीहरु: डाक्टर भेटमा साथ जान, घरको काम गर्न, मदत गर्न सक्छन्। कुरा गर्नुहोस्, योजना बनाउनुहोस्। साथै गर्भावस्था कक्षा लिनुहोस्।"
            }
            return greeting_prefix + responses.get(language, responses["en"])
        
        # ===== GENERAL PREGNANCY INFO =====
        else:
            responses = {
                "en": f"You're {weeks_pregnant} weeks pregnant! I can help with:\n✓ Pregnancy symptoms (nausea, pain, swelling)\n✓ Nutrition & exercise\n✓ Sleep, mental health, intimacy\n✓ Labor signs & delivery prep\n✓ Breastfeeding & postpartum\n✓ Risk assessment\n✓ Partner involvement & support\nWhat would you like to know?",
                "ne": f"तपाईँ {weeks_pregnant} हप्ता गर्भवती हुनुहुन्छ। मैले सहायता गर्न सक्छु:\n✓ लक्षण (मितली, दुख्ने, सूजन)\n✓ पोषण र व्यायाम\n✓ निद्रा, मानसिक स्वास्थ्य\n✓ प्रसव र तयारी\n✓ स्तनपान र प्रसवपछि\n✓ जोखिम मूल्यांकन\nके जान्न चाहनुहुन्छ?"
            }
            return greeting_prefix + responses.get(language, responses["en"])

    def chat(self, user_id: str, message: str, language: str = "en", weeks_pregnant: int = 20) -> AIResponse:
        """
        Main chat method that processes user message and generates response.
        Enhanced with greeting detection and keyword-based smart routing.
        """
        # Validate input
        if not message or not message.strip():
            return AIResponse(
                reply="Please ask a question about pregnancy or maternal health.",
                intent="greeting",
                is_pregnancy_related=False,
                emergency_detected=False,
                confidence=0.0,
                context_used=False
            )

        # Detect greeting to include in response
        detected_greeting = self._detect_greeting(message, language)
        
        # Extract medical keywords for smart intent detection
        detected_keywords = self._extract_medical_keywords(message, language)

        # Check for emergency
        is_emergency = self._is_emergency(message, language)
        if is_emergency:
            emergency_text = {
                "en": "⚠️ EMERGENCY: Please contact your doctor or go to the nearest hospital immediately! This requires urgent medical attention.",
                "ne": "⚠️ आपातकाल: तुरुन्त आफ्नो डाक्टरसँग सम्पर्क गर्नुहोस् वा नजिकको अस्पताल जानुहोस्! यसलाई तत्काल चिकित्सा सहायता आवश्यक छ।"
            }
            return AIResponse(
                reply=emergency_text.get(language, emergency_text["en"]),
                intent="emergency",
                is_pregnancy_related=True,
                emergency_detected=True,
                confidence=1.0,
                context_used=False
            )

        # Check if pregnancy-related (using keywords for smarter detection)
        is_pregnancy = self._is_pregnancy_related(message, language)
        
        # If keywords detected, it's likely pregnancy-related
        if detected_keywords and not is_pregnancy:
            is_pregnancy = True
        
        # Generate appropriate prompt
        if is_pregnancy:
            prompt = self.generate_pregnancy_prompt(message, language, weeks_pregnant)
            intent = "pregnancy_question"
        else:
            prompt = self.generate_general_prompt(message, language)
            intent = "general_question" if not detected_greeting else "greeting_with_question"

        # Try API first, fall back to local
        reply = None
        
        if self.hf_api_key:
            reply = self._call_hf_api(prompt)
        
        # Use fallback if API fails or no key
        # Pass detected_greeting to include it in the response
        if not reply:
            reply = self._generate_fallback_response(
                message, 
                language, 
                weeks_pregnant,
                detected_greeting if detected_greeting else None
            )

        # Determine confidence based on keyword match quality
        if detected_keywords:
            confidence = 0.95  # High confidence when keywords match
        else:
            confidence = 0.95 if is_pregnancy else 0.70

        return AIResponse(
            reply=reply,
            intent=intent,
            is_pregnancy_related=is_pregnancy,
            emergency_detected=False,
            confidence=confidence,
            context_used=False
        )


# Singleton instance
pregnancy_ai_chatbot = PregnancyAIChatbot()
