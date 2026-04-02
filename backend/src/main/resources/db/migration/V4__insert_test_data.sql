INSERT INTO employees (employee_number, first_name, last_name, email, position, department, hire_date, salary)
VALUES
  ('EMP-001', 'Maximilian', 'Bauer',   'm.bauer@firma.de',   'Senior Developer', 'Engineering', '2021-03-15', 85000),
  ('EMP-002', 'Sophie',     'Müller',  's.mueller@firma.de', 'Product Manager',  'Product',     '2020-07-01', 90000),
  ('EMP-003', 'Jonas',      'Weber',   'j.weber@firma.de',   'UX Designer',      'Design',      '2022-01-10', 72000);

INSERT INTO hardware (asset_tag, name, category, manufacturer, model, serial_number, status, purchase_date, warranty_until)
VALUES
  ('HW-0001', 'MacBook Pro 16"', 'LAPTOP',    'Apple',  'MK183D/A', 'C02XY12345', 'AVAILABLE', '2022-06-01', '2025-06-01'),
  ('HW-0002', 'Dell UltraSharp', 'MONITOR',   'Dell',   'U2722D',   'D3L7890',    'AVAILABLE', '2022-06-15', '2025-06-15'),
  ('HW-0003', 'ThinkPad X1',     'LAPTOP',    'Lenovo', 'Gen 10',   'LNV4567',    'AVAILABLE', '2021-11-10', '2024-11-10');

INSERT INTO software (name, vendor, version, category, license_type, total_licenses, cost_per_license, renewal_date)
VALUES
  ('Microsoft 365',    'Microsoft', '2024',   'PRODUCTIVITY', 'SUBSCRIPTION', 50, 12.50, '2025-01-01'),
  ('IntelliJ IDEA',    'JetBrains', '2024.1', 'DEV_TOOLS',    'SUBSCRIPTION', 15, 24.90, '2025-06-30'),
  ('Figma Business',   'Figma',     'Web',    'DESIGN',       'SUBSCRIPTION', 10, 45.00, '2025-09-01');
