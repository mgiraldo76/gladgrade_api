const db = require('../config/db');
const { createError } = require('../utils/errorUtils');

/**
 * Get all education areas
 * @returns {Promise<Array>} Education areas
 */
const getAllAreas = async () => {
  try {
    const areas = await db.query(
      `SELECT * FROM edu_areas 
       WHERE is_active = TRUE
       ORDER BY name`
    );
    
    return areas;
  } catch (error) {
    throw createError(`Error getting education areas: ${error.message}`, 500, error);
  }
};

/**
 * Get area by ID
 * @param {string|number} id - Area ID
 * @returns {Promise<Object|null>} Area object or null if not found
 */
const getAreaById = async (id) => {
  try {
    const result = await db.query(
      'SELECT * FROM edu_areas WHERE id = $1',
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting education area: ${error.message}`, 500, error);
  }
};

/**
 * Get all education locations
 * @returns {Promise<Array>} Education locations
 */
const getAllLocations = async () => {
  try {
    const locations = await db.query(
      `SELECT l.*, a.name as area_name 
       FROM edu_locations l
       JOIN edu_areas a ON l.edu_area_id = a.id
       WHERE l.is_active = TRUE
       ORDER BY l.name`
    );
    
    return locations;
  } catch (error) {
    throw createError(`Error getting education locations: ${error.message}`, 500, error);
  }
};

/**
 * Get locations by area
 * @param {string|number} areaId - Area ID
 * @returns {Promise<Array>} Education locations
 */
const getLocationsByArea = async (areaId) => {
  try {
    const locations = await db.query(
      `SELECT l.*, a.name as area_name 
       FROM edu_locations l
       JOIN edu_areas a ON l.edu_area_id = a.id
       WHERE l.edu_area_id = $1 AND l.is_active = TRUE
       ORDER BY l.name`,
      { areaId: parseInt(areaId) }
    );
    
    return locations;
  } catch (error) {
    throw createError(`Error getting education locations by area: ${error.message}`, 500, error);
  }
};

/**
 * Get location by ID
 * @param {string|number} id - Location ID
 * @returns {Promise<Object|null>} Location object or null if not found
 */
const getLocationById = async (id) => {
  try {
    const result = await db.query(
      `SELECT l.*, a.name as area_name 
       FROM edu_locations l
       JOIN edu_areas a ON l.edu_area_id = a.id
       WHERE l.id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting education location: ${error.message}`, 500, error);
  }
};

/**
 * Get all dorms
 * @returns {Promise<Array>} Dorms
 */
const getAllDorms = async () => {
  try {
    const dorms = await db.query(
      `SELECT * FROM edu_dorms 
       WHERE is_active = TRUE
       ORDER BY name`
    );
    
    // Get images for each dorm
    const dormIds = dorms.map(dorm => dorm.id);
    
    if (dormIds.length > 0) {
      const images = await db.query(
        `SELECT * FROM image_urls 
         WHERE edu_dorm_id IN ($1) AND is_active = TRUE
         ORDER BY order_by_number`,
        { dormIds }
      );
      
      // Attach images to dorms
      dorms.forEach(dorm => {
        dorm.images = images.filter(img => img.edu_dorm_id === dorm.id);
      });
    }
    
    return dorms;
  } catch (error) {
    throw createError(`Error getting dorms: ${error.message}`, 500, error);
  }
};

/**
 * Get dorms by location
 * @param {string|number} locationId - Location ID
 * @returns {Promise<Array>} Dorms
 */
const getDormsByLocation = async (locationId) => {
  try {
    // This is a placeholder - actual implementation would depend on
    // how dorms are associated with locations in your schema
    // For now, returning all dorms
    return await getAllDorms();
  } catch (error) {
    throw createError(`Error getting dorms by location: ${error.message}`, 500, error);
  }
};

/**
 * Get dorm by ID
 * @param {string|number} id - Dorm ID
 * @returns {Promise<Object|null>} Dorm object or null if not found
 */
const getDormById = async (id) => {
  try {
    const result = await db.query(
      'SELECT * FROM edu_dorms WHERE id = $1',
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    const dorm = result[0];
    
    // Get images for this dorm
    const images = await db.query(
      `SELECT * FROM image_urls 
       WHERE edu_dorm_id = $1 AND is_active = TRUE
       ORDER BY order_by_number`,
      { id: parseInt(id) }
    );
    
    dorm.images = images;
    
    return dorm;
  } catch (error) {
    throw createError(`Error getting dorm: ${error.message}`, 500, error);
  }
};

/**
 * Get all professors
 * @returns {Promise<Array>} Professors
 */
const getAllProfessors = async () => {
  try {
    const professors = await db.query(
      `SELECT p.*, d.name as department_name
       FROM edu_professors p
       JOIN edu_departments d ON p.edu_department_id = d.id
       ORDER BY p.name`
    );
    
    return professors;
  } catch (error) {
    throw createError(`Error getting professors: ${error.message}`, 500, error);
  }
};

/**
 * Get professors by department
 * @param {string|number} departmentId - Department ID
 * @returns {Promise<Array>} Professors
 */
const getProfessorsByDepartment = async (departmentId) => {
  try {
    const professors = await db.query(
      `SELECT p.*, d.name as department_name
       FROM edu_professors p
       JOIN edu_departments d ON p.edu_department_id = d.id
       WHERE p.edu_department_id = $1
       ORDER BY p.name`,
      { departmentId: parseInt(departmentId) }
    );
    
    return professors;
  } catch (error) {
    throw createError(`Error getting professors by department: ${error.message}`, 500, error);
  }
};

/**
 * Get professor by ID
 * @param {string|number} id - Professor ID
 * @returns {Promise<Object|null>} Professor object or null if not found
 */
const getProfessorById = async (id) => {
  try {
    const result = await db.query(
      `SELECT p.*, d.name as department_name
       FROM edu_professors p
       JOIN edu_departments d ON p.edu_department_id = d.id
       WHERE p.id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting professor: ${error.message}`, 500, error);
  }
};

/**
 * Get professor courses
 * @param {string|number} professorId - Professor ID
 * @returns {Promise<Array>} Courses
 */
const getProfessorCourses = async (professorId) => {
  try {
    const courses = await db.query(
      `SELECT pc.*, cc.name, cc.code
       FROM edu_professor_courses pc
       JOIN edu_class_codes cc ON pc.edu_class_code_id = cc.id
       WHERE pc.professor_id = $1
       ORDER BY cc.code`,
      { professorId: parseInt(professorId) }
    );
    
    return courses;
  } catch (error) {
    throw createError(`Error getting professor courses: ${error.message}`, 500, error);
  }
};

/**
 * Get all departments
 * @returns {Promise<Array>} Departments
 */
const getAllDepartments = async () => {
  try {
    const departments = await db.query(
      `SELECT * FROM edu_departments 
       WHERE is_active = TRUE
       ORDER BY name`
    );
    
    return departments;
  } catch (error) {
    throw createError(`Error getting departments: ${error.message}`, 500, error);
  }
};

/**
 * Get all class codes
 * @returns {Promise<Array>} Class codes
 */
const getAllClassCodes = async () => {
  try {
    const classCodes = await db.query(
      `SELECT * FROM edu_class_codes 
       WHERE is_active = TRUE
       ORDER BY code`
    );
    
    return classCodes;
  } catch (error) {
    throw createError(`Error getting class codes: ${error.message}`, 500, error);
  }
};

/**
 * Get class codes by department
 * @param {string|number} departmentId - Department ID
 * @returns {Promise<Array>} Class codes
 */
const getClassCodesByDepartment = async (departmentId) => {
  try {
    // This is a placeholder - actual implementation would depend on
    // how class codes are associated with departments in your schema
    // For now, returning all class codes
    return await getAllClassCodes();
  } catch (error) {
    throw createError(`Error getting class codes by department: ${error.message}`, 500, error);
  }
};

/**
 * Get all internet services
 * @returns {Promise<Array>} Internet services
 */
const getAllInternet = async () => {
  try {
    const internet = await db.query(
      `SELECT * FROM edu_internet 
       WHERE is_active = TRUE
       ORDER BY name`
    );
    
    return internet;
  } catch (error) {
    throw createError(`Error getting internet services: ${error.message}`, 500, error);
  }
};

/**
 * Get all security services
 * @returns {Promise<Array>} Security services
 */
const getAllSecurity = async () => {
  try {
    const security = await db.query(
      `SELECT s.*, a.name as area_name
       FROM edu_security s
       JOIN edu_areas a ON s.edu_area_id = a.id
       ORDER BY s.name`
    );
    
    return security;
  } catch (error) {
    throw createError(`Error getting security services: ${error.message}`, 500, error);
  }
};

/**
 * Get all social locations
 * @returns {Promise<Array>} Social locations
 */
const getAllSocial = async () => {
  try {
    const social = await db.query(
      `SELECT s.*, a.name as area_name
       FROM edu_social s
       JOIN edu_areas a ON s.edu_area_id = a.id
       ORDER BY s.name`
    );
    
    return social;
  } catch (error) {
    throw createError(`Error getting social locations: ${error.message}`, 500, error);
  }
};

/**
 * Create a new education area
 * @param {Object} areaData - Area data
 * @returns {Promise<Object>} Created area
 */
const createArea = async (areaData) => {
  try {
    const { name, isActive, isExternal } = areaData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO edu_areas (
        name, is_active, is_external, date_created
      ) VALUES ($1, $2, $3, $4)
      RETURNING id`,
      {
        name,
        isActive: isActive !== undefined ? isActive : true,
        isExternal: isExternal !== undefined ? isExternal : false,
        dateCreated: now
      }
    );
    
    const areaId = result[0].id;
    
    return await getAreaById(areaId);
  } catch (error) {
    throw createError(`Error creating education area: ${error.message}`, 500, error);
  }
};

