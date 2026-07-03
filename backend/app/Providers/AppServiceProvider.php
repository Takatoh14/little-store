<?php

namespace App\Providers;

use App\Services\MockStripePaymentGateway;
use App\Services\PaymentGatewayInterface;
use App\Services\StripePaymentGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // testing環境(PHPUnit)では実際のStripe APIへ通信しないようモックを使う。
        // それ以外(local/production)では実際のStripe APIを呼び出す。
        $this->app->bind(PaymentGatewayInterface::class, fn ($app) => $app->environment('testing')
            ? new MockStripePaymentGateway
            : new StripePaymentGateway);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
