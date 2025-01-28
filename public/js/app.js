// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize sound system
        await SoundEffects.init();
        console.log('AudioContext resumed successfully');

        // Initialize store and load data
        await Store.init();

        // Initialize UI components
        initializeUI();

        // Add weather toggle button listener
        const weatherButton = document.getElementById('toggle-weather');
        if (weatherButton) {
            weatherButton.addEventListener('click', async () => {
                try {
                    await Store.toggleWeather();
                    SoundEffects.play('buttonClick');
                } catch (error) {
                    console.error('Failed to toggle weather:', error);
                }
            });
        }

        // Add coin display updater
        const coinDisplay = document.getElementById('coin-display');
        if (coinDisplay) {
            setInterval(async () => {
                const userData = Store.getUserData();
                if (userData) {
                    coinDisplay.textContent = userData.coins || 0;
                }
            }, 1000);
        }

        // 1. Ensure store exists
        if (!window.store) {
          console.error('Store not initialized');
          return;
        }
  
        // 2. Initialize audio context on first user interaction
        function resumeAudioContext() {
          if (
            window.Howler &&
            window.Howler.ctx &&
            window.Howler.ctx.state !== 'running'
          ) {
            window.Howler.ctx
              .resume()
              .then(() => {
                console.log('AudioContext resumed successfully');
                if (
                  window.SoundEffects &&
                  typeof window.SoundEffects.play === 'function'
                ) {
                  window.SoundEffects.play('buttonClick');
                }
              })
              .catch(error => {
                console.warn('Failed to resume AudioContext:', error);
              });
          }
        }
        document.body.addEventListener('click', resumeAudioContext, { once: true });
  
        // 3. Grab DOM elements
        const elements = {
          questForm: document.getElementById('questForm'),
          questList: document.getElementById('questList'),
          weatherIndicatorIcon: document.getElementById('currentWeatherIcon'), // in header
          coinCount: document.getElementById('coinCount'),
          streakCount: document.getElementById('streakCount'),
          questTitle: document.getElementById('questTitle'),
          questDifficulty: document.getElementById('questDifficulty'),
          questDeadline: document.getElementById('questDeadline'),
          addQuestBtn: document.getElementById('addQuestBtn'),
          questModal: document.getElementById('questModal'),
          shopBtn: document.getElementById('shopBtn'),
          achievementsBtn: document.getElementById('achievementsBtn'),
          statsBtn: document.getElementById('statsBtn'),
          weatherBtn: document.getElementById('weatherBtn'),
          weatherToggleIcon: document.getElementById('weatherToggleIcon'),
          compassBtn: document.getElementById('compassBtn'),
          powerUps: document.getElementById('powerUps')
        };
  
        // 4. Initialize sound effects
        if (window.SoundEffects) {
          SoundEffects.init();
        }
  
        // 5. UI Update Functions
        function updateQuestList() {
          if (!elements.questList) return;
  
          // Filter for active quests only
          const quests = store.getQuests().filter(q => q.status === 'active');
  
          if (!quests.length) {
            elements.questList.innerHTML = `
              <div class="empty-state">
                <i class="fas fa-compass"></i>
                <p>No active quests. Start a new adventure!</p>
              </div>
            `;
            return;
          }
  
          elements.questList.innerHTML = quests
            .map(
              quest => `
              <div class="quest-item" data-quest-id="${quest.id}">
                <div class="quest-info">
                  <h3>${quest.title}</h3>
                  <div class="quest-meta">
                    <span class="difficulty ${quest.difficulty}">
                      ${quest.difficulty}
                    </span>
                    ${
                      quest.deadline
                        ? `
                      <span class="deadline">
                        <i class="fas fa-clock"></i>
                        ${new Date(quest.deadline).toLocaleDateString()}
                      </span>
                    `
                        : ''
                    }
                  </div>
                </div>
                <div class="quest-actions">
                  <button class="sail-btn map-control-btn" title="Set Sail">
                    <i class="fas fa-ship"></i>
                  </button>
                  <button class="complete-btn map-control-btn" title="Complete Quest">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="delete-btn map-control-btn" title="Delete Quest">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `
            )
            .join('');
        }
  
        function updateStats() {
          const stats = store.getStats();
  
          if (elements.coinCount) {
            elements.coinCount.textContent = stats.coins;
          }
          if (elements.streakCount) {
            elements.streakCount.textContent = stats.currentStreak;
          }
  
          // Update stats modal
          const totalQuestsEl = document.getElementById('totalQuestsCompleted');
          const totalCoinsEl = document.getElementById('totalCoinsEarned');
          const longestStreakEl = document.getElementById('longestStreak');
          const questDistributionEl = document.getElementById('questDistribution');
  
          if (totalQuestsEl) totalQuestsEl.textContent = stats.totalQuests;
          if (totalCoinsEl) totalCoinsEl.textContent = stats.coins;
          if (longestStreakEl) longestStreakEl.textContent = stats.longestStreak;
  
          if (questDistributionEl) {
            const { easy, medium, hard } = stats.questsByDifficulty;
            const total = easy + medium + hard;
            questDistributionEl.innerHTML = `
              <div class="distribution-bar">
                <div class="bar-segment easy" style="width: ${
                  total ? (easy / total) * 100 : 0
                }%">
                  <span>Easy: ${easy}</span>
                </div>
                <div class="bar-segment medium" style="width: ${
                  total ? (medium / total) * 100 : 0
                }%">
                  <span>Medium: ${medium}</span>
                </div>
                <div class="bar-segment hard" style="width: ${
                  total ? (hard / total) * 100 : 0
                }%">
                  <span>Hard: ${hard}</span>
                </div>
              </div>
            `;
          }
        }
  
        function updateWeatherDisplay() {
          // This icon in the header
          const weather = store.getCurrentWeather();
          const weatherIcons = {
            clear: 'fa-sun',
            storm: 'fa-cloud-bolt',
            fog: 'fa-smog'
          };
  
          if (elements.weatherIndicatorIcon) {
            elements.weatherIndicatorIcon.className = 'fas ' + (weatherIcons[weather] || 'fa-sun');
          }
  
          // Also toggle the icon inside the weather button
          if (elements.weatherToggleIcon) {
            elements.weatherToggleIcon.className = 'fas ' + (weatherIcons[weather] || 'fa-sun');
          }
  
          // Update data-weather attribute on .map-container
          const mapContainer = document.querySelector('.map-container');
          if (mapContainer) {
            mapContainer.setAttribute('data-weather', weather);
          }
        }
  
        function updateCompass() {
          // Simple rotation effect
          if (!elements.compassBtn) return;
          let rotation = 0;
          const rotateCompass = () => {
            rotation = (rotation + 1) % 360;
            const compassIcon = elements.compassBtn.querySelector('i');
            if (compassIcon) {
              compassIcon.style.transform = `rotate(${rotation}deg)`;
            }
            requestAnimationFrame(rotateCompass);
          };
          rotateCompass();
        }
  
        function updateShopDisplay() {
          if (!elements.powerUps) return;
  
          const coins = store.getStats().coins;
          const items = [
            { id: 'map', name: 'Treasure Map', cost: 50, icon: '🗺️' },
            { id: 'compass', name: 'Golden Compass', cost: 100, icon: '🧭' },
            { id: 'spyglass', name: 'Magic Spyglass', cost: 150, icon: '🔭' },
            { id: 'parrot', name: 'Companion Parrot', cost: 200, icon: '🦜' },
            { id: 'hat', name: "Captain's Hat", cost: 300, icon: '👒' }
          ];
  
          elements.powerUps.innerHTML = items
            .map(item => {
              const affordable = coins >= item.cost;
              return `
                <div class="shop-item">
                  <span class="shop-item-icon">${item.icon}</span>
                  <div class="shop-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.cost} coins</p>
                  </div>
                  <button
                    class="buy-button pirate-btn ${affordable ? '' : 'disabled'}"
                    data-item-id="${item.id}"
                    data-cost="${item.cost}"
                    ${affordable ? '' : 'disabled'}>
                    ${affordable ? 'Buy' : 'Not enough coins'}
                  </button>
                </div>
              `;
            })
            .join('');
        }
  
        function updateAchievements() {
          const unlocked = store.getUnlockedAchievements();
          const all = [
            { id: 'first_quest', title: 'First Quest', description: 'Complete your first quest', icon: '🏆' },
            { id: 'ten_quests', title: 'Seasoned Sailor', description: 'Complete 10 quests', icon: '⚓' },
            { id: 'fifty_quests', title: 'Master Navigator', description: 'Complete 50 quests', icon: '🧭' },
            { id: 'three_day_streak', title: 'Steady Course', description: 'Maintain a 3-day streak', icon: '📅' },
            { id: 'week_streak', title: 'True Pirate', description: 'Maintain a 7-day streak', icon: '🗓️' },
            { id: 'storm_master', title: 'Storm Chaser', description: 'Complete a quest during a storm', icon: '⛈️' },
            { id: 'fog_master', title: 'Fog Walker', description: 'Complete a quest in the fog', icon: '🌫️' },
            { id: 'weather_master', title: 'Master of the Seas', description: 'Master all weather conditions', icon: '🌈' },
            { id: 'coin_collector', title: 'Treasure Hunter', description: 'Collect 100 coins', icon: '💰' },
            { id: 'treasure_hunter', title: 'Wealthy Buccaneer', description: 'Collect 1000 coins', icon: '🏴‍☠️' }
          ];
  
          const achievementsList = document.getElementById('achievementsList');
          if (!achievementsList) return;
  
          achievementsList.innerHTML = all
            .map(achievement => {
              const locked = !unlocked.includes(achievement.id);
              return `
                <div class="achievement ${locked ? 'locked' : 'unlocked'}">
                  <span class="achievement-icon">${achievement.icon}</span>
                  <div class="achievement-info">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                  </div>
                </div>
              `;
            })
            .join('');
        }
  
        // Notification helper
        function showNotification(title, message, icon) {
          const container = document.getElementById('notificationContainer');
          if (!container) return;
  
          const notification = document.createElement('div');
          notification.className = 'notification';
          notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="content">
              <h4>${title}</h4>
              <p>${message}</p>
            </div>
          `;
          container.appendChild(notification);
  
          // Sound effect
          if (window.SoundEffects && typeof SoundEffects.play === 'function') {
            SoundEffects.play('notification');
          }
  
          // Animate in
          setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
              notification.classList.remove('show');
              setTimeout(() => notification.remove(), 300);
            }, 3000);
          }, 100);
        }
  
        // 6. Quest Functions (exposed globally for onClick in HTML or PirateMap)
        window.completeQuest = function(questId) {
          if (store.completeQuest(questId)) {
            pirateMap.removeQuest(questId);
  
            // Sound
            if (window.SoundEffects) {
              SoundEffects.play('questComplete');
              setTimeout(() => {
                SoundEffects.play('coinCollect');
              }, 500);
            }
  
            // Show notification
            showNotification('Quest Completed!', 'You earned coins for completing this quest!', 'fa-coins');
  
            // Refresh UI
            updateQuestList();
            updateStats();
          }
        };
  
        window.deleteQuest = function(questId) {
          if (store.deleteQuest(questId)) {
            pirateMap.removeQuest(questId);
  
            // Sound
            if (window.SoundEffects) {
              SoundEffects.play('buttonClick');
            }
  
            // Notification
            showNotification('Quest Deleted', 'The quest has been removed.', 'fa-trash');
  
            // Refresh UI
            updateQuestList();
            updateStats();
          }
        };
  
        // 7. Modal Functions
        function openModal(modalId) {
          closeModal(); // close others first
          const modal = document.getElementById(modalId);
          if (modal) {
            modal.classList.remove('hidden');
            if (window.SoundEffects) {
              SoundEffects.play('buttonClick');
            }
            // Update content if needed
            if (modalId === 'statsModal') {
              updateStats();
            } else if (modalId === 'achievementsModal') {
              updateAchievements();
            } else if (modalId === 'shopModal') {
              updateShopDisplay();
            }
          }
        }
  
        function closeModal() {
          document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
          if (window.SoundEffects) {
            SoundEffects.play('buttonClick');
          }
        }
  
        // Make them globally accessible
        window.openModal = openModal;
        window.closeModal = closeModal;
  
        // 8. Initialize UI & Event Listeners
        function initializeUI() {
          // Initial updates
          updateQuestList();
          updateStats();
          updateWeatherDisplay();
          updateCompass();
  
          // Add single event listener for quest form
          if (elements.questForm) {
            elements.questForm.addEventListener('submit', e => {
              e.preventDefault();
  
              if (!elements.questTitle.value.trim()) {
                alert('Please enter a quest title!');
                return;
              }
  
              const quest = {
                title: elements.questTitle.value.trim(),
                difficulty: elements.questDifficulty.value,
                deadline: elements.questDeadline.value || null
              };
  
              const newQuest = store.addQuest(quest);
              if (newQuest) {
                const position = pirateMap.addQuest(newQuest);
                store.updateQuestPosition(newQuest.id, position);
  
                if (window.SoundEffects) {
                  SoundEffects.play('newQuest');
                }
  
                elements.questTitle.value = '';
                elements.questDeadline.value = '';
                elements.questModal.classList.add('hidden');
                updateQuestList();
                updateStats();
              }
            });
          }
  
          // Quests panel
          if (elements.questList) {
            elements.questList.addEventListener('click', e => {
              const questItem = e.target.closest('.quest-item');
              if (!questItem) return;
  
              const questId = parseInt(questItem.dataset.questId, 10);
              if (!questId) return;
  
              if (e.target.closest('.complete-btn')) {
                completeQuest(questId);
              } else if (e.target.closest('.delete-btn')) {
                deleteQuest(questId);
              } else if (e.target.closest('.sail-btn')) {
                // Move ship to quest location
                pirateMap.setSail(questId);
              }
            });
          }
  
          // Shop panel
          if (elements.powerUps) {
            elements.powerUps.addEventListener('click', e => {
              const buyButton = e.target.closest('.buy-button');
              if (!buyButton) return;
  
              const itemId = buyButton.dataset.itemId;
              const cost = parseInt(buyButton.dataset.cost, 10);
  
              if (store.getStats().coins >= cost) {
                // Deduct coins
                store.state.coins -= cost;
                store.saveState();
                if (window.SoundEffects) {
                  SoundEffects.play('coinCollect');
                }
                // Refresh
                updateStats();
                updateShopDisplay();
              } else {
                alert('Not enough coins!');
              }
            });
          }
  
          // Weather button
          if (elements.weatherBtn) {
            elements.weatherBtn.addEventListener('click', () => {
              store.toggleWeather();
              updateWeatherDisplay();
              if (window.SoundEffects) {
                SoundEffects.play('buttonClick');
              }
            });
          }
  
          // Compass button
          if (elements.compassBtn) {
            elements.compassBtn.addEventListener('click', () => {
              pirateMap.centerOnShip();
              if (window.SoundEffects) {
                SoundEffects.play('buttonClick');
              }
            });
          }
  
          // Modal openers
          if (elements.addQuestBtn) {
            elements.addQuestBtn.addEventListener('click', () => openModal('questModal'));
          }
          if (elements.shopBtn) {
            elements.shopBtn.addEventListener('click', () => openModal('shopModal'));
          }
          if (elements.achievementsBtn) {
            elements.achievementsBtn.addEventListener('click', () => openModal('achievementsModal'));
          }
          if (elements.statsBtn) {
            elements.statsBtn.addEventListener('click', () => openModal('statsModal'));
          }
  
          // Close modals on background click
          document.addEventListener('click', e => {
            if (e.target.classList.contains('modal')) {
              closeModal();
            }
          });
  
          // Close modals on ESC
          document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
              closeModal();
            }
          });
  
          // Listen for weather changes
          window.addEventListener('weatherChange', e => {
            updateWeatherDisplay();
            if (window.SoundEffects) {
              const w = e.detail.weather;
              SoundEffects.play(w === 'storm' ? 'storm' : 'sail');
            }
          });
  
          // Listen for achievements
          window.addEventListener('achievementUnlocked', e => {
            const { achievementId } = e.detail;
            showNotification(
              'Achievement Unlocked!',
              `You unlocked: ${achievementId}`,
              'fa-trophy'
            );
            updateAchievements();
            if (window.SoundEffects) {
              SoundEffects.play('notification');
            }
          });
  
          // Load any existing active quests to the map
          store.getQuests().forEach(quest => {
            if (quest.status === 'active' && quest.position) {
              pirateMap.addQuest(quest);
            }
          });
        }
  
        // 9. Run initialization
        initializeUI();

    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

function initializeUI() {
    // Add click sound to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            SoundEffects.play('buttonClick');
        });
    });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = element.dataset.tooltip;
            document.body.appendChild(tooltip);

            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';
            tooltip.style.top = rect.bottom + 5 + 'px';

            element.addEventListener('mouseleave', () => tooltip.remove(), { once: true });
        });
    });
}

// Error handler for uncaught promise rejections
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
});