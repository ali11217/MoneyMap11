const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Create a controller object to store all our functions
const settingsController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Server Error' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, email, phone, salary, preferences } = req.body;
      
      // Ensure salary and currency are both updated
      const updateData = {
        name,
        email,
        phone,
        salary: parseFloat(salary) || 0,
        preferences: {
          ...preferences,
          currency: preferences.currency // Ensure currency is saved
        }
      };

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ error: 'Failed to update profile', details: err.message });
    }
  },

  // Update password
  updatePassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();
      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update preferences
  updatePreferences: async (req, res) => {
    const { currency, emailNotifications, monthlyReport, lowBalanceAlert, goalReminders } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      user.preferences = {
        currency: currency || user.preferences.currency,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : user.preferences.emailNotifications,
        monthlyReport: monthlyReport !== undefined ? monthlyReport : user.preferences.monthlyReport,
        lowBalanceAlert: lowBalanceAlert !== undefined ? lowBalanceAlert : user.preferences.lowBalanceAlert,
        goalReminders: goalReminders !== undefined ? goalReminders : user.preferences.goalReminders
      };

      await user.save();
      
      const updatedUser = await User.findById(req.user.id).select('-password');
      res.json(updatedUser);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update profile picture
  updateProfilePicture: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Received file:', req.file);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
      const fullUrl = `http://localhost:8080${profilePicturePath}`;
      
      console.log('Updating profile picture to:', fullUrl);

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { profilePicture: fullUrl } },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Updated user with new profile picture:', updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ error: 'Failed to update profile picture' });
    }
  }
};

// Make sure all functions are properly exported
module.exports = settingsController;