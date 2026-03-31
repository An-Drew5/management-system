DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'user_role'
         AND e.enumlabel = 'guardian'
     ) THEN
    ALTER TYPE user_role ADD VALUE 'guardian';
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_tenant_id
  ON guardians (tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_tenant_user
  ON guardians (tenant_id, user_id);

CREATE TABLE IF NOT EXISTS student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_guardians_unique
  ON student_guardians (student_id, guardian_id);

CREATE INDEX IF NOT EXISTS idx_student_guardians_student
  ON student_guardians (student_id);

CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian
  ON student_guardians (guardian_id);

INSERT INTO roles (tenant_id, name)
SELECT t.id, 'guardian'
FROM tenants t
ON CONFLICT (tenant_id, name) DO NOTHING;
