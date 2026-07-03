export interface PaymentSuccess {
  status: 'succeeded'
  order_id: number
}

export interface PaymentDeclined {
  message: string
  decline_code: string
}
