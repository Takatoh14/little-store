<?php

namespace App\Services;

use App\Models\Order;
use Stripe\Exception\CardException;
use Stripe\StripeClient;

class StripePaymentGateway implements PaymentGatewayInterface
{
    /**
     * @return array{succeeded: bool, stripe_payment_id: string, decline_code: string}
     */
    public function charge(Order $order, string $paymentMethodId): array
    {
        $client = new StripeClient(config('services.stripe.secret'));

        try {
            // JPYはStripe上でゼロ小数通貨のため、amountは円の整数値をそのまま渡す。
            $paymentIntent = $client->paymentIntents->create([
                'amount' => $order->total_price,
                'currency' => 'jpy',
                'payment_method' => $paymentMethodId,
                'payment_method_types' => ['card'],
                'confirm' => true,
            ]);

            return [
                'succeeded' => $paymentIntent->status === 'succeeded',
                'stripe_payment_id' => $paymentIntent->id,
                'decline_code' => '',
            ];
        } catch (CardException $e) {
            return [
                'succeeded' => false,
                'stripe_payment_id' => $e->getStripeCode() ?? 'unknown',
                'decline_code' => $e->getDeclineCode() ?? 'card_declined',
            ];
        }
    }
}
