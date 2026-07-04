<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_succeeds_with_valid_data(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Taro Yamada',
            'email' => 'taro@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'taro@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taro@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Taro Yamada',
            'email' => 'taro@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    public function test_register_fails_with_short_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Taro Yamada',
            'email' => 'taro@example.com',
            'password' => 'short12',
            'password_confirmation' => 'short12',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    public function test_login_succeeds_with_correct_credentials(): void
    {
        User::factory()->create([
            'email' => 'taro@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'taro@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'taro@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'taro@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout');

        $response->assertStatus(204);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/logout')->assertStatus(401);
    }

    public function test_update_password_succeeds_with_correct_current_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $response = $this->actingAs($user)->putJson('/api/password', [
            'current_password' => 'old-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(204);

        $loginResponse = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'new-password123',
        ]);
        $loginResponse->assertStatus(200);
    }

    public function test_update_password_fails_with_wrong_current_password(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $response = $this->actingAs($user)->putJson('/api/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('current_password');
    }

    public function test_update_password_fails_when_confirmation_mismatches(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $response = $this->actingAs($user)->putJson('/api/password', [
            'current_password' => 'old-password',
            'password' => 'new-password123',
            'password_confirmation' => 'different-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    public function test_update_password_requires_authentication(): void
    {
        $this->putJson('/api/password', [
            'current_password' => 'old-password',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertStatus(401);
    }
}