/**
 * Update an education area
 * @param {string|number} id - Area ID
 * @param {Object} areaData - Area data to update
 * @returns {Promise<Object>} Updated area
 */
const updateArea = async (id, areaData) => {
  try {
    const { name, isActive, isExternal } = areaData;
    
    await db.query(
      `UPDATE edu_areas
       SET name = $1,
           is_active = $2,
           is_external = $3
       WHERE id = $4`,
      {
        name,
        isActive,
        isExternal,
        id: parseInt(id)
      }
    );
    
    return await getAreaById(id);
  } catch (error) {
    throw createError(`Error updating education area: ${error.message}`, 500, error);
  }
};

/**
 * Create a new location
 * @param {Object} locationData - Location data
 * @returns {Promise<Object>} Created location
 */
const createLocation = async (locationData) => {
  try {
    const { eduAreaId, name, placeId, isActive, isExternal } = locationData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO edu_locations (
        edu_area_id, name, place_id, is_active, is_external, date_created
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      {
        eduAreaId: parseInt(eduAreaId),
        name,
        placeId,
        isActive: isActive !== undefined ? isActive : true,
        isExternal: isExternal !== undefined ? isExternal : false,
        dateCreated: now
      }
    );
    
    const locationId = result[0].id;
    
    return await getLocationById(locationId);
  } catch (error) {
    throw createError(`Error creating location: ${error.message}`, 500, error);
  }
};

