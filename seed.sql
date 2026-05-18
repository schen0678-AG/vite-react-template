-- Demo seed for Agenlytics Labs Voice CRM + Dashboard.
-- Wipes leads / contacts / deals and inserts a coherent sample across 3 demo reps:
--   Alex, Jordan, Sam
-- Theme: commercial coffee machines, grinders, roasters, brewing & water-treatment gear.
-- Apply with:  npx wrangler d1 execute pa --local --file=seed.sql

DELETE FROM deals;
DELETE FROM leads;
DELETE FROM contacts;

/* ── Leads ─────────────────────────────────────────────────
   Older than 14 days (pre-window) — feeds all-time conversion rate.
   "Converted" leads are paired with rows in deals below.
*/
INSERT INTO leads (name, company, product_interest, estimated_value, status, summary, language, salesperson, created_at) VALUES
  ('David Chen',     'Aria Café Group',         '3-group commercial espresso machine + grinder bundle', 45000, 'Converted',    'Aria HQ rollout — wants espresso + grinder pair across 3 flagship sites.',     'en-US', 'Alex',   '2026-04-02 09:14:00'),
  ('Sarah Mitchell', 'Coastline Hospitality',   'Multi-site barista equipment fitout (5 venues)',       85000, 'Converted',    'Coastline expanding — 5 new venues need full barista line.',                    'en-US', 'Alex',   '2026-04-05 10:32:00'),
  ('王立',           '上海星壶咖啡设备',         '全自动咖啡机批量采购 (50台)',                          120000, 'Converted',    '上海星壶分销渠道, 计划Q3批量采购50台全自动机.',                                  'zh-CN', 'Jordan', '2026-04-08 11:10:00'),
  ('Priya Sharma',   'Northwind Office Network','Bean-to-cup office machines (12 sites)',               32000, 'Qualified',    'Comparing two vendors — needs maintenance plan included.',                      'en-US', 'Jordan', '2026-04-10 14:45:00'),
  ('James O''Brien', 'Outback Camps Catering',  'Industrial brewing station + water filtration',       150000, 'Contacted',    'Remote camp kitchens — robust gear + filtration critical.',                    'en-US', 'Sam',    '2026-04-12 08:20:00'),
  ('Emma Walsh',     'Coastal Care Group',      'Bean-to-cup machines for aged-care sites',             28000, 'Converted',    'Wants low-maintenance machines residents can operate.',                         'en-US', 'Alex',   '2026-04-15 13:05:00'),
  ('Tom Becker',     'BeckerTrade Retail',      'Entry-level home espresso retail kit',                  8000, 'Not Qualified','Budget too low for commercial range — referred to retail partner.',             'en-US', 'Jordan', '2026-04-20 16:30:00'),
  ('陈博',           '北桥咖啡贸易',             '意式咖啡机分销合作',                                    22000, 'Converted',    '北桥希望成为华东区分销商, 首批意式机采购.',                                       'zh-CN', 'Sam',    '2026-04-22 09:50:00'),
  ('Lucas Romano',   'Romano Restaurants',      'Restaurant barista line + grinder',                    18000, 'Qualified',    'New trattoria opening — needs barista line by July.',                           'en-US', 'Jordan', '2026-04-25 11:15:00'),
  ('Maya Patel',     'BrightPath Universities', 'Campus coffee machine fleet (7 campuses)',             95000, 'Contacted',    '7 campuses — needs procurement approval before progressing.',                   'en-US', 'Alex',   '2026-04-28 15:40:00'),
  ('Andre Lima',     'Lima Food Co',            'Production-line water filtration + staff coffee fleet',60000, 'Converted',    'Food plant — filtration for production + coffee fleet for staff areas.',        'en-US', 'Sam',    '2026-04-30 10:00:00'),
  ('Hannah Wu',      'OceanWide Hotels',        'Luxury hotel barista equipment (Phase 1)',            150000, 'Converted',    'OceanWide Phase 1 — flagship hotel barista fitout greenlit.',                   'en-US', 'Alex',   '2026-05-02 09:00:00');

