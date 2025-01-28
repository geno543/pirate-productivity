class PirateMap {
    constructor() {
      this.map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([0, 0], 3);
  
      this.setupMap();
      this.markers = new Map();
      this.setupShip();
      this.questLayer = L.layerGroup().addTo(this.map);
  
      // Add zoom controls to top-right
      L.control.zoom({
        position: 'topright'
      }).addTo(this.map);
    }
  
    setupMap() {
      // Custom pirate-themed map style
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'map-tiles'
      }).addTo(this.map);
  
      // Add custom map styling
      const mapContainer = document.getElementById('map');
      mapContainer.style.filter = 'sepia(0.5) saturate(1.2)';
    }
  
    setupShip() {
      const shipIcon = L.divIcon({
        className: 'ship-marker',
        html: '<i class="fas fa-ship"></i>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
  
      // Start ship in the middle of the visible map bounds
      const bounds = this.map.getBounds();
      const center = bounds.getCenter();
  
      this.shipMarker = L.marker(center, {
        icon: shipIcon,
        zIndexOffset: 1000
      }).addTo(this.map);
  
      // Add ship wake effect
      this.shipWake = L.polyline([], {
        color: '#ffffff',
        weight: 2,
        opacity: 0.5,
        dashArray: '5, 10'
      }).addTo(this.map);
    }
  
    addQuest(quest) {
      const questIcon = L.divIcon({
        className: `quest-marker ${quest.difficulty}`,
        html: `<i class="fas ${this.getQuestIcon(quest.difficulty)}"></i>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
  
      // Generate random position within visible map bounds
      const bounds = this.map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
  
      const lat = southWest.lat + Math.random() * (northEast.lat - southWest.lat);
      const lng = southWest.lng + Math.random() * (northEast.lng - southWest.lng);
  
      const marker = L.marker([lat, lng], {
        icon: questIcon
      }).addTo(this.questLayer);
  
      // Add quest circle indicator
      const circle = L.circle([lat, lng], {
        color: this.getQuestColor(quest.difficulty),
        fillColor: this.getQuestColor(quest.difficulty),
        fillOpacity: 0.2,
        radius: 100000
      }).addTo(this.questLayer);
  
      marker.bindPopup(this.createQuestPopup(quest));
      this.markers.set(quest.id, { marker, circle });
  
      // Animate marker appearance
      const element = marker.getElement();
      if (element) {
        element.style.animation = 'questAppear 0.5s ease-out';
      }
  
      return { lat, lng };
    }
  
    getQuestIcon(difficulty) {
      const icons = {
        easy: 'fa-scroll',
        medium: 'fa-treasure-chest',
        hard: 'fa-skull-crossbones'
      };
      return icons[difficulty] || 'fa-scroll';
    }
  
    getQuestColor(difficulty) {
      const colors = {
        easy: '#2ecc71',
        medium: '#f1c40f',
        hard: '#e74c3c'
      };
      return colors[difficulty] || '#2ecc71';
    }
  
    createQuestPopup(quest) {
      const deadline = quest.deadline ? new Date(quest.deadline) : null;
      const timeLeft = deadline ? this.getTimeLeft(deadline) : '';
  
      return `
        <div class="quest-popup">
          <h3>${quest.title}</h3>
          <div class="quest-details">
            <div class="quest-difficulty ${quest.difficulty}">
              <i class="fas ${this.getQuestIcon(quest.difficulty)}"></i>
              ${quest.difficulty}
            </div>
            ${
              deadline
                ? `
              <div class="quest-deadline ${
                timeLeft.expired ? 'expired' : ''
              }">
                <i class="fas fa-hourglass-half"></i>
                ${timeLeft.text}
              </div>
            `
                : ''
            }
          </div>
          <div class="quest-actions">
            <button onclick="pirateMap.setSail(${quest.id})" class="map-control-btn">
              <i class="fas fa-ship"></i> Set Sail
            </button>
            <button onclick="completeQuest(${quest.id})" class="map-control-btn">
              <i class="fas fa-check"></i>
            </button>
            <button onclick="deleteQuest(${quest.id})" class="map-control-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }
  
    getTimeLeft(deadline) {
      const now = new Date();
      const diff = deadline - now;
      const expired = diff < 0;
  
      if (expired) {
        return { expired: true, text: 'Expired!' };
      }
  
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
      if (days > 0) {
        return { expired: false, text: `${days}d ${hours}h left` };
      }
      return { expired: false, text: `${hours}h left` };
    }
  
    moveShipTo(lat, lng) {
      if (!this.shipMarker) return;
  
      const startPos = this.shipMarker.getLatLng();
      const endPos = L.latLng(lat, lng);
  
      // Calculate distance and duration
      const distance = startPos.distanceTo(endPos);
      const duration = Math.min(2000, Math.max(1000, distance / 100));
  
      // Animation settings
      const fps = 60;
      const frames = duration / (1000 / fps);
      const latDiff = (lat - startPos.lat) / frames;
      const lngDiff = (lng - startPos.lng) / frames;
  
      // Update ship rotation
      const angle = this.calculateAngle(startPos, endPos);
      const shipIcon = this.shipMarker.getElement();
      if (shipIcon) {
        shipIcon.querySelector('i').style.transform = `rotate(${angle}deg)`;
      }
  
      // Animate movement
      let frame = 0;
      const animate = () => {
        if (frame >= frames) {
          this.updateShipWake(endPos);
          return;
        }
        frame++;
        const newLat = startPos.lat + latDiff * frame;
        const newLng = startPos.lng + lngDiff * frame;
        const newPos = L.latLng(newLat, newLng);
  
        this.shipMarker.setLatLng(newPos);
        this.updateShipWake(newPos);
  
        requestAnimationFrame(animate);
      };
  
      animate();
  
      // Center map on ship's new position
      this.map.panTo([lat, lng], {
        duration: duration / 1000,
        easeLinearity: 0.5
      });
    }
  
    calculateAngle(start, end) {
      const dx = end.lng - start.lng;
      const dy = end.lat - start.lat;
      return Math.atan2(dx, dy) * (180 / Math.PI);
    }
  
    updateShipWake(pos) {
      const wakePoints = this.shipWake.getLatLngs();
      wakePoints.push(pos);
  
      // Keep only last 10 points
      if (wakePoints.length > 10) {
        wakePoints.shift();
      }
  
      this.shipWake.setLatLngs(wakePoints);
    }
  
    removeQuest(questId) {
      const quest = this.markers.get(questId);
      if (quest) {
        const { marker, circle } = quest;
  
        // Animate marker removal
        const element = marker.getElement();
        if (element) {
          element.style.animation = 'questRemove 0.5s ease-out';
        }
  
        // Remove after animation
        setTimeout(() => {
          marker.remove();
          circle.remove();
          this.markers.delete(questId);
        }, 500);
      }
    }
  
    centerOnShip() {
      if (this.shipMarker) {
        const pos = this.shipMarker.getLatLng();
        this.map.flyTo(pos, this.map.getZoom(), {
          duration: 1,
          easeLinearity: 0.5
        });
      }
    }
  
    clearWake() {
      this.shipWake.setLatLngs([]);
    }
  
    setSail(questId) {
      const quest = this.markers.get(questId);
      if (!quest) return;
  
      const position = quest.marker.getLatLng();
      this.moveShipTo(position.lat, position.lng);
  
      // Close the popup
      quest.marker.closePopup();
  
      // Play sailing sound if available
      if (window.sounds && sounds.sail) {
        sounds.sail.play();
      }
    }
  }
  
  // Expose globally
  window.pirateMap = new PirateMap();
  
  const PirateMapQuestVisualization = {
    mapContainer: null,
    questElements: new Map(),
    isDragging: false,
    selectedQuest: null,
    
    init() {
        this.mapContainer = document.getElementById('map-container');
        if (!this.mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Initialize map interaction handlers
        this.initMapInteractions();
        
        // Initialize quest display
        this.refreshQuests();

        // Listen for quest updates
        window.addEventListener('questsUpdated', () => this.refreshQuests());
        
        // Listen for weather changes
        window.addEventListener('weatherChange', (event) => {
            this.updateWeatherEffects(event.detail.weather);
        });
    },

    initMapInteractions() {
        // Quest creation on map click
        this.mapContainer.addEventListener('click', (event) => {
            if (!this.isDragging && event.target === this.mapContainer) {
                const position = this.getClickPosition(event);
                this.showQuestForm(position);
            }
        });

        // Prevent text selection while dragging
        this.mapContainer.addEventListener('selectstart', (e) => {
            if (this.isDragging) e.preventDefault();
        });
    },

    async refreshQuests() {
        try {
            // Clear existing quest elements
            this.questElements.forEach(element => element.remove());
            this.questElements.clear();

            // Get quests from store
            const quests = Store.getAllQuests();
            
            // Create elements for each quest
            quests.forEach(quest => {
                if (!quest.completed) {
                    this.createQuestElement(quest);
                }
            });
        } catch (error) {
            console.error('Failed to refresh quests:', error);
        }
    },

    createQuestElement(quest) {
        const element = document.createElement('div');
        element.className = 'quest-marker';
        element.dataset.questId = quest.id;
        
        // Set position from quest data or generate new position
        const position = quest.position || this.generateRandomPosition();
        element.style.left = position.x + 'px';
        element.style.top = position.y + 'px';

        // Add difficulty indicator
        element.classList.add(`difficulty-${quest.difficulty}`);

        // Add quest info
        const tooltip = document.createElement('div');
        tooltip.className = 'quest-tooltip';
        tooltip.innerHTML = `
            <h3>${quest.title}</h3>
            <p>${quest.description || ''}</p>
            <p class="difficulty">Difficulty: ${quest.difficulty}</p>
        `;
        element.appendChild(tooltip);

        // Add drag functionality
        this.addDragHandlers(element);

        // Add click handler for quest interaction
        element.addEventListener('click', (event) => {
            event.stopPropagation();
            this.showQuestDetails(quest);
        });

        // Store reference and add to map
        this.questElements.set(quest.id, element);
        this.mapContainer.appendChild(element);

        // Update quest position in store
        if (!quest.position) {
            Store.updateQuest(quest.id, { position });
        }
    },

    addDragHandlers(element) {
        let startX, startY, initialX, initialY;

        element.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only handle left click
            
            this.isDragging = true;
            element.classList.add('dragging');
            
            startX = e.clientX - element.offsetLeft;
            startY = e.clientY - element.offsetTop;
            initialX = element.offsetLeft;
            initialY = element.offsetTop;

            const mouseMoveHandler = (e) => {
                if (!this.isDragging) return;

                e.preventDefault();
                
                const x = e.clientX - startX;
                const y = e.clientY - startY;
                
                // Constrain to map boundaries
                const bounds = this.mapContainer.getBoundingClientRect();
                const maxX = bounds.width - element.offsetWidth;
                const maxY = bounds.height - element.offsetHeight;
                
                element.style.left = Math.max(0, Math.min(maxX, x)) + 'px';
                element.style.top = Math.max(0, Math.min(maxY, y)) + 'px';
            };

            const mouseUpHandler = async () => {
                this.isDragging = false;
                element.classList.remove('dragging');
                
                // Update quest position if it changed
                if (initialX !== element.offsetLeft || initialY !== element.offsetTop) {
                    const questId = element.dataset.questId;
                    const position = {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    };
                    
                    try {
                        await Store.updateQuest(questId, { position });
                    } catch (error) {
                        console.error('Failed to update quest position:', error);
                        // Revert to initial position on failure
                        element.style.left = initialX + 'px';
                        element.style.top = initialY + 'px';
                    }
                }

                // Remove temporary handlers
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };

            // Add temporary handlers
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
    },

    showQuestForm(position) {
        const formHtml = `
            <div class="quest-form">
                <h3>Create New Quest</h3>
                <input type="text" id="quest-title" placeholder="Quest Title" required>
                <textarea id="quest-description" placeholder="Quest Description"></textarea>
                <select id="quest-difficulty">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <div class="form-buttons">
                    <button type="button" id="create-quest">Create</button>
                    <button type="button" id="cancel-quest">Cancel</button>
                </div>
            </div>
        `;

        const formContainer = document.createElement('div');
        formContainer.className = 'quest-form-container';
        formContainer.innerHTML = formHtml;
        formContainer.style.left = position.x + 'px';
        formContainer.style.top = position.y + 'px';

        this.mapContainer.appendChild(formContainer);

        // Handle form submission
        const createButton = formContainer.querySelector('#create-quest');
        createButton.addEventListener('click', async () => {
            const title = formContainer.querySelector('#quest-title').value.trim();
            const description = formContainer.querySelector('#quest-description').value.trim();
            const difficulty = formContainer.querySelector('#quest-difficulty').value;

            if (!title) {
                alert('Please enter a quest title');
                return;
            }

            try {
                await Store.createQuest({
                    title,
                    description,
                    difficulty,
                    position
                });
                
                formContainer.remove();
                await this.refreshQuests();
                SoundEffects.play('newQuest');
            } catch (error) {
                console.error('Failed to create quest:', error);
                alert('Failed to create quest. Please try again.');
            }
        });

        // Handle cancellation
        const cancelButton = formContainer.querySelector('#cancel-quest');
        cancelButton.addEventListener('click', () => {
            formContainer.remove();
        });
    },

    async showQuestDetails(quest) {
        const detailsHtml = `
            <div class="quest-details">
                <h3>${quest.title}</h3>
                <p>${quest.description || 'No description provided.'}</p>
                <p class="difficulty">Difficulty: ${quest.difficulty}</p>
                <div class="quest-actions">
                    <button id="complete-quest">Complete Quest</button>
                    <button id="delete-quest">Delete Quest</button>
                    <button id="close-details">Close</button>
                </div>
            </div>
        `;

        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'quest-details-container';
        detailsContainer.innerHTML = detailsHtml;

        const questElement = this.questElements.get(quest.id);
        const rect = questElement.getBoundingClientRect();
        detailsContainer.style.left = rect.right + 'px';
        detailsContainer.style.top = rect.top + 'px';

        this.mapContainer.appendChild(detailsContainer);

        // Handle quest completion
        const completeButton = detailsContainer.querySelector('#complete-quest');
        completeButton.addEventListener('click', async () => {
            try {
                await Store.completeQuest(quest.id);
                detailsContainer.remove();
                await this.refreshQuests();
                SoundEffects.play('questComplete');
            } catch (error) {
                console.error('Failed to complete quest:', error);
                alert('Failed to complete quest. Please try again.');
            }
        });

        // Handle quest deletion
        const deleteButton = detailsContainer.querySelector('#delete-quest');
        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this quest?')) {
                try {
                    await Store.deleteQuest(quest.id);
                    detailsContainer.remove();
                    await this.refreshQuests();
                } catch (error) {
                    console.error('Failed to delete quest:', error);
                    alert('Failed to delete quest. Please try again.');
                }
            }
        });

        // Handle close button
        const closeButton = detailsContainer.querySelector('#close-details');
        closeButton.addEventListener('click', () => {
            detailsContainer.remove();
        });
    },

    generateRandomPosition() {
        const padding = 50; // Padding from map edges
        const mapRect = this.mapContainer.getBoundingClientRect();
        
        return {
            x: padding + Math.random() * (mapRect.width - 2 * padding),
            y: padding + Math.random() * (mapRect.height - 2 * padding)
        };
    },

    getClickPosition(event) {
        const rect = this.mapContainer.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    updateWeatherEffects(weather) {
        // Remove existing weather classes
        this.mapContainer.classList.remove('weather-clear', 'weather-storm', 'weather-fog');
        
        // Add new weather class
        this.mapContainer.classList.add(`weather-${weather}`);
        
        // Play weather sound
        if (weather === 'storm') {
            SoundEffects.play('storm');
        }
    }
};

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    PirateMapQuestVisualization.init();
});