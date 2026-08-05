import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Send, Tag, MapPin, ImagePlus, Plus, Check, CheckCheck, X, Phone,
} from 'lucide-react';
import { SmartImage } from '../components/SmartImage.jsx';
import { Avatar, PlanBadge, Button } from '../components/ui/kit.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useAllListings, useStore } from '../lib/store.jsx';
import { getUser } from '../data/users.js';
import { CATEGORY_MAP } from '../data/categories.js';
import { listingCover } from '../lib/images.js';
import { formatPrice } from '../lib/format.js';

const REPLIES = [
  'Sounds good! When would you like to meet?',
  'Yes, still available 🙂 Where are you based?',
  'I could do that price if you can pick up this week.',
  'Happy to send more photos — anything specific you want to see?',
  'Let me check and get back to you shortly.',
  'It’s in great condition, honestly barely used.',
];

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { convId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState('');
  const [showActions, setShowActions] = useState(false);
  const scrollRef = useRef(null);

  // Resolve conversation (handles the "new" placeholder route)
  const conv = useMemo(() => {
    let c = state.conversations.find((x) => x.id === convId);
    if (!c && location.state) {
      c = state.conversations.find(
        (x) => x.sellerId === location.state.sellerId && x.listingId === location.state.listingId
      );
    }
    return c;
  }, [state.conversations, convId, location.state]);

  const seller = conv ? getUser(conv.sellerId) : null;
  const listing = conv ? all.find((l) => l.id === conv.listingId) : null;
  const tint = listing ? CATEGORY_MAP[listing.category]?.color : '#0f6c54';

  // Mark read + scroll on open / new messages
  useEffect(() => {
    if (conv?.unread) dispatch({ type: 'READ_CONVERSATION', convId: conv.id });
  }, [conv?.id]); // eslint-disable-line

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conv?.messages.length, conv?.typing]);

  if (!conv || !seller) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <p className="text-muted">Conversation not found.</p>
          <Button variant="soft" className="mt-3" onClick={() => navigate('/messages')}>
            Back to messages
          </Button>
        </div>
      </div>
    );
  }

  const simulateReply = () => {
    dispatch({ type: 'SET_TYPING', convId: conv.id, typing: true });
    const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    setTimeout(() => {
      dispatch({ type: 'RECEIVE_MESSAGE', convId: conv.id, text: reply, markRead: true });
    }, 1400 + Math.random() * 900);
  };

  const send = (body, msgType = 'text') => {
    if (!body?.trim() && msgType === 'text') return;
    dispatch({ type: 'SEND_MESSAGE', convId: conv.id, text: body, msgType });
    setText('');
    simulateReply();
  };

  return (
    <div className="flex h-[100dvh] flex-col lg:h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-30 safe-top">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <button onClick={() => navigate('/messages')} className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink lg:hidden">
            <ChevronLeft size={20} />
          </button>
          <Link to={`/seller/${seller.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative">
              <Avatar name={seller.name} size={40} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-bg" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-bold text-ink">{seller.name}</p>
                <PlanBadge plan={seller.plan} />
              </div>
              <p className="text-xs text-success">{conv.typing ? 'typing…' : 'Online now'}</p>
            </div>
          </Link>
          <button onClick={() => toast(`Calling ${seller.name.split(' ')[0]}…`, { type: 'info' })} className="press grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
            <Phone size={18} />
          </button>
        </div>

        {/* Pinned listing */}
        {listing && (
          <Link to={`/listing/${listing.id}`} className="mx-auto flex max-w-3xl items-center gap-3 border-t border-hairline px-4 py-2">
            <div className="h-11 w-11 shrink-0">
              <SmartImage src={listingCover(listing, tint)} alt={listing.title} className="h-full w-full" rounded="rounded-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{listing.title}</p>
              <p className="text-sm font-bold text-accent">{formatPrice(listing)}</p>
            </div>
            <Tag size={16} className="text-faint" />
          </Link>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="thin-scrollbar mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-2">
          <p className="mx-auto mb-2 w-fit rounded-full bg-ink/5 px-3 py-1 text-xs text-faint">
            This is the start of your conversation
          </p>
          {conv.messages.map((m, i) => {
            const mine = m.from === 'me';
            const last = i === conv.messages.length - 1;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'}`}>
                  {m.type === 'offer' ? (
                    <div className={`rounded-2xl border p-3 ${mine ? 'border-accent/30 bg-accent-soft' : 'border-hairline bg-surface'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Offer</p>
                      <p className="text-xl font-extrabold text-ink">{m.text}</p>
                    </div>
                  ) : m.type === 'location' ? (
                    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
                      <div className="flex h-24 items-center justify-center bg-accent-soft">
                        <MapPin size={26} className="text-accent" />
                      </div>
                      <p className="px-3 py-2 text-sm font-medium text-ink">{m.text}</p>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug ${
                        mine ? 'btn-accent rounded-br-md' : 'rounded-bl-md bg-surface text-ink border border-hairline'
                      }`}
                    >
                      {m.text}
                    </div>
                  )}
                  <div className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-faint ${mine ? 'justify-end' : ''}`}>
                    {fmtTime(m.at)}
                    {mine && (last ? <CheckCheck size={13} className="text-accent" /> : <Check size={13} />)}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {conv.typing && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-hairline bg-surface px-4 py-3">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-2 w-2 rounded-full bg-faint"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Composer */}
      <div className="glass sticky bottom-0 border-t safe-bottom">
        <div className="mx-auto flex max-w-3xl items-end gap-2 px-3 py-2.5">
          <button onClick={() => setShowActions(true)} className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5 text-ink">
            <Plus size={22} />
          </button>
          <div className="flex flex-1 items-end rounded-2xl border border-hairline bg-surface px-3 py-1.5">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              placeholder="Message…"
              className="max-h-28 w-full resize-none bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-faint"
            />
          </div>
          <button
            onClick={() => send(text)}
            disabled={!text.trim()}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full btn-accent disabled:opacity-40"
          >
            <Send size={19} />
          </button>
        </div>
      </div>

      {/* Attach actions */}
      <Sheet open={showActions} onClose={() => setShowActions(false)} title="Share">
        <div className="grid grid-cols-3 gap-3 pb-4">
          <ActionTile icon={ImagePlus} label="Photo" onClick={() => { setShowActions(false); send('📷 Photo', 'text'); toast('Photo shared'); }} />
          <ActionTile
            icon={Tag}
            label="Make offer"
            onClick={() => { setShowActions(false); setShowOffer(true); }}
          />
          <ActionTile
            icon={MapPin}
            label="Location"
            onClick={() => { setShowActions(false); send('Meet at Oslo S, main entrance', 'location'); }}
          />
        </div>
      </Sheet>

      {/* Offer sheet */}
      <Sheet
        open={showOffer}
        onClose={() => setShowOffer(false)}
        title="Make an offer"
        footer={
          <Button
            full
            size="lg"
            disabled={!offer}
            onClick={() => {
              send(`${Number(offer).toLocaleString('nb-NO')} kr`, 'offer');
              setOffer('');
              setShowOffer(false);
            }}
          >
            Send offer
          </Button>
        }
      >
        <div className="py-2">
          {listing && <p className="mb-2 text-sm text-muted">Asking price: <span className="font-bold text-ink">{formatPrice(listing)}</span></p>}
          <div className="flex items-center rounded-2xl border border-hairline bg-surface px-4">
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="0"
              className="h-14 w-full bg-transparent text-2xl font-extrabold text-ink outline-none"
            />
            <span className="text-xl font-bold text-faint">kr</span>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function ActionTile({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="press flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-surface p-4">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
        <Icon size={22} />
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </button>
  );
}
