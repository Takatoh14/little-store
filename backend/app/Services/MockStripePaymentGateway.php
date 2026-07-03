<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Str;

/**
 * Stripeのテスト用APIキーが未取得のため、実際のAPI通信を行わないモック実装。
 * payment_method_idに "decline" または "fail" が含まれる場合のみ失敗させる
 * （Stripeのテスト用カード命名規則を模したルール）。
 * 本番のStripe連携に差し替える際は PaymentGatewayInterface の別実装を
 * AppServiceProvider でバインドし直すだけでよい。
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
        ];
    }
}
