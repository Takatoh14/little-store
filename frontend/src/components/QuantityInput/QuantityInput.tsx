import styles from './QuantityInput.module.scss'

interface QuantityInputProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export function QuantityInput({ value, min = 1, max = 99, onChange }: QuantityInputProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="数量を減らす"
      >
        −
      </button>
      <input
        type="number"
        className={styles.input}
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(clamp(n))
        }}
      />
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="数量を増やす"
      >
        ＋
      </button>
    </div>
  )
}
