# EPLQ: Efficient Privacy-Preserving Location-Based Query Over Encrypted Data

## Overview

EPLQ enables privacy-preserving spatial range queries over encrypted Points of Interest (POIs). Admins upload POIs as AES-encrypted payloads to Firestore. Users query by coordinates and radius; decryption and filtering happen on the client to protect user privacy.

## Tech Stack

- HTML, CSS, JavaScript
- Firebase Auth, Firestore, Analytics (v9 compat)
- Crypto-JS (AES)

## System Modules

### Admin

- Register
- Login
- Upload Data (encrypted POIs)

### User

- Register
- Login
- Search Data (client-side decrypt + range filter)

## Features

- AES-256 encryption of POIs (CryptoJS AES)
- Client-side decryption and Euclidean range search
- Role-based navigation and gated UI
- Persistent Firestore logging for all actions
- Forgot Password (email reset)
- Theme toggle with emoji (🌞/🌙), persisted via localStorage
- Responsive, production-style UI

## Setup

1. Clone the repo.
2. Open `index.html` with a local server (e.g., VS Code Live Server).
3. Ensure Firebase project config in `script.js` matches your project.
4. Firebase Console:
   - Enable **Email/Password** in Authentication.
   - Create **Firestore** database.
   - Add your local and deployed domain to Authorized Domains.

## Workflow

1. Register as **admin** (choose Admin in dropdown) and **user**.
2. Login as **admin** → Admin Dashboard → upload POIs (name, x, y).
3. Login as **user** → User Dashboard → search by (x, y, radius).
4. Toggle theme as desired.
5. Use Forgot Password from login if needed.
6. Logs are persisted in Firestore `logs` collection.

## Logging

Each action writes to `logs` with fields:

- `uid`, `email`, `message`, `category`, `meta`, `ts`

## Test Cases

- Register (valid/invalid)
- Login (valid/invalid)
- Forgot Password (email sent)
- Upload POI (admin)
- Search POIs with different radii (user)
- Role enforcement (no admin UI for user)
- Theme persistence across reloads
- Logs written for all actions

## Repo

GitHut Repo: https://github.com/Hari612k/EPLQ.git

## Live Demo

GitHub Pages: https://hari612k.github.io/EPLQ/
