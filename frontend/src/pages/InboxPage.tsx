import { startTransition, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { NoIndex } from '../components/NoIndex';
import { useToast } from '../toast';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isHidden: boolean;
  createdAt: string;
};

type StatusFilter = 'all' | 'unread' | 'read' | 'hidden';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export function InboxPage() {
  const { portfolio } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedQRef = useRef(debouncedQ);
  debouncedQRef.current = debouncedQ;

  const contactEnabled =
    Boolean(portfolio?.plugins?.contactForm?.enabled) &&
    portfolio?.plugins?.contactForm?.mode === 'adawwa';

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === debouncedQRef.current) return;
      startTransition(() => {
        setDebouncedQ(next);
        setPage(1);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    async function load() {
      if (!contactEnabled) {
        if (!cancelled) {
          setLoading(false);
          setMessages([]);
          setTotal(0);
          setTotalPages(1);
          setUnreadCount(0);
        }
        return;
      }

      setLoading(true);
      try {
        const data = await api.listContactMessages({
          page,
          pageSize: PAGE_SIZE,
          status,
          q: debouncedQ,
        });
        if (cancelled || requestId !== requestIdRef.current) return;
        setMessages(data.messages);
        setUnreadCount(data.unreadCount);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      } catch (err) {
        if (!cancelled && requestId === requestIdRef.current) {
          toast.error('Inbox error', err instanceof Error ? err.message : 'Could not load messages');
        }
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [contactEnabled, page, status, debouncedQ, reloadToken, toast]);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      await api.markContactMessageRead(id);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
      setUnreadCount((c) => Math.max(0, c - 1));
      if (status === 'unread') setReloadToken((n) => n + 1);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusyId(null);
    }
  }

  async function hide(id: string) {
    setBusyId(id);
    try {
      await api.hideContactMessage(id);
      toast.success('Hidden', 'Message moved to Hidden.');
      if (messages.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setReloadToken((n) => n + 1);
      }
    } catch (err) {
      toast.error('Hide failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusyId(null);
    }
  }

  async function unhide(id: string) {
    setBusyId(id);
    try {
      await api.unhideContactMessage(id);
      toast.success('Restored', 'Message is visible again.');
      if (messages.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setReloadToken((n) => n + 1);
      }
    } catch (err) {
      toast.error('Restore failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusyId(null);
    }
  }

  function changeStatus(next: StatusFilter) {
    setStatus(next);
    setPage(1);
  }

  function clearSearch() {
    setSearchInput('');
    searchInputRef.current?.focus();
  }

  const searching = searchInput.trim() !== debouncedQ;
  const emptyHint = debouncedQ
    ? `No messages match “${debouncedQ}”.`
    : status === 'all'
      ? 'No messages yet. Share your live portfolio to receive inquiries.'
      : `No ${status} messages.`;

  return (
    <main className="inbox-page">
      <NoIndex />
      <header className="inbox-header">
        <div>
          <p className="dashboard-kicker">Messages</p>
          <h1>Contact inbox</h1>
          <p className="muted">
            {contactEnabled
              ? loading
                ? 'Loading…'
                : `${unreadCount} unread · ${total} ${status === 'hidden' ? 'hidden' : 'shown'}${
                    debouncedQ ? ` · search` : ''
                  }`
              : 'Enable the Adawwa contact form in Plugins to receive messages here.'}
          </p>
        </div>
        <div className="inbox-header-actions">
          {contactEnabled && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setReloadToken((n) => n + 1)}
              disabled={loading}
            >
              Refresh
            </button>
          )}
          <Link className="btn btn-secondary btn-sm" to="/builder">
            Plugins settings
          </Link>
        </div>
      </header>

      {!contactEnabled ? (
        <div className="inbox-empty-card">
          <h2>Inbox is off</h2>
          <p className="muted">
            Turn on the contact form with <strong>Adawwa inbox</strong> mode in the builder Plugins tab.
          </p>
          <Link className="btn btn-primary" to="/builder">
            Open builder
          </Link>
        </div>
      ) : (
        <>
          <div className="inbox-toolbar">
            <div className="inbox-filters" role="tablist" aria-label="Filter messages">
              {(
                [
                  ['all', 'All'],
                  ['unread', 'Unread'],
                  ['read', 'Read'],
                  ['hidden', 'Hidden'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={status === value}
                  className={`inbox-filter${status === value ? ' is-active' : ''}`}
                  onClick={() => changeStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="inbox-search">
              <span className="sr-only">Search messages</span>
              <input
                ref={searchInputRef}
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email, subject…"
                maxLength={120}
                autoComplete="off"
                spellCheck={false}
              />
              {searchInput ? (
                <button type="button" className="inbox-search-clear" onClick={clearSearch} aria-label="Clear search">
                  Clear
                </button>
              ) : null}
              {searching ? <span className="inbox-search-hint">Searching…</span> : null}
            </label>
          </div>

          {!loading && messages.length === 0 && <p className="inbox-empty">{emptyHint}</p>}

          <div className={`inbox-list${loading ? ' is-loading' : ''}`}>
            {messages.map((m) => (
              <article key={m.id} className={`inbox-card${m.isRead ? '' : ' unread'}`}>
                <div className="inbox-meta">
                  <strong>{m.name}</strong>
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                  {m.subject ? <span>{m.subject}</span> : null}
                </div>
                <p className="inbox-body">{m.message}</p>
                <div className="inbox-actions">
                  {status !== 'hidden' && !m.isRead && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={busyId === m.id}
                      onClick={() => void markRead(m.id)}
                    >
                      Mark read
                    </button>
                  )}
                  {status === 'hidden' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={busyId === m.id}
                      onClick={() => void unhide(m.id)}
                    >
                      Unhide
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busyId === m.id}
                      onClick={() => void hide(m.id)}
                    >
                      Hide
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="inbox-pagination" aria-label="Inbox pages">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="inbox-page-status">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
