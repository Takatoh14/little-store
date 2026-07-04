<?php

namespace Tests\Feature\Admin;

use App\Mail\ContactReplyMail;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_contacts(): void
    {
        $admin = User::factory()->admin()->create();
        Contact::factory(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/admin/contacts');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_admin_can_filter_contacts_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        Contact::factory()->create(['status' => 'unread']);
        Contact::factory()->create(['status' => 'answered']);

        $response = $this->actingAs($admin)->getJson('/api/admin/contacts?status=unread');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'unread');
    }

    public function test_non_admin_cannot_list_contacts(): void
    {
        $customer = User::factory()->create();

        $this->actingAs($customer)->getJson('/api/admin/contacts')->assertStatus(403);
    }

    public function test_viewing_unread_contact_marks_it_read(): void
    {
        $admin = User::factory()->admin()->create();
        $contact = Contact::factory()->create(['status' => 'unread']);

        $response = $this->actingAs($admin)->getJson('/api/admin/contacts/'.$contact->id);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'read');
        $this->assertDatabaseHas('contacts', ['id' => $contact->id, 'status' => 'read']);
    }

    public function test_viewing_answered_contact_keeps_status(): void
    {
        $admin = User::factory()->admin()->create();
        $contact = Contact::factory()->create(['status' => 'answered']);

        $response = $this->actingAs($admin)->getJson('/api/admin/contacts/'.$contact->id);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'answered');
    }

    public function test_non_admin_cannot_view_contact(): void
    {
        $customer = User::factory()->create();
        $contact = Contact::factory()->create();

        $this->actingAs($customer)->getJson('/api/admin/contacts/'.$contact->id)->assertStatus(403);
    }

    public function test_admin_can_reply_to_contact(): void
    {
        Mail::fake();
        $admin = User::factory()->admin()->create();
        $contact = Contact::factory()->create(['status' => 'unread']);

        $response = $this->actingAs($admin)->postJson('/api/admin/contacts/'.$contact->id.'/reply', [
            'reply_message' => 'お問い合わせありがとうございます。ご案内いたします。',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'answered');
        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
            'status' => 'answered',
            'reply_message' => 'お問い合わせありがとうございます。ご案内いたします。',
        ]);
        Mail::assertSent(ContactReplyMail::class, fn ($mail) => $mail->hasTo($contact->email));
    }

    public function test_reply_fails_without_message(): void
    {
        $admin = User::factory()->admin()->create();
        $contact = Contact::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/contacts/'.$contact->id.'/reply', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('reply_message');
    }

    public function test_non_admin_cannot_reply_to_contact(): void
    {
        $customer = User::factory()->create();
        $contact = Contact::factory()->create();

        $this->actingAs($customer)->postJson('/api/admin/contacts/'.$contact->id.'/reply', [
            'reply_message' => 'test',
        ])->assertStatus(403);
    }
}