/**
 * Update a location
 * @param {string|number} id - Location ID
 * @param {Object} locationData - Location data to update
 * @returns {Promise<Object>} Updated location
 */
const updateLocation = async (id, locationData) => {
  try {
    const { eduAreaId, name, placeId, isActive, isExternal } = locationData;
    
    await db.query(
      `UPDATE edu_locations
       SET edu_area_id = $1,
           name = $2,
           place_id = $3,
           is_active = $4,
           is_external = $5
       WHERE id = $6`,
      {
        eduAreaId: parseInt(eduAreaId),
        name,
        placeId,
        isActive,
        isExternal,
        id: parseInt(id)
      }
    );
    
    return await getLocationById(id);
  } catch (error) {
    throw createError(`Error updating location: ${error.message}`, 500, error);
  }
};

module.exports = {
  getAllAreas,
  getAreaById,
  getAllLocations,
  getLocationsByArea,
  getLocationById,
  getAllDorms,
  getDormsByLocation,
  getDormById,
  getAllProfessors,
  getProfessorsByDepartment,
  getProfessorById,
  getProfessorCourses,
  getAllDepartments,
  getAllClassCodes,
  getClassCodesByDepartment,
  getAllInternet,
  getAllSecurity,
  getAllSocial,
  createArea,
  updateArea,
  createLocation,
  updateLocation
};