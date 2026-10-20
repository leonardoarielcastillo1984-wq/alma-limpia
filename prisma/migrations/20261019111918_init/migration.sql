-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "birthDate" DATE,
    "birthTime" TEXT,
    "birthCity" TEXT,
    "birthCountry" TEXT,
    "birthLat" DOUBLE PRECISION,
    "birthLng" DOUBLE PRECISION,
    "birthTz" TEXT,
    "consent_memory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "sunSign" TEXT,
    "moonSign" TEXT,
    "risingSign" TEXT,
    "lifePath" INTEGER,
    "dailyCardId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notifyDailyCard" BOOLEAN NOT NULL DEFAULT false,
    "notifyHoroscope" BOOLEAN NOT NULL DEFAULT false,
    "notifyRituals" BOOLEAN NOT NULL DEFAULT false,
    "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'night',
    "language" TEXT NOT NULL DEFAULT 'es-AR',
    "deckPreference" TEXT NOT NULL DEFAULT 'rider',
    "extra" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDesc" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "kind" TEXT NOT NULL,
    "engineConfig" JSONB NOT NULL DEFAULT '{}',
    "promptVersionId" UUID,
    "priceArs" INTEGER NOT NULL DEFAULT 0,
    "creditsCost" INTEGER NOT NULL DEFAULT 0,
    "freeDaily" BOOLEAN NOT NULL DEFAULT false,
    "freeLimitPerDay" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" UUID NOT NULL,
    "serviceId" UUID,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "system" TEXT NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceId" UUID,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "purchaseId" UUID,
    "title" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "consultationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_decks" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "backImageUrl" TEXT,
    "cardCount" INTEGER NOT NULL DEFAULT 78,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tarot_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_cards" (
    "id" UUID NOT NULL,
    "deckId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arcana" TEXT NOT NULL,
    "number" INTEGER,
    "uprightKeys" TEXT NOT NULL DEFAULT '',
    "reversedKeys" TEXT NOT NULL DEFAULT '',
    "uprightText" TEXT,
    "reversedText" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tarot_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_readings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "consultationId" UUID,
    "serviceId" UUID,
    "spreadType" TEXT NOT NULL,
    "question" TEXT,
    "seed" TEXT NOT NULL,
    "cards" JSONB NOT NULL,
    "interpretation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarot_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "astrology_charts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'natal',
    "subject" TEXT NOT NULL DEFAULT 'self',
    "name" TEXT,
    "birthDate" DATE NOT NULL,
    "birthTime" TEXT,
    "hasTime" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "country" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "tz" TEXT,
    "data" JSONB NOT NULL,
    "aspects" JSONB NOT NULL DEFAULT '[]',
    "report" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "astrology_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numerology_reports" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'self',
    "name" TEXT,
    "birthDate" DATE NOT NULL,
    "tradition" TEXT NOT NULL DEFAULT 'pythagorean',
    "results" JSONB NOT NULL,
    "report" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "numerology_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rituals" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "safeVariant" JSONB NOT NULL DEFAULT '{}',
    "durationMin" INTEGER NOT NULL DEFAULT 15,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rituals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rituals_saved" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ritualId" UUID NOT NULL,
    "doneAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rituals_saved_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'diario',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "serviceId" UUID,
    "kind" TEXT NOT NULL,
    "amountArs" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "purchaseId" UUID,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "providerEventId" TEXT NOT NULL,
    "providerRef" TEXT,
    "amountArs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_wallets" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CREDITS',

    CONSTRAINT "credit_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refId" UUID,
    "balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planCode" TEXT NOT NULL DEFAULT 'LUNA',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mpPreapprovalId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planCode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "serviceId" UUID,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "serviceSlug" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "rate_limit_events" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "consent_records_userId_type_idx" ON "consent_records"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_categoryId_active_idx" ON "services"("categoryId", "active");

-- CreateIndex
CREATE INDEX "prompt_templates_key_version_idx" ON "prompt_templates"("key", "version");

-- CreateIndex
CREATE INDEX "consultations_userId_createdAt_idx" ON "consultations"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_consultationId_key" ON "conversations"("consultationId");

-- CreateIndex
CREATE INDEX "conversations_userId_updatedAt_idx" ON "conversations"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_decks_slug_key" ON "tarot_decks"("slug");

-- CreateIndex
CREATE INDEX "tarot_cards_deckId_idx" ON "tarot_cards"("deckId");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_cards_deckId_code_key" ON "tarot_cards"("deckId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_readings_consultationId_key" ON "tarot_readings"("consultationId");

-- CreateIndex
CREATE INDEX "tarot_readings_userId_createdAt_idx" ON "tarot_readings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "astrology_charts_userId_idx" ON "astrology_charts"("userId");

-- CreateIndex
CREATE INDEX "numerology_reports_userId_idx" ON "numerology_reports"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rituals_slug_key" ON "rituals"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rituals_saved_userId_ritualId_key" ON "rituals_saved"("userId", "ritualId");

-- CreateIndex
CREATE INDEX "journals_userId_kind_createdAt_idx" ON "journals"("userId", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_serviceId_key" ON "favorites"("userId", "serviceId");

-- CreateIndex
CREATE INDEX "purchases_userId_status_idx" ON "purchases"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerEventId_key" ON "payments"("providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_wallets_userId_key" ON "credit_wallets"("userId");

-- CreateIndex
CREATE INDEX "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "memberships_userId_active_idx" ON "memberships"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_events_key_action_createdAt_idx" ON "rate_limit_events"("key", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_cards" ADD CONSTRAINT "tarot_cards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "tarot_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_readings" ADD CONSTRAINT "tarot_readings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_readings" ADD CONSTRAINT "tarot_readings_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_readings" ADD CONSTRAINT "tarot_readings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "astrology_charts" ADD CONSTRAINT "astrology_charts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numerology_reports" ADD CONSTRAINT "numerology_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rituals_saved" ADD CONSTRAINT "rituals_saved_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rituals_saved" ADD CONSTRAINT "rituals_saved_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES "rituals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_wallets" ADD CONSTRAINT "credit_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
