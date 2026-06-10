'use client';

import { useRef, useState } from 'react';

// Contenedor con scroll horizontal arrastrable con el mouse (estilo "grab"),
// scrollbar personalizada (clase .drag-scroll en globals.css) y protección
// para que un arrastre no dispare el clic de los links internos.
export function DragScroller({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return; // en táctil el scroll nativo ya funciona
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active || !ref.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    ref.current.scrollLeft = drag.current.scrollLeft - dx;
  }

  function endDrag() {
    drag.current.active = false;
    setDragging(false);
  }

  // Si hubo arrastre, el "click" que lo cierra no debe navegar.
  function onClickCapture(e: React.MouseEvent) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClickCapture={onClickCapture}
      className={`drag-scroll overflow-x-auto ${
        dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
      } ${className}`}
    >
      {children}
    </div>
  );
}
