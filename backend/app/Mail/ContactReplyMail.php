<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public readonly Contact $contact, public readonly string $replyMessage)
    {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '【Little Store】お問い合わせへの回答',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: nl2br(e(sprintf(
                "%s 様\n\nお問い合わせいただきありがとうございます。以下の通りご回答いたします。\n\n".
                "【お問い合わせ内容】\n%s\n\n【回答】\n%s",
                $this->contact->name,
                $this->contact->message,
                $this->replyMessage,
            ))),
        );
    }
}
