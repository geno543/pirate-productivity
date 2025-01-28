const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    next();
});

// Middleware
app.use(express.json());

// Configure static file serving
app.use(express.static('public'));

// Data storage paths - use /tmp for Vercel
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const QUESTS_FILE = path.join(DATA_DIR, 'quests.json');
const USER_FILE = path.join(DATA_DIR, 'user.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Initialize data files if they don't exist
async function initializeDataFiles() {
    await ensureDataDir();
    
    try {
        await fs.access(QUESTS_FILE);
    } catch {
        await fs.writeFile(QUESTS_FILE, JSON.stringify([]));
    }

    try {
        await fs.access(USER_FILE);
    } catch {
        const defaultUser = {
            coins: 0,
            streak: 0,
            lastLogin: null,
            achievements: [],
            inventory: []
        };
        await fs.writeFile(USER_FILE, JSON.stringify(defaultUser));
    }
}

// Initialize data files on startup
initializeDataFiles().catch(console.error);

// Quest Routes
app.get('/api/quests', async (req, res) => {
    try {
        await ensureDataDir();
        let data;
        try {
            data = await fs.readFile(QUESTS_FILE, 'utf8');
        } catch {
            data = '[]';
            await fs.writeFile(QUESTS_FILE, data);
        }
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ error: 'Failed to fetch quests' });
    }
});

app.post('/api/quests', async (req, res) => {
    try {
        await ensureDataDir();
        const quest = req.body;
        let quests;
        try {
            const data = await fs.readFile(QUESTS_FILE, 'utf8');
            quests = JSON.parse(data);
        } catch {
            quests = [];
        }
        quests.push(quest);
        await fs.writeFile(QUESTS_FILE, JSON.stringify(quests));
        res.json(quest);
    } catch (error) {
        console.error('Error creating quest:', error);
        res.status(500).json({ error: 'Failed to create quest' });
    }
});

// User Routes
app.get('/api/user-data', async (req, res) => {
    try {
        await ensureDataDir();
        let data;
        try {
            data = await fs.readFile(USER_FILE, 'utf8');
        } catch {
            const defaultUser = {
                coins: 0,
                streak: 0,
                lastLogin: null,
                achievements: [],
                inventory: []
            };
            data = JSON.stringify(defaultUser);
            await fs.writeFile(USER_FILE, data);
        }
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.put('/api/user-data', async (req, res) => {
    try {
        await ensureDataDir();
        const userData = req.body;
        await fs.writeFile(USER_FILE, JSON.stringify(userData));
        res.json(userData);
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ error: 'Failed to update user data' });
    }
});

// Special route for sound files to ensure proper handling
app.get('/sounds/:filename', (req, res) => {
    const soundPath = path.join(__dirname, 'public', 'sounds', req.params.filename);
    res.sendFile(soundPath, {
        headers: {
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes'
        }
    });
});

// Achievement Routes
app.post('/api/achievements', async (req, res) => {
    try {
        const { achievement } = req.body;
        if (!achievement) {
            return res.status(400).json({ error: 'Achievement data is required' });
        }

        const data = await fs.readFile(USER_FILE, 'utf8');
        const user = JSON.parse(data);
        
        if (!user.achievements.some(a => a.id === achievement.id)) {
            user.achievements.push({
                ...achievement,
                unlockedAt: new Date().toISOString()
            });
            
            await fs.writeFile(USER_FILE, JSON.stringify(user, null, 2));
        }
        
        res.status(201).json(user.achievements);
    } catch (error) {
        console.error('Error adding achievement:', error);
        res.status(500).json({ error: 'Failed to add achievement' });
    }
});

// Streak Routes
app.post('/api/streak/check', async (req, res) => {
    try {
        const data = await fs.readFile(USER_FILE, 'utf8');
        const user = JSON.parse(data);
        
        const now = new Date();
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
        
        if (!lastLogin) {
            user.streak = 1;
        } else {
            const daysSinceLastLogin = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
            
            if (daysSinceLastLogin === 1) {
                user.streak += 1;
            } else if (daysSinceLastLogin > 1) {
                user.streak = 1;
            }
        }
        
        user.lastLogin = now.toISOString();
        await fs.writeFile(USER_FILE, JSON.stringify(user, null, 2));
        
        res.json({ streak: user.streak });
    } catch (error) {
        console.error('Error updating streak:', error);
        res.status(500).json({ error: 'Failed to update streak' });
    }
});

// Start server if not in Vercel
if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

// Export for Vercel
module.exports = app;
