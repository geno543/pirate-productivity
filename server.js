const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3000;

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
const staticOptions = {
    setHeaders: (res, path) => {
        // Set proper MIME types for different file types
        if (path.endsWith('.mp3')) {
            res.set({
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=31536000'
            });
        } else if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        } else if (path.endsWith('.html')) {
            res.set('Content-Type', 'text/html');
        }
    },
    maxAge: '1y',
    etag: true,
    lastModified: true
};

// Serve static files
app.use(express.static('public', staticOptions));

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

// Data storage paths
const QUESTS_FILE = path.join(__dirname, 'data', 'quests.json');
const USER_FILE = path.join(__dirname, 'data', 'user.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
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

// Quest Routes
app.get('/api/quests', async (req, res) => {
    try {
        const data = await fs.readFile(QUESTS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quests' });
    }
});

app.post('/api/quests', async (req, res) => {
    try {
        const { title, difficulty, deadline } = req.body;
        if (!title || !difficulty) {
            return res.status(400).json({ error: 'Title and difficulty are required' });
        }

        const data = await fs.readFile(QUESTS_FILE, 'utf8');
        const quests = JSON.parse(data);
        
        const newQuest = {
            id: Date.now(),
            title,
            difficulty,
            deadline: deadline || null,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        quests.push(newQuest);
        await fs.writeFile(QUESTS_FILE, JSON.stringify(quests, null, 2));
        
        res.status(201).json(newQuest);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create quest' });
    }
});

app.put('/api/quests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const data = await fs.readFile(QUESTS_FILE, 'utf8');
        const quests = JSON.parse(data);
        
        const questIndex = quests.findIndex(q => q.id === parseInt(id));
        if (questIndex === -1) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        
        quests[questIndex] = { ...quests[questIndex], ...updates };
        await fs.writeFile(QUESTS_FILE, JSON.stringify(quests, null, 2));
        
        res.json(quests[questIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update quest' });
    }
});

app.delete('/api/quests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const data = await fs.readFile(QUESTS_FILE, 'utf8');
        const quests = JSON.parse(data);
        
        const questIndex = quests.findIndex(q => q.id === parseInt(id));
        if (questIndex === -1) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        
        quests.splice(questIndex, 1);
        await fs.writeFile(QUESTS_FILE, JSON.stringify(quests, null, 2));
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete quest' });
    }
});

// User Routes
app.get('/api/user', async (req, res) => {
    try {
        const data = await fs.readFile(USER_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.put('/api/user', async (req, res) => {
    try {
        const updates = req.body;
        const data = await fs.readFile(USER_FILE, 'utf8');
        const user = JSON.parse(data);
        
        const updatedUser = { ...user, ...updates };
        await fs.writeFile(USER_FILE, JSON.stringify(updatedUser, null, 2));
        
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user data' });
    }
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
        res.status(500).json({ error: 'Failed to update streak' });
    }
});

// Initialize data and start server
initializeDataFiles().then(() => {
    app.listen(port, () => {
        console.log(`Pirate app server running at http://localhost:${port}`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});
