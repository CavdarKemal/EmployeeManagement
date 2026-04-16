#!/usr/bin/env python3
"""
Generiert drei CSV-Dateien für den Import-Test:
  sample-data/employees.csv   (300 Mitarbeiter)
  sample-data/hardware.csv    (300 Hardware-Assets)
  sample-data/software.csv    (100 Software-Titel)

Semikolon-separiert, Felder in Anführungszeichen, passend zum
CsvImportService des Backends.

Regenerieren mit: python sample-data/generate.py
"""
import csv
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(42)  # deterministisch

OUT_DIR = Path(__file__).parent

# ─── Mitarbeiter ────────────────────────────────────────────────
FIRST_NAMES = [
    "Alexander", "Anna", "Andreas", "Angelika", "Benjamin", "Brigitte",
    "Christian", "Claudia", "Daniel", "Doris", "Elena", "Emil", "Fabian",
    "Franziska", "Gabriel", "Greta", "Hannah", "Heinrich", "Isabella",
    "Ivan", "Jakob", "Julia", "Katharina", "Konstantin", "Laura", "Lukas",
    "Maria", "Markus", "Nadine", "Niklas", "Olivia", "Oskar", "Paula",
    "Peter", "Quentin", "Rebecca", "Robert", "Sabine", "Sebastian", "Tanja",
    "Thomas", "Ursula", "Viktor", "Vanessa", "Wolfgang", "Yvonne", "Zoe",
    "Emre", "Mehmet", "Ayşe", "Fatma", "Kemal", "Selin", "Burak", "Deniz",
    "Giulia", "Marco", "Sofia", "Matteo", "Elena", "Luca", "Amir", "Leila",
]
LAST_NAMES = [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer",
    "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch",
    "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann",
    "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann", "Hartmann",
    "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier",
    "Lehmann", "Schmid", "Schulze", "Maier", "Köhler", "Herrmann",
    "König", "Walter", "Mayer", "Huber", "Kaiser", "Fuchs",
    "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn",
    "Yilmaz", "Demir", "Öztürk", "Kaya", "Çelik", "Arslan",
    "Rossi", "Russo", "Ferrari", "Esposito", "Nguyen", "Pham", "Tran",
]
DEPARTMENTS = ["IT", "HR", "Sales", "Marketing", "Finance", "Operations", "R&D", "Support", "Legal", "Procurement"]
POSITIONS = {
    "IT": ["Software Engineer", "DevOps Engineer", "Tech Lead", "System Administrator", "Data Engineer", "QA Engineer", "Security Analyst"],
    "HR": ["HR Manager", "Recruiter", "HR Business Partner", "Payroll Specialist"],
    "Sales": ["Sales Representative", "Account Manager", "Sales Director", "Key Account Manager"],
    "Marketing": ["Marketing Manager", "Content Creator", "SEO Specialist", "Brand Manager"],
    "Finance": ["Controller", "Accountant", "Financial Analyst", "CFO"],
    "Operations": ["Operations Manager", "Logistics Coordinator", "Supply Chain Analyst"],
    "R&D": ["Research Scientist", "Product Designer", "Innovation Manager"],
    "Support": ["Support Engineer", "Customer Success Manager", "Helpdesk Technician"],
    "Legal": ["Legal Counsel", "Compliance Officer", "Paralegal"],
    "Procurement": ["Buyer", "Procurement Manager", "Vendor Manager"],
}
STREETS = ["Hauptstraße", "Bahnhofstraße", "Dorfstraße", "Schulstraße", "Gartenstraße", "Lindenweg", "Ringstraße", "Bergweg", "Feldweg", "Kirchplatz"]
CITIES_ZIP = [
    ("Berlin", "10115"), ("Hamburg", "20095"), ("München", "80331"),
    ("Köln", "50667"), ("Frankfurt", "60311"), ("Stuttgart", "70173"),
    ("Düsseldorf", "40213"), ("Leipzig", "04109"), ("Dortmund", "44135"),
    ("Essen", "45127"), ("Bremen", "28195"), ("Dresden", "01067"),
    ("Hannover", "30159"), ("Nürnberg", "90402"),
]

def random_date(start_year, end_year):
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

