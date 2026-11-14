import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { renderMarkdown, escapeHtml } from "../lib/utils/markdown.ts";
import { createRateLimiter, getClientIp } from "../lib/utils/rateLimit.ts";
import { formatExperienceText } from "../lib/utils/formatExperience.ts";
import { isValidGitHubUsername } from "../lib/utils/validators.ts";
import { timingSafeCompare, resolveConfiguredPin } from "../lib/utils/pinVerify.ts";

describe("markdown XSS sanitization & formatting", () => {
  it("escapes HTML tags and script injection payloads outside code blocks", () => {
    const html = renderMarkdown(`<script>alert(1)</script> <img src=x onerror="alert(2)">`);
    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("<img"), false);
    assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
    assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(2)&quot;&gt;"));
  });

  it("prevents attribute breakouts inside raw URLs and omits inline JS handlers", () => {
    const html = renderMarkdown('Visit https://example.com"onmouseover="alert(1)');
    assert.equal(html.includes('href="https://example.com"'), true);
    assert.equal(html.includes("onmouseout="), false);
    assert.ok(html.includes('class="chat-md-link chat-md-link-raw"'));
    assert.ok(html.includes("&quot;onmouseover=&quot;alert(1)"));
  });

  it("never renders anchor tags for javascript: markdown links", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    assert.equal(html.includes("<a "), false);
    assert.equal(html.includes("href="), false);
  });

  it("renders safe markdown links, highlights, blockquotes, lists, and code", () => {
    const md = [
      "## Heading",
      "> Quoted text",
      "- **Bold** & *Italic* with ==highlight==",
      "[Portfolio](https://hannn.my.id)",
      "Inline `const x = 1 < 2;`",
    ].join("\n");

    const html = renderMarkdown(md);
    assert.ok(html.includes("<h2"));
    assert.ok(html.includes("<blockquote"));
    assert.ok(html.includes("Quoted text"));
    assert.ok(html.includes("<strong"));
    assert.ok(html.includes("<em"));
    assert.ok(html.includes("<mark"));
    assert.ok(html.includes('href="https://hannn.my.id"'));
    assert.ok(html.includes("rel=\"noopener noreferrer\""));
    assert.ok(html.includes("const x = 1 &lt; 2;"));
  });

  it("escapes all 5 special HTML characters", () => {
    assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  });
});

describe("rateLimit", () => {
  it("enforces maxRequests within window and resets after windowMs", () => {
    const check = createRateLimiter({ maxRequests: 2, windowMs: 1000, maxEntries: 10 });
    assert.equal(check("1.2.3.4", 100), true);
    assert.equal(check("1.2.3.4", 200), true);
    assert.equal(check("1.2.3.4", 300), false);
    assert.equal(check("1.2.3.4", 1200), true);
  });

  it("bounds stored entries to maxEntries", () => {
    const check = createRateLimiter({ maxRequests: 1, windowMs: 10_000, maxEntries: 2 });
    assert.equal(check("ip-1", 100), true);
    assert.equal(check("ip-2", 100), true);
    assert.equal(check("ip-3", 100), true);
    // ip-1 was evicted when ip-3 arrived, so ip-1 starts fresh
    assert.equal(check("ip-1", 100), true);
  });

  it("extracts client IP from x-forwarded-for or x-real-ip", () => {
    assert.equal(
      getClientIp(new Headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2" })),
      "10.0.0.1"
    );
    assert.equal(getClientIp(new Headers({ "x-real-ip": "192.168.1.5" })), "192.168.1.5");
    assert.equal(getClientIp(new Headers()), "unknown");
  });
});

describe("formatExperienceText", () => {
  it("updates experience year counts relative to 2022", () => {
    assert.equal(
      formatExperienceText("Memiliki pengalaman selama 4 tahun di web.", 2026),
      "Memiliki pengalaman selama 4 tahun di web."
    );
    assert.equal(
      formatExperienceText("Developer with 4 years of experience.", 2028),
      "Developer with 6 years of experience."
    );
    assert.equal(
      formatExperienceText("Pengalaman kerja 3 tahun.", 2027),
      "Pengalaman kerja 5 tahun."
    );
  });
});

describe("GitHub username validator", () => {
  it("accepts valid GitHub logins and rejects invalid/SSRF inputs", () => {
    assert.equal(isValidGitHubUsername("mhdfrhan"), true);
    assert.equal(isValidGitHubUsername("octo-cat-99"), true);
    assert.equal(isValidGitHubUsername("a"), true);

    assert.equal(isValidGitHubUsername(""), false);
    assert.equal(isValidGitHubUsername("-bad"), false);
    assert.equal(isValidGitHubUsername("bad-"), false);
    assert.equal(isValidGitHubUsername("a".repeat(40)), false);
    assert.equal(isValidGitHubUsername("../../admin"), false);
    assert.equal(isValidGitHubUsername("user?q=1"), false);
  });
});

describe("PIN verification & fail-closed resolution", () => {
  it("does not fall back to any hardcoded default PIN", () => {
    assert.equal(resolveConfiguredPin(undefined, undefined), null);
    assert.equal(resolveConfiguredPin("", ""), null);
    assert.equal(resolveConfiguredPin("998877", "112233"), "998877");
    assert.equal(resolveConfiguredPin(null, "112233"), "112233");
  });

  it("compares equal and mismatched lengths in constant time", () => {
    assert.equal(timingSafeCompare("secret123", "secret123"), true);
    assert.equal(timingSafeCompare("secret123", "secret12"), false);
    assert.equal(timingSafeCompare("04032005", "99999999"), false);
  });
});
