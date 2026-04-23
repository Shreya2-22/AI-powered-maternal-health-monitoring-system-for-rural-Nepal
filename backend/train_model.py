import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score, roc_auc_score
import pickle
import os
from datetime import datetime


class ModelTrainer:
    """Complete ML model training pipeline with validation and metrics"""
    
    def __init__(self, db):
        self.db = db
        self.health_records_col = db["health_records"]
        self.users_col = db["users"]
        self.model_path = "models/trained_model.pkl"
        self.encoder_path = "models/label_encoder.pkl"
        self.feature_columns_path = "models/feature_columns.pkl"
        self.scaler_path = "models/scaler.pkl"
        self.metrics_path = "models/training_metrics.pkl"
        os.makedirs("models", exist_ok=True)
        self.scaler = StandardScaler()

    def prepare_features(self, health_records_list, user_age, weeks_pregnant):
        """
        Convert health data into ML-ready 15-feature vector
        Includes advanced feature engineering for better predictions
        """
        if not health_records_list or len(health_records_list) < 2:
            return None
        
        records = sorted(health_records_list, key=lambda x: x.get('date', ''))
        latest = records[-1]
        first = records[0]
        
        # ── Core features
        weight_latest = float(latest.get('weight', 52))
        weight_first = float(first.get('weight', 52))
        systolic_latest = float(latest.get('systolic', 120))
        diastolic_latest = float(latest.get('diastolic', 80))
        weight_change = weight_latest - weight_first if weight_first > 0 else 0
        
        try:
            from datetime import datetime as dt
            date1 = dt.strptime(records[-2].get('date', str(datetime.now())), '%Y-%m-%d')
            date2 = dt.strptime(records[-1].get('date', str(datetime.now())), '%Y-%m-%d')
            days_between = max(1, (date2 - date1).days)
        except:
            days_between = 7
        
        avg_systolic = float(np.mean([r.get('systolic', 120) for r in records]))
        avg_diastolic = float(np.mean([r.get('diastolic', 80) for r in records]))
        
        # ── Nepal-specific features
        blood_sugar = float(latest.get('blood_sugar', 4.9))
        haemoglobin = float(latest.get('haemoglobin', 11.2))
        prev_complications = int(latest.get('prev_complications', 0))
        
        # ── Advanced features (from ml_analyzer.py concept)
        systolic_readings = np.array([r.get('systolic', 120) for r in records])
        bp_variability = float(np.std(systolic_readings)) if len(systolic_readings) > 1 else 0.0
        
        # Weight trajectory (linear regression slope)
        if len(records) >= 3:
            try:
                from scipy import stats
                dates_for_weight = []
                weights_for_trend = []
                for r in records[-5:]:
                    try:
                        d = dt.strptime(r.get('date', ''), '%Y-%m-%d')
                        dates_for_weight.append(d.timestamp())
                        weights_for_trend.append(float(r.get('weight', 52.0)))
                    except:
                        pass
                if len(dates_for_weight) >= 2:
                    slope, _, _, _, _ = stats.linregress(dates_for_weight, weights_for_trend)
                    weight_trajectory = float(abs(slope) * 86400)
                else:
                    weight_trajectory = 0.0
            except:
                weight_trajectory = 0.0
        else:
            weight_trajectory = 0.0
        
        # Visit adherence score
        if len(records) >= 2:
            date_gaps = []
            for i in range(len(records) - 1):
                try:
                    from datetime import datetime as dt
                    d1 = dt.strptime(records[i].get('date', ''), '%Y-%m-%d')
                    d2 = dt.strptime(records[i+1].get('date', ''), '%Y-%m-%d')
                    date_gaps.append((d2 - d1).days)
                except:
                    pass
            if date_gaps:
                expected_gap = 14
                adherence_score = float(np.mean([min(abs(g - expected_gap), 30) for g in date_gaps]))
            else:
                adherence_score = 0.0
        else:
            adherence_score = 0.0
        
        features = np.array([
            weight_latest, systolic_latest, diastolic_latest, user_age, 
            weeks_pregnant, weight_change, days_between, avg_systolic, avg_diastolic,
            blood_sugar, haemoglobin, prev_complications,
            bp_variability, weight_trajectory, adherence_score
        ]).reshape(1, -1)
        
        return features

    def assign_risk_label(self, health_records_list, user_age):
        """
        Determine risk level for training labels using clinical rules
        Enhanced with Nepal-specific risk factors
        """
        if not health_records_list:
            return 'low'
        
        abnormal_bp_count = 0
        low_hb_count = 0
        high_bs_count = 0
        
        for record in health_records_list:
            systolic = record.get('systolic', 120)
            diastolic = record.get('diastolic', 80)
            hb = record.get('haemoglobin', 11.2)
            bs = record.get('blood_sugar', 4.9)
            
            if systolic < 90 or systolic > 140 or diastolic < 60 or diastolic > 90:
                abnormal_bp_count += 1
            if hb < 10.0:
                low_hb_count += 1
            if bs > 7.0:
                high_bs_count += 1
        
        # Calculate risk score
        abnormal_bp_rate = abnormal_bp_count / len(health_records_list)
        low_hb_rate = low_hb_count / len(health_records_list)
        high_bs_rate = high_bs_count / len(health_records_list)
        
        age_risk = 1 if (user_age > 40 or user_age < 18) else 0
        prev_complications = max([r.get('prev_complications', 0) for r in health_records_list])
        
        # Weighted risk calculation
        risk_score = (
            abnormal_bp_rate * 0.30 +
            low_hb_rate * 0.25 +
            high_bs_rate * 0.20 +
            age_risk * 0.15 +
            prev_complications * 0.10
        )
        
        if risk_score > 0.50:
            return 'high'
        elif risk_score > 0.25:
            return 'medium'
        else:
            return 'low'

    def collect_training_data(self):
        """
        Fetch all users' health records from MongoDB
        Returns balanced training dataset
        """
        print("📊 Collecting training data from database...")
        
        try:
            users = list(self.users_col.find({}))
            X_data = []
            y_data = []
            
            for user in users:
                user_id = str(user.get('_id', ''))
                user_age = user.get('age', 25)
                records = list(self.health_records_col.find({"user_id": user_id}))
                
                if len(records) >= 2:
                    features = self.prepare_features(records, user_age, user.get('weeks_pregnant', 20))
                    label = self.assign_risk_label(records, user_age)
                    
                    if features is not None:
                        X_data.append(features[0])
                        y_data.append(label)
            
            if len(X_data) > 0:
                X = np.array(X_data)
                y = np.array(y_data)
                print(f"✅ Collected {len(X_data)} training samples")
                print(f"   Distribution: LOW: {np.sum(y == 'low')} | MEDIUM: {np.sum(y == 'medium')} | HIGH: {np.sum(y == 'high')}")
                return X, y
            else:
                print("❌ Insufficient training data in database")
                return None, None
                
        except Exception as e:
            print(f"❌ Error collecting data: {str(e)}")
            return None, None

    def encode_labels(self, y_train):
        """Convert text labels to numeric format"""
        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y_train)
        with open(self.encoder_path, 'wb') as f:
            pickle.dump(encoder, f)
        print(f"✅ Label encoder saved: {self.encoder_path}")
        return y_encoded, encoder

    def train(self, rf_model=None):
        """
        Complete training pipeline with cross-validation and evaluation
        Returns: (success, metrics_dict)
        """
        print("\n" + "="*60)
        print("🔄 TRAINING PREGNANCY RISK ASSESSMENT MODEL")
        print("="*60)
        
        X_train, y_train = self.collect_training_data()
        
        if X_train is None or len(X_train) < 5:
            print("❌ Training failed: Insufficient data (need at least 5 samples)")
            return False, {}
        
        # Split data for validation
        X_split, X_test, y_split, y_test = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
        )
        
        # Encode labels
        y_encoded, encoder = self.encode_labels(y_split)
        y_test_encoded, _ = LabelEncoder().fit_transform(y_test), encoder
        
        # Normalize features
        X_train_scaled = self.scaler.fit_transform(X_split)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Save scaler
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Initialize model
        if rf_model is None:
            rf_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                class_weight='balanced',
                n_jobs=-1
            )
        
        print(f"📚 Training with {len(X_split)} samples (80% train, 20% test)...")
        rf_model.fit(X_train_scaled, y_encoded)
        
        # Training accuracy
        train_accuracy = rf_model.score(X_train_scaled, y_encoded)
        test_accuracy = rf_model.score(X_test_scaled, y_test_encoded)
        
        print(f"✅ Training Complete!")
        print(f"   Train Accuracy: {train_accuracy * 100:.2f}%")
        print(f"   Test Accuracy:  {test_accuracy * 100:.2f}%")
        
        # Cross-validation (5-fold)
        print(f"\n🔄 Running 5-fold cross-validation...")
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(rf_model, X_train_scaled, y_encoded, cv=skf, scoring='f1_weighted')
        print(f"   CV Scores: {[f'{s*100:.2f}%' for s in cv_scores]}")
        print(f"   Mean CV Score: {cv_scores.mean() * 100:.2f}% (±{cv_scores.std() * 100:.2f}%)")
        
        # Get predictions for additional metrics
        y_pred = rf_model.predict(X_test_scaled)
        conf_matrix = confusion_matrix(y_test_encoded, y_pred)
        
        # Save model
        with open(self.model_path, 'wb') as f:
            pickle.dump(rf_model, f)
        print(f"✅ Model saved: {self.model_path}")
        
        # Save feature columns
        feature_columns = [
            'weight_kg', 'systolic_bp', 'diastolic_bp', 'age', 'weeks_pregnant',
            'weight_gain_kg', 'days_between_visits', 'avg_systolic', 'avg_diastolic',
            'blood_sugar', 'haemoglobin', 'prev_complications',
            'bp_variability', 'weight_trajectory', 'visit_adherence'
        ]
        with open(self.feature_columns_path, 'wb') as f:
            pickle.dump(feature_columns, f)
        
        # Compile metrics
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'train_accuracy': round(train_accuracy * 100, 2),
            'test_accuracy': round(test_accuracy * 100, 2),
            'cv_mean': round(cv_scores.mean() * 100, 2),
            'cv_std': round(cv_scores.std() * 100, 2),
            'cv_scores': [round(s * 100, 2) for s in cv_scores],
            'samples_trained': len(X_split),
            'samples_tested': len(X_test),
            'feature_count': len(feature_columns),
            'model_type': 'RandomForestClassifier',
            'n_estimators': rf_model.n_estimators,
            'classes': encoder.classes_.tolist(),
            'confusion_matrix': conf_matrix.tolist(),
        }
        
        # Save metrics
        with open(self.metrics_path, 'wb') as f:
            pickle.dump(metrics, f)
        
        print(f"\n📊 Metrics saved: {self.metrics_path}")
        print(f"\n{'='*60}")
        print(f"🎯 MODEL READY FOR DEPLOYMENT")
        print(f"{'='*60}\n")
        
        return True, metrics

    def load_model(self):
        """Load saved model from disk"""
        try:
            with open(self.model_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"Error loading model: {e}")
            return None

    def load_encoder(self):
        """Load label encoder"""
        try:
            with open(self.encoder_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"Error loading encoder: {e}")
            return None

    def load_metrics(self):
        """Load training metrics"""
        try:
            with open(self.metrics_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"Error loading metrics: {e}")
            return None
