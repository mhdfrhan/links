/**
 * Dynamically updates career duration numbers relative to 2022.
 */
export function formatExperienceText(
  text: string,
  currentYear = new Date().getFullYear()
): string {
  if (!text) return "";
  const years = Math.max(1, currentYear - 2022);

  let formatted = text.replace(
    /(pengalaman\s+(?:[^]*?))\b\d+\b(\s+tahun)/gi,
    `$1${years}$2`
  );
  formatted = formatted.replace(
    /(experience\s+(?:[^]*?))\b\d+\b(\s+years)/gi,
    `$1${years}$2`
  );
  formatted = formatted.replace(/\b4\s*tahun/gi, `${years} tahun`);
  formatted = formatted.replace(/\b4\s*years/gi, `${years} years`);
  return formatted;
}
