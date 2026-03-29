// backend/server.js
import "dotenv/config";
import express, { json, urlencoded } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { createServer } from "http";

// Configuration
import connectDB from "./src/config/database.js";
import logger from "./src/config/logger.js";
import limiter from "./src/config/rateLimit.js";

// Middlewares
import { errorHandler } from "./src/middlewares/errorMiddleware.js";

// Routes
import authUserRoutes from "./src/routes/authUserRoutes.js";
import authHelperRoutes from "./src/routes/authHelperRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import helperRoutes from "./src/routes/helperRoutes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import sosRoutes from "./src/routes/sosRoutes.js";
import diagnosticRoutes from "./src/routes/diagnosticRoutes.js";
import interventionRoutes from "./src/routes/interventionRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import vehicleRoutes from "./src/routes/vehicleRoutes.js";

// ⚡ NOUVELLES ROUTES
import garageRoutes from "./src/routes/garageRoutes.js";
import towingRoutes from "./src/routes/towingRoutes.js";
import assistanceRoutes from "./src/routes/assistanceRoutes.js";

// ⚡ SOCKET.IO
import { initSocket } from "./src/socket/index.js";

const app = express();

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middlewares globaux
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(limiter); // À activer en production

// Logging
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

// ============================================
// ROUTES API
// ============================================

// Auth
app.use("/api/auth/user", authUserRoutes);
app.use("/api/auth/helper", authHelperRoutes);

// Utilisateurs
app.use("/api/users", userRoutes);

// Helpers
app.use("/api/helpers", helperRoutes);

// Véhicules
app.use("/api/vehicles", vehicleRoutes);

// Garages
app.use("/api/garages", garageRoutes);

// Remorquage
app.use("/api/towings", towingRoutes);

// Assistance
app.use("/api/assistance", assistanceRoutes);

// SOS
app.use("/api/sos", sosRoutes);

// Diagnostic
app.use("/api/diagnostic", diagnosticRoutes);

// Interventions
app.use("/api/interventions", interventionRoutes);

// Paiements
app.use("/api/payments", paymentRoutes);

// Documents
app.use("/api/documents", documentRoutes);

// Dans backend/server.js, ajoute cette route après les autres routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ROUTE DE TEST
// ============================================

app.get("/", (req, res) => {
  const currentTime = new Date().toLocaleString('fr-FR', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  res.json({
    success: true,
    message: "🚗 Bienvenue sur Kadima Road API",
    version: "1.0.0",
    status: "🟢 En ligne",
    timestamp: currentTime,
    websocket: "✅ Socket.IO prêt",
    endpoints: {
      auth: {
        user: "/api/auth/user",
        helper: "/api/auth/helper"
      },
      users: "/api/users",
      helpers: "/api/helpers",
      vehicles: "/api/vehicles",
      garages: "/api/garages",
      towings: "/api/towings",
      assistance: "/api/assistance",
      sos: "/api/sos",
      diagnostic: "/api/diagnostic",
      interventions: "/api/interventions",
      payments: "/api/payments",
      documents: "/api/documents"
    },
    documentation: "https://github.com/kadima-road/api",
    support: "support@kadimaroad.com"
  });
});

// Gestion des erreurs
app.use(errorHandler);

// ============================================
// DÉMARRAGE DU SERVEUR AVEC SOCKET.IO
// ============================================

const PORT = process.env.PORT || 4040;

// Créer le serveur HTTP
const server = createServer(app);

// Initialiser Socket.IO
const io = initSocket(server);

const startServer = async () => {
  try {
    await connectDB();
   




    
    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚗     KADIMA ROAD API     🚗                               ║
║                                                              ║
║   ✅ Serveur démarré avec succès                             ║
║   🌐 URL: http://localhost:${PORT}                           ║
║   🔌 WebSocket: ws://localhost:${PORT}                       ║
║   📅 Démarré le: ${new Date().toLocaleString('fr-FR')}       ║
║                                                              ║
║   📚 Documentation: http://localhost:${PORT}                 ║
║                                                              ║
║   📋 Endpoints disponibles:                                  ║
║      - /api/auth/user                                        ║
║      - /api/auth/helper                                      ║
║      - /api/users                                            ║
║      - /api/helpers                                          ║
║      - /api/vehicles                                         ║
║      - /api/garages                                          ║
║      - /api/towings                                          ║
║      - /api/assistance                                       ║
║      - /api/sos                                              ║
║      - /api/diagnostic                                       ║
║      - /api/interventions                                    ║
║      - /api/payments                                         ║
║      - /api/documents                                        ║
║                                                              ║
║   🔌 Événements Socket.IO:                                   ║
║      - join-intervention (helper)                            ║
║      - track-intervention (client)                           ║
║      - location-update (helper → client)                     ║
║      - status-update (helper/client)                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
      logger.info(`✅ Serveur démarré sur http://localhost:${PORT}`);
      logger.info(`🔌 Socket.IO prêt sur ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`❌ Erreur au démarrage: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  if (io) {
    io.close(() => {
      console.log('🔌 Socket.IO fermé');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export { io };