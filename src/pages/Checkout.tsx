import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { api, useQuery } from '../lib/api';
import { plural, price } from '../lib/format';
import { SITE, useSeo } from '../lib/seo';
import type { Checkout as CheckoutT, CourseDetail } from '../lib/types';

type Provider = 'esewa' | 'khalti';

const PROVIDERS: Record<Provider, { name: string; color: string; letter: string; note: string }> = {
  esewa: { name: 'eSewa', color: '#60bb46', letter: 'e', note: 'Pay from your eSewa wallet.' },
  khalti: { name: 'Khalti', color: '#5c2d91', letter: 'K', note: 'Pay with Khalti wallet, e-banking or mobile banking.' },
};

// Sends the browser to the gateway: eSewa takes a signed form POST, Khalti a redirect.
function go(co: CheckoutT) {
  if (co.method === 'GET') {
    location.assign(co.url);
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = co.url;
  for (const [k, v] of Object.entries(co.fields ?? {})) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function Checkout() {
  const { slug = '' } = useParams();
  const { data: c, error } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  const { data: prov } = useQuery<{ providers: Provider[]; live: Record<Provider, boolean> }>('providers', '/api/payments/providers');
  const [choice, setChoice] = useState<Provider>('esewa');
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState('');
  useSeo({ title: `Checkout · ${SITE}`, noindex: true });

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="container page"><ErrorBox message={error.message} /></main>;
  if (!c) return <main className="container page narrow"><div className="skeleton" style={{ height: 320 }} /></main>;
  if (c.owned || c.pricePaisa === 0) return <Navigate to={`/courses/${c.slug}`} replace />;

  const available = prov?.providers ?? ['esewa'];

  async function pay() {
    setBusy(true);
    setPayError('');
    try {
      go(await api<CheckoutT>('/api/payments/checkout', { method: 'POST', body: { course: slug, provider: choice } }));
    } catch (e) {
      setPayError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="container page narrow stack">
      <Link to={`/courses/${c.slug}`} className="muted small">← Back to course</Link>
      <h1>Checkout</h1>

      <div className="card row">
        <div className="grow" style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{c.title}</div>
          <div className="muted small">{plural(c.subjectCount, 'subject')} · {plural(c.lessonCount, 'lesson')} · lifetime access</div>
        </div>
        <div className="price" style={{ fontSize: '1.4rem' }}>{price(c.pricePaisa)}</div>
      </div>

      <h2>Pay with</h2>
      <div className="stack" role="group" aria-label="Payment method">
        {(Object.keys(PROVIDERS) as Provider[]).map((p) => {
          const info = PROVIDERS[p];
          const enabled = available.includes(p);
          return (
            <button key={p} type="button" className="pay-option" aria-pressed={choice === p} disabled={!enabled}
              onClick={() => setChoice(p)} style={enabled ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}>
              <span className="pay-logo" style={{ background: info.color }}>{info.letter}</span>
              <span style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, display: 'block' }}>{info.name}{prov && !prov.live[p] && enabled ? ' (test mode)' : ''}</span>
                <span className="muted small">{enabled ? info.note : 'Not available yet.'}</span>
              </span>
            </button>
          );
        })}
      </div>

      {payError && <div className="alert alert-error">{payError}</div>}
      <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => void pay()}>
        {busy ? `Opening ${PROVIDERS[choice].name}…` : `Pay ${price(c.pricePaisa)} with ${PROVIDERS[choice].name}`}
      </button>
      <p className="muted small">
        You'll finish the payment on {PROVIDERS[choice].name} and come straight back here. The course unlocks as soon as
        the payment is confirmed.
      </p>
    </main>
  );
}
