import type { ContactStatus } from '../types/contact'

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  unread: '未読',
  read: '既読',
  answered: '回答済み',
}
