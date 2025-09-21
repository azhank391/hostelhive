const express = require('express');
const router = express.Router();
const {verifyToken,requireAuth} = require ('../middleware/authMiddleware');
const {checkSubscription} = require('../middleware/paywallMiddleware');
const billingController = require('../controllers/billingController')

// Routes for billing and subscription management
router.post('/create-checkout-session',verifyToken,requireAuth,billingController.createCheckoutSession);
router.get('/subscription-status',verifyToken,requireAuth,billingController.getSubscriptionStatus);

module.exports = router;