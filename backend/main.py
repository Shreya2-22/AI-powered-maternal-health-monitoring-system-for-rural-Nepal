from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
from datetime import datetime
from risk_assessment import PregnancyRiskAssessment
 
load_dotenv()
 
app = FastAPI(title="AamaSuraksha API")
 
# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
try:
    # Connect without explicit SSL parameters - MongoDB Atlas handles SSL automatically
    client = MongoClient(
        MONGODB_URL,
        connect=False,
        serverSelectionTimeoutMS=5000
    )
    # Test the connection
    client.admin.command('ping')
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"⚠️  MongoDB connection issue: {e}")
    print("    Possible causes:")
    print("    - IP address not whitelisted in MongoDB Atlas (check Security > Network Access)")
    print("    - Connection string credentials incorrect")
    print("    - MongoDB Atlas cluster not running")
    print("    Running in offline mode - risk assessment will use rule-based predictions")
    client = None

db          = client["aama_suraksha"] if client else None
 
if db:
    users_collection          = db["users"]
    health_records_collection = db["health_records"]
    appointments_collection   = db["appointments"]
    saved_articles_collection = db["saved_articles"]
else:
    # Offline mode - create dummy collections that won't crash but will have no data
    users_collection          = None
    health_records_collection = None
    appointments_collection   = None
    saved_articles_collection = None
 
# ── Load pre-trained ML model (trained in Jupyter notebook) ───────────────────
os.makedirs("models", exist_ok=True)
risk_assessment = PregnancyRiskAssessment()
 
if risk_assessment.is_trained:
    print("🤖 ML model loaded — using Random Forest for risk predictions.")
else:
    print("⚠️  ML model not found — using rule-based fallback.")
    print("    Run the Jupyter notebook to train and save the model first.")
 
# ═════════════════════════════════════════════════════════════════════════════
# REQUEST MODELS
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
    health_records: list = []  # Optional: health records from frontend localStorage
 
# ═════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═════════════════════════════════════════════════════════════════════════════
 
@app.get("/")
async def root():
    return {
        "message": "AamaSuraksha API",
        "status":  "running",
        "ml_model": "loaded" if risk_assessment.is_trained else "not_loaded"
    }
 
# ── Users ─────────────────────────────────────────────────────────────────────
 
@app.post("/api/users")
async def create_user(user: User):
    try:
        existing = users_collection.find_one({"name": user.name})
        if existing:
            existing["id"] = str(existing.pop("_id"))
            return existing
        user_data = user.dict()
        user_data["created_at"] = datetime.now().isoformat()
        result = users_collection.insert_one(user_data)
        created = users_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/users/{user_name}")
async def get_user(user_name: str):
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
 
@app.post("/api/users/login")
async def login_user(login_data: dict):
    try:
        name  = login_data.get("name", "").strip()
        phone = login_data.get("phone", "").strip()
        if not name or not phone:
            raise HTTPException(status_code=400, detail="Name and phone are required")
        user = users_collection.find_one({"name": name, "phone": phone})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user["id"] = str(user.pop("_id"))
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ── Health Records ─────────────────────────────────────────────────────────────
 
@app.post("/api/health-records")
async def create_health_record(record: HealthRecord):
    try:
        data = record.dict()
        data["created_at"] = datetime.now().isoformat()
        result = health_records_collection.insert_one(data)
        created = health_records_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/health-records/{user_id}")
async def get_health_records(user_id: str):
    try:
        records = list(health_records_collection.find({"user_id": user_id}).sort("created_at", -1))
        for r in records:
            r["id"] = str(r.pop("_id"))
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.put("/api/health-records/{record_id}")
async def update_health_record(record_id: str, record: HealthRecord):
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
    try:
        data = appointment.dict()
        data["created_at"] = datetime.now().isoformat()
        result = appointments_collection.insert_one(data)
        created = appointments_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/appointments/{user_id}")
async def get_appointments(user_id: str):
    try:
        appts = list(appointments_collection.find({"user_id": user_id}).sort("date", -1))
        for a in appts:
            a["id"] = str(a.pop("_id"))
        return appts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.put("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, appointment: Appointment):
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
    try:
        result = appointments_collection.delete_one({"_id": ObjectId(appointment_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"status": "deleted", "message": "Appointment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
# ── Risk Assessment (uses pre-trained model from Jupyter notebook) ─────────────
 
@app.post("/api/risk-assessment")
async def get_risk_assessment(request: RiskAssessmentRequest):
    """
    Calculate pregnancy risk using the pre-trained Random Forest model.
    The model was trained in the Jupyter notebook on 1000 synthetic patients.
    Supports both MongoDB ObjectId users and localStorage string IDs.
    Falls back to defaults if MongoDB is unavailable.
    
    The request can include health_records from the frontend (localStorage),
    which will be used if provided, allowing the app to work offline.
    """
    try:
        user = None
        health_records = request.health_records or []  # Use provided records or empty list
        
        # Only query database if MongoDB is connected
        if users_collection is not None:
            # Try to find user by ObjectId first (from MongoDB)
            try:
                if len(request.user_id) == 24:  # Valid ObjectId hex length
                    user = users_collection.find_one({"_id": ObjectId(request.user_id)})
            except Exception:
                pass
            
            # If not found, try to find by string ID (from localStorage)
            if not user:
                user = users_collection.find_one({"_id": str(request.user_id)})
        
        # If user still not found, use defaults for local users
        if not user:
            user = {"age": 25, "weeks_pregnant": 20}
 
        # Get health records from database ONLY if not provided by frontend
        if not health_records and health_records_collection is not None:
            health_records = list(
                health_records_collection.find({"user_id": request.user_id}).sort("date", 1)
            )
            for r in health_records:
                r['_id'] = str(r['_id'])
 
        result = risk_assessment.calculate_risk(
            health_records   = health_records,
            user_age         = user.get('age', 25),
            weeks_pregnant   = user.get('weeks_pregnant', 20)
        )
        return result
 
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in risk assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
 
# ── Saved Articles ─────────────────────────────────────────────────────────────
 
@app.post("/api/saved-articles")
async def save_article(article: SavedArticle):
    try:
        data = article.dict()
        data["created_at"] = datetime.now().isoformat()
        result = saved_articles_collection.insert_one(data)
        created = saved_articles_collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.get("/api/saved-articles/{user_id}")
async def get_saved_articles(user_id: str):
    try:
        articles = list(saved_articles_collection.find({"user_id": user_id}).sort("created_at", -1))
        for a in articles:
            a["id"] = str(a.pop("_id"))
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
@app.delete("/api/saved-articles/{article_id}")
async def delete_saved_article(article_id: str):
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