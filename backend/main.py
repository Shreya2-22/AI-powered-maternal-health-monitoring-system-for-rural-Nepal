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

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = MongoClient(MONGODB_URL)
db = client["aama_suraksha"]

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

# Initialize Risk Assessment (loads trained model if exists)
risk_assessment = PregnancyRiskAssessment()

print("✅ Backend initialized")
if risk_assessment.is_trained:
    print("🤖 ML Model loaded successfully!")
else:
    print("⚠️ Using rule-based risk assessment (no trained model found)")
health_records_collection = db["health_records"]
appointments_collection = db["appointments"]
saved_articles_collection = db["saved_articles"]

# Models
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

# Routes
@app.get("/")
async def root():
    return {"message": "AamaSuraksha API", "status": "running"}

@app.post("/api/users")
async def create_user(user: User):
    try:
        # Check if user exists by name
        existing = users_collection.find_one({"name": user.name})
        if existing:
            existing["id"] = str(existing.pop("_id"))
            return existing
        
        user_data = user.dict()
        user_data["created_at"] = datetime.now().isoformat()
        result = users_collection.insert_one(user_data)
        
        created_user = users_collection.find_one({"_id": result.inserted_id})
        created_user["id"] = str(created_user.pop("_id"))
        return created_user
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/login")
async def login_user(login_data: dict):
    try:
        name = login_data.get("name", "").strip()
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

@app.post("/api/health-records")
async def create_health_record(record: HealthRecord):
    try:
        record_data = record.dict()
        record_data["created_at"] = datetime.now().isoformat()
        result = health_records_collection.insert_one(record_data)
        
        created_record = health_records_collection.find_one({"_id": result.inserted_id})
        created_record["id"] = str(created_record.pop("_id"))
        return created_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health-records/{user_id}")
async def get_health_records(user_id: str):
    try:
        records = list(health_records_collection.find({"user_id": user_id}).sort("created_at", -1))
        for record in records:
            record["id"] = str(record.pop("_id"))
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/appointments")
async def create_appointment(appointment: Appointment):
    try:
        appt_data = appointment.dict()
        appt_data["created_at"] = datetime.now().isoformat()
        result = appointments_collection.insert_one(appt_data)
        
        created_appt = appointments_collection.find_one({"_id": result.inserted_id})
        created_appt["id"] = str(created_appt.pop("_id"))
        return created_appt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/appointments/{user_id}")
async def get_appointments(user_id: str):
    try:
        appts = list(appointments_collection.find({"user_id": user_id}).sort("date", -1))
        for appt in appts:
            appt["id"] = str(appt.pop("_id"))
        return appts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, appointment: Appointment):
    try:
        appt_data = appointment.dict()
        appt_data["updated_at"] = datetime.now().isoformat()
        
        result = appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": appt_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        updated_appt = appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        updated_appt["id"] = str(updated_appt.pop("_id"))
        return updated_appt
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

# Risk Assessment Request Model
class RiskAssessmentRequest(BaseModel):
    user_id: str

# Initialize risk assessment model
risk_assessment = PregnancyRiskAssessment()

@app.post("/api/risk-assessment")
async def get_risk_assessment(request: RiskAssessmentRequest):
    """Calculate pregnancy risk based on health records"""
    try:
        user_id = request.user_id
        
        # Fetch user data
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Fetch health records
        health_records = list(health_records_collection.find({
            "user_id": user_id
        }).sort("date", -1))
        
        # Convert ObjectId to string for processing
        for record in health_records:
            record['_id'] = str(record['_id'])
        
        # Calculate risk
        result = risk_assessment.calculate_risk(
            health_records=health_records,
            user_age=user.get('age', 25),
            weeks_pregnant=user.get('weeks_pregnant', 20)
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train-model")
async def train_model():
    """
    Train the ML model on accumulated health data
    Returns: {success, accuracy, samples_used, message}
    """
    try:
        from train_model import ModelTrainer
        
        # Create trainer
        trainer = ModelTrainer(db)
        
        # Train the model
        success, metrics = trainer.train(risk_assessment.rf_model)
        
        if success:
            # Model is now trained
            risk_assessment.is_trained = True
            risk_assessment.use_ml = True
            
            return {
                'status': 'success',
                'accuracy': metrics['accuracy'],
                'samples_used': metrics['samples'],
                'message': f"✅ Model trained successfully on {metrics['samples']} samples with {metrics['accuracy']}% accuracy",
                'model_used': 'ml'
            }
        else:
            return {
                'status': 'error',
                'message': 'Insufficient data for training. Need at least 2+ records per user.',
                'model_used': 'rules'
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

# Health Records UPDATE endpoint
@app.put("/api/health-records/{record_id}")
async def update_health_record(record_id: str, record: HealthRecord):
    try:
        record_data = record.dict()
        record_data["updated_at"] = datetime.now().isoformat()
        
        result = health_records_collection.update_one(
            {"_id": ObjectId(record_id)},
            {"$set": record_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        
        updated_record = health_records_collection.find_one({"_id": ObjectId(record_id)})
        updated_record["id"] = str(updated_record.pop("_id"))
        return updated_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health Records DELETE endpoint
@app.delete("/api/health-records/{record_id}")
async def delete_health_record(record_id: str):
    try:
        result = health_records_collection.delete_one({"_id": ObjectId(record_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"status": "deleted", "message": "Health record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Save Article endpoint
@app.post("/api/saved-articles")
async def save_article(article: SavedArticle):
    try:
        article_data = article.dict()
        article_data["created_at"] = datetime.now().isoformat()
        result = saved_articles_collection.insert_one(article_data)
        
        created_article = saved_articles_collection.find_one({"_id": result.inserted_id})
        created_article["id"] = str(created_article.pop("_id"))
        return created_article
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get Saved Articles for user
@app.get("/api/saved-articles/{user_id}")
async def get_saved_articles(user_id: str):
    try:
        articles = list(saved_articles_collection.find({"user_id": user_id}).sort("created_at", -1))
        for article in articles:
            article["id"] = str(article.pop("_id"))
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete Saved Article
@app.delete("/api/saved-articles/{article_id}")
async def delete_saved_article(article_id: str):
    try:
        result = saved_articles_collection.delete_one({"_id": ObjectId(article_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"status": "deleted", "message": "Article removed from saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)