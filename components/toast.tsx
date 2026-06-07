'use client';
/* ============================================================
   toast.tsx — 軽量トースト（プロトタイプ準拠のモジュールレベル API）
   ============================================================ */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icons';

interface ToastItem { id: number; msg: string; icon?: string }
let _toastFn: ((msg: string, icon?: string) => void) | null = null;
let _seq = 0;

export function toast(msg: string, icon?: string): void { if (_toastFn) _toastFn(msg, icon); }

export function ToastHost() {
  const [, force] = useState(0);
  const listRef = useRef<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    _toastFn = (msg, icon) => {
      const id = ++_seq;
      listRef.current = listRef.current.concat([{ id, msg, icon }]);
      force((n) => n + 1);
      setTimeout(() => {
        listRef.current = listRef.current.filter((t) => t.id !== id);
        force((n) => n + 1);
      }, 2400);
    };
    return () => { _toastFn = null; };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="toast-wrap">
      {listRef.current.map((t) => (
        <div className="toast" key={t.id}>
          <span style={{ color: 'var(--st-done)' }}><Icon name={t.icon || 'check'} size={15} weight={2.4} /></span>
          {t.msg}
        </div>
      ))}
    </div>,
    document.body,
  );
}
