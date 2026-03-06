import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { getAllAlerts, addAlert, clearAlerts } from './db.js';
import { getLiveZones } from './zones.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// ─── NASA EONET Natural Events ───────────────────────────────────────────────
async function fetchNasaEvents() {
    try {
        const res = await fetch(
            'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20&categories=wildfires,landslides,severeStorms'
        );
        const data = await res.json();
        return (data.events || []).map(ev => ({
            id: ev.id,
            title: ev.title,
            category: ev.categories?.[0]?.title || 'Unknown',
            date: ev.geometry?.[0]?.date?.split('T')[0] || 'N/A',
            coords: ev.geometry?.[0]?.coordinates || [],
            link: ev.sources?.[0]?.url || ''
        }));
    } catch (e) {
        console.error('[NASA EONET] Error:', e.message);
        return [];
    }
}

// ─── NASA POWER Climate Data ─────────────────────────────────────────────────
async function fetchNasaClimate(lat, lon) {
    try {
        const today = new Date();
        const end = today.toISOString().slice(0, 10).replace(/-/g, '');
        const startD = new Date(today);
        startD.setDate(today.getDate() - 7);
        const start = startD.toISOString().slice(0, 10).replace(/-/g, '');

        const params = 'T2M,PRECTOTCORR,RH2M,GWETROOT';
        const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;

        const res = await fetch(url);
        const json = await res.json();
        const props = json?.properties?.parameter;

        if (!props) return null;

        const dates = Object.keys(props.T2M).slice(-7);
        return {
            temperature: dates.map(d => parseFloat(props.T2M[d].toFixed(1))),
            precipitation: dates.map(d => parseFloat(props.PRECTOTCORR[d].toFixed(2))),
            humidity: dates.map(d => parseFloat(props.RH2M[d].toFixed(1))),
            soilMoisture: dates.map(d => parseFloat((props.GWETROOT[d] * 100).toFixed(1))),
            dates,
            latest: {
                temperature: parseFloat(props.T2M[dates.at(-1)].toFixed(1)),
                precipitation: parseFloat(props.PRECTOTCORR[dates.at(-1)].toFixed(2)),
                humidity: parseFloat(props.RH2M[dates.at(-1)].toFixed(1)),
                soilMoisture: parseFloat((props.GWETROOT[dates.at(-1)] * 100).toFixed(1)),
            }
        };
    } catch (e) {
        console.error('[NASA POWER] Error:', e.message);
        return null;
    }
}

const ZONE_COORDS = {
    jharkhand: { lat: 23.8, lon: 86.4 },
    odisha: { lat: 21.9, lon: 85.6 },
    chhattisgarh: { lat: 19.1, lon: 81.7 }
};

// ─── REST ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), gemini: !!GEMINI_KEY });
});

app.get('/api/zones', (req, res) => {
    res.json(getLiveZones());
});

app.get('/api/zones/:id/climate', async (req, res) => {
    const coords = ZONE_COORDS[req.params.id];
    if (!coords) return res.status(404).json({ error: 'Zone not found' });
    const climate = await fetchNasaClimate(coords.lat, coords.lon);
    if (!climate) return res.status(503).json({ error: 'NASA POWER unavailable' });
    res.json(climate);
});

app.get('/api/nasa/events', async (req, res) => {
    const events = await fetchNasaEvents();
    res.json(events);
});

app.get('/api/alerts', (req, res) => {
    res.json(getAllAlerts());
});

app.post('/api/alerts', (req, res) => {
    const { zone, level, msg } = req.body;
    if (!zone || !level || !msg) return res.status(400).json({ error: 'zone, level, msg required' });
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const result = addAlert(time, zone, level, msg);
    const newAlert = { id: result.lastInsertRowid, time, zone, level, msg };
    broadcastToAll({ type: 'NEW_ALERT', alert: newAlert });
    res.status(201).json(newAlert);
});

app.delete('/api/alerts', (req, res) => {
    clearAlerts();
    res.json({ success: true });
});

