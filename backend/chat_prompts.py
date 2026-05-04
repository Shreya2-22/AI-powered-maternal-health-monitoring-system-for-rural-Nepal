"""
Chat prompts and suggested questions configuration.
Provides suggested questions and response templates for ML-driven chatbot.
"""

import random
from typing import List, Dict, Optional


class ChatPromptsAndSuggestions:
    """Store and retrieve suggested questions and prompt templates."""

    def __init__(self):
        self.suggested_questions = {
            "en": {
                "greeting": [
                    "What should I eat during pregnancy?",
                    "Is nausea normal in early pregnancy?",
                    "What are signs of labor?",
                ],
                "nutrition": [
                    "What foods are rich in iron?",
                    "Is caffeine safe during pregnancy?",
                    "Should I take prenatal vitamins?",
                ],
                "symptoms": [
                    "I have severe abdominal pain, is this normal?",
                    "How much swelling is normal?",
                    "When should I worry about bleeding?",
                ],
                "trimester": [
                    "What happens in the third trimester?",
                    "How do I prepare for labor?",
                    "Is exercise safe during pregnancy?",
                ],
                "labor": [
                    "What are signs of labor?",
                    "When should I go to the hospital?",
                    "How to manage contractions?",
                ],
                "breastfeeding": [
                    "How to start breastfeeding?",
                    "What if I have pain while breastfeeding?",
                    "How often should I breastfeed?",
                ],
                "postpartum": [
                    "How to recover after delivery?",
                    "When can I resume exercise?",
                    "What postpartum symptoms need urgent care?",
                ],
                "emergency": [
                    "Contact your doctor immediately",
                    "Go to the nearest hospital",
                    "Call emergency services",
                ],
                "general": [
                    "What foods are safe to eat?",
                    "Is my symptom normal?",
                    "How to take care during pregnancy?",
                ],
            },
            "ne": {
                "greeting": [
                    "गर्भावस्थामा के खाने बेलामा खान चाहिए?",
                    "मितली सामान्य हुन सक्छ?",
                    "प्रसवको संकेत के हुन्छ?",
                ],
                "nutrition": [
                    "कुन खानामा आइरन छ?",
                    "क्याफिन सुरक्षित छ?",
                    "प्रेनेटल भिटामिन लिने बेलामा लिने?",
                ],
                "symptoms": [
                    "मेरो गम्भीर पेट दुखाइ छ, सामान्य छ?",
                    "कति सूजन सामान्य हुन सक्छ?",
                    "रक्तस्राव कहिले चिन्ता गर्ने?",
                ],
                "trimester": [
                    "तेस्रो तिनमासमा के हुन्छ?",
                    "प्रसवको लागि कसरी तयारी गर्ने?",
                    "व्यायाम सुरक्षित हुन सक्छ?",
                ],
                "labor": [
                    "प्रसवको संकेत के हुन्छ?",
                    "अस्पताल कहिले जाने?",
                    "संकुचन कसरी व्यवस्थापन गर्ने?",
                ],
                "breastfeeding": [
                    "स्तनपान कसरी सुरु गर्ने?",
                    "स्तनपानमा दुखाइ भए के गर्ने?",
                    "कति घण्टामा स्तनपान गर्ने?",
                ],
                "postpartum": [
                    "डेलिभरी पछि कसरी ठीक हुने?",
                    "व्यायाम कहिले सुरु गर्ने?",
                    "कुन लक्षण चिन्ता गर्ने?",
                ],
                "emergency": [
                    "तुरुन्त डाक्टरलाई सम्पर्क गर्नुहोस्",
                    "नजिकको अस्पताल जानुहोस्",
                    "आपतकालीन सेवा बोलाउनुहोस्",
                ],
                "general": [
                    "कुन खाना सुरक्षित छ?",
                    "यो लक्षण सामान्य छ?",
                    "गर्भावस्थामा कसरी हेरचाह गर्ने?",
                ],
            },
        }

        self.question_types_guide = {
            "en": {
                "title": "Types of Questions I Can Help With",
                "categories": [
                    {
                        "emoji": "🍽️",
                        "title": "Nutrition",
                        "description": "Ask about healthy eating, foods to avoid, vitamins, and dietary needs during pregnancy",
                        "examples": ["What should I eat?", "Is caffeine safe?", "Do I need iron supplements?"]
                    },
                    {
                        "emoji": "🤰",
                        "title": "Pregnancy Symptoms",
                        "description": "Questions about common pregnancy symptoms, when to worry, and what's normal",
                        "examples": ["Is nausea normal?", "How much swelling is okay?", "When should I worry about bleeding?"]
                    },
                    {
                        "emoji": "📅",
                        "title": "Trimester Care",
                        "description": "Guidance specific to each trimester - what to expect and how to care for yourself",
                        "examples": ["What happens in the third trimester?", "First trimester tips?", "Prepare for labor?"]
                    },
                    {
                        "emoji": "💪",
                        "title": "Exercise & Activity",
                        "description": "Learn about safe exercise, physical activity, and movements during pregnancy",
                        "examples": ["Is walking safe?", "Can I do yoga?", "How much exercise is good?"]
                    },
                    {
                        "emoji": "🏥",
                        "title": "Labor & Delivery",
                        "description": "Information about labor signs, when to go to hospital, and delivery preparation",
                        "examples": ["What are labor signs?", "When to go to hospital?", "How to manage contractions?"]
                    },
                    {
                        "emoji": "👶",
                        "title": "Breastfeeding",
                        "description": "Help with breastfeeding tips, latch, common issues, and baby care",
                        "examples": ["How to start breastfeeding?", "Breastfeeding pain?", "How often to feed?"]
                    },
                    {
                        "emoji": "❤️",
                        "title": "Postpartum Recovery",
                        "description": "Guidance on recovery after delivery, mental health, and when to seek care",
                        "examples": ["How to recover after delivery?", "Postpartum warning signs?", "When to resume exercise?"]
                    },
                    {
                        "emoji": "⚠️",
                        "title": "Emergency Signs",
                        "description": "Red flags and emergency symptoms - when to call doctor or go to hospital immediately",
                        "examples": ["Heavy bleeding?", "Severe pain?", "When to go to ER?"]
                    }
                ]
            },
            "ne": {
                "title": "मले मद्दत गर्न सक्ने प्रश्नका प्रकार",
                "categories": [
                    {
                        "emoji": "🍽️",
                        "title": "पोषण",
                        "description": "स्वास्थ्यकर खाना, बेवास्ता खाना, भिटामिन, र आहार सम्बन्धी प्रश्न",
                        "examples": ["के खान चाहिए?", "क्याफिन सुरक्षित?", "आइरन सप्लिमेन्ट चाहिए?"]
                    },
                    {
                        "emoji": "🤰",
                        "title": "गर्भावस्था लक्षण",
                        "description": "गर्भावस्थाका सामान्य लक्षण, चिन्ता गर्ने समय, र सामान्य अवस्था",
                        "examples": ["मितली सामान्य?", "कति सूजन ठीक?", "रक्तस्राव कहिले चिन्ता?"]
                    },
                    {
                        "emoji": "📅",
                        "title": "तिनमास हेरचाह",
                        "description": "हरेक तिनमासमा विशिष्ट मार्गदर्शन र हेरचाह",
                        "examples": ["तेस्रो तिनमास?", "पहिलो तिनमास?", "प्रसवको तयारी?"]
                    },
                    {
                        "emoji": "💪",
                        "title": "व्यायाम र क्रियाकलाप",
                        "description": "सुरक्षित व्यायाम, शारीरिक क्रियाकलाप, र गर्भावस्थामा चाल",
                        "examples": ["हिँडाइ सुरक्षित?", "योग गर्न सक्छु?", "कति व्यायाम गर्ने?"]
                    },
                    {
                        "emoji": "🏥",
                        "title": "प्रसव र डेलिभरी",
                        "description": "प्रसवका संकेत, अस्पताल जाने समय, र प्रसवको तयारी",
                        "examples": ["प्रसवको संकेत?", "अस्पताल कहिले?", "संकुचन व्यवस्थापन?"]
                    },
                    {
                        "emoji": "👶",
                        "title": "स्तनपान",
                        "description": "स्तनपान सुझाव, पकड, सामान्य समस्या, र बच्चाको हेरचाह",
                        "examples": ["स्तनपान कसरी सुरु?", "स्तनपान दुखाइ?", "कति घण्टा?"]
                    },
                    {
                        "emoji": "❤️",
                        "title": "पोस्टपार्टम रिकभरी",
                        "description": "डेलिभरी पछिको ठीकी, मानसिक स्वास्थ्य, र चिकित्सा सहायता",
                        "examples": ["डेलिभरी पछि कसरी?", "चिन्ता गर्ने लक्षण?", "व्यायाम कहिले?"]
                    },
                    {
                        "emoji": "⚠️",
                        "title": "आपतकालीन संकेत",
                        "description": "खतरनाक संकेत र आपतकालीन लक्षण - कहिले डाक्टर वा अस्पताल जाने",
                        "examples": ["भारी रक्तस्राव?", "गम्भीर दुखाइ?", "कहिले आपतकाल?"]
                    }
                ]
            }
        }

    def get_suggested_questions(self, intent: Optional[str] = None, language: str = "en", count: int = 3) -> List[str]:
        """
        Get 3 random suggested questions based on detected intent.
        Falls back to 'general' if intent not found.
        """
        lang = "ne" if str(language).lower().startswith("ne") else "en"
        category = intent if intent in self.suggested_questions[lang] else "general"
        
        available = self.suggested_questions[lang].get(category, self.suggested_questions[lang]["general"])
        return random.sample(available, min(count, len(available)))

    def get_question_types_guide(self, language: str = "en") -> Dict:
        """Get the complete question types guide with all categories."""
        lang = "ne" if str(language).lower().startswith("ne") else "en"
        return self.question_types_guide.get(lang, self.question_types_guide["en"])

    def get_welcome_message(self, language: str = "en") -> str:
        """Get a friendly welcome message."""
        if str(language).lower().startswith("ne"):
            return "नमस्ते! 👋 मैले गर्भावस्था र मातृ स्वास्थ्य सम्बन्धी आपका सवालों का जवाब दिन यहाँ हूँ। कृपया कुनै प्रश्न सोध्नुहोस् या मेरोसँग कुरा गर्नुहोस्।"
        return "Hello! 👋 I'm here to help with your pregnancy and maternal health questions. Feel free to ask me anything!"


# Initialize singleton instance
prompts_and_suggestions = ChatPromptsAndSuggestions()
