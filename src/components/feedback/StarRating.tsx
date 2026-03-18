interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export const StarRating = ({ value, onChange, readonly = false }: StarRatingProps) => {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          style={{
            background: 'none',
            padding: '2px',
            cursor: readonly ? 'default' : 'pointer',
            color: star <= value ? 'var(--accent-amber)' : 'var(--border-bright)',
            transition: 'color 0.1s',
            fontSize: '20px',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            if (readonly) return;
            const btn = e.currentTarget;
            btn.parentElement!.querySelectorAll('button').forEach((b, i) => {
              (b as HTMLButtonElement).style.color = i < star ? 'var(--accent-amber)' : 'var(--border-bright)';
            });
          }}
          onMouseLeave={() => {
            if (readonly) return;
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
};
