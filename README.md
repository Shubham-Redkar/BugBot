
#  BugBot – AI-Powered Autonomous QA Testing Agent

An intelligent **multi-agent AI system** that automatically scans websites, detects issues, and generates **detailed explanations and actionable fixes using LLMs**.

---

#  Overview

BugBot eliminates manual QA testing by automating the entire workflow:

-  Crawls websites  
-  Detects UI & functional issues  
-  Explains issues using AI  
-  Suggests fixes using AI  
-  Generates structured reports  

---

#  Key Features

- Autonomous website scanning  
- Multi-agent architecture  
- AI-generated explanations (WHY)  
- AI-generated fix suggestions (HOW)  
- Real-time scan progress tracking  
- REST API with FastAPI  
- Scalable and modular design  

---

#  Multi-Agent Architecture

```

User Input (URL)
↓
Crawler Agent
↓
Testing Agent
↓
Report Explainer Agent (AI)
↓
Suggestion Agent (AI)
↓
Structured Report Output

```

---

#  Tech Stack

### Backend
- FastAPI  
- Uvicorn  

### AI / LLM
- Grok API (xAI)  

### Web Scraping / Testing
- Playwright  
- httpx  
- BeautifulSoup  

### Database
- PostgreSQL
- SQLAlchemy (async)
- Alembic migrations

### Utilities
- Pydantic and pydantic-settings
- Pytest

---

#  Project Structure

```text
BugBot/
├── backend/
│   ├── alembic/                 # PostgreSQL migrations
│   ├── app/
│   │   ├── agents/
│   │   │   ├── report_agent.py
│   │   │   └── scan_coordinator.py
│   │   ├── api/routes.py
│   │   ├── db/                  # SQLAlchemy models and async sessions
│   │   ├── models/              # API and scan data contracts
│   │   ├── repositories/        # PostgreSQL persistence
│   │   ├── services/            # Browser, analysis, LLM, screenshots
│   │   ├── config.py            # Typed application settings
│   │   └── main.py
│   ├── tests/
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/useScanner.ts
│   │   ├── lib/api.ts
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

# 🔌 API Endpoints

###  Start Scan

POST /scan

```json
{
  "url": "https://example.com"
}
````

---

###  Check Status

GET /scan/{scan_id}/status

---

###  Get Results

GET /scan/{scan_id}/results

---

###  Filter Issues

GET /scan/{scan_id}/issues?severity=high

---

###  Download Report

GET /scan/{scan_id}/download

---

#  AI Capabilities

BugBot uses LLMs to generate:

###  Explanation

* Root cause analysis
* Technical reasoning
* Context-aware insights

###  Impact

* User experience impact
* Business impact
* System reliability concerns

###  Fix Suggestions

* Step-by-step solutions
* Frontend + backend fixes
* Best practices

---

#  Installation

```bash
git clone <https://github.com/Shubham-Redkar/BugBot>
cd BugBot/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
playwright install chromium
```

---

#  Environment Setup

Create a `.env` file:

```
XAI_API_KEY=your_api_key_here
DATABASE_URL=postgresql+asyncpg://bugbot:bugbot@localhost:5432/bugbot
```

---

#  Run the Project

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Open in browser:

[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

#  Example Output

```json
{
  "issue_type": "Broken Link",
  "severity": "High",
  "description": "404 error on About page",
  "explanation": "The link points to a non-existent resource due to incorrect routing or outdated URL configuration.",
  "impact": "Users cannot access the intended page, leading to poor navigation experience and increased bounce rate.",
  "fix_suggestion": "1. Verify the URL path\n2. Update frontend links\n3. Ensure backend route exists\n4. Add redirect handling if needed"
}
```

---

#  Key Innovation

*  AI-driven QA (not rule-based)
*  Multi-agent system design
*  End-to-end automation
*  Developer-friendly reports

---

#  Use Cases

* Automated QA testing
* Website health monitoring
* Developer debugging assistant
* Hackathon AI projects

---

#  Future Improvements

*  Parallel LLM execution
*  Screenshot-based issue detection
*  Confidence scoring
*  Advanced analytics dashboard
*  Real-time streaming results

---

#  Team Roles

###  Backend + AI

* FastAPI backend
* Agent orchestration
* LLM integration

###  Frontend

* UI + dashboard
* API integration

###  Scanner

* Playwright testing
* Issue detection

---

#  USP

**An AI-powered QA system that not only detects issues but also explains them and suggests fixes using intelligent agents.**

---

#  Final Note

BugBot transforms traditional QA into an intelligent, autonomous, AI-driven system — making debugging faster, smarter, and scalable.
