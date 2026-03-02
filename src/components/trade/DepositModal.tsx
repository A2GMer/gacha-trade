"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { AlertTriangle, CreditCard, ShieldCheck } from "lucide-react";

// Initialize Stripe (use the test key from env if available)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_sample");

interface DepositModalProps {
    tradeId: string;
    userId: string;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

const CheckoutForm = ({ tradeId, userId, onSuccess, onCancel }: DepositModalProps) => {
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

        // 1. Authorize Stripe through our API
        try {
            const res = await fetch("/api/deposit/authorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tradeId, userId }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to authorize deposit.");
            }

            const clientSecret = data.clientSecret;
            const paymentIntentId = data.paymentIntentId;

            // 2. Confirm the payment with Stripe Elements
            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    // This prevents Stripe from redirecting, so we can handle success on the client
                    return_url: window.location.href,
                },
                redirect: "if_required",
            });

            if (confirmError) {
                setError(confirmError.message || "支払い処理に失敗しました。");
            } else {
                onSuccess(paymentIntentId);
            }
        } catch (err: any) {
            setError(err.message || "予期せぬエラーが発生しました。");
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
                    キャンセル
                </button>
                <button
                    disabled={isLoading || !stripe || !elements}
                    className="btn btn-primary flex-1 py-3 text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>処理中...</>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4" />
                            同意してデポジット（300円）
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export const DepositModal = (props: DepositModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up-sm border border-border">
                <div className="p-5 border-b border-border text-center relative">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">デポジット（一時預かり金）</h2>
                    <p className="text-xs text-muted mt-2">
                        安全な取引のため、一時的に300円の与信枠を確保します。
                    </p>
                </div>

                <div className="p-5 bg-surface/50 text-sm space-y-3">
                    <p>このデポジットは<strong>取引が正常に完了した際に全額解放（返金）</strong>されます。</p>
                    <ul className="list-disc pl-5 text-muted text-xs space-y-1">
                        <li>商品が発送されないなど、悪質な行為があった場合には違約金として没収されます</li>
                        <li>現在決済はされず、カードの枠のみを確保します（Auth Hold）</li>
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
                                    colorPrimary: '#2563eb', // primary color
                                    colorBackground: '#ffffff',
                                    colorText: '#1f2937',
                                    colorDanger: '#ef4444',
                                    fontFamily: 'system-ui, sans-serif',
                                    spacingUnit: '4px',
                                    borderRadius: '8px',
                                }
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
