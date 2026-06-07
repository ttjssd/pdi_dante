"use client";

import { useState } from "react";

export type UpdateGroup = {
  date: string;
  items: {
    version: string;
    title: string;
    description: string;
  }[];
};

export default function UpdateLog({ updates }: { updates: UpdateGroup[] }) {
  const [openDates, setOpenDates] = useState<string[]>([]);

  const toggleGroup = (date: string) => {
    setOpenDates((current) =>
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date],
    );
  };

  return (
    <div className="update-groups">
      {updates.map((group) => {
        const isOpen = openDates.includes(group.date);

        return (
          <section className={`update-group ${isOpen ? "is-open" : ""}`} key={group.date}>
            <button
              className="update-group-trigger"
              type="button"
              aria-expanded={isOpen}
              aria-controls={`updates-${group.date.replace("/", "-")}`}
              onClick={() => toggleGroup(group.date)}
            >
              <span className="update-group-date">{group.date}</span>
              <strong>{group.items.length}개 업데이트</strong>
              <i aria-hidden="true">⌄</i>
            </button>
            <div
              className="update-group-content"
              id={`updates-${group.date.replace("/", "-")}`}
              aria-hidden={!isOpen}
            >
              <div className="update-group-inner">
                {group.items.map((update) => (
                  <article className="update-entry" key={`${update.version}-${update.title}`}>
                    <span className="update-version">{update.version}</span>
                    <div>
                      <h3>{update.title}</h3>
                      <p>{update.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
