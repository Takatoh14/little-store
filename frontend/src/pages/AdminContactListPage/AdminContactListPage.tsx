import { Link, useSearchParams } from 'react-router-dom'
import { getAdminContacts } from '../../api/contact'
import { CONTACT_STATUS_LABELS } from '../../constants/contactStatus'
import { Pagination } from '../../components/Pagination/Pagination'
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { useAsync } from '../../hooks/useAsync'
import type { ContactStatus } from '../../types/contact'
import styles from './AdminContactListPage.module.scss'

const ALL_STATUSES: ContactStatus[] = ['unread', 'read', 'answered']

export function AdminContactListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const status = (searchParams.get('status') as ContactStatus | null) ?? undefined

  const {
    data: contacts,
    isLoading,
    error,
  } = useAsync(() => getAdminContacts({ page, status }), [page, status])

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const handleStatusChange = (nextStatus: string) => {
    const next = new URLSearchParams(searchParams)
    if (nextStatus === '') next.delete('status')
    else next.set('status', nextStatus)
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>問い合わせ管理</h1>

      <div className={styles.filters}>
        <select value={status ?? ''} onChange={(e) => handleStatusChange(e.target.value)}>
          <option value="">すべてのステータス</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTACT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}
      {contacts && contacts.data.length === 0 && <EmptyMessage text="問い合わせがありません" />}

      {contacts && contacts.data.length > 0 && (
        <>
          <div className={styles.list}>
            {contacts.data.map((contact) => (
              <Link key={contact.id} to={`/admin/contacts/${contact.id}`} className={styles.row}>
                <div className={styles.rowInfo}>
                  <span className={styles.name}>
                    {contact.name}（{contact.email}）
                  </span>
                  <span className={styles.meta}>{new Date(contact.created_at).toLocaleString('ja-JP')}</span>
                </div>
                <span className={`${styles.statusBadge} ${styles[contact.status]}`}>
                  {CONTACT_STATUS_LABELS[contact.status]}
                </span>
              </Link>
            ))}
          </div>
          <Pagination meta={contacts.meta} onChange={handlePageChange} />
        </>
      )}
    </section>
  )
}
