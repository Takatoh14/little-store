<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public readonly User $user, public readonly string $token)
    {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '【Little Store】パスワード再設定のご案内',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $resetUrl = rtrim(config('app.frontend_url'), '/').'/reset-password?email='.urlencode($this->user->email).'&token='.$this->token;

        return new Content(
            htmlString: nl2br(e(
                "以下のリンクからパスワードを再設定してください（60分以内に操作してください）。\n".
                "このメールに心当たりがない場合は、何もせずこのメールを破棄してください。\n\n"
            )).'<a href="'.$resetUrl.'">'.$resetUrl.'</a>',
        );
    }
}
