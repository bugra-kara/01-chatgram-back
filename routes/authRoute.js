const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authentication');

const {login, register, logout, verifyEmail, forgotPassword, resetPassword} = require('../controllers/authenticationController');

router.post('/login', login)
router.post('/register', register)
router.delete('/logout', auth, logout)
router.post('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
module.exports = router