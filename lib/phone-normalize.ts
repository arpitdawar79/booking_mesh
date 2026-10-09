/**
 * Normalizes a raw phone string to digits-only, matching the storage format
 * of UserLead.phoneNumber (country code included, no "+").
 * Indian 10-digit mobiles get the "91" prefix; everything else keeps digits.
 */
export function normalizeContactPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;

  // 00-prefixed international dialing → strip the trunk prefix
  if (digits.startsWith("00")) {
    const intl = digits.slice(2);
    return intl.length >= 7 && intl.length <= 15 ? intl : null;
  }

  // "+..." always carries an explicit country code
  if (hasPlus) return digits;

  // Indian mobile: bare 10-digit number starting with 6-9
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;

  // Leading-zero Indian trunk code, e.g. 098765...
  if (digits.startsWith("0") && digits.length === 11 && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}
