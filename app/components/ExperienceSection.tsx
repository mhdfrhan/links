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

      {/* Timeline */}
      <div className="space-y-0">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative pl-6"
            style={{
              borderLeft: "1px solid var(--border)",
              paddingBottom: index < items.length - 1 ? "2rem" : "0",
            }}
          >
            {/* Timeline dot */}
            <div
              className="absolute"
              style={{
                left: "-5px",
                top: "3px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-hover)",
              }}
            />

            {/* Content */}
            <div>
              {/* Period — mono, muted, di atas */}
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.02em",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                {item.period}
              </span>

              {/* Title */}
              <h3
                style={{
                  fontWeight: 500,
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  fontStyle: "normal",
                  marginBottom: "0.15rem",
                }}
              >
                {item.title}
              </h3>

              {/* Company */}
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--accent)",
                  marginBottom: "0.625rem",
                  fontStyle: "normal",
                }}
              >
                {item.company}
              </p>

              {/* Points */}
              <ul className="space-y-1.5">
                {item.points.map((point, pIndex) => (
                  <li
                    key={pIndex}
                    className="flex items-start gap-2"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      fontStyle: "normal",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--border-hover)",
                        flexShrink: 0,
                        marginTop: "0.1em",
                        fontSize: "0.7rem",
                      }}
                    >
                      ▸
                    </span>
                    <span>{point}</span>
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
