# AamaSuraksha

AamaSuraksha is a maternal health companion for pregnant women in Nepal. It combines health tracking, emergency triage, personalized insights, appointment support, education, and a bilingual chatbot in English and Nepali.

## What it does

- Tracks weight, blood pressure, blood sugar, haemoglobin, symptoms, and notes.
- Flags emergency symptoms and gives safer escalation guidance.
- Generates personalized health insights from recorded data.
- Schedules and manages appointments.
- Provides pregnancy education by trimester and topic.
- Offers a bilingual chatbot and AI-assisted guidance.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Recharts
- Backend: FastAPI, Python, MongoDB, scikit-learn, pymongo, pydantic, bcrypt
- Testing: pytest, httpx

## Project Structure

```text
backend/
  ai_chatbot_enhanced.py
  chat_prompts.py
  chat_service.py
  chatbot_model.py
  ml_analyzer.py
  personalized_insights.py
  risk_assessment.py
  server.py
  train_model.py
  validation.py
  models/
  notebooks/
  tests/
  requirements.txt
frontend/
  src/
  public/
  package.json
  vite.config.js
  tailwind.config.js
Database/
  schema/
  sample-data/
  queries/
  validation/
  screenshots/
```

## Setup

Backend:

```bash
cd backend
python -m venv venv
# PowerShell
.\venv\Scripts\Activate.ps1
# Command Prompt
venv\Scripts\activate
pip install -r requirements.txt
```

Frontend:

```bash
cd frontend
npm install
```

## Configuration

- Copy `backend/.env.example` to `backend/.env`.
- Set `MONGODB_URL` and `JWT_SECRET`.
- Set `VITE_API_URL` in `frontend/.env.local` if needed.

## Notes

- Keep generated build output, virtual environments, caches, and local secrets out of version control.
- The database documentation lives under `Database/` for submission and reference.

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
