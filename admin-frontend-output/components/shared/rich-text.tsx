'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading3, List, ListOrdered, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RichText editor (impl spec §6): contentEditable with a toolbar —
 * B / I / U (execCommand), divider, heading (formatBlock), UL + OL, divider,
 * link (prompt for URL). Placeholder via [data-ph]:empty:before. The News
 * editor uses the trimmed variant with H3.
 */
export interface RichTextProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function RichText({ value, onChange, placeholder = 'Rédigez…', minHeight = 200, className }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Only sync external → editor when the content actually differs (avoids
  // caret jumps on every keystroke).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const buttons: { icon: React.ReactNode; title: string; action: () => void }[] = [
    { icon: <Bold size={15} />, title: 'Gras', action: () => exec('bold') },
    { icon: <Italic size={15} />, title: 'Italique', action: () => exec('italic') },
    { icon: <Underline size={15} />, title: 'Souligné', action: () => exec('underline') },
  ];

  return (
    <div className={cn('overflow-hidden rounded-[12px] border border-hair2', className)}>
      <div className="flex items-center gap-[2px] border-b border-hair bg-surface2 px-2 py-[6px]">
        {buttons.map((b, i) => (
          <ToolbarBtn key={i} title={b.title} onClick={b.action}>
            {b.icon}
          </ToolbarBtn>
        ))}
        <span className="mx-1 h-4 w-px bg-hair2" />
        <ToolbarBtn title="Titre" onClick={() => exec('formatBlock', 'h3')}>
          <Heading3 size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Liste à puces" onClick={() => exec('insertUnorderedList')}>
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn title="Liste numérotée" onClick={() => exec('insertOrderedList')}>
          <ListOrdered size={15} />
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-hair2" />
        <ToolbarBtn
          title="Lien"
          onClick={() => {
            const url = window.prompt('URL du lien :');
            if (url) exec('createLink', url);
          }}
        >
          <Link2 size={15} />
        </ToolbarBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-ph={placeholder}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        className="rich-body bg-surface px-4 py-3 text-[14px] leading-relaxed text-ink outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}

function ToolbarBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken hover:text-ink"
    >
      {children}
    </button>
  );
}
