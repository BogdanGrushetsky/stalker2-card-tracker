interface Props { message: string; }

export default function Toast({ message }: Props) {
  return (
    <div className={`toast${message ? ' visible' : ''}`} aria-live="polite">
      {message}
    </div>
  );
}
