"use client";

interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  points: string[];
}

interface ExperienceSectionProps {
  title: string;
  icon?: React.ReactNode;
  sectionNumber?: string;
  items: ExperienceItem[];
}

/**
 * ExperienceSection — Timeline bersih
 * Vertical line tipis di kiri, dot accent kecil
 * Warna accent soft blue sesuai design prompt
 */
export function ExperienceSection({
  title,
  sectionNumber = "05.",
  items,
}: ExperienceSectionProps) {
  return (
    <section className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--accent)",
            letterSpacing: "0.04em",
          }}
        >
          {sectionNumber}
        </span>
        <h2
          style={{
            fontWeight: 500,
            fontSize: "1.5rem",
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            fontStyle: "normal",
          }}
        >
          {title}
        </h2>
        <div
          className="flex-1"
          style={{ height: "1px", background: "var(--border)" }}
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-16 mt-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-4 md:gap-12"
          >
            {/* Period */}
            <div className="md:w-1/4 flex-shrink-0 md:text-right pt-1 md:pr-4">
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                {item.period}
              </span>
            </div>

            {/* Content */}
            <div className="md:w-3/4">
              <h3
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontWeight: 400,
                  fontSize: "1.5rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  fontSize: "1rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1rem",
                }}
              >
                {item.company}
              </p>

              {/* Points */}
              <ul className="flex flex-col gap-3">
                {item.points.map((point, pIndex) => (
                  <li
                    key={pIndex}
                    style={{
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontSize: "0.9375rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
