export type FieldSeverity = "required" | "soft";

export interface SheetFieldDef {
  key: string;
  label: string;
  col: number; // 0-based column index in the tab
  severity: FieldSeverity;
}

export interface SheetStreamDef {
  key: "expenses" | "payouts" | "revenue";
  tabName: string;
  headerRow: number; // 1-based
  fields: SheetFieldDef[];
  /** field used as the row's stable id; absent → `r{rowNum}` */
  rowIdField?: string;
  /** canonical field whose parsed date drives the legacy cutoff */
  dateField?: string;
  activationFields: string[];
}

export const SHEET_STREAMS: SheetStreamDef[] = [
  {
    key: "expenses",
    tabName: "9 Sept onwards expenditure",
    headerRow: 2,
    rowIdField: "sno",
    dateField: "date",
    activationFields: ["date", "particular", "amount"],
    fields: [
      { key: "sno", label: "S.No", col: 0, severity: "soft" },
      { key: "date", label: "Date", col: 1, severity: "required" },
      { key: "property", label: "Property", col: 2, severity: "required" },
      { key: "particular", label: "Particular", col: 3, severity: "required" },
      { key: "amount", label: "Amount", col: 4, severity: "required" },
      { key: "paidBy", label: "Paid by", col: 5, severity: "required" },
    ],
  },
  {
    // Payouts is a second table sharing the expenditure tab (cols H–J)
    key: "payouts",
    tabName: "9 Sept onwards expenditure",
    headerRow: 2,
    dateField: "date",
    activationFields: ["date", "amount", "beneficiary"],
    fields: [
      { key: "date", label: "Date", col: 7, severity: "required" },
      { key: "amount", label: "Amount", col: 8, severity: "required" },
      { key: "beneficiary", label: "Beneficiary", col: 9, severity: "required" },
    ],
  },
  {
    key: "revenue",
    tabName: "9 Sept onwards revenue",
    headerRow: 2,
    rowIdField: "sno",
    dateField: "dateOfSale",
    activationFields: ["revenue", "type", "guestName", "dateOfSale", "stayDates"],
    fields: [
      { key: "sno", label: "S.No", col: 0, severity: "soft" },
      { key: "property", label: "Property", col: 1, severity: "required" },
      { key: "revenue", label: "Revenue", col: 2, severity: "required" },
      { key: "type", label: "Type", col: 3, severity: "required" },
      { key: "guestName", label: "Guest Name", col: 4, severity: "soft" },
      { key: "dateOfSale", label: "Date of Sale", col: 5, severity: "required" },
      { key: "stayDates", label: "Stay Dates", col: 6, severity: "soft" },
      { key: "rooms", label: "#Rooms", col: 7, severity: "soft" },
      { key: "pax", label: "Pax", col: 8, severity: "soft" },
      { key: "source", label: "Source", col: 9, severity: "soft" },
      { key: "receivedBy", label: "Recd. by", col: 10, severity: "required" },
      { key: "status", label: "Status", col: 11, severity: "required" },
      { key: "comments", label: "Comments", col: 12, severity: "soft" },
    ],
  },
];

export const sheetSyncEnv = {
  fileId: () => process.env.SHEET_FILE_ID ?? "",
  syncFromDate: () => process.env.SHEET_SYNC_FROM_DATE ?? "",
  adminGroupJid: () =>
    process.env.ADMIN_GROUP_JID ?? process.env.ADMIN_WHATSAPP_GROUP_ID ?? "",
  adminDmJid: () => process.env.ADMIN_DM_JID ?? "",
  appBaseUrl: () =>
    process.env.APP_BASE_URL ??
    (process.env.PASSKEY_RP_ID ? `https://${process.env.PASSKEY_RP_ID}` : ""),
};

export const APP_CONFIG_KEYS = {
  syncFromDate: "sheet.syncFromDate",
  watchChannelId: "sheet.watchChannelId",
  watchResourceId: "sheet.watchResourceId",
  watchToken: "sheet.watchToken",
  watchExpiry: "sheet.watchExpiry",
  lastSyncAt: "sheet.lastSyncAt",
};