/* Recent (last 14 days) — mix of statuses, 4 conversions for non-zero recent rate. */
INSERT INTO leads (name, company, product_interest, estimated_value, status, summary, language, salesperson, created_at) VALUES
  ('Oliver Stone',    'Stoneworks Café',        'Compact 2-group espresso machine',                     22000, 'New',       'Inbound enquiry — single-site indie café.',                                       'en-US', 'Alex',   '2026-05-05 08:45:00'),
  ('Grace Hoang',     'EcoFresh Foods',         'Office bean-to-cup pilot (2 sites)',                   18000, 'Converted', 'Pilot scoped at 2 sites — moved to pipeline.',                                    'en-US', 'Alex',   '2026-05-05 10:20:00'),
  ('Mark Reilly',     'Reilly Building Group',  'Site-office coffee machines (rental)',                 12000, 'Contacted', 'Construction site offices — rental model preferred.',                             'en-US', 'Alex',   '2026-05-05 14:10:00'),
  ('Liam Foster',     'FosterAgri Farm Shop',   'Farm-shop barista setup',                               9500, 'New',       'Farm shop adding a café corner — needs compact gear.',                            'en-US', 'Sam',    '2026-05-05 15:30:00'),
  ('Naomi Rivers',    'Rivers Health Clinics',  'Clinic waiting-room coffee machines',                  21000, 'New',       'Bean-to-cup machines for 6 clinic waiting rooms.',                                'en-US', 'Sam',    '2026-05-05 16:50:00'),
  ('张敏',            '深圳锐能办公',            '全自动咖啡机方案 (办公楼)',                            70000, 'Converted', '深圳锐能办公园区采购意向确认, 已进入报价阶段.',                                     'zh-CN', 'Jordan', '2026-05-10 09:15:00'),
  ('Felix Hartmann',  'HarbourTech Towers',     'Office tower bean-to-cup rollout',                     38000, 'New',       'Greenfield office tower — long evaluation cycle expected.',                       'en-US', 'Jordan', '2026-05-10 11:30:00'),
  ('刘晓',            '上海星壶咖啡设备',         '追加采购磨豆机',                                       35000, 'Converted', '老客户追加磨豆机订单, 已发送报价.',                                              'zh-CN', 'Jordan', '2026-05-13 14:20:00'),
  ('Beatrice Lowe',   'Lowe Roastery',          'Commercial roaster + packaging line',                  52000, 'New',       'Roastery expanding — needs 15kg roaster + bagging line.',                         'en-US', 'Alex',   '2026-05-14 10:00:00'),
  ('Ethan Park',      'Park Hospitality',       'Boutique-hotel barista line (2 hotels)',               48000, 'Converted', '2 boutique hotels in scope — joint proposal underway.',                          'en-US', 'Sam',    '2026-05-16 13:00:00'),
  ('Sofia Marin',     'Marin Logistics',        'Warehouse staff café (4 sites)',                       62000, 'New',       'Marin owns 4 warehouses — staff café phased rollout.',                            'en-US', 'Alex',   '2026-05-17 15:45:00'),
  ('赵磊',            '上海蓝海餐饮',            '餐厅咖啡机批量采购',                                   88000, 'New',       '上海蓝海首次接洽, 准备多门店餐厅咖啡机采购.',                                      'zh-CN', 'Jordan', '2026-05-18 09:00:00');

