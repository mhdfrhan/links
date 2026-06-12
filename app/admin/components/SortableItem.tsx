"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-[-12px] md:left-[-24px] top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-accent transition-colors md:opacity-0 md:group-hover/sortable:opacity-100 z-10 hidden md:block"
        title="Geser untuk mengurutkan"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
      </div>

      {/* Mobile Handle - visible only on mobile */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-4 right-14 p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-accent z-10 md:hidden bg-card/80 backdrop-blur-sm "
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
      </div>

      <div className={isDragging ? "ring-2 ring-accent  shadow-lg shadow-accent/20" : ""}>
        {children}
      </div>
    </div>
  );
}
