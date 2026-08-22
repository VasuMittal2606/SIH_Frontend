# ResidueLink — Frontend

**Smart Stubble-to-Biomass Matching Marketplace**
Team ResidueLink | Smart India Hackathon (SIH) 2026

## Overview

ResidueLink is a bilingual (Hindi/Punjabi), mobile-friendly web platform that connects farmers with biomass buyers and collection machinery. It automates the crop-stubble trade lifecycle using predictive harvest modeling and distance-optimized marketplace matching, helping prevent field-burning in Punjab and Haryana.

The frontend is the responsive web application that farmers, biomass buyers, and government/CHC officials use to interact with the platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React.js (responsive web app) |
| Core web technologies | HTML5, CSS3, JavaScript |
| UI / Design tools | Canva, Figma |
| Language support | Bilingual UI — Hindi / Punjabi |

The frontend communicates with a Python (Flask/FastAPI) backend, which in turn integrates with external APIs (Open-Meteo/OpenWeatherMap for weather data, Distance Matrix API for geolocation) and an ML layer (Scikit-learn/Pandas/NumPy) for harvest-date prediction.

## Frontend Dashboards & Features

### 1. Farmer Dashboard
- **Farm Profile & Crop Input** — form to enter farm size, crop type/variety, sowing date, and farm location.
- **ML-Predicted Harvest Date** — displays the auto-calculated harvest maturity date from crop parameters and live weather data.
- **Automated 10-Day Pre-Harvest Listing** — system-generated listing view that activates 10 days before the predicted harvest date to alert nearby buyers.
- **Manual Date Override & Instant Sell Request** — UI controls to manually set/adjust the harvest date or post an immediate sell listing with available tonnage.
- **Baler Availability Status** — real-time display of collection baler availability at local Custom Hiring Centres (CHCs).
- **Incoming Offers & Buyer Matches** — list of interested buyers, ranked by shortest geographical distance.
- **Farmer Profitability Calculator** — interactive tool computing net earnings per acre/ton from the buyer's offer rate, baler rental, machine operator charges, and diesel cost.
- **Direct Negotiation & Communication Panel** — click-to-call / chat UI to negotiate and finalize pricing with matched buyers.

### 2. Biomass Buyer Dashboard
- **Tonnage Requirement Posting** — form to create "Buy Requests" specifying required stubble volume (tons) and proposed starting price per ton.
- **Proximity-Based Farm Alerts** — push-notification UI for new stubble listings within the buyer's procurement radius, sorted by distance.
- **Distance & Logistics Tracker** — map/view of farm locations with freight-distance calculation for routing.
- **Offer & Deal Negotiation Management** — interface to review incoming listings, submit counter-offers, and view farmer contact details post-acceptance.
- **Buyer Profitability & Landed Cost Calculator** — computes total procurement cost per ton (price + transport/diesel + handling charges).
- **Procurement & Delivery Tracker** — dashboard view for confirmed pickups, active supply contracts, and completed deliveries.

### 3. Government / CHC Official Dashboard (Prototype)
- **Baler Machinery Status Manager** — interface for CHCs to update operational status/availability of baling machines.
- **Regional Stubble Supply & Demand Heatmap** — spatial visualization of active sell requests and buyer demand clusters by district.
- **Machinery Allocation Overview** — high-level inventory view of where CRM-subsidized balers are stationed/assigned.
- **Environmental Impact Analytics** — aggregated dashboard metrics (tons of stubble diverted, estimated crop fires prevented).

## Core UX Flows Powering the Frontend

- **Predictive & Manual Harvest Scheduling** — the primary flow combining ML prediction with manual override, driving the Farmer Dashboard's main call-to-action.
- **Proximity-First Marketplace** — matching and notification UI prioritized by shortest travel distance.
- **Negotiation & Pricing** — buy-request posting, matching, and direct in-app negotiation.
- **Mutual Profitability Framework** — shared calculator pattern used on both Farmer and Buyer dashboards to ensure transparent, fair-trade pricing.

## Notes for Implementation

- Build as a responsive React.js SPA; ensure mobile-first layouts given the target users (farmers, field-based buyers).
- UI copy and labels should support Hindi and Punjabi in addition to English.
- Dashboards are role-based (Farmer / Buyer / Government-CHC) — plan routing/auth around three distinct views.
- Design assets/mockups are being produced in Canva/Figma; align component styling to these design files.
- Deployment target: Render / Vercel, with Git/GitHub for version control and Docker for containerization.

---
*Source: ResidueLink Project Summary (SIH 2026)*
