const express = require('express');
const router = express.Router();
const { 
  registerOwner, 
  registerUser, 
  loginUser, 
  getCurrentUser,
  getUserHostels, 
  setActiveHostel 
} = require('../controllers/authController');
const { verifyToken, requireAuth } = require('../middleware/authMiddleware');
const User = require('../models/user');

// Public endpoints
router.post('/register-owner', registerOwner);
router.post('/register-user', verifyToken, registerUser);
router.post('/login', loginUser);

// Protected endpoints
router.get('/hostels', verifyToken, getUserHostels);
router.post('/set-active-hostel', verifyToken, setActiveHostel);

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Prevent using the default password
    if (newPassword === '123456') {
      return res.status(400).json({ 
        message: 'Cannot use the default password (123456)' 
      });
    }

    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and set requiresPasswordChange to false
    await User.update(
      { 
        password: hashedPassword, 
        requiresPasswordChange: false 
      },
      { where: { id: userId } }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;
