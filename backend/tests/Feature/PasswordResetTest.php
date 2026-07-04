<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_mail_for_existing_email(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'taro@example.com']);

        $response = $this->postJson('/api/forgot-password', ['email' => 'taro@example.com']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
        Mail::assertSent(ResetPasswordMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_forgot_password_returns_same_message_for_unknown_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/forgot-password', ['email' => 'unknown@example.com']);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'unknown@example.com']);
        Mail::assertNothingSent();
    }

    public function test_reset_password_succeeds_with_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'taro@example.com', 'password' => 'old-password']);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make('valid-token'),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'valid-token',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(204);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'new-password123',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_reset_password_fails_with_wrong_token(): void
    {
        $user = User::factory()->create(['email' => 'taro@example.com']);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make('valid-token'),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'wrong-token',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_reset_password_fails_with_expired_token(): void
    {
        $user = User::factory()->create(['email' => 'taro@example.com']);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make('valid-token'),
            'created_at' => now()->subMinutes(61),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => 'valid-token',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(422);
    }
}
