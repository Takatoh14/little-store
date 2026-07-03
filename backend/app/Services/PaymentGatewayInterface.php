<?php

namespace App\Services;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * @return array{succeeded: bool, stripe_payment_id: string, decline_code: string}
     */
    public function charge(Order $order, string $paymentMethodId): array;
}
