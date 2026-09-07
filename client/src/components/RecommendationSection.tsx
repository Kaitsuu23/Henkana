"use client";

import { useState } from "react";
import { AnimeCard } from "./AnimeCard";

interface Tab {
  tab: string;
  data: any[];
}

interface RecommendationSectionProps {
  title: string;
  tabs: Tab[];
}

export function RecommendationSection({ title, tabs }: RecommendationSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) return null;

  const activeData = tabs[activeTab]?.data || [];

  return (
    <section className="space-y-4">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-6 bg-primary rounded-full" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {/* Tab list */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              i === activeTab
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {t.tab}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {activeData.map((item: any, i: number) => (
          <AnimeCard key={i} {...item} />
        ))}
      </div>
    </section>
  );
}
