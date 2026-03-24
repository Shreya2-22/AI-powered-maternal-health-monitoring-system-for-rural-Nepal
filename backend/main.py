from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import os
from datetime import datetime

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

# Collections
users_collection = db["users"]
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

@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    try:
        result = appointments_collection.delete_one({"_id": ObjectId(appointment_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"status": "deleted", "message": "Appointment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)