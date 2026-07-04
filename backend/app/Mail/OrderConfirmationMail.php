<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public readonly Order $order)
    {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf('【Little Store】ご注文ありがとうございます（注文番号 #%d）', $this->order->id),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $itemsText = $this->order->orderItems->map(
            fn ($item) => sprintf('・%s × %d　¥%s', $item->product_name, $item->quantity, number_format($item->price * $item->quantity))
        )->implode("\n");

        return new Content(
            htmlString: nl2br(e(sprintf(
                "ご注文ありがとうございます。以下の内容で注文を承りました。\n\n".
                "注文番号: #%d\n\n%s\n\n合計金額: ¥%s\n配送先: %s",
                $this->order->id,
                $itemsText,
                number_format($this->order->total_price),
                $this->order->shipping_address,
            ))),
        );
    }
}
