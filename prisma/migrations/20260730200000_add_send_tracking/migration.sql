-- Seguimiento real de los envios.
-- Todo son columnas nuevas que admiten NULL: no toca ni una fila existente.
ALTER TABLE "prospect_send_logs" ADD COLUMN "provider_message_id" VARCHAR(120);
ALTER TABLE "prospect_send_logs" ADD COLUMN "delivery_status" VARCHAR(20);
ALTER TABLE "prospect_send_logs" ADD COLUMN "delivery_detail" TEXT;
ALTER TABLE "prospect_send_logs" ADD COLUMN "delivery_updated_at" TIMESTAMP(3);

-- El id del proveedor identifica un envio de forma unica: es la clave por la
-- que el webhook encuentra a que envio corresponde cada evento.
CREATE UNIQUE INDEX "prospect_send_logs_provider_message_id_key"
    ON "prospect_send_logs"("provider_message_id");