def generate_employees(n=300):
    rows = []
    used_emails = set()
    for i in range(1, n + 1):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        # eindeutige E-Mail durch Zähler
        base = f"{first}.{last}".lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss").replace("ş", "s").replace("ı", "i").replace("ö", "oe").replace("ç", "c").replace("ğ", "g")
        email = f"{base}{i}@firma.test"
        while email in used_emails:
            i += 1
            email = f"{base}{i}@firma.test"
        used_emails.add(email)
        department = random.choice(DEPARTMENTS)
        position = random.choice(POSITIONS[department])
        city, zip_code = random.choice(CITIES_ZIP)
        hire_date = random_date(2018, 2025)
        salary = random.randint(36000, 140000)
        phone = f"+49 {random.randint(30, 89)} {random.randint(1000000, 9999999)}"
        street = f"{random.choice(STREETS)} {random.randint(1, 200)}"
        rows.append({
            "Nr.": f"EMP-{i:04d}",
            "Vorname": first,
            "Nachname": last,
            "E-Mail": email,
            "Telefon": phone,
            "Position": position,
            "Abteilung": department,
            "Eingestellt": hire_date.isoformat(),
            "Gehalt": str(salary),
            "Straße": street,
            "PLZ": zip_code,
            "Stadt": city,
            "Land": "Deutschland",
        })
    return rows

# ─── Hardware ────────────────────────────────────────────────────
HW_CATEGORIES = ["LAPTOP", "DESKTOP", "MONITOR", "PHONE", "TABLET", "ACCESSORY", "SERVER", "PRINTER"]
HW_STATUS_DIST = ["AVAILABLE"] * 70 + ["LOANED"] * 20 + ["MAINTENANCE"] * 5 + ["RETIRED"] * 5

HW_CATALOG = {
    "LAPTOP": [
        ("Dell", ["Latitude 5520", "Latitude 7420", "XPS 13", "XPS 15", "Precision 5570"]),
        ("HP", ["EliteBook 840", "ProBook 450", "ZBook Studio", "Pavilion 15"]),
        ("Lenovo", ["ThinkPad X1 Carbon", "ThinkPad T14", "ThinkPad P1", "Yoga 9i"]),
        ("Apple", ["MacBook Pro 14", "MacBook Pro 16", "MacBook Air M2"]),
        ("Microsoft", ["Surface Laptop 5", "Surface Laptop Studio"]),
    ],
    "DESKTOP": [
        ("Dell", ["OptiPlex 7090", "Precision 3660"]),
        ("HP", ["EliteDesk 800 G9", "Z2 Tower G9"]),
        ("Lenovo", ["ThinkCentre M90t", "ThinkStation P360"]),
        ("Apple", ["iMac 24", "Mac Studio", "Mac mini M2"]),
    ],
    "MONITOR": [
        ("Dell", ["UltraSharp U2723QE", "U2722D", "P2422H"]),
        ("LG", ["27UP850", "34WN780", "32UN880"]),
        ("Samsung", ["Odyssey G7", "ViewFinity S8", "M70B"]),
        ("BenQ", ["PD3220U", "GW2780"]),
        ("Eizo", ["ColorEdge CS2740", "FlexScan EV2795"]),
    ],
    "PHONE": [
        ("Apple", ["iPhone 14", "iPhone 14 Pro", "iPhone 15", "iPhone 15 Pro"]),
        ("Samsung", ["Galaxy S23", "Galaxy S24", "Galaxy A54"]),
        ("Google", ["Pixel 7", "Pixel 8"]),
    ],
    "TABLET": [
        ("Apple", ["iPad Pro 11", "iPad Pro 12.9", "iPad Air"]),
        ("Samsung", ["Galaxy Tab S9", "Galaxy Tab A8"]),
        ("Microsoft", ["Surface Pro 9", "Surface Go 3"]),
    ],
    "ACCESSORY": [
        ("Logitech", ["MX Master 3S", "MX Keys", "C920 Webcam", "Brio 4K"]),
        ("Apple", ["Magic Mouse", "Magic Keyboard", "AirPods Pro"]),
        ("Sony", ["WH-1000XM5", "WF-1000XM4"]),
        ("Jabra", ["Evolve2 75", "Speak 750"]),
    ],
    "SERVER": [
        ("Dell", ["PowerEdge R750", "PowerEdge T550"]),
        ("HP", ["ProLiant DL380 Gen11", "ProLiant ML350 Gen11"]),
        ("Lenovo", ["ThinkSystem SR650", "ThinkSystem ST550"]),
    ],
    "PRINTER": [
        ("HP", ["LaserJet Pro M404dn", "OfficeJet Pro 9015e", "Color LaserJet M454dw"]),
        ("Brother", ["HL-L2370DW", "MFC-L3770CDW"]),
        ("Canon", ["imageCLASS MF445dw", "PIXMA TR8620"]),
    ],
}

