import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossiers d'upload
const UPLOAD_DIRS = {
  vehicle: 'uploads/vehicles',
  profile: 'uploads/profiles',
  document: 'uploads/documents'
};

// Créer le dossier s'il n'existe pas
const ensureDirectoryExists = (dirPath) => {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// Uploader un fichier
export const uploadFile = async (file, type, customName = null) => {
  try {
    const uploadDir = UPLOAD_DIRS[type] || UPLOAD_DIRS.document;
    const fullDirPath = ensureDirectoryExists(uploadDir);
    
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const fileName = customName 
      ? `${customName}-${timestamp}-${random}${path.extname(file.originalname)}`
      : `${type}-${timestamp}-${random}${path.extname(file.originalname)}`;
    
    const filePath = path.join(fullDirPath, fileName);
    
    // Déplacer le fichier
    fs.renameSync(file.path, filePath);
    
    // Construire l'URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4040';
    const fileUrl = `${baseUrl}/${uploadDir}/${fileName}`;
    
    return {
      success: true,
      url: fileUrl,
      path: filePath,
      fileName,
      fileSize: file.size,
      mimeType: file.mimetype
    };
    
  } catch (error) {
    console.error('Erreur uploadFile:', error);
    throw error;
  }
};

// Supprimer un fichier
export const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) return false;
    
    // Extraire le chemin du fichier depuis l'URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:4040';
    const relativePath = fileUrl.replace(baseUrl, '');
    const fullPath = path.join(process.cwd(), relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('Erreur deleteFile:', error);
    return false;
  }
};

// Obtenir les informations d'un fichier
export const getFileInfo = async (fileUrl) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4040';
    const relativePath = fileUrl.replace(baseUrl, '');
    const fullPath = path.join(process.cwd(), relativePath);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const stats = fs.statSync(fullPath);
    
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      path: fullPath
    };
    
  } catch (error) {
    console.error('Erreur getFileInfo:', error);
    return null;
  }
};