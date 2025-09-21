"use client";
import React from "react";
import { useBilling } from "@/hooks/useBilling";
import { Button } from "../ui/Button";
import {Card,CardContent,CardHeader} from '@/components/ui/Card';
import {useRouter} from 'next/navigation';

interface PaywallGuardProps {
    children:React.ReactNode;
    feature?:string;

}
export const PaywallGuard: React.FC<PaywallGuardProps> = ({ children, feature }) => {
    const { subscriptionStatus, loading } = useBilling();
    const router = useRouter();

    if (loading) {
        return <div>Loading...</div>;
    }

    const now = new Date();
    const isTrialActive = subscriptionStatus?.trial_end && now < new Date(subscriptionStatus.trial_end);
    const isSubscriptionActive = ['active', 'trialing'].includes(subscriptionStatus?.subscription_status || '');

    if (!isTrialActive && !isSubscriptionActive) {
        return (
            <Card className="max-w-md mx-auto mt-8">
                <CardHeader>
                    <h3>Subscription Required</h3>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">
                        {feature ? `The ${feature} feature` : 'This feature'} requires an active subscription.
                    </p>
                    <Button onClick={() => router.push('/dashboard/billing')} className="w-full">
                        View Subscription Plans
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
};