def generate_hardware(n=300):
    rows = []
    used_serials = set()
    for i in range(1, n + 1):
        category = random.choices(HW_CATEGORIES, weights=[25, 10, 20, 10, 5, 20, 3, 7])[0]
        manufacturer, models = random.choice(HW_CATALOG[category])
        model = random.choice(models)
        name = f"{manufacturer} {model}"
        status = random.choice(HW_STATUS_DIST)
        price = {
            "LAPTOP": (800, 3500),
            "DESKTOP": (600, 2500),
            "MONITOR": (150, 1800),
            "PHONE": (400, 1500),
            "TABLET": (300, 1800),
            "ACCESSORY": (20, 400),
            "SERVER": (2000, 8000),
            "PRINTER": (150, 900),
        }[category]
        purchase_price = round(random.uniform(*price), 2)
        warranty = random_date(2024, 2029)
        serial = f"{manufacturer[:3].upper()}-{random.randint(10000000, 99999999)}"
        while serial in used_serials:
            serial = f"{manufacturer[:3].upper()}-{random.randint(10000000, 99999999)}"
        used_serials.add(serial)
        rows.append({
            "Asset-Tag": f"HW-{i:04d}",
            "Name": name,
            "Kategorie": category,
            "Hersteller": manufacturer,
            "Modell": model,
            "Seriennummer": serial,
            "Status": status,
            "Kaufpreis": f"{purchase_price:.2f}",
            "Garantie bis": warranty.isoformat(),
            "Notizen": "",
        })
    return rows

