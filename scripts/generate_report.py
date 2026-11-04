import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_report():
    doc = docx.Document()

    # Base page settings
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Title Page
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title_p.add_run("MOTORSPORT RACE PERFORMANCE AND STRATEGY MANAGEMENT SYSTEM\n")
    run.font.size = Pt(20)
    run.font.bold = True
    run.font.color.rgb = RGBColor(180, 0, 0)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = sub_p.add_run("A Multi-Model Relational (MySQL) and Document-Store (MongoDB) Database Architecture for Formula 1 Race Analytics\n\n")
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True

    p_cred = doc.add_paragraph()
    p_cred.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cred = p_cred.add_run(
        "Submitted in partial fulfilment of the requirements for the award of degree of\n"
        "Bachelor of Technology\n"
        "in\n"
        "Computer Science & Engineering\n"
        "UE23CS351A – DBMS Level 3 Project\n\n"
        "PES UNIVERSITY\n"
        "Electronic City Campus, Bengaluru – 560 100\n"
        "Academic Year: 2026\n\n"
        "Team 8:\n"
        "Student A: Relational Database Architecture, SQL Analytics & Core Dashboard\n"
        "Student B: MongoDB NoSQL Telemetry Layer, Aggregations & Race-Event Stream\n"
    )
    r_cred.font.size = Pt(11)

    doc.add_page_break()

    # Table of Contents
    toc_h = doc.add_heading("TABLE OF CONTENTS", level=1)
    toc_entries = [
        ("1. INTRODUCTION", "3"),
        ("2. PROBLEM DEFINITION & ARCHITECTURAL JUSTIFICATION", "4"),
        ("3. ER MODEL & SYSTEM ARCHITECTURE", "5"),
        ("4. ER TO RELATIONAL & NOSQL DOCUMENT MAPPING", "6"),
        ("5. DDL STATEMENTS (MySQL & MongoDB)", "8"),
        ("6. DML STATEMENTS (Relational & NoSQL Operations)", "10"),
        ("7. SQL ANALYTICAL QUERIES & MONGODB AGGREGATIONS", "12"),
        ("8. STORED PROCEDURES, FUNCTIONS, TRIGGERS & INDEXING", "15"),
        ("9. FRONT-END DEVELOPMENT (Next.js 14 Integration)", "17"),
        ("10. SECURITY, ROLE-BASED ACCESS CONTROL & DATA INTEGRITY", "19"),
        ("11. TESTING & VALIDATION RESULTS", "20"),
        ("12. CONCLUSION & INDIVIDUAL MEMBER CONTRIBUTIONS", "21"),
    ]
    toc_table = doc.add_table(rows=len(toc_entries), cols=2)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, page) in enumerate(toc_entries):
        row = toc_table.rows[idx]
        row.cells[0].text = title
        row.cells[1].text = page
        row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

    doc.add_page_break()

    # Chapter 1
    doc.add_heading("1. INTRODUCTION", level=1)
    doc.add_paragraph(
        "Modern professional motorsport, notably Formula 1, is an intensely data-driven engineering domain. "
        "During a typical Grand Prix weekend, teams process millions of data points spanning timing classifications, "
        "pit stop intervals, championship standings, variable weather incident reports, and high-frequency vehicle telemetry (speed, throttle, RPM, brake pressure, and DRS status). "
        "Designing an enterprise information system for this environment presents a classic database dilemma: structured tabular records require strict relational integrity, normalization, and ACID guarantees, "
        "while high-volume vehicle telemetry samples and unpredictable race-control incident streams require flexible, non-blocking, horizontally scalable document storage."
    )
    doc.add_paragraph(
        "This project presents the Motorsport Race Performance and Strategy Management System, a hybrid multi-model DBMS Level 3 application "
        "engineered using MySQL 8+ (Relational Database) and MongoDB (NoSQL Document Store), unified under a Next.js 14 full-stack TypeScript interface."
    )

    doc.add_heading("1.1 Project Objectives", level=2)
    doc.add_paragraph(
        "1. Model the complete 2023 FIA Formula 1 World Championship season across 22 Grands Prix using strict 3NF relational schemas in MySQL.\n"
        "2. Implement high-frequency, time-series sensor telemetry and race control event ingestion via MongoDB document collections.\n"
        "3. Provide advanced SQL abstractions including Views, Stored Procedures, and Triggers to automate pit stop duration integrity and driver season cards.\n"
        "4. Develop complex MongoDB aggregation pipelines for speed trap leaderboards and telemetry delta analytics.\n"
        "5. Integrate both database engines into a responsive Next.js 14 application with role-based access control (Race Strategist vs. Spectator)."
    )

    doc.add_page_break()

    # Chapter 2
    doc.add_heading("2. PROBLEM DEFINITION & ARCHITECTURAL JUSTIFICATION", level=1)
    doc.add_paragraph(
        "Why Multi-Model (MySQL + MongoDB) Is Required (Academic Rubric Compliance):\n\n"
        "1. Relational Rigor (MySQL 8+):\n"
        "Championship standings, race classifications, driver contracts, and pit stop logs are inherently relational. "
        "A driver cannot finish a race that does not exist (Foreign Key Constraint), nor can championship points be awarded with inconsistencies. "
        "MySQL enforces referential integrity (ON DELETE CASCADE / ON DELETE RESTRICT), ensures transactional isolation (ACID), and provides deterministic aggregations.\n\n"
        "2. Time-Series Sensor Stream Flexibility (MongoDB):\n"
        "Car telemetry generates samples at 10 to 50 Hz per car. Over 22 races and 20 drivers, this generates tens of millions of metric snapshots. "
        "Storing every instantaneous speed, throttle %, and DRS flag in MySQL would lead to catastrophic index lock contention, table bloat, and relational performance degradation. "
        "Furthermore, race events (flags, collisions, stewards' decisions) are heterogeneous and semi-structured. MongoDB provides non-blocking write throughput, flexible polymorphic schemas, and compound index optimization."
    )

    doc.add_page_break()

    # Chapter 3 & 4
    doc.add_heading("3. ER MODEL & RELATIONAL MAPPING", level=1)
    doc.add_paragraph(
        "The relational schema comprises 9 interconnected entities in 3NF:\n"
        "• SEASON (season_id PK, year, start_date, end_date)\n"
        "• TEAM (team_id PK, team_name, nationality, base, jolpica_constructor_id)\n"
        "• DRIVER (driver_id PK, driver_name, nationality, dob, team_id FK, jolpica_driver_id)\n"
        "• CIRCUIT (circuit_id PK, circuit_name, location, country, jolpica_circuit_id)\n"
        "• RACE (race_id PK, season_id FK, circuit_id FK, round_no, race_date)\n"
        "• QUALIFYING_RESULT (qualifying_id PK, race_id FK, driver_id FK, position, q1_time, q2_time, q3_time)\n"
        "• RACE_RESULT (result_id PK, race_id FK, driver_id FK, team_id FK, position, grid_position, laps_completed, points, status)\n"
        "• PIT_STOP (stop_id PK, race_id FK, driver_id FK, lap_number, stop_time, duration)\n"
        "• DRIVER_STANDING (standing_id PK, season_id FK, driver_id FK, position, points, wins)\n"
        "• STRATEGY_NOTE (note_id PK, race_id FK, author_role, title, content, recommended_tyre, created_at)"
    )

    doc.add_heading("4. NOSQL DOCUMENT MODELS (MongoDB)", level=2)
    doc.add_paragraph(
        "Database: motorsport_telemetry\n\n"
        "Collection 1: telemetry_samples\n"
        "{\n"
        "  _id: ObjectId,\n"
        "  race_id: Int32, // Cross-database reference to MySQL race.race_id\n"
        "  driver_id: Int32, // Cross-database reference to MySQL driver.driver_id\n"
        "  driver_code: String (e.g. 'VER', 'HAM'),\n"
        "  lap_number: Int32,\n"
        "  timestamp: ISODate,\n"
        "  telemetry: { speed: Double, throttle: Double, brake: Int32, rpm: Int32, gear: Int32, drs: Int32 },\n"
        "  source: String\n"
        "}\n"
        "Compound Index: { race_id: 1, driver_id: 1, lap_number: 1 }\n\n"
        "Collection 2: race_events\n"
        "{\n"
        "  _id: ObjectId,\n"
        "  race_id: Int32,\n"
        "  lap_number: Int32,\n"
        "  timestamp: ISODate,\n"
        "  event_type: String ('Safety Car', 'Virtual Safety Car', 'Yellow Flag', 'Red Flag', 'Penalty', 'Overtake'),\n"
        "  driver_id: Int32,\n"
        "  driver_name: String,\n"
        "  description: String,\n"
        "  severity: String ('Low', 'Medium', 'High', 'Critical')\n"
        "}\n"
        "Compound Index: { race_id: 1, event_type: 1 }"
    )

    doc.add_page_break()

    # Chapter 5 & 6
    doc.add_heading("5. DDL & DML IMPLEMENTATION", level=1)
    doc.add_paragraph(
        "The project enforces robust DDL constraints across both database engines:\n"
        "• Primary Keys (AUTO_INCREMENT) on all relational tables.\n"
        "• Foreign Keys with ON DELETE CASCADE for race-dependent records and ON DELETE RESTRICT for core entity lookups.\n"
        "• CHECK constraints on pit_stop.lap_number > 0 and pit_stop.duration >= 0.\n"
        "• UNIQUE composite keys on (season_id, round_no) and (race_id, driver_id).\n"
        "• MongoDB JSON Schema Validators with strictly enforced BSON data types.\n\n"
        "DML Operations Demonstrated:\n"
        "• SELECT: Complex multi-table inner and left outer joins, correlated subqueries.\n"
        "• INSERT: Adding strategy recommendations and race incident documents via authenticated API routes.\n"
        "• UPDATE: Modifying tyre allocations and driver standing points tally.\n"
        "• DELETE: Removing invalidated strategy notes with role-based restriction checks."
    )

    doc.add_page_break()

    # Chapter 7 & 8
    doc.add_heading("6. ADVANCED DATABASE CONCEPTS (Rubric Section 7)", level=1)
    doc.add_paragraph(
        "The project implements five advanced database features meeting Level 3 criteria:\n\n"
        "1. Views (Relational Abstraction):\n"
        "• view_race_classification: Denormalizes race outcomes with circuit, driver, constructor, and finish status.\n"
        "• view_season_standings: Ranks drivers by season championship points and win tallies.\n\n"
        "2. Stored Procedure:\n"
        "• sp_get_driver_season_summary(IN p_year INT, IN p_driver_name VARCHAR(100)): Encapsulates driver season statistics, calculating total starts, best finish, podium count, and subquery-computed average pit stop duration.\n\n"
        "3. Database Trigger:\n"
        "• trg_validate_pit_stop_duration: A BEFORE INSERT trigger on the pit_stop table that raises SQLSTATE 45000 if an anomalous negative pit duration is attempted.\n\n"
        "4. MongoDB Aggregation Pipeline:\n"
        "• Speed Trap & Stint Analytics: Aggregates high-frequency telemetry samples, grouping by driver to calculate peak speed, average throttle percentage, and total DRS activations.\n\n"
        "5. Compound Indexing:\n"
        "• Relational indices on foreign key join paths.\n"
        "• MongoDB compound index on { race_id: 1, driver_id: 1, lap_number: 1 } providing O(log N) telemetry trace lookups."
    )

    doc.add_page_break()

    # Chapter 9
    doc.add_heading("7. APPLICATION ARCHITECTURE & NEXT.JS 14 INTERFACE", level=1)
    doc.add_paragraph(
        "The front-end is built using Next.js 14 App Router, TypeScript, and Tailwind CSS. Key modules include:\n"
        "1. Grand Prix Results Tab: Dynamic race calendar sidebar with detailed race classification and millisecond-accurate pit stop logs.\n"
        "2. Championship Standings Tab: Real-time driver and constructor championship tables powered by MySQL SQL views.\n"
        "3. Stored Procedure Card: Interactive driver search executing MySQL stored procedures.\n"
        "4. Strategy Desk (CRUD): Role-based strategy formulation desk allowing Race Strategists to create and delete notes while restricting Spectators to read-only access.\n"
        "5. Telemetry & Race Events Studio (NoSQL): Interactive head-to-head SVG telemetry curves comparing driver cornering and straightaway traces, Speed Trap aggregation leaderboard, and a real-time incident event logger."
    )

    doc.add_heading("8. DIVISION OF WORK & CONTRIBUTIONS", level=2)
    doc.add_paragraph(
        "Student A Responsibilities:\n"
        "• MySQL relational schema design, 3NF normalization, and DDL script.\n"
        "• Jolpica Ergast F1 ETL data ingestion pipeline for 2023 season data.\n"
        "• Advanced SQL queries, views, stored procedure, and triggers.\n"
        "• Initial Next.js dashboard shell and relational API routes.\n\n"
        "Student B Responsibilities:\n"
        "• MongoDB NoSQL database architecture (`motorsport_telemetry`).\n"
        "• JSON Schema validators and compound index design.\n"
        "• OpenF1 live sensor telemetry ETL ingestion pipeline.\n"
        "• MongoDB Aggregation Pipeline for speed trap & stint analytics.\n"
        "• Next.js API route handlers (/api/telemetry, /api/events, /api/analytics/speed-trap).\n"
        "• Frontend interactive SVG telemetry trace comparison studio and real-time incident timeline."
    )

    output_path = "/home/wingsfry/Work/DBMS_MiniProject_Team8/DBMS_MINI_PROJECT_REPORT_TEAM8.docx"
    doc.save(output_path)
    print(f"Report generated successfully at: {output_path}")

if __name__ == "__main__":
    create_report()
