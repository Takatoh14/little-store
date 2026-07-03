<?php

namespace Tests\Feature;

use App\Mail\ContactReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_persists_contact_and_notifies_admin(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/contact', [
            'name' => '山田太郎',
            'email' => 'taro@example.com',
            'message' => 'お問い合わせ内容のテストです。',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('contacts', ['email' => 'taro@example.com']);
        Mail::assertSent(ContactReceived::class, fn ($mail) => $mail->hasTo(config('mail.admin_address')));
    }

    public function test_store_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => '山田太郎',
            'email' => 'not-an-email',
            'message' => 'テスト',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }
}