# ─── Software ────────────────────────────────────────────────────
SW_CATALOG = [
    # (name, vendor, category, license_type, total_range, cost_range)
    ("Microsoft 365 E3", "Microsoft", "PRODUCTIVITY", "SUBSCRIPTION", (50, 500), (25, 40)),
    ("Microsoft 365 E5", "Microsoft", "PRODUCTIVITY", "SUBSCRIPTION", (10, 100), (50, 75)),
    ("Windows 11 Pro", "Microsoft", "OS", "PERPETUAL", (50, 500), (150, 250)),
    ("Visual Studio Professional", "Microsoft", "DEV_TOOLS", "SUBSCRIPTION", (5, 50), (40, 50)),
    ("Visual Studio Enterprise", "Microsoft", "DEV_TOOLS", "SUBSCRIPTION", (5, 30), (200, 300)),
    ("SQL Server Standard", "Microsoft", "DATABASE", "PERPETUAL", (2, 20), (800, 1500)),
    ("Adobe Creative Cloud", "Adobe", "DESIGN", "SUBSCRIPTION", (10, 100), (50, 80)),
    ("Adobe Photoshop", "Adobe", "DESIGN", "SUBSCRIPTION", (5, 50), (20, 30)),
    ("Adobe Illustrator", "Adobe", "DESIGN", "SUBSCRIPTION", (5, 50), (20, 30)),
    ("Adobe Acrobat Pro DC", "Adobe", "PRODUCTIVITY", "SUBSCRIPTION", (20, 200), (15, 25)),
    ("IntelliJ IDEA Ultimate", "JetBrains", "DEV_TOOLS", "SUBSCRIPTION", (10, 100), (20, 30)),
    ("PyCharm Professional", "JetBrains", "DEV_TOOLS", "SUBSCRIPTION", (5, 50), (10, 20)),
    ("WebStorm", "JetBrains", "DEV_TOOLS", "SUBSCRIPTION", (5, 50), (10, 20)),
    ("DataGrip", "JetBrains", "DEV_TOOLS", "SUBSCRIPTION", (5, 30), (20, 25)),
    ("Rider", "JetBrains", "DEV_TOOLS", "SUBSCRIPTION", (3, 20), (15, 25)),
    ("All Products Pack", "JetBrains", "DEV_TOOLS", "SUBSCRIPTION", (5, 50), (50, 70)),
    ("Jira Software", "Atlassian", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (50, 500), (5, 10)),
    ("Confluence", "Atlassian", "COLLABORATION", "SUBSCRIPTION", (50, 500), (5, 10)),
    ("Bitbucket", "Atlassian", "DEV_TOOLS", "SUBSCRIPTION", (20, 200), (3, 7)),
    ("Slack Business+", "Slack", "COLLABORATION", "SUBSCRIPTION", (50, 500), (10, 15)),
    ("Slack Enterprise Grid", "Slack", "COLLABORATION", "SUBSCRIPTION", (100, 1000), (15, 25)),
    ("Zoom Business", "Zoom", "COLLABORATION", "SUBSCRIPTION", (20, 200), (15, 25)),
    ("Zoom Enterprise", "Zoom", "COLLABORATION", "SUBSCRIPTION", (50, 500), (20, 30)),
    ("GitHub Enterprise", "GitHub", "DEV_TOOLS", "SUBSCRIPTION", (10, 200), (20, 25)),
    ("GitLab Premium", "GitLab", "DEV_TOOLS", "SUBSCRIPTION", (10, 100), (20, 30)),
    ("GitLab Ultimate", "GitLab", "DEV_TOOLS", "SUBSCRIPTION", (5, 50), (80, 100)),
    ("Docker Business", "Docker", "DEV_TOOLS", "SUBSCRIPTION", (10, 100), (15, 25)),
    ("Figma Professional", "Figma", "DESIGN", "SUBSCRIPTION", (5, 50), (12, 18)),
    ("Figma Organization", "Figma", "DESIGN", "SUBSCRIPTION", (10, 100), (40, 50)),
    ("Sketch", "Sketch", "DESIGN", "SUBSCRIPTION", (5, 30), (8, 12)),
    ("Notion Business", "Notion", "PRODUCTIVITY", "SUBSCRIPTION", (20, 200), (8, 15)),
    ("Miro Business", "Miro", "COLLABORATION", "SUBSCRIPTION", (20, 200), (10, 15)),
    ("Asana Business", "Asana", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (20, 200), (20, 30)),
    ("monday.com Pro", "monday.com", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (10, 100), (15, 25)),
    ("Trello Premium", "Atlassian", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (20, 200), (5, 10)),
    ("Salesforce Sales Cloud", "Salesforce", "CRM", "SUBSCRIPTION", (10, 100), (75, 150)),
    ("HubSpot Professional", "HubSpot", "CRM", "SUBSCRIPTION", (5, 50), (800, 1200)),
    ("Zendesk Support", "Zendesk", "SUPPORT", "SUBSCRIPTION", (5, 50), (40, 60)),
    ("Freshdesk", "Freshworks", "SUPPORT", "SUBSCRIPTION", (5, 50), (15, 30)),
    ("DocuSign Business Pro", "DocuSign", "PRODUCTIVITY", "SUBSCRIPTION", (20, 200), (25, 40)),
    ("Dropbox Business", "Dropbox", "STORAGE", "SUBSCRIPTION", (20, 200), (12, 20)),
    ("Box Business", "Box", "STORAGE", "SUBSCRIPTION", (20, 200), (15, 25)),
    ("Google Workspace Business", "Google", "PRODUCTIVITY", "SUBSCRIPTION", (20, 500), (10, 20)),
    ("1Password Business", "1Password", "SECURITY", "SUBSCRIPTION", (20, 500), (7, 10)),
    ("LastPass Teams", "LastPass", "SECURITY", "SUBSCRIPTION", (20, 500), (4, 8)),
    ("Okta Workforce", "Okta", "SECURITY", "SUBSCRIPTION", (50, 500), (4, 10)),
    ("CrowdStrike Falcon", "CrowdStrike", "SECURITY", "SUBSCRIPTION", (50, 500), (50, 100)),
    ("SentinelOne", "SentinelOne", "SECURITY", "SUBSCRIPTION", (50, 500), (40, 80)),
    ("Datadog Pro", "Datadog", "MONITORING", "SUBSCRIPTION", (10, 100), (15, 25)),
    ("New Relic", "New Relic", "MONITORING", "SUBSCRIPTION", (5, 50), (100, 200)),
    ("PagerDuty Business", "PagerDuty", "MONITORING", "SUBSCRIPTION", (5, 50), (20, 40)),
    ("Splunk Enterprise", "Splunk", "MONITORING", "PERPETUAL", (2, 20), (2000, 5000)),
    ("Tableau Creator", "Tableau", "ANALYTICS", "SUBSCRIPTION", (5, 30), (60, 75)),
    ("Power BI Pro", "Microsoft", "ANALYTICS", "SUBSCRIPTION", (20, 200), (8, 12)),
    ("Snowflake Standard", "Snowflake", "DATABASE", "SUBSCRIPTION", (5, 50), (40, 80)),
    ("MongoDB Atlas", "MongoDB", "DATABASE", "SUBSCRIPTION", (5, 30), (50, 150)),
    ("Redis Enterprise", "Redis", "DATABASE", "SUBSCRIPTION", (2, 20), (500, 1000)),
    ("Elastic Enterprise", "Elastic", "MONITORING", "SUBSCRIPTION", (2, 20), (200, 500)),
    ("Postman Business", "Postman", "DEV_TOOLS", "SUBSCRIPTION", (10, 100), (20, 30)),
    ("SonarQube Developer", "SonarSource", "DEV_TOOLS", "SUBSCRIPTION", (5, 30), (150, 250)),
    ("Sentry Business", "Sentry", "MONITORING", "SUBSCRIPTION", (10, 100), (80, 120)),
    ("Terraform Cloud", "HashiCorp", "DEV_TOOLS", "SUBSCRIPTION", (5, 50), (20, 40)),
    ("Vault Enterprise", "HashiCorp", "SECURITY", "SUBSCRIPTION", (5, 30), (300, 500)),
    ("Consul Enterprise", "HashiCorp", "DEV_TOOLS", "SUBSCRIPTION", (5, 30), (200, 400)),
    ("Nomad Enterprise", "HashiCorp", "DEV_TOOLS", "SUBSCRIPTION", (3, 20), (250, 450)),
    ("AutoCAD", "Autodesk", "DESIGN", "SUBSCRIPTION", (5, 50), (200, 300)),
    ("Fusion 360", "Autodesk", "DESIGN", "SUBSCRIPTION", (5, 50), (40, 60)),
    ("Revit", "Autodesk", "DESIGN", "SUBSCRIPTION", (3, 20), (250, 350)),
    ("SolidWorks Standard", "Dassault Systèmes", "DESIGN", "PERPETUAL", (3, 20), (3500, 5000)),
    ("Windows Server 2022", "Microsoft", "OS", "PERPETUAL", (2, 20), (800, 1500)),
    ("VMware vSphere Standard", "VMware", "VIRTUALIZATION", "PERPETUAL", (2, 20), (1000, 1800)),
    ("VMware Workstation Pro", "VMware", "VIRTUALIZATION", "PERPETUAL", (5, 30), (180, 250)),
    ("Parallels Desktop", "Parallels", "VIRTUALIZATION", "SUBSCRIPTION", (5, 50), (80, 120)),
    ("TeamViewer Business", "TeamViewer", "REMOTE_ACCESS", "SUBSCRIPTION", (5, 50), (30, 50)),
    ("AnyDesk Professional", "AnyDesk", "REMOTE_ACCESS", "SUBSCRIPTION", (5, 50), (15, 30)),
    ("Veeam Backup & Replication", "Veeam", "BACKUP", "SUBSCRIPTION", (5, 30), (400, 700)),
    ("Acronis Cyber Protect", "Acronis", "BACKUP", "SUBSCRIPTION", (10, 100), (80, 150)),
    ("Mimecast Email Security", "Mimecast", "SECURITY", "SUBSCRIPTION", (50, 500), (25, 40)),
    ("Proofpoint Essentials", "Proofpoint", "SECURITY", "SUBSCRIPTION", (50, 500), (20, 35)),
    ("KnowBe4 Security Awareness", "KnowBe4", "SECURITY", "SUBSCRIPTION", (50, 500), (15, 25)),
    ("NordVPN Teams", "NordVPN", "SECURITY", "SUBSCRIPTION", (20, 200), (5, 10)),
    ("ExpressVPN for Business", "ExpressVPN", "SECURITY", "SUBSCRIPTION", (20, 200), (7, 12)),
    ("Malwarebytes Endpoint Protection", "Malwarebytes", "SECURITY", "SUBSCRIPTION", (50, 500), (30, 50)),
    ("Kaspersky Endpoint Security", "Kaspersky", "SECURITY", "SUBSCRIPTION", (50, 500), (25, 45)),
    ("Bitdefender GravityZone", "Bitdefender", "SECURITY", "SUBSCRIPTION", (50, 500), (30, 55)),
    ("ESET Endpoint Protection", "ESET", "SECURITY", "SUBSCRIPTION", (50, 500), (25, 45)),
    ("Norton Small Business", "NortonLifeLock", "SECURITY", "SUBSCRIPTION", (20, 200), (50, 90)),
    ("Grammarly Business", "Grammarly", "PRODUCTIVITY", "SUBSCRIPTION", (20, 200), (12, 20)),
    ("Calendly Teams", "Calendly", "PRODUCTIVITY", "SUBSCRIPTION", (10, 100), (10, 16)),
    ("Loom Business", "Loom", "COLLABORATION", "SUBSCRIPTION", (10, 100), (10, 15)),
    ("Airtable Pro", "Airtable", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (10, 100), (15, 25)),
    ("ClickUp Business", "ClickUp", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (10, 100), (10, 20)),
    ("Smartsheet Business", "Smartsheet", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (10, 100), (20, 30)),
    ("Wrike Business", "Wrike", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (10, 100), (20, 30)),
    ("Basecamp Business", "37signals", "PROJECT_MANAGEMENT", "SUBSCRIPTION", (5, 50), (15, 25)),
    ("Todoist Business", "Doist", "PRODUCTIVITY", "SUBSCRIPTION", (10, 100), (5, 10)),
    ("Evernote Business", "Evernote", "PRODUCTIVITY", "SUBSCRIPTION", (10, 100), (10, 15)),
    ("Lucidchart Team", "Lucid", "DESIGN", "SUBSCRIPTION", (5, 50), (8, 12)),
    ("draw.io Business", "JGraph", "DESIGN", "SUBSCRIPTION", (5, 50), (3, 6)),
    ("Balsamiq Cloud", "Balsamiq", "DESIGN", "SUBSCRIPTION", (5, 30), (10, 15)),
    ("InVision Enterprise", "InVision", "DESIGN", "SUBSCRIPTION", (10, 50), (20, 40)),
]

