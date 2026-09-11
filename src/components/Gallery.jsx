import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { SmartImage } from './SmartImage.jsx';

// Swipeable gallery with dot indicators + a fullscreen pinch/double-tap zoom lightbox.
export function Gallery({ photos, alt }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const trackRef = useRef(null);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => setOpen(true)}
              aria-label={`View photo ${i + 1} of ${photos.length}${alt ? ` — ${alt}` : ''}`}
              className="relative aspect-[4/3] w-full shrink-0 snap-center sm:aspect-[16/10]"
            >
              <SmartImage src={src} alt={`${alt} ${i + 1}`} className="h-full w-full" eager={i === 0} />
            </button>
          ))}
        </div>

        {/* counter */}
        <div className="glass pointer-events-none absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-ink safe-top">
          {index + 1} / {photos.length}
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Expand"
          className="press glass absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full text-ink"
        >
          <Expand size={16} />
        </button>

        {/* dots */}
        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>{open && <Lightbox photos={photos} start={index} onClose={() => setOpen(false)} alt={alt} />}</AnimatePresence>
    </>
  );
}

function Lightbox({ photos, start, onClose, alt }) {
  const [i, setI] = useState(start);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const pinch = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };
  const go = (d) => {
    setI((v) => (v + d + photos.length) % photos.length);
    reset();
  };

  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinch.current = { d: dist(e.touches), scale };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) {
        setScale((s) => (s > 1 ? 1 : 2.4));
        setTx(0);
        setTy(0);
      }
      lastTap.current = now;
      pinch.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, tx, ty, pan: scale > 1 };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinch.current?.d) {
      const next = Math.min(4, Math.max(1, (pinch.current.scale * dist(e.touches)) / pinch.current.d));
      setScale(next);
    } else if (e.touches.length === 1 && pinch.current?.pan) {
      setTx(pinch.current.tx + (e.touches[0].clientX - pinch.current.startX));
      setTy(pinch.current.ty + (e.touches[0].clientY - pinch.current.startY));
    }
  };
  const onTouchEnd = () => {
    if (scale <= 1) reset();
    pinch.current = null;
  };

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="press absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md safe-top"
      >
        <X size={22} />
      </button>
      <div className="absolute top-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white safe-top">
        {i + 1} / {photos.length}
      </div>

      <div
        className="flex h-full w-full touch-none items-center justify-center overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.4))}
      >
        <img
          src={photos[i]}
          alt={`${alt} ${i + 1}`}
          draggable={false}
          className="max-h-full max-w-full select-none"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: pinch.current ? 'none' : 'transform 0.25s ease',
          }}
        />
      </div>

      {photos.length > 1 && scale === 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="press absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => go(1)}
            className="press absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </motion.div>
  );
}
