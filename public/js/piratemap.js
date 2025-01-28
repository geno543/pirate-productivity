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
  