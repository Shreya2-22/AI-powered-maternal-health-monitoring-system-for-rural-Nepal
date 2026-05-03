from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
from datetime import datetime
from typing import List, Optional
from risk_assessment import PregnancyRiskAssessment
from chat_service import PregnancyChatService

# Import validation module
try:
    from validation import (
        HealthRecordValidator, UserValidator, RiskAssessmentValidator,
        DataSanitizer, ErrorResponse
    )
    VALIDATION_AVAILABLE = True
except ImportError:
    print("WARN - Validation module not available - proceeding without validation")
    VALIDATION_AVAILABLE = False
 
load_dotenv()
 
app = FastAPI(title="AamaSuraksha API")
 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
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
    print("OK - MongoDB Atlas connected successfully")
except Exception as e:
    print(f"WARN - MongoDB connection failed: {e}")
    print("    FIX: Go to MongoDB Atlas → Security → Network Access → Add your IP address")
    print("    Running in localStorage-only mode.")
    client = None
    db     = None
 
# Collections (None if DB is offline)
users_collection          = db["users"]           if db is not None else None
health_records_collection = db["health_records"]  if db is not None else None
appointments_collection   = db["appointments"]    if db is not None else None
saved_articles_collection = db["saved_articles"]  if db is not None else None
chat_logs_collection      = db["chat_logs"]       if db is not None else None
 

os.makedirs("models", exist_ok=True)
risk_assessment = PregnancyRiskAssessment()
pregnancy_chat = PregnancyChatService()

# Import ML enhancement modules
try:
    from ml_analyzer import MLAnalyzer, FeatureEngineering
    ml_analyzer = MLAnalyzer()
except ImportError:
    print("WARN - ml_analyzer module not available")
    ml_analyzer = None

try:
    from train_model import ModelTrainer
    model_trainer = ModelTrainer(db) if db is not None else None
except ImportError:
    print("WARN - ModelTrainer not available")
    model_trainer = None

try:
    from personalized_insights import PersonalizedInsightsGenerator
    insights_gen = PersonalizedInsightsGenerator()
except ImportError:
    print("WARN - Personalized insights generator not available")
    insights_gen = None
 
if risk_assessment.is_trained:
    print("[ML] Model loaded - using Random Forest for risk predictions.")
else:
    print("WARN - ML model not found - using rule-based fallback.")
 
 
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
    blood_sugar: float = None  # mmol/L - optional, for GDM screening
    haemoglobin: float = None  # g/dL - optional, for anaemia screening
    prev_complications: bool = False  # Previous obstetric complications flag
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
    health_records: List[dict] = Field(default_factory=list)   # frontend sends localStorage records here

class ModelTrainingRequest(BaseModel):
    action: str  # "train", "evaluate", "stats"

class FeatureAnalysisRequest(BaseModel):
    health_records: list
    user_age: int = 25
    weeks_pregnant: int = 20


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    language: str = "en"
    session_id: str = "global"
    memory_turns: int = Field(default=6, ge=1, le=10)


class LoginRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=7, max_length=20)


class EmergencyAssessmentRequest(BaseModel):
    language: str = "en"
    selected_symptoms: List[str] = Field(default_factory=list)
    weeks_pregnant: int = 20
    duration_hours: Optional[int] = None
    pain_scale: Optional[int] = None
    temperature_c: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    reduced_fetal_movement: bool = False


class PersonalizedInsightsRequest(BaseModel):
    user_id: str
    health_records: List[dict] = Field(default_factory=list)
    user_age: int = 25
    weeks_pregnant: int = 20
    language: str = "en"
    limit: int = Field(default=3, le=5)
 
 
@app.get("/")
async def root():
    return {
        "message":  "AamaSuraksha API",
        "status":   "running",
        "db":       "connected" if db is not None else "offline",
        "ml_model": "loaded"    if risk_assessment.is_trained else "not_loaded",
    }


