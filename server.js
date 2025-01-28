const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data paths
const DATA_DIR = path.join(__dirname, 'data');
const QUESTS_FILE = path.join(DATA_DIR, 'quests.json');
const USER_DATA_FILE = path.join(DATA_DIR, 'user-data.json');

// Ensure data directory and files exist
async function initializeDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Initialize quests.json if it doesn't exist
        try {
            await fs.access(QUESTS_FILE);
        } catch {
            await fs.writeFile(QUESTS_FILE, JSON.stringify([]));
        }

        // Initialize user-data.json if it doesn't exist
        try {
            await fs.access(USER_DATA_FILE);
        } catch {
            const initialUserData = {
                coins: 0,
                currentStreak: 0,
                longestStreak: 0,
                achievements: [],
                lastActive: null,
                items: []
            };
            await fs.writeFile(USER_DATA_FILE, JSON.stringify(initialUserData));
        }
    } catch (error) {
        console.error('Failed to initialize data files:', error);
        throw error;
    }
}

// API Routes

// Get all quests
app.get('/api/quests', async (req, res) => {
    try {
        const data = await fs.readFile(QUESTS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading quests:', error);
        res.status(500).json({ error: 'Failed to read quests' });
    }
});

// Create a new quest
app.post('/api/quests', async (req, res) => {
    try {
        const quests = JSON.parse(await fs.readFile(QUESTS_FILE, 'utf8'));
        const newQuest = {
            id: Date.now(),
            ...req.body,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        quests.push(newQuest);
        await fs.writeFile(QUESTS_FILE, JSON.stringify(quests, null, 2));
        
        res.status(201).json(newQuest);
    } catch (error) {
        console.error('Error creating quest:', error);
        res.status(500).json({ error: 'Failed to create quest' });
    }
});

// Update a quest
app.patch('/api/quests/:id', async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        const quests = JSON.parse(await fs.readFile(QUESTS_FILE, 'utf8'));
        
        const questIndex = quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        
        const updatedQuest = {
            ...quests[questIndex],
            ...req.body,
            id: questId // Ensure ID doesn't change
        };
        
        quests[questIndex] = updatedQuest;
        await fs.writeFile(QUESTS_FILE, JSON.stringify(quests, null, 2));
        
        res.json(updatedQuest);
    } catch (error) {
        console.error('Error updating quest:', error);
        res.status(500).json({ error: 'Failed to update quest' });
    }
});

// Complete a quest
app.post('/api/quests/:id/complete', async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        const quests = JSON.parse(await fs.readFile(QUESTS_FILE, 'utf8'));
        const userData = JSON.parse(await fs.readFile(USER_DATA_FILE, 'utf8'));
        
        const questIndex = quests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        
        // Calculate coins earned based on difficulty
        const coinsEarned = {
            easy: 10,
            medium: 20,
            hard: 30
        }[quests[questIndex].difficulty] || 10;
        
        // Update quest
        quests[questIndex].completed = true;
        quests[questIndex].completedAt = new Date().toISOString();
        
        // Update user data
        userData.coins += coinsEarned;
        
        // Update streak
        const today = new Date().toDateString();
        if (userData.lastActive !== today) {
            userData.currentStreak++;
            userData.longestStreak = Math.max(userData.longestStreak, userData.currentStreak);
            userData.lastActive = today;
        }
        
        // Save changes
        await Promise.all([
            fs.writeFile(QUESTS_FILE, JSON.stringify(quests, null, 2)),
            fs.writeFile(USER_DATA_FILE, JSON.stringify(userData, null, 2))
        ]);
        
        res.json({
            quest: quests[questIndex],
            coinsEarned,
            newTotal: userData.coins
        });
    } catch (error) {
        console.error('Error completing quest:', error);
        res.status(500).json({ error: 'Failed to complete quest' });
    }
});

// Delete a quest
app.delete('/api/quests/:id', async (req, res) => {
    try {
        const questId = parseInt(req.params.id);
        const quests = JSON.parse(await fs.readFile(QUESTS_FILE, 'utf8'));
        
        const newQuests = quests.filter(q => q.id !== questId);
        if (newQuests.length === quests.length) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        
        await fs.writeFile(QUESTS_FILE, JSON.stringify(newQuests, null, 2));
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting quest:', error);
        res.status(500).json({ error: 'Failed to delete quest' });
    }
});

// Get user data
app.get('/api/user-data', async (req, res) => {
    try {
        const data = await fs.readFile(USER_DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading user data:', error);
        res.status(500).json({ error: 'Failed to read user data' });
    }
});

// Update user data
app.post('/api/user-data', async (req, res) => {
    try {
        const currentData = JSON.parse(await fs.readFile(USER_DATA_FILE, 'utf8'));
        const newData = {
            ...currentData,
            ...req.body
        };
        
        await fs.writeFile(USER_DATA_FILE, JSON.stringify(newData, null, 2));
        res.json(newData);
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ error: 'Failed to update user data' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize data files and start server
async function start() {
    try {
        await initializeDataFiles();
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
