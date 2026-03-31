INSERT INTO permissions (name)
VALUES
  ('student.read'),
  ('student.create'),
  ('attendance.mark'),
  ('grade.write'),
  ('finance.read')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (tenant_id, name)
SELECT t.id, role_name
FROM tenants t
CROSS JOIN (VALUES ('admin'), ('teacher'), ('accountant'), ('staff')) AS defaults(role_name)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Admin gets all currently defined permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON 1 = 1
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Teacher permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('student.read', 'attendance.mark', 'grade.write')
WHERE r.name = 'teacher'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Accountant permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('student.read', 'finance.read')
WHERE r.name = 'accountant'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Staff permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('student.read', 'attendance.mark')
WHERE r.name = 'staff'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Backfill one-role-per-user from existing users.role enum where possible.
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r
  ON r.tenant_id = u.tenant_id
 AND r.name = u.role::text
ON CONFLICT (user_id) DO NOTHING;
