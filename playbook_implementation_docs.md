# Playbook Live - Platform Implementation Documentation

This document outlines the step-by-step implementation steps followed to enhance the Football Tactical AI Platform, including backend restrictions, UI/UX upgrades, manual plan creation, MP4 recording, database migrations, and repository splits.

---

## 1. Backend Route & Dataset Restriction

### Objective
Restrict squad and match loading strictly to local offline preseeded data to ensure complete lineups (exactly 11 starters and 7 subs) and eliminate unreliable AI scraper proxies.

### Implementation Details
- **File Updated**: [football.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/server/routes/football.js)
- **Modifications**:
  - Restructured the `/squad` and `/matches` GET routes to query the offline static dataset ([preseededSquads.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/server/db/preseededSquads.js)) using a normalized team name key.
  - Removed all dependencies on Gemini AI proxies, DuckDuckScrape web scrapers, and TheSportsDB APIs.
  - Imposed a strict `404 Not Found` response with `{"error":"Team not found in preseeded dataset"}` for any non-preseeded queries.

---

## 2. Roster Bench & Pitch Canvas Upgrades

### Objective
Ensure that substitutes load properly on the panel and that only the starting XI are rendered on the pitch.

### Implementation Details
- **Files Updated**: 
  - [OurSquadPanel.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/client/src/components/PreMatch/OurSquadPanel.jsx)
  - [OpponentPanel.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/client/src/components/PreMatch/OpponentPanel.jsx)
  - [PitchCanvas.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/client/src/components/PreMatch/PitchCanvas.jsx)
- **Modifications**:
  - Re-mapped the database loader logic from the obsolete snake_case format (`is_sub`, `pos_x`, `pos_y`) to standard camelCase properties (`isSub`, `x`, `y`).
  - Added filter logic to the Konva render layer to ensure opponent bench players are kept off the field canvas.
  - Added HTML5 drag-and-drop mechanics to the side rosters to allow users to hover bench cards over starting slots, rendering scale animations and green dashed highlights before swapping coordinates.

---

## 3. Manual Game Plan Creator

### Objective
Provide a manual tactical creator allowing coaches to input custom plans, defensive schemes, set pieces, and starting XI directives without AI generation dependencies.

### Implementation Details
- **Files Created**: 
  - [CustomPlanForm.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/client/src/components/GamePlans/CustomPlanForm.jsx)
- **Files Updated**:
  - [GamePlanModal.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/client/src/components/GamePlans/GamePlanModal.jsx)
- **Modifications**:
  - Created a form component with fields for Title, Opponent, Date, Venue, Competition, Style, Strategy summaries, Checklist areas (Key Instructions and Press Triggers), and comma-separated Tags.
  - Populated starting XI names dynamically with inputs next to each to assign individual directives.
  - Added the **Create Plan** (`✏️`) tab to the Tactical Modal and connected submits to the database collection API (`gamePlansApi.save`).

---

## 4. MP4 Tactical Replays

### Objective
Export recorded tactical sessions as universally compatible MP4 video files.

### Implementation Details
- **File Updated**: [CanvasRecorder.jsx](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/client/src/components/PreMatch/CanvasRecorder.jsx)
- **Modifications**:
  - Reconfigured the encoder selection to attempt native `video/mp4` MIME type encoding first.
  - Added fallback formats for browser-supported media containers (`video/webm`) and changed the download filename output to use the `.mp4` extension.

---

## 5. MongoDB Atlas Connection

### Objective
Migrate data storage from localhost environments to your MongoDB Atlas cloud cluster.

### Implementation Details
- **Files Updated**: 
  - [.env](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/.env)
  - [mongo.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/server/db/mongo.js)
  - [index.js](file:///c:/Users/Admin/.gemini/antigravity/scratch/playbook_live_app/server/index.js)
- **Modifications**:
  - Configured `MONGODB_URI` environment variable to connect to the Atlas cluster:
    `mongodb+srv://niteeshsk08_db_user:akpe2304@cluster0.qysgcdd.mongodb.net/playbook_live?appName=Cluster0`
  - Refactored `dotenv` path resolution scripts in backend entries to dynamically load environment files from both local and parent directories, ensuring standalone stability.

---

## 6. Monorepo Repository Separation

### Objective
Isolate the client and server codebases into separate repositories for modular deployment.

### Implementation Details
- **Frontend Git**:
  - Initialized a standalone repository in `/client`.
  - Configured `.gitignore` to skip `node_modules` and client build folders.
  - Pushed to: [frontend-playbook](https://github.com/skagilansk/frontend-playbook.git).
- **Backend Git**:
  - Initialized a standalone repository in `/server`.
  - Configured `.gitignore` to skip `node_modules` and credentials.
  - Pushed to: [backend-playbook](https://github.com/skagilansk/backend-playbook.git).
