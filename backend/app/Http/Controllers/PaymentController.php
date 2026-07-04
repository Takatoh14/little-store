<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentStoreRequest;
use App\Mail\OrderConfirmationMail;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService)
    {
    }

    public function store(PaymentStoreRequest $request): JsonResponse
    {
        $order = Order::findOrFail($request->order_id);

        if ($order->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'この注文は決済できません'], 422);
        }

        $result = $this->paymentService->charge($order, $request->payment_method_id);

        if ($result['succeeded']) {
            Payment::create([
                'order_id' => $order->id,
                'stripe_payment_id' => $result['stripe_payment_id'],
                'status' => 'succeeded',
            ]);

            $order->update(['status' => 'paid']);

            Mail::to($order->user->email)->send(new OrderConfirmationMail($order->load('orderItems')));

            return response()->json(['status' => 'succeeded', 'order_id' => $order->id], 200);
        }

        Payment::create([
            'order_id' => $order->id,
            'stripe_payment_id' => $result['stripe_payment_id'],
            'status' => 'failed',
        ]);

        return response()->json([
            'message' => 'カード決済に失敗しました',
            'decline_code' => $result['decline_code'],
        ], 402);
    }
}
