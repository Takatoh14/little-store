<?php

namespace App\Services;

use App\Models\Order;

class PaymentService
{
    public function __construct(private readonly PaymentGatewayInterface $gateway)
    {
    }

    /**
     * @return array{succeeded: bool, stripe_payment_id: string}
     */
    public function charge(Order $order, string $paymentMethodId): array
    {
        return $this->gateway->charge($order, $paymentMethodId);
    }
}
