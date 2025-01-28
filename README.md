# Pirate Quest App

A pirate-themed quest tracking application where users can create, manage, and complete quests while earning coins and achievements. The app features dynamic weather effects, sound effects, and an interactive map interface.

## Features

- Create and manage quests with different difficulty levels
- Interactive map interface for quest visualization
- Dynamic weather system affecting gameplay
- Sound effects for various interactions
- Achievement system
- Coin-based economy
- Persistent data storage
- Responsive design

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Sound: Howler.js
- Deployment: Vercel

## Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd pirate-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment on Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the app:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

## Project Structure

```
pirate-app/
├── public/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── sounds/
│   └── index.html
├── data/
│   ├── quests.json
│   └── user-data.json
├── server.js
├── package.json
└── vercel.json
```

## Environment Variables

No environment variables are required for basic functionality.

## API Endpoints

### Quests
- `GET /api/quests` - Get all quests
- `POST /api/quests` - Create a new quest
- `PATCH /api/quests/:id` - Update a quest
- `DELETE /api/quests/:id` - Delete a quest
- `POST /api/quests/:id/complete` - Complete a quest

### User Data
- `GET /api/user-data` - Get user data
- `POST /api/user-data` - Update user data

## License

MIT
