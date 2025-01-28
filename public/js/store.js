// Store for managing application state
const Store = {
    state: {
        quests: [],
        weather: 'clear',
        coins: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
        lastActive: null,
        items: []
    },

    async init() {
        try {
            // Load initial data
            const [userData, quests] = await Promise.all([
                this.fetchUserData(),
                this.fetchQuests()
            ]);

            // Initialize state
            this.state = {
                ...this.state,
                ...userData,
                quests
            };

            // Start weather cycle
            this.startWeatherCycle();

            console.log('Store initialized successfully');
        } catch (error) {
            console.error('Failed to initialize store:', error);
            throw error;
        }
    },

    async fetchUserData() {
        try {
            const response = await fetch('/api/user-data');
            if (!response.ok) throw new Error('Failed to fetch user data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user data:', error);
            return {
                coins: 0,
                currentStreak: 0,
                longestStreak: 0,
                achievements: [],
                lastActive: null,
                items: []
            };
        }
    },

    async fetchQuests() {
        try {
            const response = await fetch('/api/quests');
            if (!response.ok) throw new Error('Failed to fetch quests');
            return await response.json();
        } catch (error) {
            console.error('Error fetching quests:', error);
            return [];
        }
    },

    async saveUserData() {
        try {
            const userData = {
                coins: this.state.coins,
                currentStreak: this.state.currentStreak,
                longestStreak: this.state.longestStreak,
                achievements: this.state.achievements,
                lastActive: this.state.lastActive,
                items: this.state.items
            };

            const response = await fetch('/api/user-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error('Failed to save user data');
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    },

    // Quest Management
    async createQuest(questData) {
        try {
            const response = await fetch('/api/quests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(questData)
            });

            if (!response.ok) throw new Error('Failed to create quest');
            
            const newQuest = await response.json();
            this.state.quests.push(newQuest);
            
            return newQuest;
        } catch (error) {
            console.error('Error creating quest:', error);
            throw error;
        }
    },

    async updateQuest(questId, updates) {
        try {
            const response = await fetch(`/api/quests/${questId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error('Failed to update quest');
            
            const updatedQuest = await response.json();
            const index = this.state.quests.findIndex(q => q.id === questId);
            if (index !== -1) {
                this.state.quests[index] = updatedQuest;
            }
            
            return updatedQuest;
        } catch (error) {
            console.error('Error updating quest:', error);
            throw error;
        }
    },

    async completeQuest(questId) {
        try {
            const response = await fetch(`/api/quests/${questId}/complete`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to complete quest');
            
            const result = await response.json();
            
            // Update local state
            const questIndex = this.state.quests.findIndex(q => q.id === questId);
            if (questIndex !== -1) {
                this.state.quests[questIndex].completed = true;
                this.state.coins += result.coinsEarned;
                
                // Update streak
                const today = new Date().toDateString();
                if (this.state.lastActive !== today) {
                    this.state.currentStreak++;
                    this.state.longestStreak = Math.max(this.state.longestStreak, this.state.currentStreak);
                    this.state.lastActive = today;
                }
                
                await this.saveUserData();
                
                // Check for achievements
                this.checkAchievements();
            }
            
            return result;
        } catch (error) {
            console.error('Error completing quest:', error);
            throw error;
        }
    },

    async deleteQuest(questId) {
        try {
            const response = await fetch(`/api/quests/${questId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete quest');
            
            // Update local state
            this.state.quests = this.state.quests.filter(q => q.id !== questId);
            
            return true;
        } catch (error) {
            console.error('Error deleting quest:', error);
            throw error;
        }
    },

    // Weather System
    startWeatherCycle() {
        setInterval(() => {
            const weathers = ['clear', 'storm', 'fog'];
            const currentIndex = weathers.indexOf(this.state.weather);
            const nextIndex = (currentIndex + 1) % weathers.length;
            this.state.weather = weathers[nextIndex];
            
            // Dispatch weather change event
            window.dispatchEvent(new CustomEvent('weatherChange', {
                detail: { weather: this.state.weather }
            }));
        }, 300000); // Change weather every 5 minutes
    },

    getCurrentWeather() {
        return this.state.weather;
    },

    // Achievement System
    checkAchievements() {
        const completedQuests = this.state.quests.filter(q => q.completed).length;
        const achievements = [];

        // First quest
        if (completedQuests === 1) {
            achievements.push('first_quest');
        }

        // Quest milestones
        if (completedQuests >= 10) {
            achievements.push('ten_quests');
        }
        if (completedQuests >= 50) {
            achievements.push('fifty_quests');
        }

        // Streak achievements
        if (this.state.currentStreak >= 3) {
            achievements.push('three_day_streak');
        }
        if (this.state.currentStreak >= 7) {
            achievements.push('week_streak');
        }

        // Coin achievements
        if (this.state.coins >= 100) {
            achievements.push('coin_collector');
        }
        if (this.state.coins >= 1000) {
            achievements.push('treasure_hunter');
        }

        // Weather achievements
        const weatherQuests = this.state.quests.filter(q => q.completed && q.weather);
        if (weatherQuests.some(q => q.weather === 'storm')) {
            achievements.push('storm_master');
        }
        if (weatherQuests.some(q => q.weather === 'fog')) {
            achievements.push('fog_master');
        }
        if (achievements.includes('storm_master') && achievements.includes('fog_master')) {
            achievements.push('weather_master');
        }

        // Add new achievements and trigger events
        achievements.forEach(achievement => {
            if (!this.state.achievements.includes(achievement)) {
                this.state.achievements.push(achievement);
                window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                    detail: { achievementId: achievement }
                }));
            }
        });
    },

    // Getters
    getAllQuests() {
        return this.state.quests;
    },

    getActiveQuests() {
        return this.state.quests.filter(q => !q.completed);
    },

    getUserData() {
        return {
            coins: this.state.coins,
            currentStreak: this.state.currentStreak,
            longestStreak: this.state.longestStreak,
            achievements: this.state.achievements,
            items: this.state.items
        };
    }
};

// Initialize store when the page loads
document.addEventListener('DOMContentLoaded', () => {
    Store.init().catch(error => {
        console.error('Store initialization failed:', error);
    });
});

// Export globally
window.Store = Store;