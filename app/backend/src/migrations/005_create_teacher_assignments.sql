CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_assignments_unique
  ON teacher_assignments (tenant_id, teacher_id, class_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher
  ON teacher_assignments (tenant_id, teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_subject
  ON teacher_assignments (tenant_id, class_id, subject_id);
