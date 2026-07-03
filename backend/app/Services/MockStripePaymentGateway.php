<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Str;

/**
 * 自動テスト(testing環境)専用のモック実装。実際のAPI通信は行わない。
 * payment_method_idに "decline" または "fail" が含まれる場合のみ失敗させる
 * （Stripeのテスト用カード命名規則を模したルール）。
 * 開発・本番環境では StripePaymentGateway が使われる（AppServiceProvider参照）。
 */
class MockStripePaymentGateway implements PaymentGatewayInterface
{
    public function charge(Order $order, string $paymentMethodId): array
    {
        $normalized = strtolower($paymentMethodId);
        $declined = str_contains($normalized, 'decline') || str_contains($normalized, 'fail');

        return [
            'succeeded' => ! $declined,
            'stripe_payment_id' => 'mock_'.Str::uuid(),
            'decline_code' => $declined ? 'generic_decline' : '',
        ];
    }
}
