-- CreateTable
CREATE TABLE "prospect_leads" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255),
    "address" VARCHAR(500),
    "city" VARCHAR(120),
    "phone" VARCHAR(60),
    "website" VARCHAR(500),
    "rating" DOUBLE PRECISION,
    "reviews_count" INTEGER,
    "search_keyword" VARCHAR(255),
    "segment" VARCHAR(20) NOT NULL DEFAULT 'eventos',
    "intent_score" INTEGER NOT NULL DEFAULT 0,
    "intent_signals" TEXT,
    "email" VARCHAR(255),
    "contact_name" VARCHAR(255),
    "enrichment_notes" TEXT,
    "email_status" VARCHAR(20) NOT NULL DEFAULT 'no_verificado',
    "email_checked_at" TIMESTAMP(3),
    "email_subject" VARCHAR(500),
    "email_body" TEXT,
    "status" VARCHAR(40) NOT NULL DEFAULT 'nuevo',
    "last_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_jobs" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "params" JSONB,
    "status" VARCHAR(10) NOT NULL DEFAULT 'pending',
    "log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "prospect_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_send_logs" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "email_to" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "send_date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "prospect_send_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_suppressions" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_prospect_lead_name_address" ON "prospect_leads"("name", "address");

-- CreateIndex
CREATE UNIQUE INDEX "prospect_suppressions_email_key" ON "prospect_suppressions"("email");
