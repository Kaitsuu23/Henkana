"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface RelatedItem {
  title: string;
  thumbnail: string;
  url: string;
  slug?: string | null;
  badge?: string | null;
}

interface RelatedMangaProps {
  items: RelatedItem[];
}

const FLAG_MAP: Record<string, string> = {
  '🇰🇷': 'kr', '🇯🇵': 'jp', '🇨🇳': 'cn', '🇺🇸': 'us',
};

function parseBadge(badge: string) {
  for (const [emoji, code] of Object.entries(FLAG_MAP)) {
    if (badge.includes(emoji)) {
      return { flagCode: code, label: badge.replace(emoji, '').trim() };
    }
  }
  return { flagCode: null, label: badge };
}

export function RelatedManga({ items }: RelatedMangaProps) {
  const [visible, setVisible] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary" />
          Series Terkait
          <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
        </h2>

        <button
          onClick={() => setVisible(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border/50 transition-colors"
        >
          <motion.span
            animate={{ rotate: visible ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex"
          >
            <ChevronDown className="h-3 w-3" />
          </motion.span>
          {visible ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="related-grid"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-1">
              {items.map((item, i) => {
                const href = item.slug ? `/manga/${item.slug}` : item.url;
                const { flagCode, label } = item.badge ? parseBadge(item.badge) : { flagCode: null, label: null };

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                    className="flex flex-col"
                  >
                    <Link href={href} className="group relative block aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      {label && (
                        <div className="absolute bottom-2 right-2 bg-red-700 text-white text-[10px] px-1.5 py-0.5 font-bold flex items-center gap-1">
                          {flagCode && (
                            <img
                              src={`https://flagcdn.com/16x12/${flagCode}.png`}
                              width={14}
                              height={11}
                              alt={flagCode}
                              className="inline-block"
                            />
                          )}
                          {label.toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="pt-2">
                      <Link href={href}>
                        <h3 className="line-clamp-2 text-sm font-bold text-foreground/90 hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h3>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
