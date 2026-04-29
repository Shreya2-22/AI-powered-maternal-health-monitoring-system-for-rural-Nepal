"""
Personalized health insights generator - creates context-aware guidance from user data.
Generates natural, specific recommendations based on pregnancy week, symptoms, and trends.
"""

from datetime import datetime
from typing import List, Dict, Optional


class PersonalizedInsightsGenerator:
    """Generate natural, personalized health insights from user data."""

    def __init__(self) -> None:
        self.language_defaults = {"en": "en", "ne": "ne"}

    def generate_insights(
        self,
        user_age: int,
        weeks_pregnant: int,
        health_records: List[Dict],
        language: str = "en",
        limit: int = 3,
    ) -> Dict:
        """
        Generate 2-4 personalized insights (not AI-obvious, conversational tone).
        
        Returns dict with:
        - insights: list of { title, content, category, urgency }
        - summary: one-line overview
        """
        lang = "ne" if str(language).lower().startswith("ne") else "en"
        insights = []

        # Extract trends from health records
        trends = self._analyze_trends(health_records, weeks_pregnant)

        # Generate trimester-specific insight
        trimester_insight = self._get_trimester_insight(weeks_pregnant, lang)
        if trimester_insight:
            insights.append(trimester_insight)

        # Generate symptom-specific insights (if any symptoms logged)
        symptom_insights = self._get_symptom_insights(health_records, lang)
        insights.extend(symptom_insights[:1])  # Just one symptom insight to avoid clutter

        # Generate trend-based insight (weight, BP, etc.)
        if trends.get("weight_trend"):
            trend_insight = self._get_trend_insight(trends, lang)
            if trend_insight:
                insights.append(trend_insight)

        # Generate age-specific insight (if relevant)
        if user_age < 18 or user_age > 35:
            age_insight = self._get_age_insight(user_age, weeks_pregnant, lang)
            if age_insight:
                insights.append(age_insight)

        # Limit to requested count and sort by urgency
        insights = sorted(insights, key=lambda x: x.get("urgency_score", 0), reverse=True)[
            :limit
        ]

        summary = insights[0].get("title", "") if insights else ""

        return {"insights": insights, "summary": summary, "count": len(insights)}

    def _analyze_trends(self, health_records: List[Dict], weeks_pregnant: int) -> Dict:
        """Analyze health record trends."""
        if not health_records or len(health_records) < 2:
            return {}

        trends = {}

        # Weight trend
        weights = [r.get("weight") for r in health_records if r.get("weight")]
        if len(weights) >= 2:
            weight_change = weights[-1] - weights[0]
            weeks_span = (len(health_records) - 1) * 7 if len(health_records) > 1 else 1
            expected_gain = (weeks_pregnant / 40) * 12  # ~12kg by end
            weekly_rate = weight_change / (weeks_span / 7) if weeks_span > 0 else 0

            trends["weight_trend"] = {
                "current": weights[-1],
                "change": weight_change,
                "weekly_rate": weekly_rate,
                "expected_by_now": expected_gain,
            }

        # BP trend (systolic)
        systolics = [r.get("systolic") for r in health_records if r.get("systolic")]
        if len(systolics) >= 2:
            recent_avg = sum(systolics[-2:]) / 2
            trends["bp_trend"] = {"recent": recent_avg, "elevated": recent_avg > 140}

        # Symptoms pattern
        symptom_log = []
        for r in health_records:
            if r.get("symptoms"):
                symptom_log.append(r["symptoms"].lower())
        if symptom_log:
            trends["repeated_symptoms"] = symptom_log

        return trends

    def _get_trimester_insight(self, weeks_pregnant: int, lang: str) -> Optional[Dict]:
        """Generate trimester-specific insight."""
        if weeks_pregnant <= 13:
            insight = {
                "en": {
                    "title": "Early pregnancy focus: energy and nausea are normal",
                    "content": "Around week 10, your body is adjusting to hormonal changes. Fatigue and mild nausea are common and usually ease by week 14. Eat small, frequent meals—ginger and peppermint help many people. Rest is your priority right now.",
                    "category": "trimester",
                    "urgency_score": 2,
                },
                "ne": {
                    "title": "गर्भावस्थाको सुरु: थकान र मितली सामान्य छ",
                    "content": "अब तपाईंको शरीर हार्मोनल परिवर्तनमा ढल किरहेको छ। थकान र हल्का मितली सामान्य हुन्छ र सामान्यतः १४ हप्तामा सुधरन्छ। थोरै-थोरै खाना खानुहोस्—अदुवा र पुदीना मदत गर्छ। अब आराम मुख्य हो।",
                    "category": "trimester",
                    "urgency_score": 2,
                },
            }
        elif weeks_pregnant <= 26:
            insight = {
                "en": {
                    "title": "Mid-pregnancy growth: baby is developing rapidly",
                    "content": "You're likely feeling baby movements now. Focus on steady nutrition and gentle movement—walking 20-30 mins daily helps. Watch for any sudden swelling or vision changes, as these need prompt attention.",
                    "category": "trimester",
                    "urgency_score": 2,
                },
                "ne": {
                    "title": "गर्भावस्थाको बीच: बच्चा छिटो बढिरहेको छ",
                    "content": "तपाईं अब बच्चाको चाल अनुभव गरिरहनुभएको हुनसक्छ। पोषण र हल्का व्यायाममा ध्यान दिनुहोस्—दिनमा २०-३० मिनेट हिँडाइ गर्नुहोस्। कुनै पनि अचानक सूजन वा दृष्टि परिवर्तन आए तुरुन्त जाँच गराउनुहोस्।",
                    "category": "trimester",
                    "urgency_score": 2,
                },
            }
        else:  # Third trimester
            insight = {
                "en": {
                    "title": "Late pregnancy: prepare for delivery and practice comfort",
                    "content": "Baby is mostly developed now. Discomfort is normal—back pain, swelling, and interrupted sleep are common. Sleep on your left side, use support pillows, and stay mobile. Start thinking about your birth plan with your doctor.",
                    "category": "trimester",
                    "urgency_score": 3,
                },
                "ne": {
                    "title": "गर्भावस्थाको अन्त: प्रसव तयारी र आराम",
                    "content": "बच्चा अब लगभग पूरा विकसित छ। असहजता सामान्य छ—पीठको दर्द, सूजन र नींद मा समस्या सामान्य हुन्छ। बायाँ तिरमा सुत्नुहोस्, सहायक तकिया प्रयोग गर्नुहोस्। डाक्टरसँग प्रसव योजना बनाउन सुरु गर्नुहोस्।",
                    "category": "trimester",
                    "urgency_score": 3,
                },
            }

        return insight.get(lang)

    def _get_symptom_insights(self, health_records: List[Dict], lang: str) -> List[Dict]:
        """Generate insights based on logged symptoms."""
        insights = []

        # Extract recent symptoms
        recent_symptoms = []
        for r in health_records[-3:]:  # Last 3 records
            if r.get("symptoms"):
                recent_symptoms.extend(r["symptoms"].lower().split(","))

        symptom_advice = {
            "en": {
                "nausea": {
                    "title": "Managing nausea: try small, frequent meals",
                    "content": "You've logged nausea a few times. Eat every 2-3 hours—keep snacks by your bed. Avoid strong smells and greasy foods. Ginger tea, citrus, and peppermint often help. If it's severe or you're losing weight, tell your doctor.",
                    "urgency_score": 1,
                },
                "headache": {
                    "title": "Headaches in pregnancy: hydration and rest help",
                    "content": "We noticed you've had headaches. Stay hydrated (10+ glasses of water daily), rest in a quiet room, and try a cool compress. If headaches are severe, come with vision changes or swelling, contact your doctor.",
                    "urgency_score": 2,
                },
                "swelling": {
                    "title": "Mild swelling is normal, but monitor for changes",
                    "content": "Some swelling in legs and feet is common. Elevate your feet when resting, wear compression socks if available, and stay hydrated. If swelling is sudden or severe with headache, seek care immediately.",
                    "urgency_score": 2,
                },
            },
            "ne": {
                "मितली": {
                    "title": "मितली कम गर्ने: थोरै-थोरै खाना खानुहोस्",
                    "content": "तपाईंले मितली लग गरेको छु। २-३ घण्टाको अन्तरमा खाना खानुहोस्। बिरामीजनक खुशबु र तेलेको खाना बचाउनुहोस्। अदुवाको चिया, नेबू र पुदीना मदत गर्छ। गम्भीर छ वा वजन घटिरहेको छ भने डाक्टरलाई बताउनुहोस्।",
                    "urgency_score": 1,
                },
                "टाउको दुखाइ": {
                    "title": "गर्भावस्थामा टाउको दुखाइ: पानी र आराम मदत गर्छ",
                    "content": "तपाईंले टाउको दुखाइ लग गरेको छु। दिनमा १० गिलास पानी पिनुहोस्, शान्त कोठामा आराम गर्नुहोस्। ठण्डो सेक गर्नुहोस्। गम्भीर हो वा दृष्टि परिवर्तन/सूजन छ भने तुरुन्त सम्पर्क गर्नुहोस्।",
                    "urgency_score": 2,
                },
            },
        }

        for symptom in set(recent_symptoms):
            symptom_clean = symptom.strip().lower()
            if symptom_clean in symptom_advice.get(lang, {}):
                advice = symptom_advice[lang][symptom_clean].copy()
                advice["category"] = "symptom"
                insights.append(advice)

        return insights[:1]  # Return just one to avoid clutter

    def _get_trend_insight(self, trends: Dict, lang: str) -> Optional[Dict]:
        """Generate insight based on health trends."""
        if "weight_trend" not in trends:
            return None

        wt = trends["weight_trend"]

        if wt["weekly_rate"] > 0.5:  # Rapid weight gain
            return {
                "en": {
                    "title": "Weight gain is faster than typical—discuss with doctor",
                    "content": f"You've gained {wt['change']:.1f}kg recently. Average is ~0.5kg per week. This could indicate fluid retention or other changes. Mention it at your next visit.",
                    "category": "trend",
                    "urgency_score": 2,
                },
                "ne": {
                    "title": "वजन बढ्न थेक भन्दा छिटो बढिरहेको छ",
                    "content": f"तपाईंको वजन हालै {wt['change']:.1f}किलो बढेको छ। सामान्य हार प्रति हप्ता ०.५किलो हो। यो पानी जमा हुनु वा अन्य परिवर्तन हुन सक्छ। अर्को भेटमा बताउनुहोस्।",
                    "category": "trend",
                    "urgency_score": 2,
                },
            }

        if trends.get("bp_trend", {}).get("elevated"):
            return {
                "en": {
                    "title": "Blood pressure is trending higher—monitor closely",
                    "content": "Recent BP readings are elevated (140+). Keep tracking daily if possible. Reduce salt, stay hydrated, and report at your next checkup. If sudden or with headache, seek care.",
                    "category": "trend",
                    "urgency_score": 3,
                },
                "ne": {
                    "title": "रक्तचाप बढिरहेको छ—नजिकबाट हेर्नुहोस्",
                    "content": "हालको रक्तचाप उच्च छ (१४० भन्दा माथि)। दैनिक जाँच गर्नुहोस् यदि सम्भव छ। नमक कम गर्नुहोस्, पानी पिनुहोस्। अचानक बढे वा टाउको दुखाइ भए तुरुन्त गएर हेराउनुहोस्।",
                    "category": "trend",
                    "urgency_score": 3,
                },
            }

        return None

    def _get_age_insight(self, user_age: int, weeks_pregnant: int, lang: str) -> Optional[Dict]:
        """Generate age-specific insight if relevant."""
        if user_age < 18:
            insights = {
                "en": {
                    "title": "Teen pregnancy: extra prenatal care is important",
                    "content": "You have more regular checkups planned, which is good. Nutrition is critical—eat enough protein and calcium. Share any concerns with your doctor or a counselor.",
                    "category": "age",
                    "urgency_score": 2,
                },
                "ne": {
                    "title": "किशोरी गर्भावस्था: अतिरिक्त हेरचाह महत्वपूर्ण",
                    "content": "तपाईंको नियमित जाँच योजना राम्रो छ। पोषण अत्यन्त महत्वपूर्ण—प्रोटिन र क्याल्सियम खानुहोस्। डाक्टर वा परामर्शदातासँग कुनै पनी चिन्ता साझा गर्नुहोस्।",
                    "category": "age",
                    "urgency_score": 2,
                },
            }
            return insights.get(lang)
        elif user_age > 35:
            insights = {
                "en": {
                    "title": "Pregnancy after 35: routine screening is your friend",
                    "content": "Additional genetic screening is recommended. Follow your doctor's timeline closely. Stay active, manage stress, and keep your checkups. Most pregnancies over 35 are healthy.",
                    "category": "age",
                    "urgency_score": 2,
                },
                "ne": {
                    "title": "३५ पछि गर्भावस्था: नियमित जाँच महत्वपूर्ण",
                    "content": "अतिरिक्त आनुवंशिक जाँच सिफारिश गरिन्छ। डाक्टरको समय तालिका पालना गर्नुहोस्। सक्रिय रहनुहोस्, तनाव कम गर्नुहोस्। ३५ पछि अधिकांश गर्भावस्था स्वस्थ रहन्छ।",
                    "category": "age",
                    "urgency_score": 2,
                },
            }
            return insights.get(lang)

        return None
