from sklearn.ensemble import RandomForestClassifier
import numpy as np
from datetime import datetime, timedelta

class PregnancyRiskAssessment:
    def __init__(self):
        # Initialize ML model for risk prediction
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        
    def calculate_risk(self, health_records, user_age, weeks_pregnant):
        """
        Calculate pregnancy risk level based on health data
        Returns: {
            risk_level: 'low' | 'medium' | 'high',
            score: 0-100,
            factors: {...},
            recommendations: [...]
        }
        """
        if not health_records:
            return {
                'risk_level': 'low',
                'score': 20,
                'factors': {},
                'recommendations': ['Start tracking your health metrics regularly']
            }
        
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
            'recommendations': recommendations
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
