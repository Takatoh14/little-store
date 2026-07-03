import styles from './StatusMessage.module.scss'

export function LoadingMessage({ text = '読み込み中...' }: { text?: string }) {
  return <p className={styles.wrapper}>{text}</p>
}

export function ErrorMessage({ text }: { text: string }) {
  return <p className={`${styles.wrapper} ${styles.error}`}>{text}</p>
}

export function EmptyMessage({ text }: { text: string }) {
  return <p className={styles.wrapper}>{text}</p>
}
