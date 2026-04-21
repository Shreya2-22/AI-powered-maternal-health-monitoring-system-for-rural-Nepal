from sklearn.ensemble import RandomForestClassifier
import numpy as np
from datetime import datetime
import pickle
import os
 
# ── Must match FEATURE_COLUMNS in the Jupyter notebook exactly ───────────────
FEATURE_COLUMNS = [
    'weight_kg',
    'systolic_bp',
    'diastolic_bp',
    'age',
    'weeks_pregnant',
    'weight_gain_kg',
    'days_between_visits',
    'avg_systolic',
    'avg_diastolic',
    'blood_sugar',        # NEW — gestational diabetes indicator
    'haemoglobin',        # NEW — anaemia (major Nepal-specific risk factor)
    'prev_complications', # NEW — previous obstetric complications flag
]
 
 
class PregnancyRiskAssessment:
    def __init__(self):
        self.model      = None
        self.encoder    = None
        self.is_trained = False
        self._load_model()
 
    # ─────────────────────────────────────────────────────────────────────────
    def _load_model(self):
        """Load the pre-trained model saved from the Jupyter notebook."""
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
                print(f"⚠️  Could not load model: {e}  →  using rule-based fallback.")
                self.is_trained = False
        else:
            print("⚠️  No model found in models/ folder. Run the Jupyter notebook first.")
            self.is_trained = False
 
    # ─────────────────────────────────────────────────────────────────────────
    def _prepare_features(self, health_records, user_age, weeks_pregnant):
        """
        Convert health records from MongoDB into the 12-feature vector
        that matches the Jupyter notebook training format.
 
        New fields (blood_sugar, haemoglobin, prev_complications) are read
        from health records if present, otherwise safe Nepal-population
        defaults are used.
        """
        if not health_records:
            return None
 
        records = sorted(health_records, key=lambda r: r.get('date', ''))
        latest  = records[-1]
        first   = records[0]
 
        # ── Core features (same as before) ───────────────────────────────────
        weight_kg    = float(latest.get('weight', 52.0))
        systolic_bp  = float(latest.get('systolic', 115))
        diastolic_bp = float(latest.get('diastolic', 75))
 
        first_weight   = float(first.get('weight', weight_kg))
        weight_gain_kg = round(weight_kg - first_weight, 1)
 
        days_between_visits = 14  # safe default
        if len(records) >= 2:
            try:
                d1 = datetime.strptime(records[-2].get('date', ''), '%Y-%m-%d')
                d2 = datetime.strptime(records[-1].get('date', ''), '%Y-%m-%d')
                days_between_visits = max(1, (d2 - d1).days)
            except Exception:
                pass
 
        avg_systolic  = float(np.mean([r.get('systolic',  115) for r in records]))
        avg_diastolic = float(np.mean([r.get('diastolic',  75) for r in records]))
 
        # ── Nepal-specific features ───────────────────────────────────────────
        # If the user has entered these in HealthTracker, use them.
        # Otherwise use Nepal population mean as a safe neutral default.
        blood_sugar       = float(latest.get('blood_sugar', 4.9))     # mmol/L — Nepal mean ~4.9
        haemoglobin       = float(latest.get('haemoglobin', 11.2))    # g/dL   — rural Nepal mean
        prev_complications = int(latest.get('prev_complications', 0)) # 0 or 1
 
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
            blood_sugar,
            haemoglobin,
            float(prev_complications),
        ]
 
    # ─────────────────────────────────────────────────────────────────────────
    def calculate_risk(self, health_records, user_age, weeks_pregnant):
        """
        Main entry — called by the /api/risk-assessment FastAPI endpoint.
        Returns: { risk_level, score, factors, recommendations, model_used }
        """
        if not health_records:
            return {
                'risk_level':      'low',
                'score':           20,
                'factors':         {},
                'recommendations': [
                    'Please add at least one health record so the model can assess your risk.',
                    'Record your weight, blood pressure at every checkup.',
                ],
                'model_used': 'no_data',
            }
 
        if self.is_trained:
            return self._predict_ml(health_records, user_age, weeks_pregnant)
        return self._predict_rules(health_records, user_age, weeks_pregnant)
 
    # ─────────────────────────────────────────────────────────────────────────
    def _predict_ml(self, health_records, user_age, weeks_pregnant):
        """Use the trained Random Forest model."""
        features = self._prepare_features(health_records, user_age, weeks_pregnant)
        if features is None:
            return self._predict_rules(health_records, user_age, weeks_pregnant)
 
        try:
            pred_num   = self.model.predict([features])[0]
            proba      = self.model.predict_proba([features])[0]
            risk_level = self.encoder.inverse_transform([pred_num])[0]
            confidence = round(float(max(proba)) * 100)
 
            class_probs = {
                cls: round(float(p) * 100)
                for cls, p in zip(self.encoder.classes_, proba)
            }
 
            return {
                'risk_level':      risk_level,
                'score':           confidence,
                'factors':         class_probs,
                'recommendations': self._recommendations(risk_level, health_records),
                'model_used':      'ml',
            }
        except Exception as e:
            print(f"ML error: {e} — falling back to rules.")
            return self._predict_rules(health_records, user_age, weeks_pregnant)
 
    # ─────────────────────────────────────────────────────────────────────────
    def _predict_rules(self, health_records, user_age, weeks_pregnant):
        """
        Rule-based fallback — used only if .pkl files are missing.
        Enhanced with Nepal-specific factors (anaemia, blood sugar).
        """
        records = sorted(health_records, key=lambda r: r.get('date', ''))
 
        bp_score     = self._bp_score(records)
        weight_score = self._weight_score(records, weeks_pregnant)
        age_score    = self._age_score(user_age)
        freq_score   = self._freq_score(records)
        hb_score     = self._haemoglobin_score(records)
        bs_score     = self._blood_sugar_score(records)
 
        total = (bp_score     * 0.30 +
                 weight_score * 0.20 +
                 age_score    * 0.15 +
                 freq_score   * 0.15 +
                 hb_score     * 0.10 +
                 bs_score     * 0.10)
 
        if total < 30:   risk_level = 'low'
        elif total < 60: risk_level = 'medium'
        else:            risk_level = 'high'
 
        return {
            'risk_level':  risk_level,
            'score':       round(total),
            'factors': {
                'blood_pressure':     round(bp_score),
                'weight_gain':        round(weight_score),
                'age':                round(age_score),
                'visit_frequency':    round(freq_score),
                'anaemia':            round(hb_score),
                'blood_sugar':        round(bs_score),
            },
            'recommendations': self._recommendations(risk_level, records),
            'model_used': 'rules',
        }
 
    # ─── Rule helpers ─────────────────────────────────────────────────────────
 
    def _bp_score(self, records):
        recent = records[-3:] if len(records) >= 3 else records
        bad = sum(
            1 for r in recent
            if r.get('systolic', 0) > 140 or r.get('diastolic', 0) > 90
            or r.get('systolic', 0) < 85  or r.get('diastolic', 0) < 50
        )
        return (bad / len(recent)) * 100
 
    def _weight_score(self, records, weeks_pregnant):
        if len(records) < 2: return 20
        first = float(records[0].get('weight', 0))
        last  = float(records[-1].get('weight', 0))
        if first == 0: return 20
        expected = (weeks_pregnant / 40) * 13.0
        diff = abs(last - first - expected)
        return min((diff / max(expected, 1)) * 100, 100)
 
    def _age_score(self, age):
        if age < 18:         return 70
        if 18 <= age <= 35:  return 10
        if 35 < age <= 40:   return 35
        return 65
 
    def _freq_score(self, records):
        if len(records) < 2: return 60
        dates = []
        for r in records[-5:]:
            try: dates.append(datetime.strptime(r.get('date', ''), '%Y-%m-%d'))
            except: pass
        if len(dates) < 2: return 50
        gaps    = [(dates[i+1]-dates[i]).days for i in range(len(dates)-1)]
        avg_gap = sum(gaps) / len(gaps)
        if avg_gap <= 14:  return 15
        if avg_gap <= 30:  return 40
        if avg_gap <= 55:  return 65
        return 85
 
    def _haemoglobin_score(self, records):
        """Anaemia scoring — major Nepal-specific risk factor."""
        latest = records[-1]
        hb = float(latest.get('haemoglobin', 11.2))
        if hb >= 11.0:  return 10   # Normal
        if hb >= 10.0:  return 30   # Mild anaemia
        if hb >= 7.0:   return 65   # Moderate anaemia
        return 90                   # Severe anaemia
 
    def _blood_sugar_score(self, records):
        """Gestational diabetes scoring."""
        latest = records[-1]
        bs = float(latest.get('blood_sugar', 4.9))
        if bs <= 5.5:   return 10   # Normal
        if bs <= 7.0:   return 40   # Elevated
        return 80                   # GDM threshold
 
 
    def _recommendations(self, risk_level, health_records):
        recs = []
 
        if risk_level == 'high':
            recs += [
                '🚨 High risk detected — visit your nearest health post or hospital TODAY.',
                'Do not travel alone. Ask a family member or FCHV to accompany you.',
                'Monitor blood pressure and weight every day.',
            ]
        elif risk_level == 'medium':
            recs += [
                '⚠️ Moderate risk — schedule a checkup within the next 1–2 weeks.',
                'Track your blood pressure and weight at every visit.',
                'Ask your Female Community Health Volunteer (FCHV) for guidance.',
            ]
        else:
            recs += [
                '✅ Low risk — you are doing well! Keep up your healthy habits.',
                'Continue attending antenatal checkups every 4 weeks.',
                'Stay active, eat iron-rich foods (spinach, lentils), and drink clean water.',
            ]
 
        # BP danger warning
        if health_records:
            latest = sorted(health_records, key=lambda r: r.get('date', ''))[-1]
            if latest.get('systolic', 0) > 140 or latest.get('diastolic', 0) > 90:
                recs.append('🩺 High blood pressure detected — report to your doctor immediately.')
 
            # Anaemia warning
            if float(latest.get('haemoglobin', 11.2)) < 10.0:
                recs.append('💊 Low haemoglobin detected — ask your doctor about iron supplements.')
 
            # Blood sugar warning
            if float(latest.get('blood_sugar', 4.9)) > 7.0:
                recs.append('🍬 Elevated blood sugar — follow your doctor\'s dietary advice carefully.')
 
        return recs
 