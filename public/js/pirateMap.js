class PirateMap {
    constructor() {
        this.map = null;
        this.ship = null;
        this.quests = new Map();
        this.currentQuestMarker = null;
        this.initialized = false;
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initMap());
        } else {
            this.initMap();
        }
    }

    initMap() {
        try {
            // Check if map container exists
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('Map container not found');
                return;
            }

            // Initialize the map
            this.map = L.map('map', {
                center: [0, 0],
                zoom: 3,
                minZoom: 2,
                maxZoom: 5,
                maxBounds: [[-90, -180], [90, 180]],
                maxBoundsViscosity: 1.0
            });

            // Add custom tile layer
            L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            }).addTo(this.map);

            // Create ship icon
            const shipIcon = L.divIcon({
                className: 'ship-icon',
                html: '<i class="fas fa-ship"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            // Add ship marker at center
            this.ship = L.marker([0, 0], { icon: shipIcon }).addTo(this.map);

            // Mark as initialized
            this.initialized = true;

            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    addQuest(quest) {
        if (!this.initialized || !this.map) {
            console.error('Map not initialized');
            return null;
        }

        try {
            // Create quest icon
            const questIcon = L.divIcon({
                className: `quest-icon ${quest.difficulty}`,
                html: '<i class="fas fa-scroll"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            // Generate random position if not provided
            const position = quest.position || this.getRandomPosition();

            // Add marker to map
            const marker = L.marker(position, { icon: questIcon })
                .bindPopup(`
                    <div class="quest-popup">
                        <h3>${quest.title}</h3>
                        <p class="difficulty ${quest.difficulty}">${quest.difficulty}</p>
                        ${quest.deadline ? `<p class="deadline">Due: ${new Date(quest.deadline).toLocaleDateString()}</p>` : ''}
                        <div class="popup-actions">
                            <button onclick="completeQuest(${quest.id})">Complete</button>
                            <button onclick="deleteQuest(${quest.id})">Delete</button>
                        </div>
                    </div>
                `)
                .addTo(this.map);

            // Store marker reference
            this.quests.set(quest.id, marker);

            return position;
        } catch (error) {
            console.error('Error adding quest:', error);
            return null;
        }
    }

    removeQuest(questId) {
        const marker = this.quests.get(questId);
        if (marker) {
            marker.remove();
            this.quests.delete(questId);
        }
    }

    getRandomPosition() {
        // Generate random coordinates within map bounds
        const lat = Math.random() * 140 - 70; // -70 to 70
        const lng = Math.random() * 320 - 160; // -160 to 160
        return [lat, lng];
    }

    setSail(questId) {
        const marker = this.quests.get(questId);
        if (!marker) return;

        const targetPosition = marker.getLatLng();
        const startPosition = this.ship.getLatLng();

        // Play sail sound
        if (window.SoundEffects) {
            SoundEffects.play('sail');
        }

        // Animate ship movement
        this.animateShipMovement(startPosition, targetPosition);

        // Center map on target
        this.map.setView(targetPosition, 4, {
            animate: true,
            duration: 1
        });
    }

    animateShipMovement(start, end) {
        const frames = 100;
        let frame = 0;

        const animate = () => {
            frame++;
            const progress = frame / frames;

            const lat = start.lat + (end.lat - start.lat) * progress;
            const lng = start.lng + (end.lng - start.lng) * progress;

            this.ship.setLatLng([lat, lng]);

            if (frame < frames) {
                requestAnimationFrame(animate);
            } else {
                // Play ship arrival sound
                if (window.SoundEffects) {
                    SoundEffects.play('shipMove');
                }
            }
        };

        animate();
    }

    centerOnShip() {
        if (this.ship) {
            this.map.setView(this.ship.getLatLng(), 4, {
                animate: true,
                duration: 1
            });
        }
    }
}

// Initialize map
window.pirateMap = new PirateMap();
window.pirateMap.init();
