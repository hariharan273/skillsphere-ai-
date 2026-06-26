# SkillSphere AI — System Architecture

## Full Project Workflow

```mermaid
flowchart TD
    subgraph USER["👤 User Layer"]
        A["Student / User\n(Browser)"]
    end

    subgraph FRONTEND["🖥️ Frontend — Vercel"]
        B["React + Vite App\nskillsphere-ai-khaki.vercel.app"]
        B1["Login / Register Page"]
        B2["Resume Upload Page"]
        B3["Dashboard & Analytics"]
        B4["Readiness Report"]
        B5["Learning Roadmap"]
        B --> B1
        B --> B2
        B --> B3
        B --> B4
        B --> B5
    end

    subgraph BACKEND["⚙️ Backend — Render (Docker)"]
        C["Spring Boot REST API\nskillsphere-ai.onrender.com"]
        C1["Auth Controller\n/api/auth"]
        C2["Resume Controller\n/api/resume"]
        C3["Intelligence Controller\n/api/intelligence"]
        C --> C1
        C --> C2
        C --> C3
    end

    subgraph DB["🗄️ Database Layer"]
        D1["H2 In-Memory DB\n(Local Dev)"]
        D2["MySQL on Aiven\n(Cloud Production)"]
    end

    subgraph CICD["🔁 CI/CD Pipeline — GitHub Actions"]
        E1["Code Push to GitHub"]
        E2["Build & Test Backend\nMaven + JDK 17"]
        E3["Build & Test Frontend\nnpm + Node 18"]
        E4["Docker Build & Push\nto Docker Hub"]
        E1 --> E2
        E1 --> E3
        E2 --> E4
        E3 --> E4
    end

    subgraph AI["🤖 AI Intelligence Layer"]
        F1["Resume Text Parser"]
        F2["Skill Extractor"]
        F3["Gap Analyzer"]
        F4["Roadmap Generator"]
        F1 --> F2 --> F3 --> F4
    end

    A -->|"HTTPS Request"| B
    B -->|"REST API Call\naxios"| C
    C1 -->|"JWT Token"| B
    C2 --> F1
    F4 -->|"JSON Response"| C3
    C3 -->|"Insights Data"| B3
    C -->|"Read / Write"| D1
    C -->|"Read / Write"| D2
    E4 -->|"Deploy Image"| C
    B2 -->|"Upload Resume Text"| C2
```

---

## Layer-by-Layer Breakdown

| Layer | Technology | Responsibility |
|---|---|---|
| **User** | Browser (Any device) | Interacts with the web app |
| **Frontend** | React + Vite → Vercel | UI, routing, API calls |
| **Backend** | Spring Boot → Render | REST APIs, business logic, auth |
| **AI Layer** | Java (Custom NLP) | Parses resume, extracts skills, generates roadmap |
| **Database** | H2 (local) / MySQL Aiven (cloud) | Stores users, resumes, sessions |
| **CI/CD** | GitHub Actions | Auto build, test, and push Docker image on every commit |
| **Containers** | Docker + Docker Hub | Packages the backend into a portable image |
