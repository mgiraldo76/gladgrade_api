const businessService = require('../services/businessService');
const { createError } = require('../utils/errorUtils');

/**
 * Get all business sectors
 */
const getAllSectors = async (req, res, next) => {
  try {
    const sectors = await businessService.getAllSectors();
    res.status(200).json({ sectors });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get sector by ID
 */
const getSectorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const sector = await businessService.getSectorById(id);
    
    if (!sector) {
      return next(createError('Business sector not found', 404));
    }
    
    res.status(200).json({ sector });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get all business types
 */
const getAllTypes = async (req, res, next) => {
  try {
    const types = await businessService.getAllTypes();
    res.status(200).json({ types });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get business types by sector
 */
const getTypesBySector = async (req, res, next) => {
  try {
    const { sectorId } = req.params;
    
    const types = await businessService.getTypesBySector(sectorId);
    
    res.status(200).json({ types });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get business type by ID
 */
const getTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const type = await businessService.getTypeById(id);
    
    if (!type) {
      return next(createError('Business type not found', 404));
    }
    
    res.status(200).json({ type });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Get businesses owned by the current user
 */
const getUserBusinesses = async (req, res, next) => {
  try {
    const businesses = await businessService.getUserBusinesses(req.user.userId);
    res.status(200).json({ businesses });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Create a new business
 */
const createBusiness = async (req, res, next) => {
  try {
    const { 
      businessName, 
      placeId, 
      businessTypeId, 
      streetAddress, 
      city, 
      state, 
      zipCode, 
      country, 
      phone, 
      website,
      logoURL 
    } = req.body;
    
    const business = await businessService.createBusiness({
      userId: req.user.userId,
      businessName,
      placeId,
      businessTypeId,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      phone,
      website,
      logoURL,
      isActive: true,
      isVerified: false
    });
    
    res.status(201).json({ message: 'Business created successfully', business });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Get business by ID
 */
const getBusinessById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const business = await businessService.getBusinessById(id);
    
    if (!business) {
      return next(createError('Business not found', 404));
    }
    
    // Check if user is authorized to view this business
    const isOwner = business.userId === req.user.userId;
    const isAdmin = req.user.roles.includes('Admin');
    
    if (!business.isActive && !isOwner && !isAdmin) {
      return next(createError('Business not found', 404));
    }
    
    res.status(200).json({ business });
  } catch (error) {
    next(createError(error.message, 500, error));
  }
};

/**
 * Update a business
 */
const updateBusiness = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      businessName, 
      businessTypeId, 
      streetAddress, 
      city, 
      state, 
      zipCode, 
      country, 
      phone, 
      website,
      logoURL,
      isActive 
    } = req.body;
    
    // Check if user is authorized to update this business
    const business = await businessService.getBusinessById(id);
    
    if (!business) {
      return next(createError('Business not found', 404));
    }
    
    const isOwner = business.userId === req.user.userId;
    const isAdmin = req.user.roles.includes('Admin');
    
    if (!isOwner && !isAdmin) {
      return next(createError('Not authorized to update this business', 403));
    }
    
    const updatedBusiness = await businessService.updateBusiness(id, {
      businessName,
      businessTypeId,
      streetAddress,
      city,
      state,
      zipCode,
      country,
      phone,
      website,
      logoURL,
      isActive: isAdmin ? isActive : business.isActive // Only admin can change active status
    });
    
    res.status(200).json({ message: 'Business updated successfully', business: updatedBusiness });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Create a new business sector (admin only)
 */
const createSector = async (req, res, next) => {
  try {
    const { businessSectorName, isExternal, other } = req.body;
    
    const sector = await businessService.createSector({
      businessSectorName,
      isExternal: isExternal || false,
      other: other || null
    });
    
    res.status(201).json({ message: 'Business sector created successfully', sector });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a business sector (admin only)
 */
const updateSector = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { businessSectorName, isExternal, other } = req.body;
    
    const updatedSector = await businessService.updateSector(id, {
      businessSectorName,
      isExternal,
      other
    });
    
    res.status(200).json({ message: 'Business sector updated successfully', sector: updatedSector });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Create a new business type (admin only)
 */
const createType = async (req, res, next) => {
  try {
    const { businessType, businessSectorId, isDefault, isExternal } = req.body;
    
    const type = await businessService.createType({
      businessType,
      businessSectorId,
      isDefault: isDefault || true,
      isExternal: isExternal || false
    });
    
    res.status(201).json({ message: 'Business type created successfully', type });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

/**
 * Update a business type (admin only)
 */
const updateType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { businessType, businessSectorId, isDefault, isExternal } = req.body;
    
    const updatedType = await businessService.updateType(id, {
      businessType,
      businessSectorId,
      isDefault,
      isExternal
    });
    
    res.status(200).json({ message: 'Business type updated successfully', type: updatedType });
  } catch (error) {
    next(createError(error.message, 400, error));
  }
};

module.exports = {
  getAllSectors,
  getSectorById,
  getAllTypes,
  getTypesBySector,
  getTypeById,
  getUserBusinesses,
  createBusiness,
  getBusinessById,
  updateBusiness,
  createSector,
  updateSector,
  createType,
  updateType
};