import numpy as np
from sklearn.preprocessing import LabelEncoder
import pickle
import os
from datetime import datetime

class ModelTrainer:
    """Train ML model on accumulated user health data"""
    
    def __init__(self, db):
        self.db = db
        self.health_records_col = db["health_records"]
        self.users_col = db["users"]
        self.model_path = "models/trained_model.pkl"
        self.encoder_path = "models/label_encoder.pkl"
        os.makedirs("models", exist_ok=True)

    def prepare_features(self, health_records_list, user_age, weeks_pregnant):
        """Convert health data into ML-ready features (9 numbers)"""
        if not health_records_list or len(health_records_list) < 2:
            return None
        
        records = sorted(health_records_list, key=lambda x: x.get('date', ''))
        latest = records[-1]
        first = records[0]
        
        weight_latest = latest.get('weight', 0)
        weight_first = first.get('weight', 0)
        systolic_latest = latest.get('systolic', 120)
        diastolic_latest = latest.get('diastolic', 80)
        weight_change = weight_latest - weight_first if weight_first > 0 else 0
        
        try:
            date1 = datetime.fromisoformat(records[-2].get('date', str(datetime.now())))
            date2 = datetime.fromisoformat(records[-1].get('date', str(datetime.now())))
            days_between = (date2 - date1).days
        except:
            days_between = 7
        
        avg_systolic = np.mean([r.get('systolic', 120) for r in records])
        avg_diastolic = np.mean([r.get('diastolic', 80) for r in records])
        
        features = np.array([
            weight_latest, systolic_latest, diastolic_latest, user_age, 
            weeks_pregnant, weight_change, days_between, avg_systolic, avg_diastolic
        ]).reshape(1, -1)
        
        return features

    def assign_risk_label(self, health_records_list, user_age):
        """Determine risk level for training labels"""
        if not health_records_list:
            return 'low'
        
        abnormal_bp_count = 0
        for record in health_records_list:
            systolic = record.get('systolic', 120)
            diastolic = record.get('diastolic', 80)
            if systolic < 90 or systolic > 140 or diastolic < 60 or diastolic > 90:
                abnormal_bp_count += 1
        
        age_risk = 'high' if user_age > 40 or user_age < 18 else 'low'
        
        if abnormal_bp_count >= len(health_records_list) * 0.5 or age_risk == 'high':
            return 'high'
        elif abnormal_bp_count >= len(health_records_list) * 0.25:
            return 'medium'
        else:
            return 'low'

    def collect_training_data(self):
        """Fetch all users' health records from MongoDB"""
        print("📊 Collecting training data from database...")
        
        try:
            users = list(self.users_col.find({}))
            X_data = []
            y_data = []
            
            for user in users:
                user_id = str(user.get('_id'))
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
                print(f"   - LOW: {np.sum(y == 'low')} | MEDIUM: {np.sum(y == 'medium')} | HIGH: {np.sum(y == 'high')}")
                return X, y
            else:
                print("❌ Insufficient training data")
                return None, None
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return None, None

    def encode_labels(self, y_train):
        """Convert text labels to numbers"""
        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y_train)
        with open(self.encoder_path, 'wb') as f:
            pickle.dump(encoder, f)
        return y_encoded, encoder

    def train(self, rf_model):
        """Train RandomForest model"""
        print("\n🔄 Training ML Model...")
        print("=" * 50)
        
        X_train, y_train = self.collect_training_data()
        
        if X_train is None:
            print("❌ Training failed: Insufficient data")
            return False, {}
        
        y_encoded, encoder = self.encode_labels(y_train)
        print(f"📚 Training with {len(X_train)} samples...")
        rf_model.fit(X_train, y_encoded)
        
        train_accuracy = rf_model.score(X_train, y_encoded)
        with open(self.model_path, 'wb') as f:
            pickle.dump(rf_model, f)
        
        print(f"✅ Training complete! Accuracy: {train_accuracy * 100:.2f}%")
        
        return True, {'accuracy': round(train_accuracy * 100, 2), 'samples': len(X_train), 'timestamp': datetime.now().isoformat()}

    def load_model(self):
        """Load saved model from disk"""
        try:
            with open(self.model_path, 'rb') as f:
                return pickle.load(f)
        except:
            return None

    def load_encoder(self):
        """Load label encoder"""
        try:
            with open(self.encoder_path, 'rb') as f:
                return pickle.load(f)
        except:
            return None
