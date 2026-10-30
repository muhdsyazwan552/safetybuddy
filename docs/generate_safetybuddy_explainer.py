"""Render the source-backed Safety Buddy overview as one readable PNG."""
from PIL import Image, ImageDraw, ImageFont

OUT = r"C:\laragon\www\safetybuddy\docs\safetybuddy-complete-explainer.png"
W, H = 3000, 4890
BG, INK, MUTED = "#F7F5F3", "#211C22", "#5E5A61"
WINE, DARK, GOLD, GREEN = "#850D2C", "#1D2733", "#E6A426", "#147D62"
WHITE, LINE = "#FFFFFF", "#DDD8D8"
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def font(size, bold=False):
    return ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf", size)

def wrap(s, f, width):
    words, lines, line = s.split(), [], ""
    for word in words:
        candidate = (line + " " + word).strip()
        if d.textlength(candidate, font=f) <= width:
            line = candidate
        else:
            if line: lines.append(line)
            line = word
    if line: lines.append(line)
    return lines

def para(s, x, y, width, size=29, color=INK, bold=False, gap=10):
    f = font(size, bold)
    step = size + gap
    for line in wrap(s, f, width):
        d.text((x, y), line, font=f, fill=color)
        y += step
    return y

def card(x, y, w, h, title, lines, accent=WINE, title_size=39, body_size=27):
    d.rounded_rectangle((x, y, x+w, y+h), radius=30, fill=WHITE, outline=LINE, width=3)
    d.rounded_rectangle((x, y, x+w, y+83), radius=30, fill=accent)
    d.rectangle((x, y+52, x+w, y+83), fill=accent)
    d.text((x+28, y+18), title, font=font(title_size, True), fill=WHITE)
    cy = y + 107
    for label, value in lines:
        d.text((x+28, cy), label.upper(), font=font(24, True), fill=accent)
        cy += 32
        cy = para(value, x+28, cy, w-56, body_size, INK, gap=8) + 12
    if cy > y+h-12:
        print("OVERFLOW", title, cy-(y+h))

# Title and scope
d.rounded_rectangle((0, 0, W, 254), radius=0, fill=WINE)
d.text((84, 47), "SAFETY BUDDY 360", font=font(92, True), fill=WHITE)
d.text((88, 158), "WHO CAN DO WHAT  •  MODULE DATA  •  STATUS INDICATORS  •  PDF REPORTS", font=font(37, True), fill="#F7DBE3")

# Product modules
d.text((88, 294), "PRODUCT MODULES", font=font(52, True), fill=INK)
d.text((88, 357), "The module chooser has 4 access indicators: Active · Expired · Locked · Coming soon", font=font(33), fill=MUTED)
product_tiles = [("SAFETY / WSIS", "WORKING", GREEN), ("PRODUCTS & SERVICES", "COMING SOON", DARK),
                 ("CAREERS", "COMING SOON", DARK), ("TRAINING", "COMING SOON", DARK),
                 ("NEWS", "COMING SOON", DARK), ("ASSIST", "COMING SOON", DARK)]
tile_w, tile_gap = 452, 24
for i, (name, status, accent) in enumerate(product_tiles):
    x = 88 + i*(tile_w+tile_gap)
    d.rounded_rectangle((x, 428, x+tile_w, 559), radius=23, fill=WHITE, outline=accent, width=4)
    para(name, x+19, 449, tile_w-38, 29, INK, True, 4)
    d.text((x+19, 512), status, font=font(24, True), fill=accent)

