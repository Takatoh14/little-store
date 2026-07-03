import client from './client'

// POST /contact は response()->json(['message' => ...], 201) のためflat（messageのみ）
export async function submitContact(payload: { name: string; email: string; message: string }): Promise<void> {
  await client.post('/contact', payload)
}