@app.post("/api/personalized-insights")
async def get_personalized_insights(request: PersonalizedInsightsRequest):
    """
    Generate personalized health insights based on user data.
    Returns contextual, non-generic recommendations based on:
    - Weeks pregnant (trimester)
    - Logged symptoms and health trends
    - Age and risk factors
    """
    try:
        if insights_gen is None:
            raise HTTPException(status_code=503, detail="Insights generator not available")
        
        result = insights_gen.generate_insights(
            user_age=request.user_age,
            weeks_pregnant=request.weeks_pregnant,
            health_records=request.health_records,
            language=request.language,
            limit=request.limit,
        )
        
        return {
            "insights": result.get("insights", []),
            "summary": result.get("summary", ""),
            "count": result.get("count", 0),
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights generation error: {str(e)}")


@app.post("/api/chat")
async def chat_with_guardrails(request: ChatRequest):
    """
    Pregnancy-only chat endpoint with explicit safety guardrails:
    1) Emergency escalation
    2) Strict maternal-health topic restriction
    """
    try:
        cleaned_message = request.message.strip()
        if not cleaned_message:
            raise HTTPException(status_code=400, detail="Message is required")

        result = pregnancy_chat.answer(
            message=cleaned_message,
            language=request.language,
            session_id=request.session_id,
            memory_turns=request.memory_turns,
        )

        response_payload = {
            "reply": result.reply,
            "intent": result.intent,
            "restricted": result.restricted,
            "emergency": result.emergency,
            "confidence": result.confidence,
            "context_used": result.context_used,
            "memory_turns": result.memory_turns,
            "top_intents": result.top_intents or [],
            "model_used": result.model_used,
            "safety_path": result.safety_path,
            "timestamp": datetime.now().isoformat(),
        }

        # Best practice for healthcare bots: keep audit logs when DB is available.
        if chat_logs_collection is not None:
            try:
                chat_logs_collection.insert_one(
                    {
                        "session_id": request.session_id,
                        "language": request.language,
                        "message": cleaned_message,
                        "reply": result.reply,
                        "intent": result.intent,
                        "confidence": float(result.confidence),
                        "restricted": bool(result.restricted),
                        "emergency": bool(result.emergency),
                        "context_used": bool(result.context_used),
                        "model_used": result.model_used,
                        "safety_path": result.safety_path,
                        "created_at": datetime.now().isoformat(),
                    }
                )
            except Exception:
                # Logging should never break patient-facing chat responses.
                pass

        return response_payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat endpoint error: {str(e)}")


@app.post("/api/emergency-assessment")
async def emergency_assessment(request: EmergencyAssessmentRequest):
    """Advanced triage endpoint combining symptoms, vitals, and pregnancy context."""
    try:
        lang = "ne" if str(request.language).lower().startswith("ne") else "en"

        symptom_weights = {
            "bleeding": 5,
            "severe_pain": 5,
            "fever": 3,
            "swelling": 3,
            "headache": 3,
            "dizziness": 2,
            "nausea": 1,
        }

        score = 0
        reasons: List[str] = []
        emergency_flags: List[str] = []
        urgent_flags: List[str] = []

        symptoms = set(request.selected_symptoms)
        for symptom_id in symptoms:
            score += symptom_weights.get(symptom_id, 0)

        if "bleeding" in symptoms and "severe_pain" in symptoms:
            emergency_flags.append("bleeding_with_pain")
            reasons.append("Heavy bleeding with severe pain")

        if request.reduced_fetal_movement and request.weeks_pregnant >= 28:
            emergency_flags.append("reduced_fetal_movement")
            reasons.append("Reduced fetal movement in late pregnancy")

        if request.temperature_c is not None:
            if request.temperature_c >= 39.0:
                urgent_flags.append("high_fever")
                reasons.append("High fever >= 39C")
                score += 2
            elif request.temperature_c >= 38.0:
                urgent_flags.append("fever")
                reasons.append("Fever >= 38C")
                score += 1

        if request.systolic_bp is not None and request.diastolic_bp is not None:
            if request.systolic_bp >= 160 or request.diastolic_bp >= 110:
                emergency_flags.append("very_high_bp")
                reasons.append("Very high blood pressure")
            elif request.systolic_bp >= 140 or request.diastolic_bp >= 90:
                urgent_flags.append("high_bp")
                reasons.append("High blood pressure")
                score += 2

        if request.pain_scale is not None:
            if request.pain_scale >= 9:
                urgent_flags.append("extreme_pain")
                reasons.append("Extreme pain level")
                score += 2
            elif request.pain_scale >= 7:
                urgent_flags.append("high_pain")
                reasons.append("High pain level")
                score += 1

        if request.duration_hours is not None and request.duration_hours >= 24:
            urgent_flags.append("persistent_symptoms")
            reasons.append("Symptoms lasting 24+ hours")
            score += 1

        score = min(score, 10)

        if emergency_flags:
            level = "emergency"
        elif urgent_flags or score >= 6:
            level = "urgent"
        else:
            level = "self_care"

        next_steps = {
            "en": {
                "emergency": "Go to the nearest hospital immediately and call your doctor now.",
                "urgent": "Contact your doctor today and seek same-day evaluation.",
                "self_care": "Monitor symptoms closely, hydrate, rest, and re-check in 6-12 hours.",
            },
            "ne": {
                "emergency": "तुरुन्त नजिकको अस्पताल जानुहोस् र अहिले नै डाक्टरलाई सम्पर्क गर्नुहोस्।",
                "urgent": "आजै डाक्टरलाई सम्पर्क गर्नुहोस् र सोही दिन जाँच गराउनुहोस्।",
                "self_care": "लक्षण नजिकबाट हेर्नुहोस्, पानी पिउनुहोस्, आराम गर्नुहोस्, र ६-१२ घण्टामा पुनः जाँच गर्नुहोस्।",
            },
        }

        action_plans = {
            "en": {
                "emergency": [
                    "Do not wait at home if bleeding, severe pain, or very high BP is present.",
                    "Carry prior reports and medication list.",
                    "Ask a family member to accompany you.",
                ],
                "urgent": [
                    "Check blood pressure and temperature again within 1 hour.",
                    "Avoid heavy activity and keep hydration up.",
                    "Call your clinic and describe current symptoms.",
                ],
                "self_care": [
                    "Track symptoms every 4-6 hours.",
                    "Escalate if symptoms worsen or new red flags appear.",
                    "Discuss persistent discomfort at your next prenatal visit.",
                ],
            },
            "ne": {
                "emergency": [
                    "रक्तस्राव, अत्यधिक दुखाइ, वा धेरै उच्च BP भए घरमै नबस्नुहोस्।",
                    "पुराना रिपोर्ट र औषधि सूची साथमा लिनुहोस्।",
                    "सम्भव भए परिवारको सदस्यसँग जानुहोस्।",
                ],
                "urgent": [
                    "१ घण्टाभित्र BP र तापक्रम फेरि जाँच गर्नुहोस्।",
                    "भारी काम नगर्नुहोस् र पर्याप्त पानी पिउनुहोस्।",
                    "क्लिनिकमा फोन गरेर हालको लक्षण बताउनुहोस्।",
                ],
                "self_care": [
                    "प्रत्येक ४-६ घण्टामा लक्षण नोट गर्नुहोस्।",
                    "लक्षण बढे वा नयाँ जोखिम संकेत आए तुरुन्त escalate गर्नुहोस्।",
                    "लामो समय असहजता रहे अर्को prenatal visit मा डाक्टरसँग छलफल गर्नुहोस्।",
                ],
            },
        }

        return {
            "level": level,
            "score": score,
            "reasons": reasons,
            "red_flags": emergency_flags,
            "urgent_flags": urgent_flags,
            "next_step": next_steps[lang][level],
            "actions": action_plans[lang][level],
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emergency assessment error: {str(e)}")
 
 
@app.post("/api/users")
async def create_user(user: User):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database offline. User saved locally.")
    
    try:
        # Validate user data
        if VALIDATION_AVAILABLE:
            is_valid, error_msg = UserValidator.validate_user_registration(user.model_dump())
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
        
        data = user.model_dump()
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
async def login_user(login_data: LoginRequest):
    if users_collection is None:
        raise HTTPException(status_code=503, detail="Database offline. Login from localStorage only.")
    try:
        name = login_data.name.strip()
        phone = login_data.phone.strip()
        if not name or not phone:
            raise HTTPException(status_code=400, detail="Name and phone are required")

        if VALIDATION_AVAILABLE:
            is_valid, error_msg = UserValidator.validate_nepali_phone(phone)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)
            phone = DataSanitizer.normalize_phone(phone)

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
            is_valid, error_msg = HealthRecordValidator.validate_health_record(record.model_dump())
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Invalid health record: {error_msg}")
            
            # Normalize record
            normalized_data = DataSanitizer.normalize_health_record(record.model_dump())
            data = normalized_data
        else:
            data = record.model_dump()
        
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
        if not ObjectId.is_valid(record_id):
            raise HTTPException(status_code=400, detail="Invalid record id format")

        data = record.model_dump()
        data["updated_at"] = datetime.now().isoformat()
        oid = ObjectId(record_id)
        result = health_records_collection.update_one(
            {"_id": oid}, {"$set": data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        updated = health_records_collection.find_one({"_id": oid})
        updated["id"] = str(updated.pop("_id"))
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.delete("/api/health-records/{record_id}")
async def delete_health_record(record_id: str):
    if health_records_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        if not ObjectId.is_valid(record_id):
            raise HTTPException(status_code=400, detail="Invalid record id format")

        result = health_records_collection.delete_one({"_id": ObjectId(record_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"status": "deleted", "message": "Health record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ── Appointments ───────────────────────────────────────────────────────────────
 
@app.post("/api/appointments")
async def create_appointment(appointment: Appointment):
    if appointments_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        data = appointment.model_dump()
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
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(status_code=400, detail="Invalid appointment id format")

        data = appointment.model_dump()
        data["updated_at"] = datetime.now().isoformat()
        oid = ObjectId(appointment_id)
        result = appointments_collection.update_one(
            {"_id": oid}, {"$set": data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        updated = appointments_collection.find_one({"_id": oid})
        updated["id"] = str(updated.pop("_id"))
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    if appointments_collection is None:
        raise HTTPException(status_code=503, detail="Database offline")
    try:
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(status_code=400, detail="Invalid appointment id format")

        result = appointments_collection.delete_one({"_id": ObjectId(appointment_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"status": "deleted", "message": "Appointment deleted successfully"}
    except HTTPException:
        raise
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
        data = article.model_dump()
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
        if not ObjectId.is_valid(article_id):
            raise HTTPException(status_code=400, detail="Invalid article id format")

        result = saved_articles_collection.delete_one({"_id": ObjectId(article_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"status": "deleted", "message": "Article removed from saved"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ─────────────────────────────────────────────────────────────────────────────
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)