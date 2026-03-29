// Définition des événements pour assurer la cohérence entre client et helper
export const SOCKET_EVENTS = {
    // Client → Helper / Helper → Client
    JOIN_INTERVENTION: 'join-intervention',
    TRACK_INTERVENTION: 'track-intervention',
    LEAVE_INTERVENTION: 'leave-intervention',
    
    // Mises à jour
    STATUS_UPDATE: 'status-update',
    LOCATION_UPDATE: 'location-update',
    HELPER_JOINED: 'helper-joined',
    
    // Notifications globales
    NEW_MISSION: 'new-mission',
    MISSION_ACCEPTED: 'mission-accepted',
    MISSION_CANCELLED: 'mission-cancelled',
    MISSION_COMPLETED: 'mission-completed',
    
    // Messages
    CHAT_MESSAGE: 'chat-message',
    PHOTO_UPDATE: 'photo-update',
    
    // Erreurs
    ERROR: 'error'
  };