def generate_software(n=100):
    # Wenn n > SW_CATALOG, dupliziere mit Version-Suffix
    rows = []
    for i in range(n):
        idx = i % len(SW_CATALOG)
        name, vendor, category, lic_type, total_range, cost_range = SW_CATALOG[idx]
        # Name ist Unique-Key im Importer → bei Duplikaten mit Suffix
        if i >= len(SW_CATALOG):
            suffix = i // len(SW_CATALOG) + 1
            name = f"{name} ({suffix})"
        total = random.randint(*total_range)
        cost = round(random.uniform(*cost_range), 2)
        renewal = random_date(2026, 2029)
        version = random.choice(["2024", "2025", "2024.2", "2025.1", "11.0", "12.0", "Enterprise", ""])
        rows.append({
            "Name": name,
            "Hersteller": vendor,
            "Version": version,
            "Kategorie": category,
            "Lizenztyp": lic_type,
            "Lizenzen gesamt": str(total),
            "Kosten/Lizenz": f"{cost:.2f}",
            "Erneuerung": renewal.isoformat(),
            "Notizen": "",
        })
    return rows

# ─── CSV schreiben ───────────────────────────────────────────────
def write_csv(path, rows, fieldnames):
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames,
            delimiter=";",
            quotechar='"',
            quoting=csv.QUOTE_ALL,
        )
        writer.writeheader()
        writer.writerows(rows)
    print(f"  {path.name}: {len(rows)} Zeilen")

def main():
    print(f"Ziel-Verzeichnis: {OUT_DIR}")
    employees = generate_employees(300)
    hardware = generate_hardware(300)
    software = generate_software(100)

    write_csv(
        OUT_DIR / "employees.csv", employees,
        ["Nr.", "Vorname", "Nachname", "E-Mail", "Telefon", "Position", "Abteilung", "Eingestellt", "Gehalt", "Straße", "PLZ", "Stadt", "Land"],
    )
    write_csv(
        OUT_DIR / "hardware.csv", hardware,
        ["Asset-Tag", "Name", "Kategorie", "Hersteller", "Modell", "Seriennummer", "Status", "Kaufpreis", "Garantie bis", "Notizen"],
    )
    write_csv(
        OUT_DIR / "software.csv", software,
        ["Name", "Hersteller", "Version", "Kategorie", "Lizenztyp", "Lizenzen gesamt", "Kosten/Lizenz", "Erneuerung", "Notizen"],
    )
    print("Fertig.")

if __name__ == "__main__":
    main()
