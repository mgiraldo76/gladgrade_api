const express = require('express');
const businessController = require('../controllers/businessController');
const { checkRole } = require('../middleware/auth');

const router = express.Router();

// Business sectors (public read)
router.get('/sectors', businessController.getAllSectors);
router.get('/sectors/:id', businessController.getSectorById);

// Business types by sector (public read)
router.get('/types', businessController.getAllTypes);
router.get('/types/by-sector/:sectorId', businessController.getTypesBySector);
router.get('/types/:id', businessController.getTypeById);

// Business management routes (for client users)
router.get('/my-businesses', businessController.getUserBusinesses);
router.post('/businesses', checkRole(['Client', 'Client Admin', 'Admin']), businessController.createBusiness);
router.get('/businesses/:id', businessController.getBusinessById);
router.put('/businesses/:id', businessController.updateBusiness);

// Admin routes for business data
router.post('/sectors', checkRole(['Admin']), businessController.createSector);
router.put('/sectors/:id', checkRole(['Admin']), businessController.updateSector);
router.post('/types', checkRole(['Admin']), businessController.createType);
router.put('/types/:id', checkRole(['Admin']), businessController.updateType);

module.exports = router;