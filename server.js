const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initDB, getDB, saveDB, createBackup, restoreBackup, listBackups } = require('./database/init');
const Container = require('./src/container');
const GameRoutes = require('./src/routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
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
    
    app.get('/api/admin/backups', (req, res) => {
      const backups = listBackups();
      res.json(backups);
    });
    
    app.post('/api/admin/backup', (req, res) => {
      createBackup('manual');
      res.json({ success: true });
    });
    
    app.post('/api/admin/restore/:backupFile', (req, res) => {
      try {
        restoreBackup(req.params.backupFile);
        res.json({ success: true, message: 'Restored. Please restart server.' });
      } catch (e) {
        res.status(400).json({ error: e.message });
      }
    });
    
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