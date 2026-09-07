"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
  text: string;
  clampLines?: number;
}

const LINE_HEIGHT_PX = 22.75;

export function ExpandableText({ text, clampLines = 4 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const collapsedHeight = Math.round(clampLines * LINE_HEIGHT_PX);
  const needsClamp = text.length > 300;

  useLayoutEffect(() => {
    if (contentRef.current) {
      setFullHeight(contentRef.current.scrollHeight);
    }
  }, [text]);

  const targetHeight = !needsClamp
    ? fullHeight
    : expanded
    ? fullHeight
    : collapsedHeight;

  return (
    <div className="space-y-1">
      <motion.div
        className="overflow-hidden relative"
        animate={{ height: targetHeight }}
        transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
      >
        <p
          ref={contentRef}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          {text}
        </p>

        {needsClamp && !expanded && null}
      </motion.div>

      {needsClamp && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors bg-muted/60 hover:bg-muted px-3 py-1.5 rounded-full border border-border/50"
        >
          {expanded ? "Sembunyikan" : "Baca Selengkapnya"}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.span>
        </button>
      )}
    </div>
  );
}