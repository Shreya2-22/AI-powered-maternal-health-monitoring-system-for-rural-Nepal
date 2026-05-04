# AamaSuraksha - Maternal Health Companion

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Active-green)
![License](https://img.shields.io/badge/license-MIT-green)

AamaSuraksha is a maternal health companion application designed specifically for pregnant women in Nepal. It provides personalized health tracking, risk assessment, intelligent health guidance through a chatbot, and emergency support.

Languages Supported: English | नेपाली (Nepali)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Using the AI Chatbot](#using-the-ai-chatbot-beginner-guide)
- [API Endpoints](#api-endpoints)
- [Chatbot Architecture](#chatbot-architecture)
- [ML Models](#ml-models)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## Features

### Health Tracking
- Log weight, blood pressure, blood sugar, hemoglobin levels
- Track symptoms (nausea, bleeding, swelling, headaches, etc.)
- Automatic pregnancy week calculation
- Health record history with trend analysis

### AI-Powered Chatbot
- Smart question handling: Answers ANY pregnancy question
- Graceful redirects: Non-pregnancy topics redirected kindly to pregnancy topics
- Emergency detection: Instantly recognizes danger signs
- Multilingual: English & Nepali
- Context-aware: Responses tailored to pregnancy week, severity level
- Free AI integration: Uses free Hugging Face models with intelligent fallback
- Works offline: Local knowledge base ensures 24/7 availability

### Risk Assessment
- ML-based pregnancy risk classifier
- Feature importance analysis
- Real-time risk scoring (Low/Medium/High)
- Nepal-specific health indicators (hemoglobin, gestational diabetes)
- Personalized recommendations

### Health Insights
- Trimester-specific guidance
- Symptom-based alerts
- Health trend analysis (weight gain, BP changes)
- Age-specific recommendations
- 3+ personalized insights on dashboard

### Appointment Management
- Schedule and track doctor appointments
- Set reminders
- Manage visit history

### Educational Resources
- Week-by-week pregnancy guide
- Nutrition, exercise, and symptom information
- Labor preparation guide
- Breastfeeding tips
- Postpartum recovery advice

### Emergency Assessment
- Quick symptom checker
- Emergency escalation system
- Direct hospital recommendation
- Vital signs tracking (temperature, BP, pain level)

---

## Tech Stack

### Backend
- Framework: FastAPI 0.104.1
- Language: Python 3.12
- Database: MongoDB Atlas
- ML/AI: scikit-learn, Hugging Face Inference API, TFIDF + Logistic Regression
- Authentication: JWT + bcrypt
- Server: uvicorn

### Frontend
- Framework: React 19.2.4
- Build Tool: Vite 8.0.1
- Styling: Tailwind CSS 4.2.2
- Routing: React Router 7.13.1
- Charts: Recharts 2.15.0
- HTTP: Axios 1.13.6

### DevOps & Tools
- Testing: pytest 8.3.3
- Package Manager: pip (Python), npm (Node.js)
- Version Control: Git
- Environment: .env files for secrets

---

## Project Structure

```
aama-suraksha/
├── backend/
│   ├── ai_chatbot_enhanced.py      # AI chatbot with knowledge base
│   ├── chat_service.py             # Rule-based chat guardrails
│   ├── chat_prompts.py             # Chat templates & suggestions
│   ├── chatbot_model.py            # Intent classification model
│   ├── risk_assessment.py          # ML risk classifier
│   ├── personalized_insights.py    # Insight generation engine
│   ├── server.py                   # FastAPI server & endpoints
│   ├── validation.py               # Input validation
│   ├── train_model.py              # Model training pipeline
│   ├── ml_analyzer.py              # Advanced ML analysis
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Environment variables (secret)
│   ├── .env.example                # Example env file
│   ├── models/
│   │   ├── trained_model.pkl       # Random Forest classifier
│   │   ├── label_encoder.pkl       # Risk label encoder
│   │   └── chatbot_intent_model.pkl # Intent classifier
│   ├── tests/
│   │   ├── test_chat_api.py        # Chat endpoint tests
│   │   └── test_chat_service.py    # Chat service tests
│   ├── venv/                       # Virtual environment
│   └── README.md                   # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx             # Main app layout
│   │   │   ├── Dashboard.jsx       # Dashboard with insights
│   │   │   ├── ChatBot.jsx         # Chat interface
│   │   │   ├── HealthTracker.jsx   # Health logging
│   │   │   ├── RiskAssessment.jsx  # Risk display
│   │   │   ├── Appointments.jsx    # Appointment management
│   │   │   ├── Emergency.jsx       # Emergency assessment
│   │   │   ├── Education.jsx       # Educational resources
│   │   │   └── Login.jsx           # Authentication
│   │   ├── constants.js            # API endpoints
│   │   ├── index.css               # Global styles
│   │   └── main.jsx                # React entry point
│   ├── public/                     # Static assets
│   ├── package.json                # Node dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind setup
│   ├── eslint.config.js            # ESLint rules
│   └── index.html                  # HTML template
│
├── README.md                       # THIS FILE
├── CHATBOT_IMPLEMENTATION_GUIDE.md # Chatbot architecture details
├── .gitignore                      # Git ignore rules
└── .env.example                    # Example env file
```

---

## Getting Started

### Prerequisites
- **Python 3.12+** (backend)
- **Node.js 18+** (frontend)
- **MongoDB Atlas account** (cloud database)
- **Git** for version control
- **Hugging Face API Key** (optional, for enhanced AI)

### System Requirements
- RAM: 4GB minimum (8GB recommended)
- Disk: 2GB free space
- OS: Windows, macOS, or Linux

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/aama-suraksha.git
cd aama-suraksha
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

**Note:** If you encounter timeout errors during pip install:
```bash
# Retry with longer timeout
pip install --default-timeout=1000 -r requirements.txt

# Or install packages individually
pip install fastapi uvicorn python-dotenv pymongo pydantic bcrypt
pip install scikit-learn numpy scipy
pip install pytest httpx joblib requests
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## Configuration

### Backend Configuration

1. **Create `.env` file** in `backend/` directory:
```bash
cp .env.example .env
```

2. **Fill in your credentials** in `backend/.env`:
```env
# MongoDB Connection
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/aama_suraksha?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-key-here-change-in-production

# Optional: Hugging Face API Key (for enhanced AI responses)
HUGGINGFACE_API_KEY=hf_your_api_key_here
```

### Frontend Configuration

Create `.env.local` in `frontend/` directory:
```env
VITE_API_URL=http://localhost:8001/api
```

For production:
```env
VITE_API_URL=https://your-api-domain.com/api
```

---

## Running the Application

### Option 1: Run Locally (Development)

#### Terminal 1: Backend
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

python -m uvicorn server:app --reload --port 8001
```

Backend runs at: `http://localhost:8001`
API docs at: `http://localhost:8001/docs`

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Option 2: Build for Production

#### Backend
```bash
cd backend
# Create production build (no reload)
python -m uvicorn server:app --port 8001
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## API Endpoints

### Health Tracking
```
POST   /api/health-records              # Log health data
GET    /api/health-records/:user_id    # Get health history
PUT    /api/health-records/:record_id  # Update health record
DELETE /api/health-records/:record_id  # Delete health record
```

### Chatbot
```
POST   /api/chat                        # Send chat message
GET    /api/chat/suggestions            # Get suggested questions
```

### Risk Assessment
```
POST   /api/risk-assessment            # Calculate pregnancy risk
GET    /api/risk-assessment/:user_id   # Get risk history
```

### Personalized Insights
```
POST   /api/personalized-insights      # Generate health insights
```

### Appointments
```
POST   /api/appointments                # Schedule appointment
GET    /api/appointments/:user_id      # Get user appointments
PUT    /api/appointments/:id           # Update appointment
DELETE /api/appointments/:id           # Cancel appointment
```

### User Authentication
```
POST   /api/auth/login                 # User login
POST   /api/auth/register              # User registration
POST   /api/auth/logout                # User logout
```

**Full API Documentation:** Visit `http://localhost:8001/docs` (Swagger UI)

---

## Chatbot Architecture

The chatbot uses a layered approach to answer pregnancy health questions:

### Layer 1: Question Understanding
- Detects pregnancy-related vs. general questions
- Identifies emergency signals
- Handles greetings and small talk

### Layer 2: Knowledge Base
- Comprehensive pregnancy medical information
- Trimester-specific guidance
- Nutrition and exercise advice
- Symptom and emergency detection

### Layer 3: AI Integration
- **Primary:** Hugging Face Falcon 7B LLM (if API key available)
- **Fallback:** Local rule-based responses (always available)
- **Advantage:** Works offline without requiring external APIs

**Example Flow:**
```
User: "What's a good pizza?"
↓
System detects: Not pregnancy-related
↓
Response: "I specialize in pregnancy nutrition. Would you like 
         nutrient recommendations for pregnancy? Iron, calcium, 
         and protein are especially important!"
```

For detailed architecture, see [CHATBOT_IMPLEMENTATION_GUIDE.md](./CHATBOT_IMPLEMENTATION_GUIDE.md)

---

## ML Models

### 1. **Risk Assessment Model**
- **Type:** Random Forest Classifier
- **Features:** 12 pregnancy-specific indicators
- **File:** `backend/models/trained_model.pkl`
- **Training:** See `backend/train_model.py`

**Features Used:**
```
- weight_kg, systolic_bp, diastolic_bp, age, weeks_pregnant
- weight_gain_kg, days_between_visits, avg_systolic, avg_diastolic
- blood_sugar (gestational diabetes), haemoglobin (anemia)
- prev_complications (obstetric history)
```

### 2. **Chat Intent Classifier**
- **Type:** TFIDF + Logistic Regression Pipeline
- **File:** `backend/models/chatbot_intent_model.pkl`
- **Intents:** nausea, bleeding, pain, fever, nutrition, exercise, etc.

### 3. **Label Encoder**
- **File:** `backend/models/label_encoder.pkl`
- **Purpose:** Encode risk labels (Low/Medium/High)

**Model Training:**
```bash
cd backend
python train_model.py
```

---

## Database

### MongoDB Collections

```javascript
// Users
{
  _id: ObjectId,
  name: String,
  phone: String,
  age: Number,
  weeks_pregnant: Number,
  due_date: Date,
  created_at: Date
}

// Health Records
{
  _id: ObjectId,
  user_id: ObjectId,
  date: Date,
  weight: Number,
  systolic: Number,
  diastolic: Number,
  blood_sugar: Number,
  haemoglobin: Number,
  symptoms: String,
  notes: String,
  created_at: Date
}

// Risk Assessments
{
  _id: ObjectId,
  user_id: ObjectId,
  risk_level: String,  // "low", "medium", "high"
  confidence: Number,
  feature_impact: Object,
  created_at: Date
}

// Appointments
{
  _id: ObjectId,
  user_id: ObjectId,
  date: Date,
  time: String,
  doctor_name: String,
  clinic: String,
  reason: String,
  created_at: Date
}

// Chat Logs
{
  _id: ObjectId,
  session_id: String,
  user_message: String,
  bot_reply: String,
  intent: String,
  confidence: Number,
  created_at: Date
}
```

---

## Testing

### Run All Tests
```bash
cd backend
pytest
```

### Run Specific Test File
```bash
pytest tests/test_chat_service.py -v
pytest tests/test_chat_api.py -v
```

### Test Coverage
```bash
pytest --cov=. --cov-report=html
```

### Manual API Testing
```bash
# Using curl
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Is nausea normal in pregnancy?","language":"en"}'

# Using Python
python -m pytest tests/ -v
```

---

## Deployment

### Deploy Backend (Heroku, Railway, or any VPS)

1. **Create `Procfile`** in backend/:
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

2. **Deploy:**
```bash
git push heroku main
```

### Deploy Frontend (Vercel, Netlify, or GitHub Pages)

1. **Build:**
```bash
npm run build
```

2. **Deploy built `dist/` folder**

### Environment Variables
Ensure all `.env` variables are set in your hosting platform:
- MongoDB connection string
- JWT secret
- Hugging Face API key
- CORS origins

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature`
3. **Commit changes:** `git commit -m "Add your feature"`
4. **Push to branch:** `git push origin feature/your-feature`
5. **Submit a Pull Request**

### Code Standards
- Follow PEP 8 (Python)
- Use ESLint rules (JavaScript)
- Add tests for new features
- Document complex logic

---

## Health Insights (Dashboard)

The dashboard now displays **3+ personalized health insights**:

### Insight Types
1. **Trimester Guide** - Week-specific pregnancy advice
2. **Symptom Alert** - Guidance on logged symptoms
3. **Health Trend** - Weight gain, BP changes analysis
4. **Age-Specific** - For teen or 35+ pregnancies

### How Insights Are Generated
```python
# From backend/personalized_insights.py
generator = PersonalizedInsightsGenerator()
insights = generator.generate_insights(
    user_age=28,
    weeks_pregnant=20,
    health_records=[...],
    language="en",
    limit=3  # Gets 3+ insights
)
```

---

## Support

### Getting Help

1. **Documentation:** Check [CHATBOT_IMPLEMENTATION_GUIDE.md](./CHATBOT_IMPLEMENTATION_GUIDE.md)
2. **API Docs:** Visit `http://localhost:8001/docs`
3. **Issues:** Create a GitHub Issue with detailed description
4. **Email:** Support email here

### Common Issues

**Q: Port 8001 already in use**
```bash
# Use different port
python -m uvicorn server:app --port 8002
```

**Q: MongoDB connection failed**
- Check MONGODB_URL in `.env`
- Verify IP whitelist in MongoDB Atlas

**Q: Dependencies timeout**
```bash
pip install --default-timeout=1000 -r requirements.txt
```

**Q: Frontend can't reach API**
- Check VITE_API_URL in frontend `.env.local`
- Verify backend is running on correct port

---

## Using the AI Chatbot (Beginner Guide)

### Step 1: Start the Application
Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python -m uvicorn server:app --reload --port 8001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser to `http://localhost:3000`

### Step 2: Navigate to the Chatbot
1. Login or create an account
2. Click "Chat" in the navigation menu
3. You'll see the chat interface

### Step 3: Ask Questions
The chatbot handles ANY question intelligently:

**Pregnancy-related questions:**
- "Is nausea normal in the first trimester?"
- "What should I eat to prevent anemia?"
- "When should I feel baby movements?"
- "I have severe abdominal pain, what should I do?"

**General questions (redirected gracefully):**
- "What's a good breakfast?" → Bot redirects to pregnancy nutrition
- "How do I stay fit?" → Bot redirects to pregnancy exercise
- "Can I drink coffee?" → Bot redirects to pregnancy caffeine safety

**Emergency detection:**
- "I have severe chest pain" → Instant emergency alert
- "Heavy bleeding" → Hospital recommendation
- "I'm unconscious" → Escalates to emergency

### Step 4: Clear Chat History
Look for the **CLEAR** button at the bottom of the chat window. Clicking it will erase all messages in the current chat session.

### Features
- ✓ Answers pregnancy questions with medical accuracy
- ✓ Detects emergencies instantly
- ✓ Works in English and Nepali
- ✓ Works offline with built-in knowledge base
- ✓ Remembers context within a session
- ✓ Clear button to reset conversation

---

## Jupyter Notebooks & ML Training

### Included Notebooks
The project includes Jupyter notebooks for:
- **Model training & experimentation**
- **Feature analysis & EDA**
- **Performance evaluation**

### Best Practices
✅ DO:
- Commit `.ipynb` files to repo for documentation
- Keep `.pkl` files (trained models) in `backend/models/`
- Document notebook purpose in README
- Use notebooks for analysis/experimentation
- Include training data version in notebook

❌ DON'T:
- Commit large data files (>10MB) directly
- Store secrets in notebooks
- Commit notebooks with execution output if very large
- Use notebooks for production code

### Using Notebooks
```bash
# Install Jupyter (if not already)
pip install jupyter notebook

# Start Jupyter
jupyter notebook

# Or use Jupyter Lab
pip install jupyterlab
jupyter lab
```

### Recommended Structure
```
backend/notebooks/
├── 01_data_exploration.ipynb
├── 02_model_training.ipynb
├── 03_model_evaluation.ipynb
└── README.md
```

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Hugging Face** - Free LLM models and API
- **scikit-learn** - Machine learning library
- **React & Vite** - Frontend framework
- **FastAPI & MongoDB** - Backend infrastructure
- **Tailwind CSS** - Styling

---

## 📞 Contact & Social

- **Project Lead:** [Your Name]
- **Email:** contact@aamasuraksha.com
- **Website:** www.aamasuraksha.com
- **GitHub:** github.com/yourusername/aama-suraksha

---

**Last Updated:** May 4, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

## Quick Reference

### Start Development
```bash
# Terminal 1: Backend
cd backend && venv\Scripts\activate && python -m uvicorn server:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev
```

### View API Documentation
```
http://localhost:8001/docs
```

### Access Application
```
http://localhost:3000
```

### Run Tests
```bash
cd backend && pytest -v
```

### Build Production
```bash
# Backend: Already built with uvicorn
# Frontend:
cd frontend && npm run build
```

---

**Made with ❤️ for maternal health in Nepal**