/* ── Contacts ─────────────────────────────────────────────── */
INSERT INTO contacts (name, company, title, email, phone, wechat, notes, source, language, created_at) VALUES
  ('David Chen',     'Aria Café Group',         'Head of Operations',  'david@ariacafe.com.au',     '+61 411 222 333', '',           'Decision maker — prefers email + spec sheets.',         'manual',    'en-US', '2026-04-02 09:30:00'),
  ('Sarah Mitchell', 'Coastline Hospitality',   'Procurement Manager', 'sarah@coastlinehosp.com.au','+61 412 555 666', '',           'Manages 5-site fitout in QLD.',                          'card_scan', 'en-US', '2026-04-05 11:00:00'),
  ('王立',           '上海星壶咖啡设备',         '采购总监',             'liwang@xinghu-coffee.cn',   '+86 138 0011 2233','wang_li_88', '老客户, 习惯微信沟通, 关注交付时间.',                    'voice',     'zh-CN', '2026-04-08 11:30:00'),
  ('Priya Sharma',   'Northwind Office Network','Facilities Director', 'priya@northwind.com.au',    '+61 422 888 999', '',           '12-site office portfolio — weekly cadence.',             'manual',    'en-US', '2026-04-10 15:00:00'),
  ('James O''Brien', 'Outback Camps Catering',  'Camp Logistics Lead', 'james@outbackcamps.com',    '+61 488 100 200', '',           'Best reached after 4pm AWST. Robustness > price.',       'voice',     'en-US', '2026-04-12 08:45:00'),
  ('Emma Walsh',     'Coastal Care Group',      'Facilities Manager',  'emma@coastalcare.com.au',   '+61 433 700 800', '',           'Aged-care — share residents-friendly machine options.',  'card_scan', 'en-US', '2026-04-15 13:30:00'),
  ('陈博',           '北桥咖啡贸易',             '合伙人',              'chen@northbridge-coffee.cn','+86 139 8800 1122','chen_bo_nb', '准备做华东区分销, 关注供货稳定性.',                       'card_scan', 'zh-CN', '2026-04-22 10:15:00'),
  ('Andre Lima',     'Lima Food Co',            'GM Operations',       'andre@limafood.com',        '+61 405 333 444', '',           '24/7 plant — uptime + service contract critical.',       'manual',    'en-US', '2026-04-30 10:30:00'),
  ('Hannah Wu',      'OceanWide Hotels',        'F&B Director',        'hannah.wu@oceanwide.com',   '+61 477 222 111', '',           'Reports to CEO — fast turnaround on Phase 1.',           'card_scan', 'en-US', '2026-05-02 09:30:00'),
  ('Oliver Stone',   'Stoneworks Café',         'Owner',               'oliver@stoneworkscafe.com', '+61 419 600 700', '',           'Solo decision maker. Wants demo before purchase.',       'voice',     'en-US', '2026-05-05 09:00:00'),
  ('张敏',           '深圳锐能办公',            '总经理',              'zhang.min@ruineng.cn',      '+86 137 8800 6677','zhangmin_rn','广东客户, 价格敏感, 看重售后.',                          'voice',     'zh-CN', '2026-05-10 09:45:00'),
  ('Felix Hartmann', 'HarbourTech Towers',      'Head of Tenancy',     'felix@harbourtech.com.au',  '+61 408 555 111', '',           'Long sales cycle — needs total-cost-of-ownership model.','card_scan', 'en-US', '2026-05-10 12:00:00'),
  ('Ethan Park',     'Park Hospitality',        'Property Director',   'ethan@parkhospitality.com', '+61 414 909 808', '',           'Two boutique hotels — wants single joint proposal.',     'manual',    'en-US', '2026-05-16 13:30:00'),
  ('Sofia Marin',    'Marin Logistics',         'COO',                 'sofia@marinlogistics.com',  '+61 423 111 222', '',           'Phase 1 of 4-warehouse staff-café rollout.',             'voice',     'en-US', '2026-05-17 16:00:00');

