export function price(paisa: number) {
  if (paisa === 0) return 'Free';
  const rupees = paisa / 100;
  return `Rs ${rupees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function duration(seconds: number) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`;
}

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
