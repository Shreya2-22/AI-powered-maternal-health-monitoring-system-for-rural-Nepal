from sklearn.ensemble import RandomForestClassifier
import numpy as np
from datetime import datetime
import pickle
import os
 
# The exact feature order the model was trained on (must match notebook!)
FEATURE_COLUMNS = [
    'weight_kg',
    'systolic_bp',
    'diastolic_bp',
    'age',
    'weeks_pregnant',
    'weight_gain_kg',
    'days_between_visits',
    'avg_systolic',
    'avg_diastolic'
]
 
class PregnancyRiskAssessment:
    def __init__(self):
        self.model       = None
        self.encoder     = None
        self.is_trained  = False
 
        # Try loading the pre-trained model saved from Jupyter notebook
        self._load_model()
 
    # ─────────────────────────────────────────────────────────────────────────
    def _load_model(self):
        """Load the model and encoder that were trained in the Jupyter notebook."""
        model_path   = "models/trained_model.pkl"
        encoder_path = "models/label_encoder.pkl"
 
        if os.path.exists(model_path) and os.path.exists(encoder_path):
            try:
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(encoder_path, 'rb') as f:
                    self.encoder = pickle.load(f)
                self.is_trained = True
                print("✅ Pre-trained ML model loaded successfully!")
            except Exception as e:
                print(f"⚠️  Could not load model: {e}. Falling back to rule-based.")
                self.is_trained = False
        else:
            print("⚠️  No trained model found in models/ folder.")
            print("    Please run the Jupyter notebook first to train and save the model.")
            self.is_trained = False
 
    # ─────────────────────────────────────────────────────────────────────────
    def _prepare_features(self, health_records, user_age, weeks_pregnant):
        """
        Convert MongoDB health records into the same 9-feature vector
        that was used during Jupyter notebook training.
        """
        if not health_records:
            return None
 
        # Sort records oldest → newest
        records = sorted(health_records, key=lambda r: r.get('date', ''))
        latest  = records[-1]
        first   = records[0]
 
        weight_kg      = float(latest.get('weight', 60))
        systolic_bp    = float(latest.get('systolic', 120))
        diastolic_bp   = float(latest.get('diastolic', 80))
 
        # Weight gained since first visit
        first_weight   = float(first.get('weight', weight_kg))
        weight_gain_kg = round(weight_kg - first_weight, 1)
 
        # Days between the last two visits
        days_between_visits = 7  # default
        if len(records) >= 2:
            try:
                d1 = datetime.strptime(records[-2].get('date', ''), '%Y-%m-%d')
                d2 = datetime.strptime(records[-1].get('date', ''), '%Y-%m-%d')
                days_between_visits = max(1, (d2 - d1).days)
            except Exception:
                pass
 
        # Averages across all visits
        avg_systolic  = float(np.mean([r.get('systolic',  120) for r in records]))
        avg_diastolic = float(np.mean([r.get('diastolic',  80) for r in records]))
 
        # Return features in EXACTLY the same order as the notebook
        return [
            weight_kg,
            systolic_bp,
            diastolic_bp,
            float(user_age),
            float(weeks_pregnant),
            weight_gain_kg,
            float(days_between_visits),
            avg_systolic,
            avg_diastolic,
        ]
 
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_risk(self, health_records, user_age, weeks_pregnant):
        """
        Main entry point — called by the FastAPI endpoint.
        Returns a dict with risk_level, score, factors, recommendations.
        """
        if not health_records:
            return {
                'risk_level': 'low',
                'score': 20,
                'factors': {},
                'recommendations': [
                    'Start tracking your health metrics regularly.',
                    'Record your weight and blood pressure at every checkup.'
                ],
                'model_used': 'no_data'
            }
 
        if self.is_trained:
            return self._predict_with_ml(health_records, user_age, weeks_pregnant)
        else:
            return self._predict_with_rules(health_records, user_age, weeks_pregnant)
 
    # ─────────────────────────────────────────────────────────────────────────
    def _predict_with_ml(self, health_records, user_age, weeks_pregnant):
        """Use the pre-trained Random Forest model."""
        features = self._prepare_features(health_records, user_age, weeks_pregnant)
        if features is None:
            return self._predict_with_rules(health_records, user_age, weeks_pregnant)
 
        try:
            prediction   = self.model.predict([features])[0]
            proba        = self.model.predict_proba([features])[0]
            risk_level   = self.encoder.inverse_transform([prediction])[0]   # 'low'/'medium'/'high'
            confidence   = round(float(max(proba)) * 100)
 
            # Build a probability dict keyed by class name
            class_probs = {
                cls: round(float(p) * 100)
                for cls, p in zip(self.encoder.classes_, proba)
            }
 
            return {
                'risk_level':      risk_level,
                'score':           confidence,
                'factors':         class_probs,
                'recommendations': self._recommendations(risk_level, health_records),
                'model_used':      'ml'
            }
        except Exception as e:
            print(f"ML prediction error: {e} — falling back to rules")
            return self._predict_with_rules(health_records, user_age, weeks_pregnant)
 
    # ─────────────────────────────────────────────────────────────────────────
    def _predict_with_rules(self, health_records, user_age, weeks_pregnant):
        """Fallback rule-based system (used only if model files are missing)."""
        records = sorted(health_records, key=lambda r: r.get('date', ''))
        latest  = records[-1]
 
        bp_score        = self._bp_score(records)
        weight_score    = self._weight_score(records, weeks_pregnant)
        age_score       = self._age_score(user_age)
        frequency_score = self._frequency_score(records)
 
        total = (bp_score * 0.35 + weight_score * 0.30 +
                 age_score * 0.20 + frequency_score * 0.15)
 
        if total < 35:
            risk_level = 'low'
        elif total < 65:
            risk_level = 'medium'
        else:
            risk_level = 'high'
 
        return {
            'risk_level':  risk_level,
            'score':       round(total),
            'factors': {
                'blood_pressure':      round(bp_score),
                'weight_gain':         round(weight_score),
                'age':                 round(age_score),
                'tracking_frequency':  round(frequency_score),
            },
            'recommendations': self._recommendations(risk_level, records),
            'model_used': 'rules'
        }
 
    # ─────────────────────────────────────────────────────────────────────────
    # ── Helper scoring functions for rule-based fallback ─────────────────────
 
    def _bp_score(self, records):
        recent = records[-3:] if len(records) >= 3 else records
        bad    = sum(
            1 for r in recent
            if r.get('systolic', 0) > 140 or r.get('diastolic', 0) > 90
            or r.get('systolic', 0) < 90  or r.get('diastolic', 0) < 60
        )
        return (bad / len(recent)) * 100
 
    def _weight_score(self, records, weeks_pregnant):
        if len(records) < 2:
            return 20
        first = float(records[0].get('weight', 0))
        last  = float(records[-1].get('weight', 0))
        if first == 0:
            return 20
        expected = (weeks_pregnant / 40) * 12.5
        diff     = abs(last - first - expected)
        return min((diff / max(expected, 1)) * 100, 100)
 
    def _age_score(self, age):
        if 18 <= age <= 35:  return 15
        if 35 < age <= 40:   return 35
        if age > 40:         return 60
        return 70  # under 18
 
    def _frequency_score(self, records):
        if len(records) < 3:
            return 60
        dates = []
        for r in records[-5:]:
            try:
                dates.append(datetime.strptime(r.get('date', ''), '%Y-%m-%d'))
            except Exception:
                pass
        if len(dates) < 2:
            return 40
        gaps    = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        avg_gap = sum(gaps) / len(gaps)
        if avg_gap <= 7:   return 20
        if avg_gap <= 14:  return 40
        return 70
 
    # ─────────────────────────────────────────────────────────────────────────
    def _recommendations(self, risk_level, health_records):
        recs = []
        if risk_level == 'high':
            recs += [
                '⚠️ High risk detected — please consult your doctor immediately.',
                'Schedule a checkup within the next 2–3 days.',
                'Monitor your blood pressure and weight every day.',
            ]
        elif risk_level == 'medium':
            recs += [
                '⚠️ Moderate risk — schedule a consultation soon.',
                'Attend your next checkup within 1–2 weeks.',
                'Track your blood pressure and weight consistently.',
            ]
        else:
            recs += [
                '✅ Low risk — keep up your healthy habits!',
                'Continue attending regular antenatal checkups every 4 weeks.',
                'Stay active, eat well, and stay hydrated.',
            ]
 
        # Extra warning if latest BP is dangerous
        if health_records:
            latest = sorted(health_records, key=lambda r: r.get('date', ''))[-1]
            if latest.get('systolic', 0) > 140 or latest.get('diastolic', 0) > 90:
                recs.append('🩺 Your blood pressure reading is above normal — report this to your doctor.')
 
        return recs