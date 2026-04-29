const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/profile', protect, authController.getUserProfile);
router.put('/profile', protect, authController.updateUserProfile);
router.delete('/profile', protect, authController.deleteUserProfile);
router.get('/users', protect, authorize('admin'), authController.getUsers);
router.delete('/users/:id', protect, authorize('admin'), authController.deleteUser);

module.exports = router;