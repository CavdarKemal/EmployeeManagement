-- Hardware-Status von custom enum zu VARCHAR konvertieren (Hibernate-Kompatibilität)
ALTER TABLE hardware
    ALTER COLUMN status TYPE VARCHAR(20) USING status::text;

DROP TYPE IF EXISTS hardware_status;