// ─── Gemini AI Chatbot ────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
    const { message, zoneContext } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    if (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here') {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `You are EcoTwin AI, an environmental intelligence assistant for TERRAWATCH — a platform monitoring carbon absorption rates (CAR), NDVI, terrain stability, and seismic activity in Indian mining regions.

Current zone context: ${JSON.stringify(zoneContext || {})}

Answer in 2-4 sentences. Be specific and use numbers from the context where relevant. Focus on environmental risk, carbon credits, and mitigation strategies.

User: ${message}`;
            const result = await model.generateContent(prompt);
            return res.json({ reply: result.response.text(), source: 'gemini' });
        } catch (e) {
            console.error('[Gemini] Error:', e.message);
        }
    }

    // Fallback scripted responses
    res.json({ reply: getSmartReply(message, zoneContext), source: 'fallback' });
});

function getSmartReply(msg, ctx) {
    const m = msg.toLowerCase();
    const zone = ctx?.name || 'this zone';
    const car = ctx?.car || 'N/A';
    const risk = ctx?.riskLevel || 'UNKNOWN';

    if (m.includes('car') || m.includes('carbon absorption'))
        return `The Carbon Absorption Rate (CAR) for ${zone} is currently ${car}. Values below 0.4 indicate critical deforestation. Immediate reforestation using native species is recommended.`;
    if (m.includes('ndvi') || m.includes('vegetation'))
        return `NDVI for ${zone} is ${ctx?.ndvi || 'N/A'}, indicating ${parseFloat(ctx?.ndvi) < 0.4 ? 'significant vegetation loss' : 'moderate green cover'}. I recommend cross-referencing with Sentinel-2 imagery for accurate assessment.`;
    if (m.includes('seismic') || m.includes('earthquake'))
        return `Seismic activity at ${zone} is ${ctx?.seismic || 'N/A'}R. Mining-induced seismicity above 2.0R requires mandatory suspension of blasting operations and structural integrity assessment.`;
    if (m.includes('risk'))
        return `${zone} is classified as ${risk} risk. ${risk === 'HIGH' ? 'Immediate ground team deployment and mining restrictions needed.' : risk === 'MEDIUM' ? 'Enhanced monitoring and preventive measures recommended.' : 'All metrics within safe parameters.'}`;
    if (m.includes('carbon credit') || m.includes('credit'))
        return `Carbon credit deficit for ${zone} is estimated at ₹${Math.round((0.85 - parseFloat(car || 0.5)) * 500 * 850).toLocaleString()} annually based on the current CAR of ${car} vs baseline 0.85.`;
    if (m.includes('mitigation') || m.includes('solution'))
        return `For ${zone}: (1) Native afforestation to restore CAR, (2) Controlled mining schedules to reduce seismic impact, (3) Soil bioengineering for slope stabilisation, (4) Real-time sensor grid expansion for early warning coverage.`;
    if (m.includes('nasa') || m.includes('satellite'))
        return `I am integrated with NASA POWER for real-time climate data and NASA EONET for natural event monitoring at ${zone}. Temperature, precipitation, and soil moisture data are updated daily from satellite observations.`;
    return `I'm monitoring ${zone} with ${risk} risk status — CAR: ${car}, NDVI: ${ctx?.ndvi || 'N/A'}, Seismic: ${ctx?.seismic || 'N/A'}R. Ask me about carbon absorption, vegetation trends, seismic activity, or mitigation strategies.`;
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
const connectedClients = new Set();

wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log(`[WS] Client connected. Total: ${connectedClients.size}`);
    ws.send(JSON.stringify({ type: 'ZONES_UPDATE', zones: getLiveZones() }));
    ws.on('close', () => {
        connectedClients.delete(ws);
        console.log(`[WS] Client disconnected. Total: ${connectedClients.size}`);
    });
});

function broadcastToAll(data) {
    const msg = JSON.stringify(data);
    connectedClients.forEach(c => c.readyState === 1 && c.send(msg));
}

// Push live zone updates every 30s
setInterval(() => {
    broadcastToAll({ type: 'ZONES_UPDATE', zones: getLiveZones() });
    // Occasional auto-alert (~10% chance every 30s)
    if (Math.random() < 0.10) {
        const pool = [
            { zone: 'Jharkhand', level: 'high', msg: 'Seismic activity spike detected — Zone 7A' },
            { zone: 'Jharkhand', level: 'med', msg: 'CAR Index dropped below threshold' },
            { zone: 'Odisha', level: 'med', msg: 'Vegetation loss in grid sector B4' },
            { zone: 'Odisha', level: 'low', msg: 'Soil moisture reading anomaly detected' },
            { zone: 'Chhattisgarh', level: 'low', msg: 'Mining vibration within safe limits' },
        ];
        const al = pool[Math.floor(Math.random() * pool.length)];
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        addAlert(time, al.zone, al.level, al.msg);
        broadcastToAll({ type: 'NEW_ALERT', alert: { ...al, time } });
    }
}, 30000);

// ─── START ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`\n🌍 TERRAWATCH Backend running on port ${PORT}`);
    console.log(`   REST API : http://localhost:${PORT}/api`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
    console.log(`   Gemini AI: ${GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here' ? '✅ Enabled' : '⚠️  Add API key to server/.env'}`);
    console.log(`   NASA POWER + EONET: ✅ Integrated (no key needed)\n`);
});
