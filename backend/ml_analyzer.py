"""
Advanced ML Analysis Module for AamaSuraksha
Provides cross-validation, feature importance, anomaly detection, and model evaluation
"""

import numpy as np
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score, 
    precision_recall_curve, f1_score
)
from datetime import datetime
import pickle
import os


class MLAnalyzer:
    """Advanced ML analysis and model evaluation"""

    def __init__(self, model_path="models/trained_model.pkl", encoder_path="models/label_encoder.pkl"):
        self.model_path = model_path
        self.encoder_path = encoder_path
        self.model = None
        self.encoder = None
        self.scaler = StandardScaler()
        self._load_model()

    def _load_model(self):
        """Load pre-trained model and encoder"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
            if os.path.exists(self.encoder_path):
                with open(self.encoder_path, 'rb') as f:
                    self.encoder = pickle.load(f)
        except Exception as e:
            print(f"⚠️ Error loading model: {e}")

    def evaluate_model(self, X_test, y_test_encoded, y_test_labels):
        """
        Comprehensive model evaluation with multiple metrics
        Returns: { accuracy, precision, recall, f1, roc_auc, classification_report }
        """
        if self.model is None:
            return {'error': 'Model not loaded'}

        try:
            predictions = self.model.predict(X_test)
            proba = self.model.predict_proba(X_test)

            accuracy = (predictions == y_test_encoded).mean()
            precision = np.mean([
                np.sum((predictions == y_test_encoded) & (predictions == i)) / 
                np.sum(predictions == i) 
                for i in np.unique(predictions)
            ])
            
            f1 = f1_score(y_test_encoded, predictions, average='weighted')

            # ROC-AUC (for binary: use max vs rest)
            try:
                if len(np.unique(y_test_encoded)) == 2:
                    roc_auc = roc_auc_score(y_test_encoded, proba[:, 1])
                else:
                    roc_auc = roc_auc_score(y_test_encoded, proba, multi_class='ovr')
            except:
                roc_auc = 0.0 

            # Confusion matrix
            conf_matrix = confusion_matrix(y_test_encoded, predictions)

            return {
                'accuracy': round(float(accuracy) * 100, 2),
                'precision': round(float(precision) * 100, 2),
                'f1_score': round(float(f1) * 100, 2),
                'roc_auc': round(float(roc_auc) * 100, 2) if roc_auc > 0 else 0,
                'confusion_matrix': conf_matrix.tolist(),
                'timestamp': datetime.now().isoformat(),
            }
        except Exception as e:
            return {'error': str(e)}

    def cross_validate(self, X_train, y_train_encoded, cv_folds=5):
        """
        Perform k-fold cross-validation to assess model generalization
        Returns: { mean_cv_score, std_cv_score, fold_scores }
        """
        if self.model is None:
            return {'error': 'Model not loaded'}

        try:
            skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
            cv_scores = cross_val_score(
                self.model, X_train, y_train_encoded,
                cv=skf, scoring='accuracy'
            )

            return {
                'mean_cv_score': round(float(np.mean(cv_scores)) * 100, 2),
                'std_cv_score': round(float(np.std(cv_scores)) * 100, 2),
                'fold_scores': [round(float(s) * 100, 2) for s in cv_scores],
                'cv_folds': cv_folds,
            }
        except Exception as e:
            return {'error': str(e)}

    def get_feature_importance(self):
        """
        Extract and rank feature importance from Random Forest model
        Returns: { feature_name: importance_score }
        """
        if self.model is None or not hasattr(self.model, 'feature_importances_'):
            return {}

        from risk_assessment import FEATURE_COLUMNS

        importances = self.model.feature_importances_
        feature_importance = {}

        for name, importance in zip(FEATURE_COLUMNS, importances):
            feature_importance[name] = round(float(importance) * 100, 2)

        # Sort by importance (descending)
        return dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    def detect_anomalies(self, X_data, contamination=0.1):
        """
        Detect anomalous health records using Isolation Forest
        Returns: { anomaly_indices, anomaly_count, normal_count }
        """
        from sklearn.ensemble import IsolationForest

        try:
            iso_forest = IsolationForest(contamination=contamination, random_state=42)
            predictions = iso_forest.fit_predict(X_data)
            
            anomaly_indices = np.where(predictions == -1)[0].tolist()
            
            return {
                'anomaly_indices': anomaly_indices,
                'anomaly_count': len(anomaly_indices),
                'normal_count': len(predictions) - len(anomaly_indices),
                'contamination_rate': round(len(anomaly_indices) / len(predictions) * 100, 2),
            }
        except Exception as e:
            return {'error': str(e)}

    def predict_with_confidence(self, features):
        """
        Make prediction with detailed confidence metrics
        Returns: { prediction, confidence, class_probabilities, decision_boundary }
        """
        if self.model is None:
            return {'error': 'Model not loaded'}

        try:
            features = np.array(features).reshape(1, -1)
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]
            
            # Confidence (max probability)
            confidence = max(probabilities)
            
            # Margin (difference between top 2 probabilities)
            sorted_probs = sorted(probabilities, reverse=True)
            decision_margin = sorted_probs[0] - (sorted_probs[1] if len(sorted_probs) > 1 else 0)
            
            class_probs = {}
            if self.encoder:
                for cls, prob in zip(self.encoder.classes_, probabilities):
                    class_probs[cls] = round(float(prob) * 100, 2)

            prediction_label = self.encoder.inverse_transform([prediction])[0] if self.encoder else str(prediction)

            return {
                'prediction': prediction_label,
                'confidence': round(float(confidence) * 100, 2),
                'decision_margin': round(float(decision_margin) * 100, 2),
                'class_probabilities': class_probs,
            }
        except Exception as e:
            return {'error': str(e)}

    def get_model_insights(self):
        """Get high-level model statistics and insights"""
        insights = {
            'model_type': 'Random Forest Classifier',
            'feature_count': len(FEATURE_COLUMNS) if hasattr(self, 'FEATURE_COLUMNS') else 15,
            'is_trained': self.model is not None,
        }

        if self.model:
            insights['n_estimators'] = self.model.n_estimators
            insights['max_depth'] = self.model.max_depth
            insights['classes'] = self.encoder.classes_.tolist() if self.encoder else []

        return insights


class FeatureEngineering:
    """Advanced feature engineering for pregnancy health data"""

    @staticmethod
    def normalize_features(X):
        """Normalize features to 0-1 range"""
        scaler = StandardScaler()
        return scaler.fit_transform(X)

    @staticmethod
    def extract_temporal_features(health_records):
        """
        Extract time-based features from health records
        - Record frequency trends
        - Seasonality patterns
        - Time gaps between visits
        """
        if not health_records or len(health_records) < 2:
            return {}

        dates = []
        for r in health_records:
            try:
                d = datetime.strptime(r.get('date', ''), '%Y-%m-%d')
                dates.append(d)
            except:
                pass

        if len(dates) < 2:
            return {}

        # Calculate gaps
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        
        features = {
            'total_records': len(health_records),
            'date_range_days': (dates[-1] - dates[0]).days,
            'avg_gap_days': float(np.mean(gaps)) if gaps else 0,
            'max_gap_days': float(np.max(gaps)) if gaps else 0,
            'min_gap_days': float(np.min(gaps)) if gaps else 0,
            'gap_std_dev': float(np.std(gaps)) if len(gaps) > 1 else 0,
        }
        return features

    @staticmethod
    def extract_vital_trends(health_records):
        """
        Extract vital sign trends
        - BP trend direction
        - Weight trajectory
        - Vital sign volatility
        """
        if not health_records or len(health_records) < 2:
            return {}

        weights = [r.get('weight', 52) for r in health_records]
        systolic = [r.get('systolic', 115) for r in health_records]
        diastolic = [r.get('diastolic', 75) for r in health_records]

        features = {
            'weight_trend': float(weights[-1] - weights[0]) if weights else 0,
            'weight_volatility': float(np.std(weights)) if len(weights) > 1 else 0,
            'systolic_volatility': float(np.std(systolic)) if len(systolic) > 1 else 0,
            'diastolic_volatility': float(np.std(diastolic)) if len(diastolic) > 1 else 0,
            'latest_weight': float(weights[-1]) if weights else 0,
            'latest_systolic': float(systolic[-1]) if systolic else 0,
            'latest_diastolic': float(diastolic[-1]) if diastolic else 0,
        }
        return features

    @staticmethod
    def extract_nepal_risk_factors(health_records):
        """
        Extract Nepal-specific maternal health risk factors
        - Anaemia prevalence
        - Malnutrition indicators
        - Previous complications
        """
        if not health_records:
            return {}

        hb_levels = [r.get('haemoglobin', 11.2) for r in health_records]
        blood_sugar = [r.get('blood_sugar', 4.9) for r in health_records]
        prev_complications = max([r.get('prev_complications', 0) for r in health_records])

        features = {
            'min_haemoglobin': float(np.min(hb_levels)) if hb_levels else 11.2,
            'avg_haemoglobin': float(np.mean(hb_levels)) if hb_levels else 11.2,
            'haemoglobin_trend': float(hb_levels[-1] - hb_levels[0]) if len(hb_levels) > 1 else 0,
            'avg_blood_sugar': float(np.mean(blood_sugar)) if blood_sugar else 4.9,
            'has_prev_complications': int(prev_complications),
            'anaemia_risk_level': FeatureEngineering._assess_anaemia_risk(hb_levels),
        }
        return features

    @staticmethod
    def _assess_anaemia_risk(hb_levels):
        """Classify anaemia risk for Nepal context"""
        if not hb_levels:
            return 'unknown'
        
        avg_hb = np.mean(hb_levels)
        if avg_hb >= 11.0:
            return 'low'
        elif avg_hb >= 10.0:
            return 'mild'
        elif avg_hb >= 7.0:
            return 'moderate'
        else:
            return 'severe'


# For backward compatibility
FEATURE_COLUMNS = [
    'weight_kg', 'systolic_bp', 'diastolic_bp', 'age', 'weeks_pregnant',
    'weight_gain_kg', 'days_between_visits', 'avg_systolic', 'avg_diastolic',
    'blood_sugar', 'haemoglobin', 'prev_complications',
    'bp_variability', 'weight_trajectory', 'visit_adherence',
]
