class Store {
    constructor() {
      this.state = this.loadState();
      this.saveState();
    }
  
    loadState() {
      const defaultState = {
        quests: [],
        coins: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastQuestDate: null,
        totalQuests: 0,
        questDistribution: {
          easy: 0,
          medium: 0,
          hard: 0
        },
        weatherMastery: {
          clear: false,
          storm: false,
          fog: false
        },
        unlockedAchievements: [],
        weather: 'clear',
        weatherMultiplier: 1,
        powerUps: [],
        inventory: []
      };
  
      try {
        const savedState = localStorage.getItem('pirateAppState');
        if (!savedState) return defaultState;
  
        const parsedState = JSON.parse(savedState);
        return { ...defaultState, ...parsedState };
      } catch (error) {
        console.warn('Failed to load state:', error);
        return defaultState;
      }
    }
  
    saveState() {
      try {
        localStorage.setItem('pirateAppState', JSON.stringify(this.state));
        return true;
      } catch (error) {
        console.warn('Failed to save state:', error);
        return false;
      }
    }
  
    // Quest Methods
    getQuests() {
      return this.state.quests || [];
    }
  
    getActiveQuests() {
      return this.getQuests().filter(quest => quest.status === 'active');
    }
  
    getQuest(id) {
      return this.getQuests().find(quest => quest.id === id);
    }
  
    addQuest(quest) {
      if (!quest.title || !quest.difficulty) {
        console.warn('Invalid quest data:', quest);
        return null;
      }
  
      const newQuest = {
        id: Date.now(),
        title: quest.title,
        description: quest.description || '',
        difficulty: quest.difficulty,
        status: 'active',
        createdAt: new Date().toISOString(),
        deadline: quest.deadline || null
      };
  
      this.state.quests = [...this.getQuests(), newQuest];
      this.saveState();
      return newQuest;
    }
  
    completeQuest(questId) {
      const quest = this.getQuest(questId);
      if (!quest || quest.status !== 'active') return false;
  
      quest.status = 'completed';
      quest.completedAt = new Date().toISOString();
  
      // Update stats
      this.state.totalQuests++;
      this.state.questDistribution[quest.difficulty]++;
  
      // Calculate reward
      const rewards = { easy: 10, medium: 20, hard: 30 };
      const baseReward = rewards[quest.difficulty] || 10;
      const finalReward = Math.round(baseReward * this.state.weatherMultiplier);
      this.state.coins += finalReward;
  
      // Update streak
      this.updateStreak();
  
      // Check weather mastery
      if (this.state.weather) {
        this.state.weatherMastery[this.state.weather] = true;
      }
  
      this.saveState();
      this.checkAchievements();
      return true;
    }
  
    deleteQuest(questId) {
      const index = this.state.quests.findIndex(q => q.id === questId);
      if (index === -1) return false;
  
      this.state.quests.splice(index, 1);
      this.saveState();
      return true;
    }
  
    // Weather Methods
    getCurrentWeather() {
      return this.state.weather || 'clear';
    }
  
    toggleWeather() {
      const weathers = ['clear', 'storm', 'fog'];
      const currentIndex = weathers.indexOf(this.state.weather);
      const nextIndex = (currentIndex + 1) % weathers.length;
      this.state.weather = weathers[nextIndex];
      this.saveState();
  
      // Dispatch weather change event
      window.dispatchEvent(
        new CustomEvent('weatherChange', {
          detail: { weather: this.state.weather }
        })
      );
  
      return this.state.weather;
    }
  
    // Stats Methods
    getStats() {
      return {
        coins: this.state.coins,
        currentStreak: this.state.currentStreak,
        longestStreak: this.state.longestStreak,
        totalQuests: this.state.totalQuests,
        questsByDifficulty: this.state.questDistribution
      };
    }
  
    // Achievement Methods
    checkAchievements() {
      const achievements = [
        {
          id: 'first_quest',
          condition: () => this.state.totalQuests >= 1
        },
        {
          id: 'ten_quests',
          condition: () => this.state.totalQuests >= 10
        },
        {
          id: 'weather_master',
          condition: () =>
            Object.values(this.state.weatherMastery).every(v => v)
        }
      ];
  
      achievements.forEach(achievement => {
        if (
          achievement.condition() &&
          !this.state.unlockedAchievements.includes(achievement.id)
        ) {
          this.unlockAchievement(achievement.id);
        }
      });
    }
  
    unlockAchievement(achievementId) {
      if (!this.state.unlockedAchievements.includes(achievementId)) {
        this.state.unlockedAchievements.push(achievementId);
        this.saveState();
  
        window.dispatchEvent(
          new CustomEvent('achievementUnlocked', {
            detail: { achievementId }
          })
        );
      }
    }
  
    getUnlockedAchievements() {
      return this.state.unlockedAchievements;
    }
  
    // Helper Methods
    updateStreak() {
      const today = new Date().toDateString();
      const lastQuestDate = this.state.lastQuestDate
        ? new Date(this.state.lastQuestDate).toDateString()
        : null;
  
      if (lastQuestDate !== today) {
        if (
          lastQuestDate ===
          new Date(Date.now() - 86400000).toDateString()
        ) {
          this.state.currentStreak++;
          this.state.longestStreak = Math.max(
            this.state.currentStreak,
            this.state.longestStreak
          );
        } else {
          this.state.currentStreak = 1;
        }
        this.state.lastQuestDate = new Date().toISOString();
      }
    }
  
    updateQuestPosition(questId, position) {
      const quest = this.getQuest(questId);
      if (quest && position) {
        quest.position = position;
        this.saveState();
      }
    }
  }
  
  // Create and expose store instance globally
  window.store = new Store();
  