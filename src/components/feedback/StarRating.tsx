import './StarRating.css';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export const StarRating = ({ value, onChange, readonly = false }: StarRatingProps) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          className={`star-btn${star <= value ? ' star-btn--filled' : ''}${readonly ? ' star-btn--readonly' : ' star-btn--interactive'}`}
          onMouseEnter={(e) => {
            if (readonly) return;
            const btn = e.currentTarget;
            btn.parentElement!.querySelectorAll('button').forEach((b, i) => {
              b.classList.toggle('star-btn--filled', i < star);
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
