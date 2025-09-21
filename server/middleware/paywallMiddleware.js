const {Hostel} = require('../models');

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
    const now = new Date();
    const isTrialActive = hostel.trial_end && now < hostel.trial_end;
    const isSubscriptionActive = ['active','trialing'].includes(hostel.subscription_status);
    if(!isTrialActive && !isSubscriptionActive) {
        return res.status(402).json({message: 'Subscription requires to access this feature',
        paywall: true,
        subscription_status: hostel.subscription_status,
        trial_end: hostel.trial_end,
        })
    }
        // check plan limits if needed 
        req.hostelSubscription = {
            status: hostel.subscription_status,
            planId: hostel.plan_id,
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