const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initDB, getDB, saveDB } = require('./database/init');
const Container = require('./src/container');
const GameRoutes = require('./src/routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

let container = null;
let gameRoutes = null;

app.use((req, res, next) => {
  const playerId = req.cookies.player_id;
  const playerService = container.getPlayerService();
  
  if (playerId) {
    const player = playerService.getPlayerById(parseInt(playerId));
    if (player) {
      req.player = player;
      return next();
    }
  }
  
  const player = playerService.getOrCreatePlayer(Date.now().toString());
  
  res.cookie('player_id', player.id, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    httpOnly: true
  });
  
  req.player = player;
  next();
});

async function startServer() {
  try {
    await initDB();
    console.log('Database initialized');
    
    const db = getDB();
    container = new Container(db, saveDB);
    gameRoutes = new GameRoutes(container);
    gameRoutes.register(app);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on:`);
      console.log(`  - Local:   http://localhost:${PORT}`);
      console.log(`  - Network: http://<your-ip>:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();