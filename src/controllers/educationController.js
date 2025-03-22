const educationService = require('../services/educationService');
const { createError } = require('../utils/errorUtils');

/**
 * Get all education areas
 */
const getAllAreas = async (req, res, next) => {
  try {
    const areas = await educationService.getAllAreas();
    res.status(200).json({ areas });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get area by ID
 */
const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const area = await educationService.getAreaById(id);
    
    if (!area) {
      return next(createError('Education area not found', 404));
    }
    
    res.status(200).json({ area });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all education locations
 */
const getAllLocations = async (req, res, next) => {
  try {
    const locations = await educationService.getAllLocations();
    res.status(200).json({ locations });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get locations by area
 */
const getLocationsByArea = async (req, res, next) => {
  try {
    const { areaId } = req.params;
    
    const locations = await educationService.getLocationsByArea(areaId);
    
    res.status(200).json({ locations });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get location by ID
 */
const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const location = await educationService.getLocationById(id);
    
    if (!location) {
      return next(createError('Location not found', 404));
    }
    
    res.status(200).json({ location });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all dorms
 */
const getAllDorms = async (req, res, next) => {
  try {
    const dorms = await educationService.getAllDorms();
    res.status(200).json({ dorms });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get dorms by location
 */
const getDormsByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    
    const dorms = await educationService.getDormsByLocation(locationId);
    
    res.status(200).json({ dorms });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get dorm by ID
 */
const getDormById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const dorm = await educationService.getDormById(id);
    
    if (!dorm) {
      return next(createError('Dorm not found', 404));
    }
    
    res.status(200).json({ dorm });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all professors
 */
const getAllProfessors = async (req, res, next) => {
  try {
    const professors = await educationService.getAllProfessors();
    res.status(200).json({ professors });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get professors by department
 */
const getProfessorsByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    
    const professors = await educationService.getProfessorsByDepartment(departmentId);
    
    res.status(200).json({ professors });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get professor by ID
 */
const getProfessorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const professor = await educationService.getProfessorById(id);
    
    if (!professor) {
      return next(createError('Professor not found', 404));
    }
    
    res.status(200).json({ professor });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get professor courses
 */
const getProfessorCourses = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const courses = await educationService.getProfessorCourses(id);
    
    res.status(200).json({ courses });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all departments
 */
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await educationService.getAllDepartments();
    res.status(200).json({ departments });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all class codes
 */
const getAllClassCodes = async (req, res, next) => {
  try {
    const classCodes = await educationService.getAllClassCodes();
    res.status(200).json({ classCodes });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get class codes by department
 */
const getClassCodesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    
    const classCodes = await educationService.getClassCodesByDepartment(departmentId);
    
    res.status(200).json({ classCodes });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all internet services
 */
const getAllInternet = async (req, res, next) => {
  try {
    const internet = await educationService.getAllInternet();
    res.status(200).json({ internet });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all security services
 */
const getAllSecurity = async (req, res, next) => {
  try {
    const security = await educationService.getAllSecurity();
    res.status(200).json({ security });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all social locations
 */
const getAllSocial = async (req, res, next) => {
  try {
    const social = await educationService.getAllSocial();
    res.status(200).json({ social });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create an education area (admin only)
 */
const createArea = async (req, res, next) => {
  try {
    const { name, isActive, isExternal } = req.body;
    
    const area = await educationService.createArea({
      name,
      isActive: isActive || true,
      isExternal: isExternal || false
    });
    
    res.status(201).json({ message: 'Education area created successfully', area });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update an education area (admin only)
 */
const updateArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isActive, isExternal } = req.body;
    
    const updatedArea = await educationService.updateArea(id, {
      name,
      isActive,
      isExternal
    });
    
    res.status(200).json({ message: 'Education area updated successfully', area: updatedArea });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Create a location (admin only)
 */
const createLocation = async (req, res, next) => {
  try {
    const { eduAreaId, name, placeId, isActive, isExternal } = req.body;
    
    const location = await educationService.createLocation({
      eduAreaId,
      name,
      placeId,
      isActive: isActive || true,
      isExternal: isExternal || false
    });
    
    res.status(201).json({ message: 'Location created successfully', location });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a location (admin only)
 */
const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eduAreaId, name, placeId, isActive, isExternal } = req.body;
    
    const updatedLocation = await educationService.updateLocation(id, {
      eduAreaId,
      name,
      placeId,
      isActive,
      isExternal
    });
    
    res.status(200).json({ message: 'Location updated successfully', location: updatedLocation });
  } catch (error) {
    next(createError(error.message, 400, error));
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