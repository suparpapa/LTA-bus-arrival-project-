# Project Prompts & Requirements Log

This document records the user prompts and requirements for the **SG Bus Arrival & Live Tracker** application across each milestone.

---

## Milestone 1: Initial Frontend Application Build

**Prompt:**
> Build a Singapore based bus arrival time application that tracks real time bus locations and provides accurate wait time predictions for all LTA bus stops.
> Build just the front end for now, I will include the backend connection later.

**Delivered Scope:**
- Interactive Singapore transit map powered by Leaflet with CartoDB Voyager tiles.
- Real-time bus arrivals board with predictions for the next 3 buses (Next Bus, 2nd Bus, 3rd Bus).
- Official LTA metrics: Load status (`SEA` Seats Available, `SDA` Standing Available, `LSD` Limited Standing), deck classification (`DD` Double Deck, `SD` Single Deck, `BD` Bendy), and `WAB` (Wheelchair Accessible).
- Live bus vehicles tracking with plates, speeds, headings, and arrival progress.
- 5-digit bus stop search, road name search, bus service search, and GPS "Near Me" locator.
- Route directory with stop progressions, operating hours, and MRT connections.
- Saved commutes organizer (Morning, Evening, General).
- 15-second live countdown timer and 2-minute arrival audio chime alarm.
- Backend configuration modal with high-fidelity simulation engine fallback.

---

## Milestone 2: Git Repository Initialization & Remote Push

**Prompt:**
> `git push https://<GITHUB_PAT>@github.com/suparpapa/LTA-bus-arrival-project-.git`

*(Personal Access Token masked for credential safety)*

**Delivered Scope:**
- Initialized Git repository with `main` default branch.
- Created `.gitignore` rules (including `.aistudio/`, `.env*`, `node_modules/`, `dist/`).
- Committed initial application codebase.
- Added remote origin and pushed to `https://github.com/suparpapa/LTA-bus-arrival-project-.git` with upstream branch tracking.

---

## Milestone 3: Serverless LTA DataMall Endpoints

**Prompt:**
> add a serverless connection that pulls live data from LTA Datamall using the following endpoints:
>
> - store this in /api folder (project root level) not the src folder
> - include /health.ts and /busarrival.ts within that subfolder
> - do not hardcode any key, I will include them later
>
> `GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139`
> `# AccountKey: <LTA_ACCOUNT_KEY>`
> `# accept: application/json`

**Delivered Scope:**
- Created `/api/health.ts` serverless route for service status and environment key detection.
- Created `/api/busarrival.ts` serverless route proxying requests to LTA DataMall v3 BusArrival API:
  - Query parameters: `?BusStopCode=<code-or-83139>&ServiceNo=<service>`
  - Headers forwarded: `AccountKey: <LTA_ACCOUNT_KEY>` and `accept: application/json`
  - Zero hardcoded keys (loads from `process.env.LTA_ACCOUNT_KEY`, `process.env.LTA_DATAMALL_KEY`, or `AccountKey` request headers).
  - CORS support for local and serverless deployments.
- Configured Express server entry point `server.ts` with Vite middlewares.
- Documented `LTA_ACCOUNT_KEY` in `.env.example`.
- Committed and pushed changes to remote GitHub repository.

---

## Milestone 4: Prompt Documentation

**Prompt:**
> collate the prompt thus far into prompt.md
