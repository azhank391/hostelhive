"use client";
import React, { createContext, useContext } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
const StripeContext = createContext<any>(null);

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error("useStripe must be used within a StripeProvider");
  }
  return context;
};

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <StripeContext.Provider value={{ stripePromise }}>
      {children}
    </StripeContext.Provider>
  );
};