# Role permissions
d.text((88, 615), "ROLES & PERMISSIONS", font=font(52, True), fill=INK)
role_w, role_gap = 674, 32
roles = [
    ("SYSTEM ADMIN", "Users, subscriptions, packages, plans and plan requests. No company Safety operations.", DARK),
    ("COMPANY ADMIN", "Company profile, employees, executors, projects, Safety rules, metrics, inspections, incidents, reports and PDFs.", WINE),
    ("INSPECTOR", "Assigned field work: visits, toolbox, inspections, incidents, projects, attendance and own-record PDFs.", GOLD),
    ("SUPERVISOR / MANAGER", "Supervisor verifies and reviews; Manager gives final approval, reviews penalties and can reopen incidents.", GREEN),
]
for i, (title, body, accent) in enumerate(roles):
    x = 88 + i*(role_w+role_gap)
    d.rounded_rectangle((x, 690, x+role_w, 934), radius=26, fill=WHITE, outline=LINE, width=3)
    d.rounded_rectangle((x, 690, x+role_w, 754), radius=26, fill=accent)
    d.rectangle((x, 730, x+role_w, 754), fill=accent)
    d.text((x+23, 706), title, font=font(34, True), fill=WHITE)
    para(body, x+23, 774, role_w-46, 28, INK, gap=10)

d.text((88, 991), "SUBCONTRACTOR PORTAL", font=font(45, True), fill=INK)
card(88, 1052, 1380, 316, "SUBCON STAFF  ·  public staff link", [
    ("CAN DO", "View staff, Safety Passport rules and machinery; register staff; upload certifications; download Passport PDF."),
    ("ACCESS", "Cannot edit/remove staff or manage attendance, cases, rule acknowledgements or machinery."),
], accent=DARK, title_size=37, body_size=28)
card(1500, 1052, 1412, 316, "SUBCON LEADER  ·  secret leader link", [
    ("CAN DO", "Everything staff can do, plus edit/remove staff, manage certifications, machinery, attendance and NC/CC replies."),
    ("ALSO", "Acknowledge Passport rules; view SPGPNC performance; export all/active staff PDF."),
], accent=GREEN, title_size=37, body_size=28)

