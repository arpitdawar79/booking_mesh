CREATE TABLE "contact_imports" (
    "id" UUID NOT NULL,
    "imported_by_id" TEXT,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_ContactImportToUserLead" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContactImportToUserLead_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "contact_imports_imported_by_id_created_at_idx" ON "contact_imports"("imported_by_id", "created_at");
CREATE INDEX "_ContactImportToUserLead_B_index" ON "_ContactImportToUserLead"("B");
ALTER TABLE "contact_imports" ADD CONSTRAINT "contact_imports_imported_by_id_fkey" FOREIGN KEY ("imported_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_ContactImportToUserLead" ADD CONSTRAINT "_ContactImportToUserLead_A_fkey" FOREIGN KEY ("A") REFERENCES "contact_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ContactImportToUserLead" ADD CONSTRAINT "_ContactImportToUserLead_B_fkey" FOREIGN KEY ("B") REFERENCES "user_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
