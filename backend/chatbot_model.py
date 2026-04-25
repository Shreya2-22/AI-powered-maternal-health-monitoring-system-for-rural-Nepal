import os
from dataclasses import dataclass
from typing import List, Optional, Tuple

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


@dataclass
class ChatModelResult:
    intent: str
    confidence: float
    top_intents: List[Tuple[str, float]]


class PregnancyChatIntentModel:
    """Small supervised intent model for pregnancy chat classification."""

    def __init__(self, model_path: str = "models/chatbot_intent_model.pkl") -> None:
        self.model_path = model_path
        self.pipeline: Optional[Pipeline] = None
        self.intent_labels: List[str] = []
        self._load_or_train()

    def _training_data(self) -> Tuple[List[str], List[str]]:
        samples = {
            "greeting": [
                "hi", "hello", "hey", "good morning", "namaste", "hello there", "hi doctor", "hey there",
                "नमस्ते", "हेलो", "हाय", "शुभ प्रभात",
            ],
            "thanks": [
                "thanks", "thank you", "thx", "thank you so much", "much appreciated", "धन्यवाद", "थ्यांक", "धेरै धन्यवाद",
            ],
            "bye": [
                "bye", "goodbye", "see you later", "take care", "talk to you later", "बाइ", "बिदा", "फेरी भेटौंला",
            ],
            "identity": [
                "who are you", "what are you", "are you a bot", "introduce yourself", "tell me about you", "तिमी को हौ", "तपाईं को हुनुहुन्छ", "तपाईं के हो",
            ],
            "nausea": [
                "nausea in pregnancy", "morning sickness", "vomiting while pregnant", "how to reduce nausea", "feeling sick in first trimester", "मितली कसरी कम गर्ने", "गर्भावस्थामा उल्टी हुन्छ", "उल्टी भइरहेको छ",
            ],
            "bleeding": [
                "bleeding during pregnancy", "spotting in pregnancy", "blood coming out", "light bleeding after pregnancy", "heavy bleeding while pregnant", "गर्भावस्थामा रगत आयो", "रक्तस्राव भएको छ", "धेरै रगत बगिरहेको छ",
            ],
            "pain": [
                "stomach pain in pregnancy", "severe abdominal pain", "cramps during pregnancy", "lower belly pain", "pain in pregnancy", "पेट दुखेको छ", "अत्यधिक दुखाइ", "पेट धेरै दुख्यो",
            ],
            "fever": [
                "fever during pregnancy", "high temperature while pregnant", "I have fever", "jeworo in pregnancy", "temperature above 38", "ज्वरो आएको छ", "गर्भावस्थामा ज्वरो",
            ],
            "nutrition": [
                "what should I eat", "pregnancy diet", "nutrition advice", "iron rich food", "folic acid food", "healthy meals during pregnancy", "के खाने", "पोषण कस्तो गर्ने",
            ],
            "exercise": [
                "exercise during pregnancy", "can I walk", "prenatal yoga", "safe workout while pregnant", "daily activity", "व्यायाम गर्न मिल्छ", "हिड्न मिल्छ", "योग गर्न मिल्छ",
            ],
            "trimester": [
                "first trimester symptoms", "second trimester advice", "third trimester care", "how many months pregnant", "weeks pregnant", "तिनमास कस्तो हुन्छ", "कति महिना भयो", "गर्भको हप्ता",
            ],
            "labor": [
                "signs of labor", "water broke", "contractions", "when to go to hospital", "delivery signs", "प्रसव संकेत", "पानी फुट्यो", "संकुचन हुँदैछ",
            ],
            "breastfeeding": [
                "breastfeeding tips", "how to latch baby", "milk after birth", "breastfeed support", "nursing help", "स्तनपान कसरी गर्ने", "दूध कसरी आउँछ", "निप्पल दुख्यो",
            ],
        }

        texts: List[str] = []
        labels: List[str] = []
        for intent, examples in samples.items():
            texts.extend(examples)
            labels.extend([intent] * len(examples))
        return texts, labels

    def _build_pipeline(self) -> Pipeline:
        return Pipeline(
            steps=[
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, min_df=1)),
                ("clf", LogisticRegression(max_iter=2000, multi_class="auto")),
            ]
        )

    def _load_or_train(self) -> None:
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        if os.path.exists(self.model_path):
            try:
                artifact = joblib.load(self.model_path)
                self.pipeline = artifact["pipeline"]
                self.intent_labels = artifact["labels"]
                return
            except Exception:
                pass

        texts, labels = self._training_data()
        self.intent_labels = sorted(set(labels))
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(texts, labels)
        joblib.dump({"pipeline": self.pipeline, "labels": self.intent_labels}, self.model_path)

    def predict(self, text: str, top_k: int = 3) -> ChatModelResult:
        if self.pipeline is None:
            self._load_or_train()

        assert self.pipeline is not None
        probabilities = self.pipeline.predict_proba([text])[0]
        classes = list(self.pipeline.classes_)
        ranked = sorted(zip(classes, probabilities), key=lambda item: item[1], reverse=True)
        best_intent, best_confidence = ranked[0]
        return ChatModelResult(
            intent=best_intent,
            confidence=float(best_confidence),
            top_intents=[(intent, float(score)) for intent, score in ranked[:top_k]],
        )
