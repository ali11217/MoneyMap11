const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { sendVerificationEmail, sendTempPasswordEmail } = require('../utils/emailService');
const authController = require('../controllers/authController');
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4);
};

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('Generated token:', verificationToken); // Debug log

    // Hash token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    console.log('Hashed token for storage:', hashedToken); // Debug log

    user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      verificationToken: hashedToken,
      verificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    await user.save();
    console.log('User saved with verification token'); // Debug log

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);
    console.log('Verification email sent'); // Debug log

    res.json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      debug: process.env.NODE_ENV === 'development' ? { verificationToken } : undefined
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Server error during registration',
      error: err.message 
    });
  }
});

// @route   GET api/auth/verify-email/:token
// @desc    Verify email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    console.log('Received verification token:', req.params.token);

    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      // Check if user is already verified
      const verifiedUser = await User.findOne({
        isVerified: true,
        verificationToken: undefined
      });

      if (verifiedUser) {
        return res.json({
          success: true,
          message: 'Email already verified. You can now login.'
        });
      }

      return res.status(400).json({
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({
      message: 'Server error during verification'
    });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], authController.login);

// @route   POST api/auth/forgot-password
// @desc    Send temporary password
// @access  Public
router.post('/forgot-password', [
  check('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user || !user.isVerified) {
      return res.json({ message: 'If a verified account exists, a temporary password will be sent.' });
    }

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    await sendTempPasswordEmail(user.email, tempPassword);
    res.json({ message: 'If a verified account exists, a temporary password will be sent.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 