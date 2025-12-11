-- CreateIndex
CREATE INDEX "Appointment_tenantId_date_idx" ON "Appointment"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Appointment_professionalId_date_idx" ON "Appointment"("professionalId", "date");

-- CreateIndex
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");

-- CreateIndex
CREATE INDEX "Appointment_recurrenceRuleId_idx" ON "Appointment"("recurrenceRuleId");

-- CreateIndex
CREATE INDEX "Review_professionalId_idx" ON "Review"("professionalId");
