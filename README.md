
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
- MongoDB (Motor)  

### Utilities
- Pydantic  
- Python-dotenv  

---

#  Project Structure

```

BugBot/
│
├── backend/
│   ├── app/
│   │   ├── __pycache__/
│   │   │
│   │   ├── agents/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── crawler_agent.py
│   │   │   ├── explainer_agent.py
│   │   │   └── testing_agent.py
│   │   │
│   │   ├── api/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   └── routes.py
│   │   │
│   │   ├── db/
│   │   │   ├── __pycache__/
│   │   │   └── database.py
│   │   │
│   │   ├── models/
│   │   │   ├── __pycache__/
│   │   │   ├── __init__.py
│   │   │   ├── request_models.py
│   │   │   └── response_models.py
│   │   │
│   │   ├── screenshots/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── run.py
│   │   └── tp.py
│   │
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── node_modules/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── pages/
│   │   │   └── ui/
│   │   │       ├── AnimatedCounter.tsx
│   │   │       ├── CursorReticle.tsx
│   │   │       ├── ErrorOverlay.tsx
│   │   │       ├── HeatMap.tsx
│   │   │       ├── HUDScaffolding.tsx
│   │   │       ├── IssueCard.tsx
│   │   │       ├── KineticHeading.tsx
│   │   │       ├── MagneticCursor.tsx
│   │   │       ├── NeuralMesh.tsx
│   │   │       └── ResultsLoader.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useScanner.ts
│   │   │   ├── useScrollReveal.ts
│   │   │   ├── useSmoothScroll.ts
│   │   │   └── useSystemStatus.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── constants.ts
│   │   │   └── reports.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── types.patch.ts
│   │   │
│   │   ├── animations.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   │
│   ├── node_modules/
│   ├── screenshots/
│   ├── .gitignore
│   ├── package-lock.json
│   └── package.json
│
└── README.md (optional root)
````

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

pip install -r requirements.txt
```

---

#  Environment Setup

Create a `.env` file:

```
GROK_API_KEY=your_api_key_here
```

---

#  Run the Project

```bash
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


