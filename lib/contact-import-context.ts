import { z } from "zod";

export const importContextSchema = z.object({
  id: z.string().uuid(),
  method: z.enum(["phone_picker", "contact_file"]),
  files: z.array(z.object({
    name: z.string().min(1).max(255),
    format: z.enum(["vcf", "csv"]),
    bytes: z.number().int().min(0).max(20 * 1024 * 1024),
  })).max(100).optional(),
  device: z.object({
    installationId: z.string().uuid().optional(),
    persistence: z.enum(["local_storage", "import_only"]),
    language: z.string().max(80).optional(),
    timezone: z.string().max(100).optional(),
    displayMode: z.enum(["browser", "standalone"]),
  }).optional(),
});
export type ImportContext = z.infer<typeof importContextSchema>;

