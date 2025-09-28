const {Hostel} = require('../models');
const { normalizePlanId } = require('../utils/billingUtils');

const checkSubscription = async (req,res,next) => {
    try {
    if (req.user.role === 'superadmin') {
        return next();
    }
    const hostelId = req.user.hostelId;
    if(!hostelId) {
        return res.status(403).json({message: "Access denied: No associated hostel", paywall: true});
    }
    const hostel = await Hostel.findByPk(hostelId);
    if (!hostel) {
        return res.status(403).json({message: "Hostel not found"})
    }
    //check subscription status
    const nowTs = Date.now();
    const isTrialActive = hostel.trial_end && nowTs < new Date(hostel.trial_end).getTime();
    const isSubscriptionActive = ['active','trialing'].includes(hostel.subscription_status);
    const isCanceledButInGrace = hostel.subscription_status === 'canceled' && hostel.current_period_end && nowTs < new Date(hostel.current_period_end).getTime();
    if(!isTrialActive && !isSubscriptionActive && !isCanceledButInGrace) {
        return res.status(402).json({message: 'Subscription requires to access this feature',
        paywall: true,
        subscription_status: hostel.subscription_status,
        trial_end: hostel.trial_end,
        })
    }
        // check plan limits if needed 
        req.hostelSubscription = {
            status: hostel.subscription_status,
            planId: normalizePlanId(hostel.plan_id) || hostel.plan_id,
            trialEnd: hostel.trial_end,
            currentPeriodEnd: hostel.current_period_end,
        };
        next();
    } catch (error) {
        console.error("Error in paywall middleware:", error);
        res.status(500).json({ message: "Subscription Check Failed in middleware" });
    }
}
module.exports = {checkSubscription}