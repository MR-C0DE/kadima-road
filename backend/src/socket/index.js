import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Helper from '../models/Helper.js';
import Intervention from '../models/Intervention.js';
import { SOCKET_EVENTS } from './events.js';

let io;

export const initSocket = (server) => {
  console.log('🔌 Initialisation Socket.IO...');
  
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:8081',
        'http://localhost:8082',
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
        /^exp:\/\/192\.168\.\d+\.\d+:\d+$/,
      ],
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware d'authentification
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: user not found'));
      }
      
      socket.user = user;
      socket.isHelper = user.isHelper === true || user.role === 'helper';
      
      next();
    } catch (err) {
      next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connecté: ${socket.id} (User: ${socket.userId}, isHelper: ${socket.isHelper})`);

    // ============================================
    // HELPER - Rejoint une intervention
    // ============================================
    socket.on(SOCKET_EVENTS.JOIN_INTERVENTION, async (interventionId) => {
      console.log(`📡 join-intervention: ${interventionId} par ${socket.userId} (isHelper: ${socket.isHelper})`);
      
      if (!socket.isHelper) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Seul un helper peut rejoindre une intervention' });
        return;
      }

      try {
        const intervention = await Intervention.findById(interventionId);
        
        if (!intervention) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Intervention non trouvée' });
          return;
        }

        const assignedHelper = await Helper.findById(intervention.helper);
        
        if (!assignedHelper) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Helper assigné non trouvé' });
          return;
        }

        if (assignedHelper.user.toString() !== socket.userId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Vous n\'êtes pas assigné à cette intervention' });
          return;
        }

        // Rejoindre la salle
        socket.join(`intervention:${interventionId}`);
        console.log(`✅ Helper ${socket.userId} a rejoint la salle intervention:${interventionId}`);
        
        // Notifier le client
        io.to(`intervention:${interventionId}`).emit(SOCKET_EVENTS.HELPER_JOINED, {
          helperId: socket.userId,
          message: 'Le helper a rejoint la session',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Erreur join-intervention:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    // ============================================
    // CLIENT - Suit une intervention
    // ============================================
    socket.on(SOCKET_EVENTS.TRACK_INTERVENTION, async (interventionId) => {
      console.log(`📡 track-intervention: ${interventionId} par ${socket.userId} (isHelper: ${socket.isHelper})`);
      
      if (socket.isHelper) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Un helper ne peut pas tracker' });
        return;
      }

      try {
        const intervention = await Intervention.findById(interventionId);
        if (!intervention) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Intervention non trouvée' });
          return;
        }
        
        if (intervention.user?.toString() !== socket.userId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Vous n\'êtes pas autorisé à suivre cette intervention' });
          return;
        }

        socket.join(`intervention:${interventionId}`);
        console.log(`✅ Client ${socket.userId} suit l'intervention ${interventionId}`);
        
        // Envoyer la dernière position connue du helper
        if (intervention.helperLocation?.coordinates) {
          const [longitude, latitude] = intervention.helperLocation.coordinates;
          socket.emit(SOCKET_EVENTS.LOCATION_UPDATE, {
            helperId: intervention.helper,
            latitude,
            longitude,
            accuracy: intervention.helperLocation.accuracy || 10,
            timestamp: intervention.helperLocation.updatedAt || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Erreur track-intervention:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    // ============================================
    // MISE À JOUR DE STATUT (Helper ou Client)
    // ============================================
    socket.on(SOCKET_EVENTS.STATUS_UPDATE, async (data) => {
      const { interventionId, status, note } = data;
      console.log(`📢 status-update: ${interventionId} -> ${status} par ${socket.userId} (isHelper: ${socket.isHelper})`);
      
      if (!interventionId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'ID d\'intervention requis' });
        return;
      }

      try {
        const intervention = await Intervention.findById(interventionId);
        if (!intervention) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Intervention non trouvée' });
          return;
        }

        // Vérifier les droits
        let isHelper = false;
        let isUser = false;

        if (socket.isHelper) {
          const helper = await Helper.findOne({ user: socket.userId });
          if (helper && intervention.helper?.toString() === helper._id.toString()) {
            isHelper = true;
          }
        } else {
          if (intervention.user?.toString() === socket.userId) {
            isUser = true;
          }
        }

        if (!isHelper && !isUser) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Non autorisé' });
          return;
        }

        const oldStatus = intervention.status;
        
        intervention.status = status;
        intervention.timeline.push({
          status,
          timestamp: new Date(),
          note: note || `Statut mis à jour: ${status}`,
          updatedBy: socket.userId,
          updatedByRole: socket.isHelper ? 'helper' : 'user'
        });

        if (status === 'accepted') {
          intervention.acceptedAt = new Date();
        }
        if (status === 'completed') {
          intervention.completedAt = new Date();
        }
        if (status === 'cancelled') {
          intervention.cancelledAt = new Date();
          intervention.cancellation = {
            cancelledBy: socket.isHelper ? 'helper' : 'user',
            reason: note || 'Annulé',
            cancelledAt: new Date()
          };
        }

        await intervention.save();

        const roomName = `intervention:${interventionId}`;
        
        // ✅ DIFFUSER À TOUS LES MEMBRES DE LA SALLE
        io.to(roomName).emit(SOCKET_EVENTS.STATUS_UPDATE, {
          interventionId,
          status,
          note: note || `Statut: ${status}`,
          timestamp: new Date().toISOString(),
          updatedBy: socket.isHelper ? 'helper' : 'user',
          oldStatus
        });

        // ✅ ÉVÉNEMENTS GLOBAUX SPÉCIFIQUES
        if (status === 'cancelled') {
            // Émission simple (pour compatibilité)
            io.emit('mission-cancelled', {
              missionId: interventionId,
              reason: reason || 'Mission annulée',
              location: intervention.location,
              reward: intervention.pricing?.final || 0
            });
            
            // ✅ Émission détaillée pour les modales spécifiques
            const missionTitle = `${intervention.type === 'sos' ? 'SOS' : 'Assistance'}${intervention.problem?.category ? ` - ${intervention.problem.category}` : ''}`;
            
            io.emit('mission-cancelled-detail', {
              missionId: interventionId,
              cancelledBy: socket.isHelper ? 'helper' : 'user',
              reason: reason || (socket.isHelper ? 'Annulé par le helper' : 'Annulé par le client'),
              missionTitle: missionTitle
            });
          }
        
        if (status === 'accepted') {
          io.emit(SOCKET_EVENTS.MISSION_ACCEPTED, {
            missionId: interventionId,
            helperId: intervention.helper,
            helperName: socket.isHelper ? `${socket.user.firstName} ${socket.user.lastName}` : null
          });
        }
        
        if (status === 'completed') {
          io.emit(SOCKET_EVENTS.MISSION_COMPLETED, {
            missionId: interventionId,
            completedAt: intervention.completedAt
          });
        }

        console.log(`✅ Statut diffusé: ${status} à la salle ${roomName}`);
      } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
      }
    });

    // ============================================
    // MISE À JOUR DE POSITION (Helper)
    // ============================================
    socket.on(SOCKET_EVENTS.LOCATION_UPDATE, async (data) => {
      const { interventionId, latitude, longitude, accuracy } = data;
      
      if (!interventionId || !latitude || !longitude) return;

      try {
        const intervention = await Intervention.findById(interventionId);
        if (!intervention) return;

        const helper = await Helper.findOne({ user: socket.userId });
        if (!helper || intervention.helper?.toString() !== helper._id.toString()) {
          return;
        }

        intervention.helperLocation = {
          type: 'Point',
          coordinates: [longitude, latitude],
          accuracy: accuracy || 10,
          updatedAt: new Date()
        };
        await intervention.save();

        io.to(`intervention:${interventionId}`).emit(SOCKET_EVENTS.LOCATION_UPDATE, {
          helperId: socket.userId,
          latitude,
          longitude,
          accuracy: accuracy || 10,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erreur location-update:', error);
      }
    });

    // ============================================
    // QUITTER UNE INTERVENTION
    // ============================================
    socket.on(SOCKET_EVENTS.LEAVE_INTERVENTION, (interventionId) => {
      if (interventionId) {
        socket.leave(`intervention:${interventionId}`);
        console.log(`🚪 Client ${socket.userId} a quitté intervention:${interventionId}`);
      }
    });

    // ============================================
    // CHAT
    // ============================================
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (data) => {
      const { interventionId, message, type = 'text' } = data;
      
      try {
        const intervention = await Intervention.findById(interventionId);
        if (!intervention) return;

        const isHelper = await Helper.findOne({ user: socket.userId });
        const sender = isHelper ? 'helper' : 'user';

        intervention.communication.messages.push({
          sender,
          content: message,
          type,
          timestamp: new Date()
        });
        intervention.communication.lastMessageAt = new Date();
        await intervention.save();

        io.to(`intervention:${interventionId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          interventionId,
          message,
          sender,
          type,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erreur chat:', error);
      }
    });

    socket.on(SOCKET_EVENTS.PHOTO_UPDATE, async (data) => {
      const { interventionId, photoUrl } = data;
      
      try {
        io.to(`intervention:${interventionId}`).emit(SOCKET_EVENTS.PHOTO_UPDATE, {
          photoUrl,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erreur photo update:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client déconnecté: ${socket.id} (User: ${socket.userId})`);
    });
  });

  console.log('✅ Socket.IO prêt');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

export { SOCKET_EVENTS };