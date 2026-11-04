import { useState } from 'react';
import type { InteractiveProps } from '../registry';

// A minimal interactive lesson showing the contract brilliant-sample units will follow.
export default function Hello({ onComplete, onProgress }: InteractiveProps) {
  const [answer, setAnswer] = useState<string | null>(null);
  const correct = answer === 'back-emf';
  return (
    <div className="card stack">
      <h3>Quick check</h3>
      <p>As a DC motor speeds up, what limits the current it draws?</p>
      {[
        ['back-emf', 'The back EMF it generates'],
        ['field', 'The field winding getting weaker'],
        ['brush', 'Friction at the brushes'],
      ].map(([id, label]) => (
        <button
          key={id}
          className={answer === id ? (correct ? 'btn btn-primary btn-block' : 'btn btn-block') : 'btn btn-block'}
          onClick={() => {
            setAnswer(id);
            onProgress?.(1);
            if (id === 'back-emf') onComplete();
          }}
        >
          {label}
        </button>
      ))}
      {answer && <div className={correct ? 'alert alert-success' : 'alert alert-error'}>{correct ? 'Right: back EMF opposes the supply.' : 'Not quite. Try again.'}</div>}
    </div>
  );
}