/* ── Deals ────────────────────────────────────────────────
   11 deals from converted leads + 3 standalone.
   Stages mix: Won, Negotiation, Quote Sent, Quote Prepared,
               New Opportunity, Lost.
*/
INSERT INTO deals (name, lead_id, company, contact_name, stage, probability, deal_value, expected_close_date, notes, language, salesperson, commission_rate, created_at) VALUES
  ('Aria Café – 3-group machine bundle',         (SELECT id FROM leads WHERE name='David Chen'),     'Aria Café Group',         'David Chen',     'Won',             100, 45000, '2026-04-25', 'Closed AUD 45k. Install + barista training booked.',          'en-US', 'Alex',   0.05, '2026-04-03 09:00:00'),
  ('Coastline – 5-venue barista fitout',         (SELECT id FROM leads WHERE name='Sarah Mitchell'), 'Coastline Hospitality',   'Sarah Mitchell', 'Negotiation',      80, 85000, '2026-06-10', 'Final commercial terms under review.',                        'en-US', 'Alex',   0.05, '2026-04-06 10:00:00'),
  ('上海星壶 – 全自动机批量 (50台)',              (SELECT id FROM leads WHERE name='王立'),            '上海星壶咖啡设备',         '王立',           'Won',             100,120000, '2026-05-08', '已签合同, 设备分批发运中.',                                    'zh-CN', 'Jordan', 0.05, '2026-04-09 11:00:00'),
  ('Coastal Care – Bean-to-cup fleet',           (SELECT id FROM leads WHERE name='Emma Walsh'),     'Coastal Care Group',      'Emma Walsh',     'Quote Sent',       50, 28000, '2026-06-01', 'Awaiting board sign-off on machine model.',                   'en-US', 'Alex',   0.05, '2026-04-16 13:00:00'),
  ('北桥咖啡贸易 – 分销合作首批',                  (SELECT id FROM leads WHERE name='陈博'),            '北桥咖啡贸易',             '陈博',           'Quote Prepared',   50, 22000, '2026-06-15', '已准备好两版报价 (含培训/不含培训), 待客户选择.',                'zh-CN', 'Sam',    0.05, '2026-04-23 09:00:00'),
  ('Lima Food – Filtration + staff coffee fleet',(SELECT id FROM leads WHERE name='Andre Lima'),     'Lima Food Co',            'Andre Lima',     'Negotiation',      80, 60000, '2026-06-05', 'Negotiating SLA on filtration service plan.',                 'en-US', 'Sam',    0.05, '2026-05-01 09:30:00'),
  ('OceanWide Hotels – Barista Phase 1',         (SELECT id FROM leads WHERE name='Hannah Wu'),      'OceanWide Hotels',        'Hannah Wu',      'New Opportunity',  25,150000, '2026-08-01', 'Scoping flagship hotel barista fitout.',                      'en-US', 'Alex',   0.05, '2026-05-03 09:00:00'),
  ('EcoFresh – Office bean-to-cup pilot',        (SELECT id FROM leads WHERE name='Grace Hoang'),    'EcoFresh Foods',          'Grace Hoang',    'Quote Prepared',   50, 18000, '2026-06-20', 'Two-site pilot scoped — quote ready.',                        'en-US', 'Alex',   0.05, '2026-05-06 09:00:00'),
  ('深圳锐能 – 办公楼全自动机方案',                (SELECT id FROM leads WHERE name='张敏'),            '深圳锐能办公',             '张敏',           'New Opportunity',  25, 70000, '2026-07-15', '方案草拟中, 价格谈判待启动.',                                   'zh-CN', 'Jordan', 0.05, '2026-05-11 10:00:00'),
  ('上海星壶 – 追加磨豆机订单',                    (SELECT id FROM leads WHERE name='刘晓'),            '上海星壶咖啡设备',         '刘晓',           'Quote Sent',       50, 35000, '2026-06-25', '报价已发, 等待客户确认交付时间.',                                'zh-CN', 'Jordan', 0.05, '2026-05-14 09:30:00'),
  ('Park Hospitality – Boutique barista line',   (SELECT id FROM leads WHERE name='Ethan Park'),     'Park Hospitality',        'Ethan Park',     'New Opportunity',  25, 48000, '2026-08-10', 'Joint proposal across two boutique hotels.',                  'en-US', 'Sam',    0.05, '2026-05-17 10:00:00'),
  ('Acme Cafés – Refurb fleet (20 machines)',    NULL,                                                'Acme Cafés',              'Will Tan',        'Quote Sent',       50, 18000, '2026-06-12', 'Repeat customer — refurb + service contract.',               'en-US', 'Sam',    0.05, '2026-04-18 14:00:00'),
  ('TopFarm Bakery – Brewing station',           NULL,                                                'TopFarm Bakery',          'Karen Liu',       'New Opportunity',  25, 12000, '2026-07-10', 'Channel-partner referral.',                                   'en-US', 'Jordan', 0.05, '2026-05-04 10:00:00'),
  ('Vault Storage Café – Staff coffee corner',   NULL,                                                'Vault Storage',           'Mark Chen',       'Lost',              0,  8000, '2026-05-10', 'Lost to incumbent equipment supplier.',                       'en-US', 'Jordan', 0.05, '2026-04-19 11:00:00');
