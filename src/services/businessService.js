const db = require('../config/db');
const { createError } = require('../utils/errorUtils');

/**
 * Get all business sectors
 * @returns {Promise<Array>} Business sectors
 */
const getAllSectors = async () => {
  try {
    const sectors = await db.query(
      `SELECT * FROM business_sector 
       ORDER BY business_sector_name`
    );
    
    return sectors;
  } catch (error) {
    throw createError(`Error getting business sectors: ${error.message}`, 500, error);
  }
};

/**
 * Get business sector by ID
 * @param {string|number} id - Sector ID
 * @returns {Promise<Object|null>} Sector object or null if not found
 */
const getSectorById = async (id) => {
  try {
    const result = await db.query(
      'SELECT * FROM business_sector WHERE id = $1',
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting business sector: ${error.message}`, 500, error);
  }
};

/**
 * Get all business types
 * @returns {Promise<Array>} Business types
 */
const getAllTypes = async () => {
  try {
    const types = await db.query(
      `SELECT bt.*, bs.business_sector_name
       FROM business_types bt
       JOIN business_sector bs ON bt.business_sector_id = bs.id
       ORDER BY bt.business_type`
    );
    
    return types;
  } catch (error) {
    throw createError(`Error getting business types: ${error.message}`, 500, error);
  }
};

/**
 * Get business types by sector
 * @param {string|number} sectorId - Sector ID
 * @returns {Promise<Array>} Business types
 */
const getTypesBySector = async (sectorId) => {
  try {
    const types = await db.query(
      `SELECT bt.*, bs.business_sector_name
       FROM business_types bt
       JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE bt.business_sector_id = $1
       ORDER BY bt.business_type`,
      { sectorId: parseInt(sectorId) }
    );
    
    return types;
  } catch (error) {
    throw createError(`Error getting business types by sector: ${error.message}`, 500, error);
  }
};

/**
 * Get business type by ID
 * @param {string|number} id - Type ID
 * @returns {Promise<Object|null>} Type object or null if not found
 */
const getTypeById = async (id) => {
  try {
    const result = await db.query(
      `SELECT bt.*, bs.business_sector_name
       FROM business_types bt
       JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE bt.id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting business type: ${error.message}`, 500, error);
  }
};

/**
 * Get businesses owned by a user
 * @param {string|number} userId - User ID
 * @returns {Promise<Array>} Businesses
 */
const getUserBusinesses = async (userId) => {
  try {
    const businesses = await db.query(
      `SELECT b.*, bt.business_type, bt.business_sector_id, bs.business_sector_name
       FROM businesses b
       LEFT JOIN business_types bt ON b.business_type_id = bt.id
       LEFT JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE b.user_id = $1
       ORDER BY b.business_name`,
      { userId: parseInt(userId) }
    );
    
    return businesses;
  } catch (error) {
    throw createError(`Error getting user businesses: ${error.message}`, 500, error);
  }
};

/**
 * Get business by ID
 * @param {string|number} id - Business ID
 * @returns {Promise<Object|null>} Business object or null if not found
 */
const getBusinessById = async (id) => {
  try {
    const result = await db.query(
      `SELECT b.*, bt.business_type, bt.business_sector_id, bs.business_sector_name
       FROM businesses b
       LEFT JOIN business_types bt ON b.business_type_id = bt.id
       LEFT JOIN business_sector bs ON bt.business_sector_id = bs.id
       WHERE b.id = $1`,
      { id: parseInt(id) }
    );
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    throw createError(`Error getting business: ${error.message}`, 500, error);
  }
};

/**
 * Create a new business
 * @param {Object} businessData - Business data
 * @returns {Promise<Object>} Created business
 */
const createBusiness = async (businessData) => {
  try {
    const {
      userId,
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
      isActive,
      isVerified
    } = businessData;
    
    const now = new Date().toISOString();
    
    const result = await db.query(
      `INSERT INTO businesses (
        user_id, business_name, place_id, business_type_id,
        street_address, city, state, zip_code, country,
        phone, website, logo_url, is_active, is_verified,
        date_created, last_updated
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15
      ) RETURNING id`,
      {
        userId: parseInt(userId),
        businessName,
        placeId: placeId || null,
        businessTypeId: businessTypeId ? parseInt(businessTypeId) : null,
        streetAddress: streetAddress || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        country: country || '',
        phone: phone || '',
        website: website || '',
        logoURL: logoURL || '',
        isActive: isActive !== undefined ? isActive : true,
        isVerified: isVerified !== undefined ? isVerified : false,
        now
      }
    );
    
    const businessId = result[0].id;
    
    return await getBusinessById(businessId);
  } catch (error) {
    throw createError(`Error creating business: ${error.message}`, 500, error);
  }
};

/**
 * Update a business
 * @param {string|number} id - Business ID
 * @param {Object} businessData - Business data to update
 * @returns {Promise<Object>} Updated business
 */
const updateBusiness = async (id, businessData) => {
  try {
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
    } = businessData;
    
    // Build update fields
    const updateFields = {};
    if (businessName !== undefined) updateFields.businessName = businessName;
    if (businessTypeId !== undefined) updateFields.businessTypeId = parseInt(businessTypeId);
    if (streetAddress !== undefined) updateFields.streetAddress = streetAddress;
    if (city !== undefined) updateFields.city = city;
    if (state !== undefined) updateFields.state = state;
    if (zipCode !== undefined) updateFields.zipCode = zipCode;
    if (country !== undefined) updateFields.country = country;
    if (phone !== undefined) updateFields.phone = phone;
    if (website !== undefined) updateFields.website = website;
    if (logoURL !== undefined) updateFields.logoURL = logoURL;
    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // Add last updated timestamp
    updateFields.lastUpdated = new Date().toISOString();
    
    // Build query dynamically
    const setClauses = Object.keys(updateFields).map((key, index) => {
      // Convert camelCase to snake_case for PostgreSQL
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${snakeKey} = $${index + 2}`;
    });
    
    if (setClauses.length === 0) {
      return await getBusinessById(id);
    }
    
    const query = `
      UPDATE businesses
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING id
    `;
    
    // Execute update query
    await db.query(
      query,
      { 
        id: parseInt(id), 
        ...Object.values(updateFields)
      }
    );
    
    return await getBusinessById(id);
  } catch (error) {
    throw createError(`Error updating business: ${error.message}`, 500, error);
  }
};