# Main module cards
d.text((88, 1425), "SAFETY WORKSPACE: EVERY WORKING AREA", font=font(52, True), fill=INK)
d.text((88, 1489), "Each card shows the stored information, the number of meaningful status indicators and PDF availability.", font=font(31), fill=MUTED)
modules = [
    ("DASHBOARD", "Company safety overview, counts and links to working areas.", "Summary counts; no fixed workflow status.", "No dedicated PDF."),
    ("SAFETY PASSPORT", "Rule topics, content items, active flag, order and leader acknowledgements. Staff tick every rule at registration.", "Topic: 2 active/inactive; company: 2 active/inactive; acknowledgement: done/not done.", "Passport rules PDF: staff + leader."),
    ("COMPLIANCE & PENALTY", "Company scoring metrics and penalty amounts that feed SPGPNC reports.", "Settings; no review workflow.", "Settings appear in daily/monthly PDFs."),
    ("EMPLOYEES", "Main-company staff name, role, email, contact and status; admin creates, updates or removes.", "Staff status stored; no separate approval flow here.", "No dedicated employee PDF."),
    ("EXECUTORS / SUBCONS", "Company, contact, project assignment, staff, Passport, machinery, attendance and cases; separate staff/leader links.", "Company: 2 active/inactive. Staff: 3 pending/active/inactive.", "Executor company PDF; leader staff-list PDF."),
    ("PROJECTS", "Project name, location, dates, progress and assigned company/subcontractor staff.", "4: pending, in progress, completed, cancelled.", "No dedicated project PDF."),
    ("SITE VISITS", "One visit combines optional toolbox talk and one or more inspections; Supervisor verifies, Manager approves.", "4: pending verification, verified, approved, returned.", "Full visit PDF once all parts are approved."),
    ("TOOLBOX TALKS", "Project/date, conducted flag, categories, topics, attendees, photos and Passport sample counts.", "Conducted: 2 yes/no. Review: 4 states.", "Toolbox PDF after approval."),
    ("INSPECTIONS", "Project/date, location, topic, inspector, subcontractor, inspectee, evaluation, description and photos.", "Evaluation: 4 good/poor/NC/CC. Review: 4 states.", "Inspection PDF after approval."),
    ("NON-CONFORMANCE", "Inspection evidence, opening/closing dates, leader corrective response, reviewer return reason/comment.", "4 displayed: open, responded, returned, closed.", "NC case PDF after closure."),
    ("CLIENT COMPLAINT", "Inspection evidence, opening/closing dates, leader response and reviewer feedback.", "4 displayed: open, responded, returned, closed.", "CC case PDF after closure."),
    ("INCIDENTS", "Date/type, injury/body part, project, people, LTI losses, causes, attachment, action and responses.", "3: open, in progress, closed.", "Incident PDF at any stage."),
    ("MANHOURS / ATTENDANCE", "Project/day, subcontractor, workers present, hours per worker and calculated manhours.", "Counts and dates; no approval state.", "Manhour and daily attendance PDFs anytime."),
    ("DAILY REPORTS", "One project/subcon/day: Passport sample, good/poor/NC/CC counts, SPGPNC scores, rank and penalties.", "Review: 4 states. Penalty: 3 pending/confirmed/waived.", "Daily inspection PDF at any stage."),
    ("MONTHLY REPORTS", "One project/subcon/month: approved daily totals, SPGPNC, rank, penalty breakdown and reviewers.", "4: pending verification, verified, approved, returned.", "Monthly inspection PDF at any stage."),
]
module_users = [
    "Company Admin",
    "Admin sets rules; Subcon Staff reads; Leader acknowledges",
    "Company Admin",
    "Company Admin",
    "Admin manages; Subcon Staff/Leader use portal",
    "Admin manages; Inspector and reviewers view",
    "Admin/Inspector records; Supervisor verifies; Manager approves",
    "Admin/Inspector records; Supervisor verifies; Manager approves",
    "Admin/Inspector records; Supervisor verifies; Manager approves",
    "Admin/Inspector raises; Leader replies; reviewers close",
    "Admin/Inspector raises; Leader replies; reviewers close",
    "Admin/Inspector reports; Supervisor closes; Manager reopens",
    "Admin records; Leader marks attendance; Inspector views",
    "Admin/reviewers view; Manager decides penalty",
    "Admin/reviewers view; Supervisor verifies; Manager approves",
]
col_w, col_gap, row_h, row_gap = 912, 30, 505, 20
grid_y = 1560
for i, (title, data, status, pdf) in enumerate(modules):
    col, row = i % 3, i // 3
    x, y = 88 + col*(col_w+col_gap), grid_y + row*(row_h+row_gap)
    card(x, y, col_w, row_h, title, [("Data & actions", data), ("Status indicators", status), ("PDF", pdf), ("Who uses it", module_users[i])],
         accent=[WINE, DARK, GREEN][col], title_size=37, body_size=27)

# Footer: key workflow and report rules
footer_y = 4230
d.rounded_rectangle((88, footer_y, 2912, 4790), radius=32, fill=DARK)
d.text((131, footer_y+38), "HOW RECORDS MOVE TO REPORTS", font=font(47, True), fill=WHITE)
d.text((131, footer_y+111), "RECORD  →  SUPERVISOR VERIFY  →  MANAGER APPROVE  →  PDF", font=font(39, True), fill="#F4D599")
footer_items = [
    "Review workflow: 4 states — Pending verification · Verified · Approved · Returned.",
    "Case workflow: 4 displayed states — Open · Responded · Returned · Closed.",
    "Toolbox, inspection and full visit PDFs need approval; NC/CC PDFs need closure.",
    "Incident, attendance, manhour, daily and monthly PDFs are available before final approval.",
    "Subcon staff need Supervisor + Manager approval. Company Active needs every Passport rule acknowledged.",
]
cy = footer_y+192
for item in footer_items:
    d.ellipse((132, cy+11, 150, cy+29), fill=GOLD)
    cy = para(item, 170, cy, 2660, 31, WHITE, gap=8)+19

d.text((88, 4824), "Source: Safety Buddy application routes, models, screens and PDF controllers · 29 October 2026", font=font(25), fill=MUTED)
img.save(OUT, optimize=True)
print(OUT)
