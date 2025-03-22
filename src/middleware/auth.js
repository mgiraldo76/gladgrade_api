const admin = require('../config/firebase');
const db = require('../config/db');

// Fetch user role from the database
const getUserRole = async (uid) => {
  try {
    const userQuery = await db.query(`
      SELECT u.id, u.primary_role_id, r.role 
      FROM users u
      JOIN roles r ON u.primary_role_id = r.id
      WHERE u.firebase_uid = $1
    `, [uid]);
    
    if (userQuery.rows.length === 0) {
      return null;
    }
    
    const user = userQuery.rows[0];
    
    // Get secondary roles if any
    const secondaryRolesQuery = await db.query(`
      SELECT r.role
      FROM secondary_user_roles sur
      JOIN roles r ON sur.role_id = r.id
      WHERE sur.user_id = $1
    `, [user.id]);
    
    const roles = [user.role];
    
    // Add secondary roles
    secondaryRolesQuery.rows.forEach(row => {
      roles.push(row.role);
    });
    
    return {
      userId: user.id,
      primaryRoleId: user.primary_role_id,
      roles
    };
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user's role information from database
    const userRoleInfo = await getUserRole(decodedToken.uid);
    
    if (!userRoleInfo) {
      return res.status(403).json({ error: 'Forbidden - User not found in database' });
    }
    
    // Add user information to the request
    req.user = {
      ...decodedToken,
      userId: userRoleInfo.userId,
      primaryRoleId: userRoleInfo.primaryRoleId,
      roles: userRoleInfo.roles
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Middleware to check user role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }
    
    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (hasPermission) {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
  };
};

module.exports = {
  verifyToken,
  checkRole,
  getUserRole
};