import { z } from "zod";
import type { ParsedContact } from "./contact-file-parsers";
import { normalizeContactPhone } from "./phone-normalize";

export interface ImportContact {
  phone: string;
  name?: string;
  email?: string;
}

export interface ContactsManager {
  select(properties: string[], options: { multiple: boolean }): Promise<{
    name?: string[];
    tel?: string[];
    email?: string[];
  }[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

// Invoke directly from the click handler to preserve browser user activation.
export async function pickPhoneContacts(manager: ContactsManager): Promise<ParsedContact[]> {
  const records = await manager.select(["name", "tel", "email"], { multiple: true });
  return records.map((record) => ({
    name: record.name?.[0],
    phones: record.tel ?? [],
    email: record.email?.[0],
  }));
}

const contactEmailSchema = z.string().email().max(254);

export function prepareContacts(raw: ParsedContact[]) {
  const byPhone = new Map<string, ImportContact>();
  let invalid = 0;
  let duplicates = 0;
  for (const contact of raw) {
    const name = contact.name?.trim().slice(0, 120) || undefined;
    const candidate = contact.email?.trim();
    const email = candidate && contactEmailSchema.safeParse(candidate).success
      ? candidate : undefined;
    for (const phone of contact.phones) {
      const normalized = normalizeContactPhone(phone);
      if (!normalized) {
        invalid++;
        continue;
      }
      const existing = byPhone.get(normalized);
      if (existing) {
        existing.name ||= name;
        existing.email ||= email;
        duplicates++;
      } else {
        byPhone.set(normalized, { phone: normalized, name, email });
      }
    }
  }
  return { contacts: [...byPhone.values()], invalid, duplicates };
}
