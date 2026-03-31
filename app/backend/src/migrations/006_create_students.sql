DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
    CREATE TYPE student_status AS ENUM ('active', 'graduated', 'transferred', 'repeating');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS student_id_counters (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  last_number BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id VARCHAR(30) NOT NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  other_names VARCHAR(180),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  status student_status NOT NULL DEFAULT 'active',
  allergies TEXT,
  disabilities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_tenant_student_id_unique
  ON students (tenant_id, student_id);

CREATE INDEX IF NOT EXISTS idx_students_tenant_id
  ON students (tenant_id);

CREATE INDEX IF NOT EXISTS idx_students_tenant_class
  ON students (tenant_id, class_id);

DROP TRIGGER IF EXISTS trg_students_set_updated_at ON students;
CREATE TRIGGER trg_students_set_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_student_id_counters_set_updated_at ON student_id_counters;
CREATE TRIGGER trg_student_id_counters_set_updated_at
BEFORE UPDATE ON student_id_counters
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
