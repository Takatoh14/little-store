export type ContactStatus = 'unread' | 'read' | 'answered'

export interface Contact {
  id: number
  name: string
  email: string
  message: string
  status: ContactStatus
  reply_message: string | null
  replied_at: string | null
  created_at: string
}
