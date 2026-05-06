const { Client } = require('@notionhq/client');

// Initialize Notion client securely with an environment variable
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Get configuration from env variables
const HABITS_DB_ID = process.env.NOTION_HABITS_DB_ID;
const STATS_DB_ID = process.env.NOTION_STATS_DB_ID;

module.exports = async (req, res) => {
  // CORS configuration for the widget
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or lock to a specific domain
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if env vars are configured
  if (!process.env.NOTION_API_KEY) {
    return res.status(500).json({ error: 'Missing NOTION_API_KEY environment variable. Please configure this in Vercel.' });
  }

  try {
    const payload = {
      areas: { Health: 0, Career: 0, Finances: 0, Learning: 0, Mindset: 0 },
      habits: [],
      history: []
    };

    // ── 1. Fetch Radar Stats ──
    if (STATS_DB_ID) {
      const statsRes = await notion.databases.query({ database_id: STATS_DB_ID });
      // Map your Notion properties here. Example logic:
      statsRes.results.forEach(page => {
        const titleProp = Object.values(page.properties).find(p => p.type === 'title');
        const numProp = Object.values(page.properties).find(p => p.type === 'number');
        if (titleProp && numProp && titleProp.title[0]) {
          const areaName = titleProp.title[0].plain_text;
          payload.areas[areaName] = numProp.number || 0;
        }
      });
    }

    // ── 2. Fetch Habits & Heatmap Data ──
    if (HABITS_DB_ID) {
      // Logic to fetch the last 364 days of habit logs goes here
      // For a robust implementation, you might need to handle pagination
      // Example: const habitRes = await notion.databases.query({ database_id: HABITS_DB_ID, page_size: 100 });
      // ... process habitRes ...
      
      // Sending a message indicating it's ready for custom property mapping
      payload.message = "Successfully connected to Notion APIs. You will need to map your specific Notion properties (Checkboxes, Formula outputs) in this API route.";
    }

    return res.status(200).json(payload);

  } catch (error) {
    console.error("Notion API Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
