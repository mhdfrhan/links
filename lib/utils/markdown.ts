export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeHref(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url.trim());
}

/**
 * Safely renders chat assistant / user markdown to HTML.
 * All untrusted characters are escaped before formatting rules run.
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";

  // 1. Code blocks (```code```)
  const codeBlocks: string[] = [];
  let html = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    const escaped = escapeHtml(code);
    const placeholder = `%%CODEBLOCK${codeBlocks.length}%%`;
    codeBlocks.push(
      `<pre style="background:var(--bg-code);padding:10px 14px;overflow-x:auto;font-size:0.75rem;border-radius:4px;margin:8px 0;border:1px solid var(--border);font-family:var(--font-plus-jakarta),sans-serif"><code>${escaped}</code></pre>`
    );
    return placeholder;
  });

  // 2. Inline code (`code`)
  const inlineCodes: string[] = [];
  html = html.replace(/`([^`\n]+)`/g, (_, code) => {
    const escaped = escapeHtml(code);
    const placeholder = `%%INLINECODE${inlineCodes.length}%%`;
    inlineCodes.push(
      `<code style="background:color-mix(in srgb, var(--accent) 10%, transparent);color:var(--accent);padding:1px 5px;border-radius:3px;font-size:0.875em;font-weight:600;font-family:inherit;">${escaped}</code>`
    );
    return placeholder;
  });

  // 3. Links placeholder collector (before HTML escaping so URLs keep exact characters until escaped safely)
  const links: string[] = [];

  // 3a. Markdown links: [label](url)
  html = html.replace(
    /\s*\[([^\]]+)\]\((https?:\/\/[^\s)"']+|mailto:[^\s)"']+)\)/g,
    (_, label, url) => {
      if (!isSafeHref(url)) return escapeHtml(label);
      const placeholder = `%%LINK${links.length}%%`;
      const cleanLabel = escapeHtml(label.replace(/\s*↗$/, ""));
      const safeUrl = escapeHtml(url);
      links.push(
        ` <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="chat-md-link">${cleanLabel}<span style="font-size:0.75em;opacity:0.8">↗</span></a>`
      );
      return placeholder;
    }
  );

  // 3b. Raw URLs: https://... or http://...
  html = html.replace(
    /(^|[\s(>])(https?:\/\/[^\s<)"']+?)([.,;:!?)]?)(?=[\s<)"']|$)/g,
    (_, prefix, url, punct) => {
      if (!isSafeHref(url)) return `${escapeHtml(prefix)}${escapeHtml(url)}${escapeHtml(punct)}`;
      const placeholder = `%%LINK${links.length}%%`;
      const safeUrl = escapeHtml(url);
      links.push(
        `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="chat-md-link chat-md-link-raw">${safeUrl}<span style="font-size:0.75em;opacity:0.8">↗</span></a>`
      );
      return `${prefix}${placeholder}${punct}`;
    }
  );

  // 3c. Raw emails: user@domain.tld
  html = html.replace(
    /(^|[\s(>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})([.,;:!?)]?)(?=[\s<)]|$)/g,
    (_, prefix, email, punct) => {
      const placeholder = `%%LINK${links.length}%%`;
      const safeEmail = escapeHtml(email);
      links.push(
        `<a href="mailto:${safeEmail}" class="chat-md-link">${safeEmail}</a>`
      );
      return `${prefix}${placeholder}${punct}`;
    }
  );

  // 4. Escape all remaining raw HTML in text before converting markdown tokens to tags
  html = escapeHtml(html);

  // 5. Highlight: ==text== -> Subtle highlight
  const highlights: string[] = [];
  html = html.replace(/==([^=\n]+)==/g, (_, hl) => {
    const placeholder = `%%HIGHLIGHT${highlights.length}%%`;
    highlights.push(
      `<mark style="background:color-mix(in srgb, var(--accent) 14%, transparent);color:var(--accent);padding:1px 5px;border-radius:3px;font-weight:600;">${hl}</mark>`
    );
    return placeholder;
  });

  // 6. Bold: **text**
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    "<strong style='font-weight:700;color:var(--text-primary);'>$1</strong>"
  );

  // 7. Italic: *text*
  html = html.replace(
    /(?<!\*)\*([^*\n]+?)\*(?!\*)/g,
    "<em style='font-style:italic;color:var(--text-secondary);'>$1</em>"
  );

  // 8. Blockquotes: escaped `&gt; text`
  html = html.replace(
    /^&gt;\s+(.+)$/gm,
    "<blockquote style='border-left:3px solid var(--accent);background:color-mix(in srgb, var(--accent) 6%, transparent);padding:6px 12px;margin:8px 0;border-radius:0 4px 4px 0;font-style:italic;color:var(--text-secondary);'>$1</blockquote>"
  );

  // 9. Headings: ### and ##
  html = html.replace(
    /^###\s+(.+)$/gm,
    "<h3 style='font-size:0.9rem;font-weight:700;margin:10px 0 4px;color:var(--text-primary);'>$1</h3>"
  );
  html = html.replace(
    /^##\s+(.+)$/gm,
    "<h2 style='font-size:1rem;font-weight:700;margin:12px 0 4px;color:var(--text-primary);'>$1</h2>"
  );

  // 10. Horizontal rule: ---
  html = html.replace(
    /^---$/gm,
    "<hr style='border:none;border-top:1px solid var(--border);margin:10px 0;'/>"
  );

  // 11. Ordered lists: 1. Item
  html = html.replace(
    /^(\d+)\.\s+(.+)$/gm,
    "<oli style='margin:4px 0;padding-left:4px;'>$2</oli>"
  );

  // 12. Unordered lists: - Item or * Item
  html = html.replace(
    /^[\-\*]\s+(.+)$/gm,
    "<uli style='margin:4px 0;padding-left:4px;'>$1</uli>"
  );

  html = html.replace(
    /(<uli[^>]*>[\s\S]*?<\/uli>[\s\n]*)+/g,
    (m) =>
      `<ul style='padding-left:20px;margin:8px 0;list-style:disc;'>${m
        .replace(/<uli/g, "<li")
        .replace(/<\/uli>/g, "</li>")}</ul>`
  );
  html = html.replace(
    /(<oli[^>]*>[\s\S]*?<\/oli>[\s\n]*)+/g,
    (m) =>
      `<ol style='padding-left:20px;margin:8px 0;list-style:decimal;'>${m
        .replace(/<oli/g, "<li")
        .replace(/<\/oli>/g, "</li>")}</ol>`
  );

  // 13. Restore placeholders
  html = html.replace(/%%LINK(\d+)%%/g, (_, i) => links[Number(i)] || "");
  html = html.replace(/%%HIGHLIGHT(\d+)%%/g, (_, i) => highlights[Number(i)] || "");
  html = html.replace(/%%INLINECODE(\d+)%%/g, (_, i) => inlineCodes[Number(i)] || "");
  html = html.replace(/%%CODEBLOCK(\d+)%%/g, (_, i) => codeBlocks[Number(i)] || "");

  // 14. Convert remaining newlines to <br/>
  html = html.replace(/(?<!>)\n(?!<)/g, "<br/>");

  return html;
}
