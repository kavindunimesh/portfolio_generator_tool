import { NoIndex } from '../components/NoIndex';

const WHATSAPP_E164 = '94760358784';
const WHATSAPP_DISPLAY = '+94 76 035 8784';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
  'Hi Adawwa support — I need help with a problem:'
)}`;

export function ContactPage() {
  return (
    <main className="contact-page">
      <NoIndex />
      <p className="auth-kicker">Support</p>
      <h1>Report a problem</h1>
      <p className="muted contact-lead">
        Something not working? Message us on WhatsApp and we will help you sort it out.
      </p>

      <div className="contact-card">
        <p className="contact-card-label">WhatsApp</p>
        <p className="contact-card-number">{WHATSAPP_DISPLAY}</p>
        <a
          className="btn btn-primary btn-lg contact-whatsapp-btn"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat on WhatsApp
        </a>
        <p className="muted contact-hint">Opens WhatsApp with a short message ready to send.</p>
      </div>
    </main>
  );
}
