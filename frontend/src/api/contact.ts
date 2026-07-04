import client from './client'
import type { Paginated } from '../types/api'
import type { Contact, ContactStatus } from '../types/contact'

// POST /contact は response()->json(['message' => ...], 201) のためflat（messageのみ）
export async function submitContact(payload: { name: string; email: string; message: string }): Promise<void> {
  await client.post('/contact', payload)
}

// GET /admin/contacts はCollectionをそのまま返すためページネートラップ
export async function getAdminContacts(params: { page?: number; status?: ContactStatus } = {}): Promise<
  Paginated<Contact>
> {
  const res = await client.get<Paginated<Contact>>('/admin/contacts', { params })
  return res.data
}

// GET/POST /admin/contacts/{id}系 は response()->json(new ContactResource(...)) のためflat
export async function getAdminContact(id: number): Promise<Contact> {
  const res = await client.get<Contact>(`/admin/contacts/${id}`)
  return res.data
}

export async function replyToContact(id: number, replyMessage: string): Promise<Contact> {
  const res = await client.post<Contact>(`/admin/contacts/${id}/reply`, { reply_message: replyMessage })
  return res.data
}
