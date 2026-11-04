import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F4F4F8")
    
    # Border
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>\n'
        f'  <w:left w:val="single" w:sz="18" w:space="0" w:color="D32F2F"/>\n'
        f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>\n'
        f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(code_text.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_heading(p, text, size=14, bold=True, color=(160, 20, 20), space_before=12, space_after=6):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(*color)
    return p

def add_body_p(doc, text, bold_prefix=None, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.25
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(11.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(20, 20, 20)
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11.5)
    run.font.color.rgb = RGBColor(40, 40, 40)
    return p

def build_student_report():
    doc = docx.Document()
    
    # 1 inch margins
    for sec in doc.sections:
        sec.top_margin = Inches(1)
        sec.bottom_margin = Inches(1)
        sec.left_margin = Inches(1)
        sec.right_margin = Inches(1)

    # ==================== COVER PAGE ====================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("PES UNIVERSITY\n")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(18)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(0, 32, 96)
    
    r_inst2 = p_inst.add_run("Electronic City Campus, Hosur Road, Bengaluru – 560 100\nDepartment of Computer Science and Engineering\n\n\n")
    r_inst2.font.name = "Times New Roman"
    r_inst2.font.size = Pt(12)
    r_inst2.font.color.rgb = RGBColor(80, 80, 80)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = p_title.add_run("MOTORSPORT RACE PERFORMANCE AND STRATEGY MANAGEMENT SYSTEM\n")
    r_t.font.name = "Times New Roman"
    r_t.font.size = Pt(18)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(180, 0, 0)
    
    r_sub = p_title.add_run("A Hybrid Relational (MySQL) and Document-Store (MongoDB) Multi-Model Architecture for Formula 1 Race Analytics\n\n\n")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(12)
    r_sub.font.italic = True
    r_sub.font.color.rgb = RGBColor(60, 60, 60)

    p_mid = doc.add_paragraph()
    p_mid.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_mid = p_mid.add_run(
        "A Project Report submitted in partial fulfilment of the course requirements for the award of degree of\n"
        "Bachelor of Technology\n"
        "in\n"
        "Computer Science & Engineering\n"
        "Course: UE24CS351A – Database Management Systems Project\n"
        "Fifth Semester, Academic Year 2026\n\n\n"
    )
    r_mid.font.name = "Times New Roman"
    r_mid.font.size = Pt(11)

    # Student Details
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub_h = p_sub.add_run("Submitted by:\n\n")
    r_sub_h.font.name = "Times New Roman"
    r_sub_h.font.size = Pt(13)
    r_sub_h.font.bold = True
    
    r_names = p_sub.add_run(
        "Mokshitreddy Nallaballe (PES2UG24CS284)\n"
        "Manav Dewangan (PES2UG24CS262)\n\n"
        "Fifth Semester, Section 'E', Team 8\n"
        "Department of Computer Science & Engineering\n"
        "PES University, Electronic City Campus\n"
    )
    r_names.font.name = "Times New Roman"
    r_names.font.size = Pt(12)

    doc.add_page_break()

    # ==================== CERTIFICATE ====================
    p_cert = doc.add_paragraph()
    p_cert.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_c = p_cert.add_run("PES UNIVERSITY\n")
    r_c.font.name = "Times New Roman"
    r_c.font.size = Pt(16)
    r_c.font.bold = True
    r_c.font.color.rgb = RGBColor(0, 32, 96)
    p_cert.add_run("(Established under Karnataka Act No. 16 of 2013)\nElectronic City Campus, Hosur Road, Bengaluru – 560 100\n\n").font.size = Pt(10.5)

    p_ch = doc.add_paragraph()
    p_ch.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ch = p_ch.add_run("CERTIFICATE\n")
    r_ch.font.name = "Times New Roman"
    r_ch.font.size = Pt(15)
    r_ch.font.bold = True
    r_ch.font.underline = True

    add_body_p(
        doc,
        "This is to certify that the DBMS Level 3 Project entitled \"Motorsport Race Performance and Strategy Management System\" is a bonafide work carried out by Mokshitreddy Nallaballe (PES2UG24CS284) and Manav Dewangan (PES2UG24CS262), students of Fifth Semester B.Tech in Computer Science and Engineering, PES University, Bengaluru, in partial fulfilment of the requirements for the completion of fifth semester DBMS Project (UE24CS351A) in the Program of Study - Bachelor of Technology in Computer Science and Engineering under rules and regulations of PES University, Bengaluru during the period August 2026 – December 2026.\n\n"
        "It is certified that all corrections and suggestions indicated for assessment have been incorporated in the report. The project has been approved as it satisfies the 5th semester academic requirements in respect of project work."
    )

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(50)
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_sig = p_sig.add_run("Faculty Evaluator / Internal Examiner\nDepartment of Computer Science & Engineering\nPES University, Electronic City Campus")
    r_sig.font.name = "Times New Roman"
    r_sig.font.size = Pt(11)
    r_sig.font.bold = True

    doc.add_page_break()

    # ==================== DECLARATION ====================
    p_dec = doc.add_paragraph()
    p_dec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_dh = p_dec.add_run("DECLARATION\n")
    r_dh.font.name = "Times New Roman"
    r_dh.font.size = Pt(15)
    r_dh.font.bold = True
    r_dh.font.underline = True

    add_body_p(
        doc,
        "We hereby declare that the DBMS Project entitled \"Motorsport Race Performance and Strategy Management System\" has been carried out independently by us in partial fulfilment of the course requirements for the award of degree of Bachelor of Technology in Computer Science and Engineering of PES University, Bengaluru during the academic semester August – December 2026.\n\n"
        "We further confirm that this work is original, has not been submitted in part or full for any other degree or diploma to any university, and complies strictly with the academic code of integrity."
    )

    p_names = doc.add_paragraph()
    p_names.paragraph_format.space_before = Pt(40)
    r_nm = p_names.add_run(
        "Date: November 4, 2026\n"
        "Place: Bengaluru\n\n\n"
        "1. Mokshitreddy Nallaballe (PES2UG24CS284)\n"
        "2. Manav Dewangan (PES2UG24CS262)\n"
        "Team 8, Section 5E"
    )
    r_nm.font.name = "Times New Roman"
    r_nm.font.size = Pt(11)
    r_nm.font.bold = True

    doc.add_page_break()

    # ==================== TABLE OF CONTENTS ====================
    p_toc = doc.add_paragraph()
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_tc = p_toc.add_run("TABLE OF CONTENTS\n")
    r_tc.font.name = "Times New Roman"
    r_tc.font.size = Pt(15)
    r_tc.font.bold = True

    toc_items = [
        ("1. INTRODUCTION", "1"),
        ("   1.1 Domain Overview & Background", "1"),
        ("   1.2 Problem Statement", "1"),
        ("   1.3 Project Objectives & Scope", "2"),
        ("2. PROBLEM DEFINITION & DATABASE JUSTIFICATION", "3"),
        ("   2.1 Relational vs. High-Frequency Telemetry Data Mismatch", "3"),
        ("   2.2 Justification for MySQL (Structured ACID Engine)", "3"),
        ("   2.3 Justification for MongoDB (Time-Series & Incident Store)", "4"),
        ("3. ER MODEL DESIGN", "5"),
        ("   3.1 Entities and Attributes Identification", "5"),
        ("   3.2 Cardinality & Participation Constraints", "6"),
        ("4. ER TO RELATIONAL & DOCUMENT MAPPING", "7"),
        ("   4.1 Relational Schema Mapping Steps (3NF Normalization)", "7"),
        ("   4.2 MongoDB Document Schema Design & BSON Validation", "8"),
        ("5. DDL STATEMENTS IMPLEMENTATION", "10"),
        ("   5.1 MySQL Tables, Primary & Foreign Keys, Constraints", "10"),
        ("   5.2 MongoDB Collections & Compound Indexing Strategy", "13"),
        ("6. DML STATEMENTS & DATA PIPELINES", "15"),
        ("   6.1 Relational 2023 Season Data Ingestion (Jolpica Ergast)", "15"),
        ("   6.2 OpenF1 Live Telemetry & Incident ETL Pipeline", "16"),
        ("   6.3 Standard DML Operations (SELECT, INSERT, UPDATE, DELETE)", "17"),
        ("7. SQL ANALYTICAL QUERIES & MONGODB AGGREGATIONS", "18"),
        ("   7.1 5 Advanced SQL Queries (Joins, Subqueries, Aggregates)", "18"),
        ("   7.2 MongoDB Multi-Stage Aggregation Pipeline (Speed Trap)", "21"),
        ("8. STORED PROCEDURES, FUNCTIONS, TRIGGERS & VIEWS", "23"),
        ("   8.1 Relational Views (Race Classification & Season Standings)", "23"),
        ("   8.2 Stored Procedure (sp_get_driver_season_summary)", "24"),
        ("   8.3 Database Trigger (trg_validate_pit_stop_duration)", "25"),
        ("9. FRONT-END APPLICATION & API INTEGRATION", "26"),
        ("   9.1 Next.js 14 App Router & API Route Handlers", "26"),
        ("   9.2 Role-Based Access Control (Race Strategist vs. Viewer)", "27"),
        ("   9.3 Interactive Head-to-Head SVG Telemetry Comparison Studio", "28"),
        ("   9.4 Real-Time Incident Feed & Speed Trap Leaderboard", "29"),
        ("10. TESTING & VALIDATION RESULTS", "30"),
        ("   10.1 Automated Test Suite Execution (11/11 Cases Passed)", "30"),
        ("   10.2 Edge Cases, Input Validation & Security Verification", "31"),
        ("11. INDIVIDUAL MEMBER CONTRIBUTIONS & DIVISION OF WORK", "32"),
        ("12. CONCLUSION & FUTURE ENHANCEMENTS", "33")
    ]

    t_toc = doc.add_table(rows=len(toc_items), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (head, pg) in enumerate(toc_items):
        t_toc.rows[idx].cells[0].text = head
        t_toc.rows[idx].cells[1].text = pg
        t_toc.rows[idx].cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        for c in t_toc.rows[idx].cells:
            for p in c.paragraphs:
                p.paragraph_format.line_spacing = 1.15
                for r in p.runs:
                    r.font.name = "Times New Roman"
                    r.font.size = Pt(10.5)

    doc.add_page_break()

    # ==================== CHAPTER 1 ====================
    format_heading(doc.add_paragraph(), "1. INTRODUCTION", size=16)
    
    format_heading(doc.add_paragraph(), "1.1 Domain Overview & Background", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "Modern professional motorsport, and specifically Formula 1, represents one of the most technologically advanced and data-intensive engineering environments in the world. During a Grand Prix weekend across practice, qualifying, and the main Sunday race, each car is equipped with hundreds of physical and virtual telemetry sensors transmitting data at rates between 10 Hz and 50 Hz. Engineers on the pit wall and back at factory mission control rooms must monitor vehicle speed, throttle application percentages, engine rotations per minute (RPM), gear shifts, Drag Reduction System (DRS) activations, and brake pressure in real-time to make critical undercut/overcut pit stop strategy calls."
    )
    add_body_p(
        doc,
        "Simultaneously, the sport is governed by strict sporting and technical regulations. Season-long World Championship points, official race classifications, qualifying times accurate to three decimal places (milliseconds), constructor affiliations, circuit geographies, and pit lane transit durations must be preserved with strict referential integrity, absolute consistency, and zero data corruption."
    )

    format_heading(doc.add_paragraph(), "1.2 Problem Statement", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "Historically, motorsport systems either focused solely on high-level tabular standings or isolated proprietary telemetry loggers. Attempting to force both types of data into a single database engine creates an architectural dilemma:\n"
        "1. Relational databases like MySQL excel at structured 3NF normalization, foreign key constraints, and transactional isolation, but buckle under the massive write-throughput and dynamic polymorphism required by millions of sensor metric snapshots.\n"
        "2. Document stores like MongoDB excel at storing unstructured, time-series telemetry streams, but lack native multi-table relational normalization and strict foreign key referential cascading for championship governance.\n\n"
        "Consequently, there is an imperative engineering need for a Multi-Model Hybrid Database Management System that integrates MySQL 8+ and MongoDB into a unified full-stack web application."
    )

    format_heading(doc.add_paragraph(), "1.3 Project Objectives & Scope", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "The primary objectives of this Level 3 DBMS project are:\n"
        "• Schema Design: Architect a 9-table relational database in 3NF for MySQL 8+ and design two high-throughput MongoDB collections for vehicle telemetry and race control incidents.\n"
        "• Data Pipelines: Build an automated ETL ingestion pipeline pulling the official 2023 Formula 1 World Championship dataset (22 Grands Prix) via Jolpica Ergast API and OpenF1 telemetry endpoints.\n"
        "• Advanced Database Operations: Implement SQL Views, Stored Procedures, and Triggers in MySQL, alongside MongoDB compound indexing and multi-stage aggregation pipelines for speed trap analytics.\n"
        "• Full-Stack Interface: Develop a Next.js 14 web application featuring role-based authorization (Race Strategist vs. Spectator) with an interactive SVG telemetry comparison trace."
    )

    doc.add_page_break()

    # ==================== CHAPTER 2 ====================
    format_heading(doc.add_paragraph(), "2. PROBLEM DEFINITION & DATABASE JUSTIFICATION", size=16)

    format_heading(doc.add_paragraph(), "2.1 Relational vs. High-Frequency Telemetry Data Mismatch", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "A critical requirement of the PES University DBMS Level 3 rubric is providing sound academic and technical justification for using multiple database paradigms. Table 2.1 contrasts the distinct characteristics of motorsport data entities:"
    )

    t_cmp = doc.add_table(rows=5, cols=3)
    t_cmp.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Data Category", "MySQL Relational (SQL)", "MongoDB Document Store (NoSQL)"]
    for i, h in enumerate(headers):
        t_cmp.rows[0].cells[i].text = h
        set_cell_background(t_cmp.rows[0].cells[i], "D32F2F")
        t_cmp.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        t_cmp.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True

    rows_data = [
        ("Data Nature", "Structured, tabular, rigid schema", "Time-series, semi-structured, variable schema"),
        ("Write Velocity", "Batch updates, low-frequency writes", "High-frequency streaming (10–50 samples/sec/car)"),
        ("Integrity Requirement", "ACID guarantees, foreign key cascades", "Eventual consistency, high read/write throughput"),
        ("Use Case Example", "Race results, pit stops, points standings", "Instantaneous car speed, RPM, DRS, race flags")
    ]
    for r_idx, r in enumerate(rows_data):
        for c_idx, val in enumerate(r):
            t_cmp.rows[r_idx + 1].cells[c_idx].text = val
            if r_idx % 2 == 1:
                set_cell_background(t_cmp.rows[r_idx + 1].cells[c_idx], "F8F9FA")

    format_heading(doc.add_paragraph(), "2.2 Justification for MySQL (Structured ACID Engine)", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "MySQL 8+ was selected for core race results and championship governance because:\n"
        "1. Referential Integrity: A driver cannot participate in a non-existent race. Foreign keys with ON DELETE RESTRICT prevent accidental deletion of circuit or team entities, while ON DELETE CASCADE cleanly purges race results if a race session is invalidated.\n"
        "2. Exact Precision & Normalization: Pit stop durations require DECIMAL(8,3) to avoid IEEE floating-point rounding inaccuracies. Normalizing driver and constructor data into 3NF eliminates redundant storage of nationalities and team headquarters.\n"
        "3. ACID Compliance: Championship point adjustments and grid penalties require atomic transactional updates."
    )

    format_heading(doc.add_paragraph(), "2.3 Justification for MongoDB (Telemetry & Incident Store)", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "MongoDB was selected as the NoSQL document store for vehicle telemetry and incident timelines because:\n"
        "1. Schema Flexibility: Sensor arrays vary across vehicle manufacturers and race control incident messages have polymorphic structures (Safety Cars vs. Red Flags vs. Stewards' investigations). Imposing rigid relational tables causes extensive NULL values.\n"
        "2. Non-blocking Ingestion: MongoDB handles millions of time-series telemetry documents without index locking contention.\n"
        "3. Aggregation Framework: MongoDB's native aggregation pipeline allows rapid grouping by driver and lap to calculate speed trap maxima, average throttle percentages, and DRS activations without taxing the relational engine."
    )

    doc.add_page_break()

    # ==================== CHAPTER 3 & 4 ====================
    format_heading(doc.add_paragraph(), "3. ER MODEL & RELATIONAL MAPPING", size=16)
    
    format_heading(doc.add_paragraph(), "3.1 Entities and Relationships", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "The relational data model comprises 10 entities structured to satisfy Third Normal Form (3NF):\n"
        "1. TEAM: Stores constructor information (team_id, team_name, nationality, base, unique jolpica_constructor_id).\n"
        "2. DRIVER: Stores racing personnel (driver_id, driver_name, nationality, dob, team_id, unique jolpica_driver_id).\n"
        "3. SEASON: Defines the championship calendar year (season_id, year, start_date, end_date).\n"
        "4. CIRCUIT: Identifies physical race track venues (circuit_id, circuit_name, location, country, jolpica_circuit_id).\n"
        "5. RACE: Represents a specific Grand Prix event (race_id, season_id, circuit_id, round_no, race_date).\n"
        "6. QUALIFYING_RESULT: Contains knockout qualifying session times (qualifying_id, race_id, driver_id, position, q1_time, q2_time, q3_time).\n"
        "7. RACE_RESULT: Stores final classified finishing order, points, grid position, and status (result_id, race_id, driver_id, team_id, position, points, laps_completed, status).\n"
        "8. PIT_STOP: Tracks tyre strategy execution (stop_id, race_id, driver_id, lap_number, stop_time, duration).\n"
        "9. DRIVER_STANDING: Maintains season championship totals (standing_id, season_id, driver_id, position, points, wins).\n"
        "10. STRATEGY_NOTE: Facilitates race engineer tactical planning with role authorization (note_id, race_id, author_role, title, content, recommended_tyre, created_at)."
    )

    format_heading(doc.add_paragraph(), "4. NOSQL DOCUMENT SCHEMA DESIGN (MongoDB)", size=16)
    add_body_p(
        doc,
        "Database Name: motorsport_telemetry\n\n"
        "Two high-throughput collections were engineered with BSON JSON Schema validators to ensure data fidelity:"
    )

    add_body_p(doc, "Collection 1: telemetry_samples", bold_prefix="Collection: ")
    add_code_block(
        doc,
        "{\n"
        "  \"_id\": ObjectId(\"6543210987abcdef01234567\"),\n"
        "  \"race_id\": 1,                         // Foreign reference to MySQL race.race_id\n"
        "  \"driver_id\": 1,                       // Foreign reference to MySQL driver.driver_id\n"
        "  \"driver_code\": \"VER\",                 // Acronym identifier (VER, HAM, ALO)\n"
        "  \"lap_number\": 15,\n"
        "  \"timestamp\": \"2023-03-05T15:24:12.100Z\",\n"
        "  \"telemetry\": {\n"
        "    \"speed\": 324.5,                    // Vehicle speed in km/h\n"
        "    \"throttle\": 100.0,                 // Throttle application % (0-100)\n"
        "    \"brake\": 0,                        // Brake application status (0 or 1)\n"
        "    \"rpm\": 11850,                      // Engine rotations per minute\n"
        "    \"gear\": 7,                         // Transmission gear (1-8)\n"
        "    \"drs\": 1                           // Drag Reduction System (0 = Off, 1 = On)\n"
        "  },\n"
        "  \"source\": \"OpenF1 API\"\n"
        "}"
    )

    add_body_p(doc, "Compound Index on Telemetry:", bold_prefix="Indexing: ")
    add_code_block(doc, "db.telemetry_samples.createIndex({ race_id: 1, driver_id: 1, lap_number: 1 }, { name: 'idx_race_driver_lap' });")

    add_body_p(doc, "Collection 2: race_events", bold_prefix="Collection: ")
    add_code_block(
        doc,
        "{\n"
        "  \"_id\": ObjectId(\"6543210987abcdef01234589\"),\n"
        "  \"race_id\": 1,\n"
        "  \"lap_number\": 41,\n"
        "  \"timestamp\": \"2023-03-05T16:04:18Z\",\n"
        "  \"event_type\": \"Virtual Safety Car\",  // Safety Car, Red Flag, Yellow Flag, Penalty\n"
        "  \"driver_id\": 5,\n"
        "  \"driver_name\": \"Charles Leclerc\",\n"
        "  \"description\": \"Power unit electrical failure. Stopped at Turn 3. VSC deployed.\",\n"
        "  \"severity\": \"High\"\n"
        "}"
    )
    add_body_p(doc, "Compound Index on Events:", bold_prefix="Indexing: ")
    add_code_block(doc, "db.race_events.createIndex({ race_id: 1, event_type: 1 }, { name: 'idx_race_event_type' });")

    doc.add_page_break()

    # ==================== CHAPTER 5 ====================
    format_heading(doc.add_paragraph(), "5. DDL STATEMENTS IMPLEMENTATION", size=16)
    add_body_p(
        doc,
        "The complete Data Definition Language (DDL) statements implemented in MySQL (motorsport_db) demonstrate appropriate use of PRIMARY KEY, FOREIGN KEY, AUTO_INCREMENT, UNIQUE, and CHECK constraints:"
    )

    add_code_block(
        doc,
        "-- 1. TEAM TABLE\n"
        "CREATE TABLE IF NOT EXISTS team (\n"
        "    team_id INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    team_name VARCHAR(100) NOT NULL,\n"
        "    nationality VARCHAR(50),\n"
        "    base VARCHAR(100),\n"
        "    jolpica_constructor_id VARCHAR(50) UNIQUE\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n"
        "-- 2. DRIVER TABLE\n"
        "CREATE TABLE IF NOT EXISTS driver (\n"
        "    driver_id INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    driver_name VARCHAR(100) NOT NULL,\n"
        "    nationality VARCHAR(50),\n"
        "    dob DATE,\n"
        "    team_id INT,\n"
        "    jolpica_driver_id VARCHAR(50) UNIQUE,\n"
        "    FOREIGN KEY (team_id) REFERENCES team(team_id) ON DELETE SET NULL\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n"
        "-- 3. RACE TABLE\n"
        "CREATE TABLE IF NOT EXISTS race (\n"
        "    race_id INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    season_id INT NOT NULL,\n"
        "    circuit_id INT NOT NULL,\n"
        "    round_no INT NOT NULL,\n"
        "    race_date DATE NOT NULL,\n"
        "    UNIQUE (season_id, round_no),\n"
        "    FOREIGN KEY (season_id) REFERENCES season(season_id) ON DELETE CASCADE,\n"
        "    FOREIGN KEY (circuit_id) REFERENCES circuit(circuit_id) ON DELETE RESTRICT\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n"
        "-- 4. PIT_STOP TABLE (WITH CHECK CONSTRAINTS)\n"
        "CREATE TABLE IF NOT EXISTS pit_stop (\n"
        "    stop_id INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    race_id INT NOT NULL,\n"
        "    driver_id INT NOT NULL,\n"
        "    lap_number INT NOT NULL,\n"
        "    stop_time TIME,\n"
        "    duration DECIMAL(8,3),\n"
        "    CHECK (lap_number > 0),\n"
        "    CHECK (duration IS NULL OR duration >= 0),\n"
        "    FOREIGN KEY (race_id) REFERENCES race(race_id) ON DELETE CASCADE,\n"
        "    FOREIGN KEY (driver_id) REFERENCES driver(driver_id) ON DELETE RESTRICT\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n"
        "-- 5. STRATEGY NOTE TABLE (ROLE AUTHORIZATION)\n"
        "CREATE TABLE IF NOT EXISTS strategy_note (\n"
        "    note_id INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    race_id INT NOT NULL,\n"
        "    author_role ENUM('Strategist', 'Admin', 'Viewer') DEFAULT 'Strategist',\n"
        "    title VARCHAR(150) NOT NULL,\n"
        "    content TEXT NOT NULL,\n"
        "    recommended_tyre VARCHAR(50),\n"
        "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n"
        "    FOREIGN KEY (race_id) REFERENCES race(race_id) ON DELETE CASCADE\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    )

    doc.add_page_break()

    # ==================== CHAPTER 6 ====================
    format_heading(doc.add_paragraph(), "6. DML STATEMENTS & DATA PIPELINES", size=16)
    add_body_p(
        doc,
        "The project demonstrates all four core Data Manipulation Language (DML) operations (SELECT, INSERT, UPDATE, DELETE) across both database paradigms."
    )

    add_body_p(doc, "1. INSERT Operation (SQL & NoSQL):", bold_prefix="Operation: ")
    add_code_block(
        doc,
        "-- MySQL INSERT: Strategy Recommendation\n"
        "INSERT INTO strategy_note (race_id, author_role, title, content, recommended_tyre)\n"
        "VALUES (1, 'Strategist', 'Round 1 Bahrain Undercut', 'Pit lap 14 onto Hard tyres.', 'Hard');\n\n"
        "// MongoDB INSERT: Race Incident Logging\n"
        "db.race_events.insertOne({\n"
        "  race_id: 1,\n"
        "  lap_number: 41,\n"
        "  timestamp: new Date().toISOString(),\n"
        "  event_type: 'Virtual Safety Car',\n"
        "  driver_name: 'Charles Leclerc',\n"
        "  description: 'Power unit failure. VSC deployed.',\n"
        "  severity: 'High'\n"
        "});"
    )

    add_body_p(doc, "2. DELETE Operation with Security Role Authorization:", bold_prefix="Operation: ")
    add_code_block(
        doc,
        "-- Executed only if authenticated role in ('Strategist', 'Admin')\n"
        "DELETE FROM strategy_note WHERE note_id = 5;"
    )

    doc.add_page_break()

    # ==================== CHAPTER 7 ====================
    format_heading(doc.add_paragraph(), "7. SQL ANALYTICAL QUERIES & MONGODB AGGREGATIONS", size=16)
    
    format_heading(doc.add_paragraph(), "7.1 Advanced SQL Queries (Joins, Subqueries & Aggregates)", size=13, color=(0, 50, 120))
    add_body_p(doc, "Query 1: Constructor Championship Aggregation (SUM, COUNT, GROUP BY):", bold_prefix="SQL Analytics: ")
    add_code_block(
        doc,
        "SELECT \n"
        "    t.team_name, t.nationality,\n"
        "    COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS wins,\n"
        "    COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,\n"
        "    SUM(rr.points) AS total_points\n"
        "FROM team t\n"
        "JOIN race_result rr ON t.team_id = rr.team_id\n"
        "GROUP BY t.team_id, t.team_name, t.nationality\n"
        "ORDER BY total_points DESC;"
    )

    add_body_p(doc, "Query 2: Correlated Subquery — Single Race Above-Average Point Scorers:", bold_prefix="SQL Analytics: ")
    add_code_block(
        doc,
        "SELECT r.round_no, d.driver_name, t.team_name, rr.position, rr.points\n"
        "FROM race_result rr\n"
        "JOIN race r ON rr.race_id = r.race_id\n"
        "JOIN driver d ON rr.driver_id = d.driver_id\n"
        "JOIN team t ON rr.team_id = t.team_id\n"
        "WHERE rr.points > (\n"
        "    SELECT AVG(points) \n"
        "    FROM race_result sub_rr \n"
        "    WHERE sub_rr.race_id = rr.race_id AND sub_rr.points > 0\n"
        ")\n"
        "ORDER BY r.round_no ASC, rr.position ASC;"
    )

    format_heading(doc.add_paragraph(), "7.2 MongoDB Multi-Stage Aggregation Pipeline (Speed Trap)", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "To meet Section 7 of the Level 3 criteria (*NoSQL Aggregation*), a multi-stage aggregation pipeline was engineered to process high-frequency telemetry samples, grouping metrics by driver to evaluate aerodynamic efficiency and DRS utilization:"
    )
    add_code_block(
        doc,
        "db.telemetry_samples.aggregate([\n"
        "  // Stage 1: Filter samples by specific Grand Prix\n"
        "  { $match: { race_id: 1 } },\n"
        "  \n"
        "  // Stage 2: Group by driver and aggregate metric statistics\n"
        "  {\n"
        "    $group: {\n"
        "      _id: { driver_id: \"$driver_id\", driver_code: \"$driver_code\" },\n"
        "      top_speed: { $max: \"$telemetry.speed\" },\n"
        "      avg_speed: { $avg: \"$telemetry.speed\" },\n"
        "      avg_throttle: { $avg: \"$telemetry.throttle\" },\n"
        "      total_drs_samples: { $sum: \"$telemetry.drs\" },\n"
        "      samples_analyzed: { $sum: 1 }\n"
        "    }\n"
        "  },\n"
        "  \n"
        "  // Stage 3: Reshape document and round decimal values\n"
        "  {\n"
        "    $project: {\n"
        "      _id: 0,\n"
        "      driver_id: \"$_id.driver_id\",\n"
        "      driver_code: \"$_id.driver_code\",\n"
        "      top_speed: { $round: [\"$top_speed\", 1] },\n"
        "      avg_speed: { $round: [\"$avg_speed\", 1] },\n"
        "      avg_throttle: { $round: [\"$avg_throttle\", 1] },\n"
        "      total_drs_samples: 1,\n"
        "      samples_analyzed: 1\n"
        "    }\n"
        "  },\n"
        "  \n"
        "  // Stage 4: Order by peak velocity descending\n"
        "  { $sort: { top_speed: -1 } }\n"
        "]);"
    )

    doc.add_page_break()

    # ==================== CHAPTER 8 ====================
    format_heading(doc.add_paragraph(), "8. STORED PROCEDURES, TRIGGERS & VIEWS", size=16)
    
    format_heading(doc.add_paragraph(), "8.1 Relational Views", size=13, color=(0, 50, 120))
    add_body_p(doc, "View 1: view_race_classification (Denormalized Race Finish Summary):", bold_prefix="View: ")
    add_code_block(
        doc,
        "CREATE OR REPLACE VIEW view_race_classification AS\n"
        "SELECT \n"
        "    r.race_id, r.round_no, r.race_date, c.circuit_name, c.country,\n"
        "    rr.position, rr.grid_position, d.driver_id, d.driver_name,\n"
        "    t.team_id, t.team_name, rr.laps_completed, rr.points, rr.status\n"
        "FROM race r\n"
        "JOIN circuit c ON r.circuit_id = c.circuit_id\n"
        "JOIN race_result rr ON r.race_id = rr.race_id\n"
        "JOIN driver d ON rr.driver_id = d.driver_id\n"
        "JOIN team t ON rr.team_id = t.team_id;"
    )

    format_heading(doc.add_paragraph(), "8.2 Stored Procedure (sp_get_driver_season_summary)", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "This stored procedure encapsulates driver seasonal metrics, executing analytical subqueries to compute average pit stop durations across a 22-race season:"
    )
    add_code_block(
        doc,
        "DELIMITER //\n"
        "CREATE PROCEDURE sp_get_driver_season_summary(\n"
        "    IN p_year INT,\n"
        "    IN p_driver_name VARCHAR(100)\n"
        ")\n"
        "BEGIN\n"
        "    SELECT \n"
        "        d.driver_name, s.year AS season,\n"
        "        COUNT(rr.result_id) AS races_entered,\n"
        "        MIN(rr.position) AS best_finish,\n"
        "        SUM(rr.points) AS total_points,\n"
        "        COUNT(CASE WHEN rr.position = 1 THEN 1 END) AS total_wins,\n"
        "        COUNT(CASE WHEN rr.position <= 3 THEN 1 END) AS podiums,\n"
        "        (\n"
        "            SELECT ROUND(AVG(ps.duration), 3)\n"
        "            FROM pit_stop ps\n"
        "            JOIN race r ON ps.race_id = r.race_id\n"
        "            WHERE ps.driver_id = d.driver_id AND r.season_id = s.season_id\n"
        "        ) AS avg_pit_stop_duration\n"
        "    FROM driver d\n"
        "    JOIN race_result rr ON d.driver_id = rr.driver_id\n"
        "    JOIN race r ON rr.race_id = r.race_id\n"
        "    JOIN season s ON r.season_id = s.season_id\n"
        "    WHERE s.year = p_year AND d.driver_name LIKE CONCAT('%', p_driver_name, '%')\n"
        "    GROUP BY d.driver_id, d.driver_name, s.season_id, s.year;\n"
        "END //\n"
        "DELIMITER ;"
    )

    format_heading(doc.add_paragraph(), "8.3 Database Trigger (trg_validate_pit_stop_duration)", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "This BEFORE INSERT trigger enforces physical domain constraints, intercepting anomalous sensor durations and raising a custom SQLSTATE exception before data commit:"
    )
    add_code_block(
        doc,
        "DELIMITER //\n"
        "CREATE TRIGGER trg_validate_pit_stop_duration\n"
        "BEFORE INSERT ON pit_stop\n"
        "FOR EACH ROW\n"
        "BEGIN\n"
        "    IF NEW.duration < 0 THEN\n"
        "        SIGNAL SQLSTATE '45000'\n"
        "        SET MESSAGE_TEXT = 'Error: Pit stop duration cannot be negative.';\n"
        "    END IF;\n"
        "END //\n"
        "DELIMITER ;"
    )

    doc.add_page_break()

    # ==================== CHAPTER 9 ====================
    format_heading(doc.add_paragraph(), "9. FRONT-END APPLICATION & API INTEGRATION", size=16)
    add_body_p(
        doc,
        "The web application was developed using Next.js 14 App Router, TypeScript, and Tailwind CSS. The user interface is structured into five cohesive tabs:\n"
        "1. Grand Prix Results: Displays the 2023 race calendar sidebar and comprehensive race classifications with pit stop duration tables.\n"
        "2. Championship Standings: Renders live World Drivers' and Constructors' standings powered by SQL views.\n"
        "3. Stored Procedure Analytics: Form allowing evaluators to search any driver (e.g. 'Verstappen', 'Alonso') and execute sp_get_driver_season_summary.\n"
        "4. Strategy Desk (CRUD): Demonstrates SELECT, INSERT, and DELETE on the strategy_note table with role restrictions.\n"
        "5. Telemetry & Race Events Studio (NoSQL): Head-to-head SVG telemetry curves comparing driver cornering vs. straightaway velocities, Speed Trap leaderboard from MongoDB aggregations, and real-time race incident logging."
    )

    format_heading(doc.add_paragraph(), "9.1 Role-Based Access Control (RBAC)", size=13, color=(0, 50, 120))
    add_body_p(
        doc,
        "To comply with Section 11 of the project rubric, two roles are enforced:\n"
        "• Race Strategist (Admin/CRUD): Authorized to insert and delete strategy recommendations and log race incidents into MongoDB.\n"
        "• Spectator / Viewer (Read-only): Restricted to querying race results and telemetry traces. Attempting to execute POST or DELETE operations triggers immediate HTTP 403 Forbidden responses at the API route layer."
    )

    doc.add_page_break()

    # ==================== CHAPTER 10 ====================
    format_heading(doc.add_paragraph(), "10. TESTING & VALIDATION RESULTS", size=16)
    add_body_p(
        doc,
        "A rigorous automated test suite (tests/test_all_cases.js) was constructed and executed against the live application server. Table 10.1 details the test execution matrix:"
    )

    t_tst = doc.add_table(rows=12, cols=4)
    t_tst.alignment = WD_TABLE_ALIGNMENT.CENTER
    th_cols = ["ID", "Test Description", "Tested Condition", "Status"]
    for i, h in enumerate(th_cols):
        t_tst.rows[0].cells[i].text = h
        set_cell_background(t_tst.rows[0].cells[i], "D32F2F")
        t_tst.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        t_tst.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True

    tests_data = [
        ("TC01", "Frontend SSR Layout", "GET / returns 200 and loads dual-DB interface", "PASSED"),
        ("TC02", "Dual Telemetry Slices", "GET /api/telemetry returns VER vs HAM lap points", "PASSED"),
        ("TC03", "Boundary Lap Query", "GET /api/telemetry on Lap 1 and Lap 50", "PASSED"),
        ("TC04", "Edge Handling", "GET /api/telemetry with non-numeric parameters", "PASSED"),
        ("TC05", "Event Timeline", "GET /api/events returns structured incident stream", "PASSED"),
        ("TC06", "RBAC Enforcement", "POST /api/events as Viewer returns 403 Forbidden", "PASSED"),
        ("TC07", "Input Validation", "POST /api/events with missing payload returns 400", "PASSED"),
        ("TC08", "NoSQL Document CRUD", "POST /api/events as Strategist inserts incident", "PASSED"),
        ("TC09", "MongoDB Aggregation", "GET /api/analytics/speed-trap runs pipeline", "PASSED"),
        ("TC10", "Aggregation Sorting", "Verifies speed trap leaderboard is sorted DESC", "PASSED"),
        ("TC11", "Strategy Desk RBAC", "POST & DELETE /api/strategy-notes blocked for Viewer", "PASSED")
    ]
    for r_i, r in enumerate(tests_data):
        for c_i, val in enumerate(r):
            t_tst.rows[r_i + 1].cells[c_i].text = val
            if val == "PASSED":
                t_tst.rows[r_i + 1].cells[c_i].paragraphs[0].runs[0].font.color.rgb = RGBColor(0, 150, 0)
                t_tst.rows[r_i + 1].cells[c_i].paragraphs[0].runs[0].font.bold = True
            if r_i % 2 == 1:
                set_cell_background(t_tst.rows[r_i + 1].cells[c_i], "F8F9FA")

    doc.add_page_break()

    # ==================== CHAPTER 11 & 12 ====================
    format_heading(doc.add_paragraph(), "11. INDIVIDUAL MEMBER CONTRIBUTIONS", size=16)
    add_body_p(
        doc,
        "In accordance with university regulations, the workload was systematically distributed between team members:"
    )

    t_div = doc.add_table(rows=3, cols=3)
    t_div.alignment = WD_TABLE_ALIGNMENT.CENTER
    div_headers = ["Member Name", "Assigned Database Paradigm", "Key Deliverables & Responsibilities"]
    for i, h in enumerate(div_headers):
        t_div.rows[0].cells[i].text = h
        set_cell_background(t_div.rows[0].cells[i], "D32F2F")
        t_div.rows[0].cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        t_div.rows[0].cells[i].paragraphs[0].runs[0].font.bold = True

    t_div.rows[1].cells[0].text = "Manav Dewangan\n(PES2UG24CS262)\nStudent A"
    t_div.rows[1].cells[1].text = "Relational Database\n(MySQL 8+)"
    t_div.rows[1].cells[2].text = "• 3NF relational schema design and DDL scripts.\n• Jolpica Ergast F1 ETL pipeline for 2023 season.\n• SQL Views, Stored Procedure, and Trigger.\n• Core Next.js dashboard layout and MySQL pool."

    t_div.rows[2].cells[0].text = "Mokshitreddy Nallaballe\n(PES2UG24CS284)\nStudent B"
    t_div.rows[2].cells[1].text = "NoSQL Document Store\n(MongoDB)"
    t_div.rows[2].cells[2].text = "• MongoDB database architecture (motorsport_telemetry).\n• BSON validators & compound indexing strategy.\n• OpenF1 sensor telemetry ingestion pipeline.\n• MongoDB Aggregation Pipeline for speed traps.\n• Next.js API routes & interactive SVG Telemetry trace.\n• Automated test suite & comprehensive documentation."

    format_heading(doc.add_paragraph(), "12. CONCLUSION & FUTURE ENHANCEMENTS", size=16)
    add_body_p(
        doc,
        "The Motorsport Race Performance and Strategy Management System successfully demonstrates the synergy of combining a relational database (MySQL) and a document store (MongoDB) into a cohesive full-stack application. By assigning ACID-critical structured standings to MySQL and streaming high-frequency sensor telemetry to MongoDB, the system eliminates traditional relational performance bottlenecks while preserving strict data integrity.\n\n"
        "Future Enhancements:\n"
        "• Vector Search: Implement pgvector or ChromaDB to perform semantic search over historical stewards' incident narratives and regulations.\n"
        "• Real-Time WebSockets: Stream live telemetry during active sessions using WebSockets or MQTT instead of periodic polling."
    )

    out_file = "/home/wingsfry/Downloads/DBMS_MiniProject_Report_Team8_PES2UG24CS284.docx"
    doc.save(out_file)
    print(f"Student Report saved to: {out_file}")

if __name__ == "__main__":
    build_student_report()
