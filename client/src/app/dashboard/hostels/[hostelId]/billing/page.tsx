"use client";
import React, { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { redirect } from "next/navigation";
import { useBilling } from "@/hooks/useBilling";
import { useStripe } from "@/contexts/StripeContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PRICING_PLANS } from "@/config/pricing";
import { useSearchParams } from "next/navigation";

export default function BillingPage() {
  return <BillingPageClient />;
}

function BillingPageClient() {
  const { user } = useAuth();
  const { hasPermission, loading } = usePermissions();
  const {
    subscriptionStatus,
    createCheckoutSession,
    cancelSubscription,
    cancelSubscriptionNow,
    refetchStatus,
    resumeSubscription,
  } = useBilling();
  const { stripePromise } = useStripe();
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams?.get("plan");

  const activePlan = subscriptionStatus?.plan_id;
  const preselectedPlanId = useMemo(() => {
    return (
      selectedPlanId ||
      (activePlan === "basic"
        ? "basic"
        : activePlan === "pro"
        ? "pro"
        : undefined)
    );
  }, [selectedPlanId, activePlan]);

  if (loading) {
    return <div className="p-8 text-gray-600">Loading billing...</div>;
  }

  if (!user) {
    redirect("/login");
    return null;
  }

  if (!hasPermission("view_billing")) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            You do not have permission to view billing information.
          </p>
        </div>
      </div>
    );
  }

  const handleSubscribe = async (
    priceId: string,
    planId: string,
    opts?: { isTrial?: boolean }
  ) => {
    try {
      const sessionId = await createCheckoutSession(priceId, planId, {
        isTrial: opts?.isTrial === true,
      });
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      if (error) console.error("Stripe redirect error:", error);
    } catch (error) {
      console.error("Subscribe error:", error);
    }
  };
  const handleCancelNow = async () => {
    try {
      await cancelSubscriptionNow();
      await refetchStatus();
    } catch (e) {
      console.error("Cancel now error:", e);
    }
  };
  const handleCancel = async () => {
    try {
      await cancelSubscription();
      await refetchStatus();
    } catch (e) {
      console.error("Cancel error:", e);
    }
  };
  const handleResume = async () => {
    try {
      await resumeSubscription();
      await refetchStatus();
    } catch (e) {
      console.error("Resume error:", e);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Choose a plan to activate your account.
        </p>
      </header>

      {/* Free plan banner or trial notice */}
      {(!subscriptionStatus?.plan_id ||
        subscriptionStatus?.plan_id === "free") && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <p className="font-medium">You are on the Free plan</p>
          <p className="mt-1">
            Limits: 10 rooms, 20 students, 1 warden, no
            visitors/complaints/staff, 1 max hostel.
          </p>
          <p className="mt-1">
            Upgrade to Basic Pro or Enterprise to unlock more capacity and
            features.
          </p>
        </div>
      )}

      {subscriptionStatus?.subscription_status === "trialing" && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <p className="font-medium">Trial active</p>
          <p className="mt-1">
            {subscriptionStatus?.trial_end
              ? `Your trial ends on ${new Date(
                  subscriptionStatus.trial_end
                ).toLocaleString()}.`
              : "Trial is active. Billing will start after the trial period."}
          </p>
          <p className="mt-1">
            During trial, limits are reduced compared to the full Basic plan.
          </p>
          <div className="mt-2">
            <Button variant="outline" onClick={handleCancelNow}>
              Cancel trial now
            </Button>
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {subscriptionStatus?.subscription_status === "canceled" && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {subscriptionStatus?.current_period_end
              ? `Subscription will end on ${new Date(
                  subscriptionStatus.current_period_end
                ).toLocaleString()}`
              : "Subscription cancellation scheduled. End date is being confirmed."}
          </p>
          <p className="mt-1">
            You have access until the end of the current billing period. You
            can resume before it ends.
          </p>
          <div className="mt-2">
            <Button variant="outline" onClick={handleResume}>
              Resume subscription
            </Button>
          </div>
        </div>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <h3>Current Subscription</h3>
        </CardHeader>
        <CardContent>
          <p>
            Status:{" "}
            {subscriptionStatus?.subscription_status || "No subscription"}
          </p>
          <p>Plan: {subscriptionStatus?.plan_id || "None"}</p>
          {subscriptionStatus?.current_period_start && (
            <p>
              Current period start:{" "}
              {new Date(
                subscriptionStatus.current_period_start
              ).toLocaleDateString()}
            </p>
          )}
          {subscriptionStatus?.current_period_end && (
            <p>
              Current period end:{" "}
              {new Date(
                subscriptionStatus.current_period_end
              ).toLocaleDateString()}
            </p>
          )}
          {subscriptionStatus?.trial_end && (
            <p>
              Trial ends:{" "}
              {new Date(subscriptionStatus.trial_end).toLocaleDateString()}
            </p>
          )}
          {subscriptionStatus?.stripe_subscription_id &&
            subscriptionStatus?.subscription_status !== 'canceled' && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel at period end
              </Button>
            </div>
          )}
          {subscriptionStatus?.subscription_status === "active" && (
            <p className="text-sm text-gray-500 mt-2">
              You have an active subscription.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trial CTA (collect card, no charge until after 14 days) */}
      {!["active", "trialing", "canceled"].includes(
        subscriptionStatus?.subscription_status || ""
      ) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <h3 className="text-amber-900">Start a 14‑day free trial</h3>
          </CardHeader>
          <CardContent>
            <p className="text-amber-900 mb-3 text-sm">
              We'll ask for your card now, but you won't be charged until your
              trial ends. Cancel anytime.
            </p>
            <Button
              className="w-full"
              onClick={() =>
                handleSubscribe(
                  PRICING_PLANS.find((p) => p.id === "basic")!
                    .stripePriceIdMonthly,
                  "basic",
                  { isTrial: true }
                )
              }
            >
              Start free trial (Basic)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {PRICING_PLANS.map((plan) => {
          const isCurrent =
            subscriptionStatus?.subscription_status === "active" &&
            subscriptionStatus?.plan_id === plan.id;
          return (
            <Card
              key={plan.id}
              className={
                preselectedPlanId === plan.id ? "ring-2 ring-blue-500" : ""
              }
            >
              <CardHeader>
                <h3>{plan.name}</h3>
                <p className="text-2xl font-bold">${plan.priceMonthly}/month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      handleSubscribe(plan.stripePriceIdMonthly, plan.id, {
                        isTrial: false,
                      })
                    }
                    className="w-full"
                  >
                    {subscriptionStatus?.subscription_status === "active"
                      ? "Switch to "
                      : "Subscribe to "}{" "}
                    {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