/**
 * Create a new business sector
 * @param {Object} sectorData - Sector data
 * @returns {Promise<Object>} Created sector
 */
const createSector = async (sectorData) => {
  try {
    const {
      businessSectorName,
      isExternal,
      other
    } = sectorData;
    
    const now = new Date().toISOString();
    const result = await db.query(
        `INSERT INTO business_sector (
          business_sector_name, is_external, other, date_created
        ) VALUES ($1, $2, $3, $4)
        RETURNING id`,
        {
          businessSectorName,
          isExternal: isExternal || false,
          other: other || null,
          dateCreated: now
        }
      );
      
      const sectorId = result[0].id;
      
      return await getSectorById(sectorId);
    } catch (error) {
      throw createError(`Error creating business sector: ${error.message}`, 500, error);
    }
  };
  
  /**
   * Update a business sector
   * @param {string|number} id - Sector ID
   * @param {Object} sectorData - Sector data to update
   * @returns {Promise<Object>} Updated sector
   */
  const updateSector = async (id, sectorData) => {
    try {
      const {
        businessSectorName,
        isExternal,
        other
      } = sectorData;
      
      await db.query(
        `UPDATE business_sector
         SET business_sector_name = $1,
             is_external = $2,
             other = $3
         WHERE id = $4`,
        {
          businessSectorName,
          isExternal,
          other,
          id: parseInt(id)
        }
      );
      
      return await getSectorById(id);
    } catch (error) {
      throw createError(`Error updating business sector: ${error.message}`, 500, error);
    }
  };
  
  /**
   * Create a new business type
   * @param {Object} typeData - Type data
   * @returns {Promise<Object>} Created type
   */
  const createType = async (typeData) => {
    try {
      const {
        businessType,
        businessSectorId,
        isDefault,
        isExternal
      } = typeData;
      
      const now = new Date().toISOString();
      
      const result = await db.query(
        `INSERT INTO business_types (
          business_type, business_sector_id, is_default, is_external, date_created
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        {
          businessType,
          businessSectorId: parseInt(businessSectorId),
          isDefault: isDefault !== undefined ? isDefault : true,
          isExternal: isExternal !== undefined ? isExternal : false,
          dateCreated: now
        }
      );
      
      const typeId = result[0].id;
      
      return await getTypeById(typeId);
    } catch (error) {
      throw createError(`Error creating business type: ${error.message}`, 500, error);
    }
  };
  
  /**
   * Update a business type
   * @param {string|number} id - Type ID
   * @param {Object} typeData - Type data to update
   * @returns {Promise<Object>} Updated type
   */
  const updateType = async (id, typeData) => {
    try {
      const {
        businessType,
        businessSectorId,
        isDefault,
        isExternal
      } = typeData;
      
      await db.query(
        `UPDATE business_types
         SET business_type = $1,
             business_sector_id = $2,
             is_default = $3,
             is_external = $4
         WHERE id = $5`,
        {
          businessType,
          businessSectorId: parseInt(businessSectorId),
          isDefault,
          isExternal,
          id: parseInt(id)
        }
      );
      
      return await getTypeById(id);
    } catch (error) {
      throw createError(`Error updating business type: ${error.message}`, 500, error);
    }
  };
  
  module.exports = {
    getAllSectors,
    getSectorById,
    getAllTypes,
    getTypesBySector,
    getTypeById,
    getUserBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
    createSector,
    updateSector,
    createType,
    updateType
  };