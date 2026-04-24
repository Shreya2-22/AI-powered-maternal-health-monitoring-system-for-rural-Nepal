from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
from datetime import datetime
from risk_assessment import PregnancyRiskAssessment

# Import validation module
try:
    from validation import (
        HealthRecordValidator, UserValidator, RiskAssessmentValidator,
        DataSanitizer, ErrorResponse
    )
    VALIDATION_AVAILABLE = True
except ImportError:
    print("⚠️ Validation module not available - proceeding without validation")
    VALIDATION_AVAILABLE = False
 
load_dotenv()
 
app = FastAPI(title="AamaSuraksha API")
 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# ── MongoDB Atlas Connection ───────────────────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
 
client = None
db     = None
 
try:
    client = MongoClient(
        MONGODB_URL,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
        socketTimeoutMS=8000,
    )
    client.admin.command('ping')
    db = client["aama_suraksha"]
    print("✅ MongoDB Atlas connected successfully")
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print("    FIX: Go to MongoDB Atlas → Security → Network Access → Add your IP address")
    print("    Running in localStorage-only mode.")
    client = None
    db     = None
 
# Collections (None if DB is offline)
users_collection          = db["users"]           if db is not None else None
health_records_collection = db["health_records"]  if db is not None else None
appointments_collection   = db["appointments"]    if db is not None else None
saved_articles_collection = db["saved_articles"]  if db is not None else None
 
# ── ML Model ──────────────────────────────────────────────────────────────────
os.makedirs("models", exist_ok=True)
risk_assessment = PregnancyRiskAssessment()

# Import ML enhancement modules
try:
    from ml_analyzer import MLAnalyzer, FeatureEngineering
    ml_analyzer = MLAnalyzer()
except ImportError:
    print("⚠️ ml_analyzer module not available")
    ml_analyzer = None

try:
    from train_model import ModelTrainer
    model_trainer = ModelTrainer(db) if db is not None else None
except ImportError:
    print("⚠️ ModelTrainer not available")
    model_trainer = None
 
if risk_assessment.is_trained:
    print("🤖 ML model loaded — using Random Forest for risk predictions.")
else:
    print("⚠️  ML model not found — using rule-based fallback.")
 
# ═════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═════════════════════════════════════════════════════════════════════════════
 
class User(BaseModel):
    name: str
    age: int
    phone: str = ""
    district: str = ""
    weeks_pregnant: int
    due_date: str
    language_preference: str = "en"
 
class HealthRecord(BaseModel):
    user_id: str
    date: str
    weight: float
    systolic: int
    diastolic: int
    symptoms: str = ""
    notes: str = ""
 
class Appointment(BaseModel):
    user_id: str
    date: str
    time: str
    doctor_name: str
    clinic: str
    reason: str = ""
 
class SavedArticle(BaseModel):
    user_id: str
    title: str
    category: str
    content: str
    week: int = 0
 
class RiskAssessmentRequest(BaseModel):
    user_id: str
    health_records: list = []   # frontend sends localStorage records here

class ModelTrainingRequest(BaseModel):
    action: str  # "train", "evaluate", "stats"

class FeatureAnalysisRequest(BaseModel):
    health_records: list
    user_age: int = 25
    weeks_pregnant: int = 20
 
 
@app.get("/")
async def root():
    return {
        "message":  "AamaSuraksha API",
        "status":   "running",
        "db":       "connected" if db is not None else "offline",
        "ml_model": "loaded"    if risk_assessment.is_trained else "not_loaded",
    }
 
# ── Users ─────────────────────────────────────────────────────────────────────
# ⚠️  FIX: /api/users/login must be declared BEFORE /api/users/{user_name}
#    Otherwise FastAPI treats "login" as the {user_name} parameter.
 
@app.post("/api/users")
async def create_user(user: User):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database offline. User saved locally.")
    
    try:
        # Validate user data
        if VALIDATION_AVAILABLE:
            is_valid, error_msg = UserValidator.validate_user_registration(user.dict())
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Invalid registration: {error_msg}")
            
            # Normalize phone
            normalized_phone = DataSanitizer.normalize_phone(user.phone)
        else:
            normalized_phone = user.phone
        
        existing = users_collection.find_one({"phone": normalized_phone})
        if existing:
            existing["id"] = str(existing.pop("_id"))
            return existing
        
        data = user.dict()
        data["phone"] = normalized_phone
        data["created_at"] = datetime.now().isoformat()
        result  = users_collection.insert_one(data)
        created = users_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ✅ Login route BEFORE the /{user_name} route (critical order!)
