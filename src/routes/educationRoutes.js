const express = require('express');
const educationController = require('../controllers/educationController');
const { checkRole } = require('../middleware/auth');

const router = express.Router();

// Areas
router.get('/areas', educationController.getAllAreas);
router.get('/areas/:id', educationController.getAreaById);

// Locations
router.get('/locations', educationController.getAllLocations);
router.get('/locations/by-area/:areaId', educationController.getLocationsByArea);
router.get('/locations/:id', educationController.getLocationById);

// Dorms
router.get('/dorms', educationController.getAllDorms);
router.get('/dorms/by-location/:locationId', educationController.getDormsByLocation);
router.get('/dorms/:id', educationController.getDormById);

// Professors
router.get('/professors', educationController.getAllProfessors);
router.get('/professors/by-department/:departmentId', educationController.getProfessorsByDepartment);
router.get('/professors/:id', educationController.getProfessorById);
router.get('/professors/:id/courses', educationController.getProfessorCourses);

// Departments and class codes
router.get('/departments', educationController.getAllDepartments);
router.get('/class-codes', educationController.getAllClassCodes);
router.get('/class-codes/by-department/:departmentId', educationController.getClassCodesByDepartment);

// Internet/Security/Social
router.get('/internet', educationController.getAllInternet);
router.get('/security', educationController.getAllSecurity);
router.get('/social', educationController.getAllSocial);

// Admin routes for managing education data
router.post('/areas', checkRole(['Admin']), educationController.createArea);
router.put('/areas/:id', checkRole(['Admin']), educationController.updateArea);
router.post('/locations', checkRole(['Admin']), educationController.createLocation);
router.put('/locations/:id', checkRole(['Admin']), educationController.updateLocation);
// Additional admin routes for other educational entities...

module.exports = router;