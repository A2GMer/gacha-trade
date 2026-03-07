"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { AlertTriangle, CreditCard, ShieldCheck } from "lucide-react";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface DepositModalProps {
    tradeId: string;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

const CheckoutForm = ({ tradeId, onSuccess, onCancel }: DepositModalProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || "An error occurred");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/deposit/authorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tradeId }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to authorize deposit.");
            }

            const clientSecret = data.clientSecret;
            const paymentIntentId = data.paymentIntentId;

            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: window.location.href,
                },
                redirect: "if_required",
            });

            if (confirmError) {
                setError(confirmError.message || "Failed to confirm payment.");
            } else {
                onSuccess(paymentIntentId);
            }
        } catch (requestError: unknown) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "An unexpected error occurred.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error && (
                <div className="bg-danger/10 text-danger text-sm p-3 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="btn bg-surface border border-border flex-1 py-3 text-sm disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    disabled={isLoading || !stripe || !elements}
                    className="btn btn-primary flex-1 py-3 text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4" />
                            Authorize JPY 300
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export const DepositModal = (props: DepositModalProps) => {
    if (!stripePromise) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-6 space-y-3">
                    <h2 className="text-lg font-bold">Stripe is not configured</h2>
                    <p className="text-sm text-muted">
                        `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is missing. Contact the administrator.
                    </p>
                    <button onClick={props.onCancel} className="btn bg-surface border border-border w-full py-2.5">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up-sm border border-border">
                <div className="p-5 border-b border-border text-center relative">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">Deposit authorization</h2>
                    <p className="text-xs text-muted mt-2">
                        JPY 300 is held temporarily and captured only if there is a dispute.
                    </p>
                </div>

                <div className="p-5 bg-surface/50 text-sm space-y-3">
                    <p>
                        This amount is an authorization hold, not an immediate charge.
                    </p>
                    <ul className="list-disc pl-5 text-muted text-xs space-y-1">
                        <li>If the trade completes normally, the hold is released.</li>
                        <li>If fraud or severe policy violation is confirmed, the hold can be captured.</li>
                    </ul>
                </div>

                <div className="p-5">
                    <Elements
                        stripe={stripePromise}
                        options={{
                            mode: "payment",
                            amount: 300,
                            currency: "jpy",
                            paymentMethodCreation: "manual",
                            appearance: {
                                theme: "stripe",
                                variables: {
                                    colorPrimary: "#2563eb",
                                    colorBackground: "#ffffff",
                                    colorText: "#1f2937",
                                    colorDanger: "#ef4444",
                                    fontFamily: "system-ui, sans-serif",
                                    spacingUnit: "4px",
                                    borderRadius: "8px",
                                },
                            },
                        }}
                    >
                        <CheckoutForm {...props} />
                    </Elements>
                </div>
            </div>
        </div>
    );
};
