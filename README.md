# 🏴‍☠️ Pirate Productivity App

A fun and engaging productivity app that turns your tasks into pirate quests! Navigate the high seas of productivity while completing quests, earning coins, and unlocking achievements.

## ✨ Features

- 🗺️ Interactive map interface with ship navigation
- 📜 Quest system with difficulty levels
- 🎯 Progress tracking and achievements
- 💰 Virtual coin rewards
- 🌊 Dynamic weather effects
- 🔊 Immersive sound effects
- 🏆 Achievement system
- 🛍️ In-game shop

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection for map tiles

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pirate-productivity.git
cd pirate-productivity
```

2. Open `index.html` in your web browser

That's it! The app uses client-side storage, so no server setup is required.

## 🎮 How to Use

1. **Adding Quests**
   - Click the "+" button to add a new quest
   - Set title, difficulty, and optional deadline
   - Your quest will appear on the map

2. **Completing Quests**
   - Click the ship icon to sail to a quest
   - Complete the quest to earn coins
   - Track your progress in the stats panel

3. **Weather System**
   - Toggle weather conditions using the weather button
   - Different weather affects the map appearance
   - Complete quests in various weather conditions to unlock achievements

4. **Shop**
   - Spend earned coins in the shop
   - Purchase cosmetic items and power-ups
   - Unlock special features

## 🏗️ Project Structure

```
pirate-app/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── pirateMap.js
│   │   ├── sounds.js
│   │   └── store.js
│   ├── sounds/
│   │   └── [sound files]
│   └── index.html
└── README.md
```

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- [Leaflet.js](https://leafletjs.com/) for map functionality
- [Howler.js](https://howlerjs.com/) for sound effects
- [Font Awesome](https://fontawesome.com/) for icons
- [OpenStreetMap](https://www.openstreetmap.org/) for map tiles

## 🎨 Features & Components

### Map System
- Interactive world map using Leaflet.js
- Custom ship marker with animations
- Quest markers with popup information

### Quest Management
- Create, complete, and delete quests
- Different difficulty levels
- Optional deadlines
- Position tracking on map

### Achievement System
- Multiple achievements to unlock
- Progress tracking
- Reward notifications

### Sound System
- Background music
- Interactive sound effects
- Weather-based ambient sounds

### State Management
- Local storage for persistence
- Real-time state updates
- Progress tracking

## 🤝 Contributing

Feel free to contribute to this project! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap contributors for map data
- Font Awesome for icons
- The open-source community for inspiration and tools

## 🐛 Known Issues

- Sound effects require user interaction to start playing (browser security feature)
- Some browsers may require enabling local storage

## 📞 Support

If you encounter any issues or have questions, please:

1. Check the known issues section
2. Open an issue in the repository
3. Provide detailed information about the problem

Happy questing, matey! 🏴‍☠️
