import "dotenv/config";
import express, { json, urlencoded } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";

// Configuration
import connectDB from "./src/config/database.js";
import logger from "./src/config/logger.js";
import limiter from "./src/config/rateLimit.js";

// Middlewares
import { errorHandler } from "./src/middlewares/errorMiddleware.js";

// Routes (à décommenter au fur et à mesure)
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import sosRoutes from "./src/routes/sosRoutes.js";
import diagnosticRoutes from "./src/routes/diagnosticRoutes.js";
import helperRoutes from "./src/routes/helperRoutes.js";
import interventionRoutes from "./src/routes/interventionRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(limiter);

// Logging
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/diagnostic", diagnosticRoutes);
app.use("/api/helpers", helperRoutes);
app.use("/api/interventions", interventionRoutes);
app.use("/api/payments", paymentRoutes);

// Route de test
app.get("/", (req, res) => {
  res.json({ 
    message: "Bienvenue sur Kadima Road API",
    version: "1.0.0",
    status: "running"
  });
});

// Gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 4040;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`✅ Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error(`❌ Erreur au démarrage: ${error.message}`);
    process.exit(1);
  }
};

startServer();