@app.post("/api/users/login")
async def login_user(login_data: dict):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database offline. Login from localStorage only.")
    try:
        name  = login_data.get("name",  "").strip()
        phone = login_data.get("phone", "").strip()
        if not name or not phone:
            raise HTTPException(status_code=400, detail="Name and phone are required")
        user = users_collection.find_one({"name": name, "phone": phone})
        if not user:
            raise HTTPException(status_code=404, detail="User not found. Please register first.")
        user["id"] = str(user.pop("_id"))
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/users/{user_name}")
async def get_user(user_name: str):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        user = users_collection.find_one({"name": user_name})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["id"] = str(user.pop("_id"))
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
 
@app.post("/api/health-records")
async def create_health_record(record: HealthRecord):
    if health_records_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    
    try:
        # Validate record
        if VALIDATION_AVAILABLE:
            is_valid, error_msg = HealthRecordValidator.validate_health_record(record.dict())
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Invalid health record: {error_msg}")
            
            # Normalize record
            normalized_data = DataSanitizer.normalize_health_record(record.dict())
            data = normalized_data
        else:
            data = record.dict()
        
        data["created_at"] = datetime.now().isoformat()
        result  = health_records_collection.insert_one(data)
        created = health_records_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/health-records/{user_id}")
async def get_health_records(user_id: str):
    if health_records_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        records = list(health_records_collection.find({"user_id": user_id}).sort("created_at", -1))
        for r in records:
            r["id"] = str(r.pop("_id"))
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.put("/api/health-records/{record_id}")
async def update_health_record(record_id: str, record: HealthRecord):
    if health_records_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        data = record.dict()
        data["updated_at"] = datetime.now().isoformat()
        result = health_records_collection.update_one(
            {"_id": ObjectId(record_id)}, {"$set": data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        updated = health_records_collection.find_one({"_id": ObjectId(record_id)})
        updated["id"] = str(updated.pop("_id"))
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.delete("/api/health-records/{record_id}")
async def delete_health_record(record_id: str):
    if health_records_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        result = health_records_collection.delete_one({"_id": ObjectId(record_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"status": "deleted", "message": "Health record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ── Appointments ───────────────────────────────────────────────────────────────
 
@app.post("/api/appointments")
async def create_appointment(appointment: Appointment):
    if appointments_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        data = appointment.dict()
        data["created_at"] = datetime.now().isoformat()
        result  = appointments_collection.insert_one(data)
        created = appointments_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/appointments/{user_id}")
async def get_appointments(user_id: str):
    if appointments_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        appts = list(appointments_collection.find({"user_id": user_id}).sort("date", -1))
        for a in appts:
            a["id"] = str(a.pop("_id"))
        return appts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.put("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, appointment: Appointment):
    if appointments_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        data = appointment.dict()
        data["updated_at"] = datetime.now().isoformat()
        result = appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)}, {"$set": data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        updated = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        updated["id"] = str(updated.pop("_id"))
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    if appointments_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        result = appointments_collection.delete_one({"_id": ObjectId(appointment_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"status": "deleted", "message": "Appointment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 

 
@app.post("/api/risk-assessment")
async def get_risk_assessment(request: RiskAssessmentRequest):
    """
    Calculate pregnancy risk using the pre-trained Random Forest model.
    Accepts health_records from frontend (localStorage) so it works
    even when MongoDB is offline.
    """
    try:
        user           = None
        health_records = request.health_records or []

        # Try DB first, fall back to defaults
        if users_collection is not None:
            try:
                if len(request.user_id) == 24:
                    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
            except Exception:
                pass
            if not user:
                user = users_collection.find_one({"_id": str(request.user_id)})

        if not user:
            user = {"age": 25, "weeks_pregnant": 20}

        # Get health records from DB only if frontend didn't send them
        if not health_records and health_records_collection is not None:
            health_records = list(
                health_records_collection.find({"user_id": request.user_id}).sort("date", 1)
            )
            for r in health_records:
                r['_id'] = str(r['_id'])

        result = risk_assessment.calculate_risk(
            health_records  = health_records,
            user_age        = user.get('age', 25),
            weeks_pregnant  = user.get('weeks_pregnant', 20)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── NEW: Model Training & Management ───────────────────────────────────────────

@app.post("/api/ml/train-model")
async def train_model():
    """
    Retrain the ML model using all user data from MongoDB
    Includes cross-validation, metrics, and model evaluation
    """
    if model_trainer is None:
        raise HTTPException(status_code=503, detail="Model trainer not available")
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")
    
    try:
        success, metrics = model_trainer.train()
        
        if success:
            return {
                'status': 'success',
                'message': 'Model trained successfully',
                'metrics': metrics
            }
        else:
            raise HTTPException(status_code=400, detail="Training failed - insufficient data")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@app.get("/api/ml/model-stats")
async def get_model_stats():
    """Get comprehensive model statistics and insights"""
    if ml_analyzer is None:
        raise HTTPException(status_code=503, detail="ML analyzer not available")
    
    try:
        insights = ml_analyzer.get_model_insights()
        
        # Try to load metrics if available
        metrics = model_trainer.load_metrics() if model_trainer else None
        
        return {
            'model_status': 'loaded' if risk_assessment.is_trained else 'not_loaded',
            'insights': insights,
            'training_metrics': metrics if metrics else {},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/feature-importance")
async def get_feature_importance():
    """Get feature importance rankings from the trained model"""
    if ml_analyzer is None:
        raise HTTPException(status_code=503, detail="ML analyzer not available")
    
    try:
        importance = ml_analyzer.get_feature_importance()
        
        if not importance:
            raise HTTPException(status_code=400, detail="Model not available for analysis")
        
        return {
            'feature_importance': importance,
            'total_features': len(importance),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/analyze-features")
async def analyze_features(request: FeatureAnalysisRequest):
    """
    Perform advanced feature engineering analysis on health records
    Returns feature importance and risk factor breakdown
    """
    if ml_analyzer is None:
        raise HTTPException(status_code=503, detail="ML analyzer not available")
    
    try:
        temporal_features = FeatureEngineering.extract_temporal_features(request.health_records)
        vital_trends = FeatureEngineering.extract_vital_trends(request.health_records)
        nepal_factors = FeatureEngineering.extract_nepal_risk_factors(request.health_records)
        
        return {
            'temporal_features': temporal_features,
            'vital_trends': vital_trends,
            'nepal_risk_factors': nepal_factors,
            'summary': {
                'total_records': len(request.health_records),
                'analysis_timestamp': datetime.now().isoformat(),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/predict-confidence")
async def predict_with_confidence(request: FeatureAnalysisRequest):
    """
    Make prediction with detailed confidence metrics and decision boundaries
    """
    if ml_analyzer is None or not risk_assessment.is_trained:
        raise HTTPException(status_code=503, detail="Model not available")
    
    try:
        from risk_assessment import PregnancyRiskAssessment
        
        # Prepare features
        pra = PregnancyRiskAssessment()
        features = pra._prepare_features(
            request.health_records,
            request.user_age,
            request.weeks_pregnant
        )
        
        if features is None:
            raise HTTPException(status_code=400, detail="Insufficient health data")
        
        result = ml_analyzer.predict_with_confidence(features)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/model-health")
async def check_model_health():
    """
    Check model health and readiness for predictions
    Returns: { is_trained, model_type, confidence_level, warnings }
    """
    try:
        warnings = []
        
        if not risk_assessment.is_trained:
            warnings.append("ML model not loaded - using rule-based predictions")
        
        if users_collection is None:
            warnings.append("Database offline - cannot retrain model")
        
        return {
            'is_trained': risk_assessment.is_trained,
            'model_type': 'RandomForest' if risk_assessment.is_trained else 'RuleBased',
            'prediction_mode': 'ml' if risk_assessment.is_trained else 'fallback',
            'warnings': warnings,
            'timestamp': datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 

 
@app.post("/api/saved-articles")
async def save_article(article: SavedArticle):
    if saved_articles_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        data = article.dict()
        data["created_at"] = datetime.now().isoformat()
        result  = saved_articles_collection.insert_one(data)
        created = saved_articles_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/saved-articles/{user_id}")
async def get_saved_articles(user_id: str):
    if saved_articles_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        # ✅ FIX: removed accidental extra space in .  find()
        articles = list(saved_articles_collection.find({"user_id": user_id}).sort("created_at", -1))
        for a in articles:
            a["id"] = str(a.pop("_id"))
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.delete("/api/saved-articles/{article_id}")
async def delete_saved_article(article_id: str):
    if saved_articles_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        result = saved_articles_collection.delete_one({"_id": ObjectId(article_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"status": "deleted", "message": "Article removed from saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ─────────────────────────────────────────────────────────────────────────────
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)