"use client";

import { useState, useRef } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function TagInput({ tags, onChange, placeholder = "Ketik lalu Enter...", label }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(",")) {
      const splitValues = value.split(",").map((t) => t.trim()).filter(Boolean);
      
      let newTags = [...tags];
      let added = false;
      
      splitValues.forEach((t) => {
        if (!newTags.includes(t)) {
          newTags.push(t);
          added = true;
        }
      });
      
      if (added) {
        onChange(newTags);
      }
      setInput("");
    } else {
      setInput(value);
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div
        className="flex flex-wrap items-center gap-2 p-3  bg-background/50 border border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all cursor-text min-h-[52px]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium  border border-accent/20"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
}
