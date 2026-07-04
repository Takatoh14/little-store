<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ContactReplyRequest;
use App\Http\Resources\ContactResource;
use App\Mail\ContactReplyMail;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $contacts = Contact::when($request->status, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(20);

        return ContactResource::collection($contacts);
    }

    public function show(Contact $contact): JsonResponse
    {
        if ($contact->status === 'unread') {
            $contact->update(['status' => 'read']);
        }

        return response()->json(new ContactResource($contact));
    }

    public function reply(ContactReplyRequest $request, Contact $contact): JsonResponse
    {
        Mail::to($contact->email)->send(new ContactReplyMail($contact, $request->reply_message));

        $contact->update([
            'status' => 'answered',
            'reply_message' => $request->reply_message,
            'replied_at' => now(),
        ]);

        return response()->json(new ContactResource($contact));
    }
}
