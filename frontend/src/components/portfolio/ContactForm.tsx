import { useState, type FormEvent } from 'react';
import { api } from '../../api';
import { ContactSubmitError, type ContactFieldErrors } from '../../lib/contactErrors';

type Props =
  | {
      mode?: 'adawwa';
      userRoute: string;
      submitUrl?: never;
      active?: boolean;
    }
  | {
      mode: 'self_hosted';
      userRoute?: never;
      submitUrl: string;
      active?: boolean;
    };

type FieldErrors = ContactFieldErrors;

function validate(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const name = fields.name.trim();
  const email = fields.email.trim();
  const subject = fields.subject.trim();
  const message = fields.message.trim();

  if (!name) errors.name = 'Please enter your name.';
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer.';

  if (!email) errors.email = 'Please enter your email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address (e.g. you@example.com).';
  } else if (email.length > 255) {
    errors.email = 'Email must be 255 characters or fewer.';
  }

  if (subject.length > 200) errors.subject = 'Subject must be 200 characters or fewer.';

  if (!message) errors.message = 'Please write a message.';
  else if (message.length < 10) {
    errors.message = `Message is too short — add at least ${10 - message.length} more character${10 - message.length === 1 ? '' : 's'}.`;
  } else if (message.length > 4000) {
    errors.message = 'Message must be 4000 characters or fewer.';
  }

  return errors;
}

async function submitSelfHosted(
  submitUrl: string,
  body: {
    name: string;
    email: string;
    subject: string;
    message: string;
    honeypot: string;
    formStartedAt: number;
  }
) {
  const res = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    fields?: Record<string, string>;
  };
  if (!res.ok) {
    throw new ContactSubmitError(
      typeof data.error === 'string' ? data.error : 'Could not send your message. Please try again.',
      data.fields || {}
    );
  }
  return data;
}

export function ContactForm(props: Props) {
  const { active = true } = props;
  const mode = props.mode === 'self_hosted' ? 'self_hosted' : 'adawwa';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formStartedAt] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);

  if (!active) return null;
  if (mode === 'adawwa' && !props.userRoute) return null;
  if (mode === 'self_hosted' && !props.submitUrl) return null;

  function clearField(key: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const nextErrors = validate({ name, email, subject, message });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        honeypot,
        formStartedAt,
      };
      if (props.mode === 'self_hosted') {
        await submitSelfHosted(props.submitUrl, payload);
      } else {
        await api.submitContact(props.userRoute, payload);
      }
      setDone(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setHoneypot('');
      setFieldErrors({});
    } catch (err) {
      if (err instanceof ContactSubmitError) {
        setFieldErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not send your message. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="pf-contact-form is-success" role="status">
        <p className="pf-contact-success-title">Message sent</p>
        <p>Thanks — I’ll get back to you soon.</p>
        <button type="button" className="pf-contact-again" onClick={() => setDone(false)}>
          Send another message
        </button>
      </div>
    );
  }

  const messageLen = message.trim().length;

  return (
    <form className="pf-contact-form" onSubmit={(e) => void onSubmit(e)} noValidate>
      <div className="pf-contact-grid">
        <label className={fieldErrors.name ? 'has-error' : undefined}>
          Name
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearField('name');
            }}
            required
            maxLength={120}
            autoComplete="name"
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name && <span className="pf-contact-field-error">{fieldErrors.name}</span>}
        </label>
        <label className={fieldErrors.email ? 'has-error' : undefined}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearField('email');
            }}
            required
            maxLength={255}
            autoComplete="email"
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && <span className="pf-contact-field-error">{fieldErrors.email}</span>}
        </label>
      </div>
      <label className={fieldErrors.subject ? 'has-error' : undefined}>
        Subject <span className="pf-contact-optional">(optional)</span>
        <input
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            clearField('subject');
          }}
          maxLength={200}
          disabled={busy}
          aria-invalid={Boolean(fieldErrors.subject)}
        />
        {fieldErrors.subject && <span className="pf-contact-field-error">{fieldErrors.subject}</span>}
      </label>
      <label className={fieldErrors.message ? 'has-error' : undefined}>
        Message
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearField('message');
          }}
          required
          maxLength={4000}
          rows={5}
          disabled={busy}
          aria-invalid={Boolean(fieldErrors.message)}
          placeholder="Write at least 10 characters…"
        />
        <span className={`pf-contact-hint${messageLen > 0 && messageLen < 10 ? ' is-warn' : ''}`}>
          {messageLen}/4000 · minimum 10 characters
        </span>
        {fieldErrors.message && <span className="pf-contact-field-error">{fieldErrors.message}</span>}
      </label>
      <div className="pf-contact-hp" aria-hidden="true">
        <label>
          Leave blank
          <input
            tabIndex={-1}
            autoComplete="off"
            name="company_url_confirm"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>
      {formError && (
        <p className="pf-contact-error" role="alert">
          {formError}
        </p>
      )}
      <button type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
