<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContactStoreRequest;
use App\Mail\ContactReceived;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(ContactStoreRequest $request): JsonResponse
    {
        $contact = Contact::create($request->validated());

        Mail::to(config('mail.admin_address'))->send(new ContactReceived($contact));

        return response()->json(['message' => 'お問い合わせを受け付けました'], 201);
    }
}
