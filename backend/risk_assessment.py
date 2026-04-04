from sklearn.ensemble import RandomForestClassifier
import numpy as np
from datetime import datetime, timedelta
import pickle
import os

class PregnancyRiskAssessment:
    def __init__(self):
        # Try to load pre-trained model, otherwise use rule-based
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.encoder = None
        self.is_trained = False
        self.use_ml = False
        
        # Try loading trained model
        self._load_trained_model()
    
    def _load_trained_model(self):
        """Load trained model if it exists"""
        try:
            model_path = "models/trained_model.pkl"
            encoder_path = "models/label_encoder.pkl"
            
            if os.path.exists(model_path) and os.path.exists(encoder_path):
                with open(model_path, 'rb') as f:
                    self.rf_model = pickle.load(f)
                with open(encoder_path, 'rb') as f:
                    self.encoder = pickle.load(f)
                self.is_trained = True
                self.use_ml = True
                print("✅ Loaded trained ML model!")
            else:
                print("⚠️ No trained model found, using rule-based assessment")
        except Exception as e:
            print(f"⚠️ Could not load trained model: {str(e)}, using rule-based assessment")
            self.is_trained = False
            self.use_ml = False
        
    def calculate_risk(self, health_records, user_age, weeks_pregnant):
        """
        Calculate pregnancy risk level based on health data
        Uses ML model if trained, otherwise falls back to rule-based system
        Returns: {
            risk_level: 'low' | 'medium' | 'high',
            score: 0-100,
            factors: {...},
            recommendations: [...],
            model_used: 'ml' | 'rules'
        }
        """
        if not health_records:
            return {
                'risk_level': 'low',
                'score': 20,
                'factors': {},
                'recommendations': ['Start tracking your health metrics regularly'],
                'model_used': 'rules'
            }
        
        # If ML model is trained, use it
        if self.use_ml and self.is_trained:
            return self._calculate_risk_ml(health_records, user_age, weeks_pregnant)
        
        # Otherwise use rule-based system
        return self._calculate_risk_rules(health_records, user_age, weeks_pregnant)
    
    def _calculate_risk_ml(self, health_records, user_age, weeks_pregnant):
        """Calculate risk using trained ML model"""
        try:
            # Prepare features (same as training)
            features = self._prepare_ml_features(health_records, user_age, weeks_pregnant)
            
            # Get prediction from ML model
            prediction = self.rf_model.predict([features])[0]
            
            # Convert prediction to risk level
            risk_levels = ['low', 'medium', 'high']
            risk_level = risk_levels[prediction]
            
            # Get confidence scores
            probabilities = self.rf_model.predict_proba([features])[0]
            score = round(max(probabilities) * 100)
            
            # Generate recommendations based on ML prediction
            recommendations = self._generate_recommendations_ml(
                health_records, user_age, weeks_pregnant, risk_level
            )
            
            return {
                'risk_level': risk_level,
                'score': score,
                'factors': {
                    'low_probability': round(probabilities[0] * 100),
                    'medium_probability': round(probabilities[1] * 100),
                    'high_probability': round(probabilities[2] * 100)
                },
                'recommendations': recommendations,
                'model_used': 'ml'
            }
        except Exception as e:
            print(f"ML prediction error: {str(e)}, fallback to rules")
            return self._calculate_risk_rules(health_records, user_age, weeks_pregnant)
    
    def _prepare_ml_features(self, health_records, user_age, weeks_pregnant):
        """Prepare 9-dimensional feature vector for ML model"""
        if not health_records:
            return [0] * 9
        
        latest = health_records[-1]
        weight = latest.get('weight', 0)
        systolic = latest.get('systolic', 0)
        diastolic = latest.get('diastolic', 0)
        
        # Weight change
        weight_change = 0
        if len(health_records) >= 2:
            weight_change = weight - health_records[0].get('weight', 0)
        
        # Days between measurements
        days_between = 0
        if len(health_records) >= 2:
            try:
                date1 = datetime.strptime(health_records[0].get('date', ''), '%Y-%m-%d')
                date2 = datetime.strptime(latest.get('date', ''), '%Y-%m-%d')
                days_between = (date2 - date1).days
            except:
                days_between = 0
        
        # Average BP
        avg_systolic = sum(r.get('systolic', 0) for r in health_records) / len(health_records)
        avg_diastolic = sum(r.get('diastolic', 0) for r in health_records) / len(health_records)
        
        # Return 9-dimensional feature vector
        return [
            weight,
            systolic,
            diastolic,
            user_age,
            weeks_pregnant,
            weight_change,
            days_between,
            avg_systolic,
            avg_diastolic
        ]
    
    def _generate_recommendations_ml(self, health_records, user_age, weeks_pregnant, risk_level):
        """Generate recommendations based on ML prediction"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.append('⚠️ High risk detected - consult with your doctor immediately')
            recommendations.append('Regular checkups recommended every 2 weeks or more frequent')
            recommendations.append('Monitor blood pressure and weight closely')
        elif risk_level == 'medium':
            recommendations.append('⚠️ Moderate risk - schedule a consultation with your doctor')
            recommendations.append('Keep regular checkups every 3-4 weeks')
            recommendations.append('Monitor your vital signs consistently')
        else:
            recommendations.append('✅ Low risk - continue regular healthy habits')
            recommendations.append('Maintain regular checkups every 4 weeks')
            recommendations.append('Stay active and eat healthy')
        
        # Add specific recommendations based on latest data
        if health_records:
            latest = health_records[-1]
            if latest.get('systolic', 0) > 140 or latest.get('diastolic', 0) > 90:
                if '💊 Blood pressure alert' not in recommendations:
                    recommendations.append('💊 Blood pressure reading is high')
        
        return recommendations
    
    def _calculate_risk_rules(self, health_records, user_age, weeks_pregnant):
        """Calculate risk using rule-based system (fallback)"""
        # Calculate individual risk factors
        bp_score = self._assess_bp_trend(health_records)
        weight_score = self._assess_weight_trend(health_records, weeks_pregnant)
        age_score = self._assess_age_risk(user_age)
        frequency_score = self._assess_observation_frequency(health_records)
        
        # Weighted scoring
        total_score = (bp_score * 0.35 + weight_score * 0.30 + 
                      age_score * 0.20 + frequency_score * 0.15)
        
        # Determine risk level
        if total_score < 35:
            risk_level = 'low'
        elif total_score < 65:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        # Generate recommendations
        recommendations = self._generate_recommendations(bp_score, weight_score, age_score, risk_level)
        
        return {
            'risk_level': risk_level,
            'score': round(total_score),
            'factors': {
                'blood_pressure': round(bp_score),
                'weight_gain': round(weight_score),
                'age': round(age_score),
                'tracking_frequency': round(frequency_score)
            },
            'recommendations': recommendations,
            'model_used': 'rules'
        }
    
    def _assess_bp_trend(self, records):
        """Assess blood pressure trend"""
        if not records or len(records) < 2:
            return 20
        
        recent = records[-3:] if len(records) >= 3 else records
        bp_abnormal = 0
        
        for record in recent:
            systolic = record.get('systolic', 0)
            diastolic = record.get('diastolic', 0)
            
            # Normal: 90-140 systolic, 60-90 diastolic
            if systolic < 90 or systolic > 140 or diastolic < 60 or diastolic > 90:
                bp_abnormal += 1
        
        return (bp_abnormal / len(recent)) * 100
    
    def _assess_weight_trend(self, records, weeks_pregnant):
        """Assess weight gain pattern"""
        if len(records) < 2:
            return 20
        
        first_weight = records[0].get('weight', 0)
        last_weight = records[-1].get('weight', 0)
        
        if first_weight == 0:
            return 20
        
        weight_diff = last_weight - first_weight
        expected_gain = (weeks_pregnant / 40) * 12.5  # ~12.5kg total is healthy
        
        # Penalty for excessive or insufficient gain
        gain_diff = abs(weight_diff - expected_gain)
        score = (gain_diff / expected_gain) * 100 if expected_gain > 0 else 20
        
        return min(score, 100)
    
    def _assess_age_risk(self, age):
        """Assess age-related risk"""
        if 18 <= age <= 35:
            return 15  # Optimal age range
        elif 35 < age <= 40:
            return 35  # Advanced maternal age
        elif age > 40:
            return 60  # High-risk age
        else:
            return 70  # Very young
    
    def _assess_observation_frequency(self, records):
        """Assess how regularly health is being tracked"""
        if len(records) < 3:
            return 60
        
        # Check days between measurements
        dates = []
        for record in records[-5:]:
            try:
                dates.append(datetime.strptime(record.get('date', ''), '%Y-%m-%d'))
            except:
                pass
        
        if len(dates) < 2:
            return 40
        
        # Average days between measurements (should be ~7 days)
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        avg_gap = sum(gaps) / len(gaps)
        
        if avg_gap <= 7:
            return 20  # Good tracking frequency
        elif avg_gap <= 14:
            return 40
        else:
            return 70  # Poor tracking frequency
    
    def _generate_recommendations(self, bp_score, weight_score, age_score, risk_level):
        """Generate personalized recommendations"""
        recommendations = []
        
        if bp_score > 40:
            recommendations.append("Monitor blood pressure regularly and consult your doctor if readings are abnormal")
        
        if weight_score > 40:
            recommendations.append("Review your diet and exercise with your healthcare provider")
        
        if age_score > 40:
            recommendations.append("Increased antenatal monitoring is recommended for your age group")
        
        if risk_level == 'high':
            recommendations.append("Schedule an urgent consultation with your doctor")
        
        if not recommendations:
            recommendations.append("Continue regular health monitoring and prenatal checkups")
        
        return recommendations
