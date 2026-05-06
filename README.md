# 🍃 On Track - Gamified Notion Widgets

A high-performance, standalone frontend widget designed to be embedded directly into a Notion workspace. It provides visual analytics (Activity Heatmaps and RPG-style Radar Charts) that Notion cannot natively render.

![On Track Widget](banner.png)

## Features
- **1-Year Activity Heatmap:** A GitHub-style 364-day commit graph tracking your daily habits and consistency.
- **Player Stats Radar Chart:** A spider-web chart visualizing your progress across 5 Life Areas (Health, Career, Finances, Learning, Mindset).
- **Notion API Ready:** Built with a Vercel Serverless Function architecture to securely pull live data from your private Notion databases without exposing your API keys.
- **Zero Dependencies (Frontend):** Pure HTML, CSS, and Vanilla JS for maximum performance. Uses Chart.js via CDN for the radar rendering.

## 🚀 Deployment & Setup Guide

This project requires a backend to securely talk to Notion. The easiest way to host this is using **Vercel** (it's free).

### Step 1: Prepare Notion
1. Go to [Notion Integrations](https://www.notion.so/my-integrations) and create a new integration.
2. Copy the **Internal Integration Secret** (`secret_xxxx...`).
3. In your Notion workspace, go to the databases holding your Habits and Stats. Click `...` > `Connections` > Add your new integration to grant it access.
4. Copy the Database IDs from the URL (the 32-character string before the `?v=`).

### Step 2: Deploy to Vercel
1. Fork or push this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com) and click "Add New Project", select your GitHub repository.
3. Before hitting Deploy, go to **Environment Variables** and add the following:
   - `NOTION_API_KEY` (Your secret token)
   - `NOTION_HABITS_DB_ID` (Your habits DB ID)
   - `NOTION_STATS_DB_ID` (Your stats DB ID)
4. Click Deploy.

### Step 3: Embed in Notion
1. Once Vercel finishes deploying, copy your live URL (e.g., `https://on-track.vercel.app`).
2. Go to your Notion page, type `/embed`, and paste your Vercel URL.
3. The dashboard will now securely render live data directly inside Notion.

## 💻 Development
To run this locally without the Notion API (using mock data):
1. Open `index.html` in your browser.
2. In `app.js`, `CONFIG.use_local_storage_fallback` is set to `true` by default for local prototyping.

To modify the Notion data parsing:
- Edit `/api/notion.js`. This is where the serverless function translates Notion's complex property JSON into the simple state used by the frontend widgets.

---
*Created by an AI-assisted developer for the community. Use it, fork it, and build better systems.*
