import re
import time
from datetime import datetime
from getpass import getpass
import mysql.connector
import requests

BASE_URL = "https://api.jolpi.ca/ergast/f1"
HEADERS = {
    "User-Agent": "MotorsportRaceAnalysis/1.0"
}


def fetch_all(endpoint, table_name, records_key, delay=0.5):
    """Fetch every page of an endpoint using Jolpica pagination with rate-limiting and retry."""
    all_records = []
    offset = 0
    limit = 100

    while True:
        url = f"{BASE_URL}/{endpoint}/"

        for attempt in range(5):
            response = requests.get(
                url,
                params={"limit": limit, "offset": offset},
                headers=HEADERS,
                timeout=30
            )
            if response.status_code == 429:
                wait_time = (attempt + 1) * 2
                print(f"    [Rate limit 429] Backing off for {wait_time}s...")
                time.sleep(wait_time)
                continue
            response.raise_for_status()
            break

        mr_data = response.json()["MRData"]
        table_data = mr_data.get(table_name, {})
        records = table_data.get(records_key, [])

        all_records.extend(records)

        total = int(mr_data.get("total", 0))
        offset += len(records)

        time.sleep(delay)

        if not records or offset >= total:
            break

    return all_records


def parse_lap_time(time_str):
    """Convert lap time string (e.g. '1:31.295' or '31.295') to MySQL TIME '00:01:31.295'."""
    if not time_str or not isinstance(time_str, str):
        return None
    time_str = time_str.strip()
    if not time_str:
        return None

    # Format MM:SS.sss
    m = re.match(r"^(\d+):(\d{2})\.(\d+)$", time_str)
    if m:
        mins, secs, millis = m.groups()
        return f"00:{int(mins):02d}:{int(secs):02d}.{millis[:3].ljust(3, '0')}"

    # Format SS.sss
    m2 = re.match(r"^(\d+)\.(\d+)$", time_str)
    if m2:
        secs, millis = m2.groups()
        mins = int(secs) // 60
        rem_secs = int(secs) % 60
        return f"00:{mins:02d}:{rem_secs:02d}.{millis[:3].ljust(3, '0')}"

    return None


def parse_duration(duration_str):
    """Convert duration string (e.g. '25.885' or '1:02.123') to decimal seconds float."""
    if not duration_str:
        return None
    try:
        duration_str = str(duration_str).strip()
        if ":" in duration_str:
            parts = duration_str.split(":")
            return round(float(parts[0]) * 60 + float(parts[1]), 3)
        return round(float(duration_str), 3)
    except (ValueError, TypeError):
        return None


def get_next_id(cursor, table_name, pk_name):
    """Get next available integer ID for tables without auto-increment."""
    cursor.execute(f"SELECT COALESCE(MAX({pk_name}), 0) + 1 FROM {table_name}")
    return cursor.fetchone()[0]


def build_lookups(cursor):
    """Query existing MySQL integer IDs mapped to Jolpica string identifiers."""
    cursor.execute("SELECT jolpica_constructor_id, team_id FROM team WHERE jolpica_constructor_id IS NOT NULL")
    team_map = dict(cursor.fetchall())

    cursor.execute("SELECT jolpica_driver_id, driver_id FROM driver WHERE jolpica_driver_id IS NOT NULL")
    driver_map = dict(cursor.fetchall())

    cursor.execute("SELECT jolpica_circuit_id, circuit_id FROM circuit WHERE jolpica_circuit_id IS NOT NULL")
    circuit_map = dict(cursor.fetchall())

    cursor.execute("SELECT year, season_id FROM season")
    season_map = dict(cursor.fetchall())

    cursor.execute("SELECT season_id, round_no, race_id FROM race")
    race_map = {(row[0], row[1]): row[2] for row in cursor.fetchall()}

    return {
        "teams": team_map,
        "drivers": driver_map,
        "circuits": circuit_map,
        "seasons": season_map,
        "races": race_map
    }


def import_reference_data(cursor, connection):
    """Step 1: Import Season, Teams, Drivers, and Circuits."""
    print("\n--- STEP 1: IMPORTING REFERENCE DATA ---")

    # 1. Season 2023
    races_raw = fetch_all("2023/races", "RaceTable", "Races")
    dates = [r["date"] for r in races_raw]
    start_date = min(dates) if dates else "2023-03-01"
    end_date = max(dates) if dates else "2023-11-30"

    cursor.execute("SELECT season_id FROM season WHERE year = 2023")
    row = cursor.fetchone()
    if row:
        cursor.execute("UPDATE season SET start_date = %s, end_date = %s WHERE season_id = %s", (start_date, end_date, row[0]))
    else:
        next_season_id = get_next_id(cursor, "season", "season_id")
        cursor.execute(
            "INSERT INTO season (season_id, year, start_date, end_date) VALUES (%s, %s, %s, %s)",
            (next_season_id, 2023, start_date, end_date)
        )
    connection.commit()
    print("✓ Season 2023 imported/verified.")

    # 2. Teams
    teams_raw = fetch_all("2023/constructors", "ConstructorTable", "Constructors")
    for t in teams_raw:
        cursor.execute("SELECT team_id FROM team WHERE jolpica_constructor_id = %s", (t["constructorId"],))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE team SET team_name = %s, nationality = %s WHERE team_id = %s",
                (t["name"], t.get("nationality"), existing[0])
            )
        else:
            next_team_id = get_next_id(cursor, "team", "team_id")
            cursor.execute(
                "INSERT INTO team (team_id, team_name, nationality, base, jolpica_constructor_id) VALUES (%s, %s, %s, %s, %s)",
                (next_team_id, t["name"], t.get("nationality"), None, t["constructorId"])
            )
    connection.commit()
    print(f"✓ {len(teams_raw)} Teams imported/verified.")

    # 3. Drivers
    drivers_raw = fetch_all("2023/drivers", "DriverTable", "Drivers")
    for d in drivers_raw:
        driver_name = f"{d['givenName']} {d['familyName']}"
        cursor.execute("SELECT driver_id FROM driver WHERE jolpica_driver_id = %s", (d["driverId"],))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE driver SET driver_name = %s, nationality = %s, dob = %s WHERE driver_id = %s",
                (driver_name, d.get("nationality"), d.get("dateOfBirth"), existing[0])
            )
        else:
            next_driver_id = get_next_id(cursor, "driver", "driver_id")
            cursor.execute(
                "INSERT INTO driver (driver_id, driver_name, nationality, dob, team_id, jolpica_driver_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (next_driver_id, driver_name, d.get("nationality"), d.get("dateOfBirth"), None, d["driverId"])
            )
    connection.commit()
    print(f"✓ {len(drivers_raw)} Drivers imported/verified.")

    # 4. Circuits
    for r in races_raw:
        circ = r["Circuit"]
        loc = circ.get("Location", {})
        cursor.execute("SELECT circuit_id FROM circuit WHERE jolpica_circuit_id = %s", (circ["circuitId"],))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE circuit SET circuit_name = %s, location = %s, country = %s WHERE circuit_id = %s",
                (circ["circuitName"], loc.get("locality"), loc.get("country"), existing[0])
            )
        else:
            next_circuit_id = get_next_id(cursor, "circuit", "circuit_id")
            cursor.execute(
                "INSERT INTO circuit (circuit_id, circuit_name, location, country, jolpica_circuit_id) VALUES (%s, %s, %s, %s, %s)",
                (next_circuit_id, circ["circuitName"], loc.get("locality"), loc.get("country"), circ["circuitId"])
            )
    connection.commit()
    print(f"✓ Circuits from {len(races_raw)} races imported/verified.")


def import_races(cursor, connection):
    """Step 2: Import Races."""
    print("\n--- STEP 2: IMPORTING RACES ---")
    lookups = build_lookups(cursor)
    season_id = lookups["seasons"].get(2023)
    if not season_id:
        raise ValueError("Season 2023 not found in database. Run Step 1 first.")

    races_raw = fetch_all("2023/races", "RaceTable", "Races")
    for r in races_raw:
        circuit_id = lookups["circuits"].get(r["Circuit"]["circuitId"])
        round_no = int(r["round"])
        race_date = r["date"]

        cursor.execute("SELECT race_id FROM race WHERE season_id = %s AND round_no = %s", (season_id, round_no))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE race SET circuit_id = %s, race_date = %s WHERE race_id = %s",
                (circuit_id, race_date, existing[0])
            )
        else:
            next_race_id = get_next_id(cursor, "race", "race_id")
            cursor.execute(
                "INSERT INTO race (race_id, season_id, circuit_id, round_no, race_date) VALUES (%s, %s, %s, %s, %s)",
                (next_race_id, season_id, circuit_id, round_no, race_date)
            )
    connection.commit()
    print(f"✓ {len(races_raw)} Races imported/verified.")


def import_race_results(cursor, connection):
    """Step 3: Import Race Results in bulk across the season."""
    print("\n--- STEP 3: IMPORTING RACE RESULTS ---")
    lookups = build_lookups(cursor)
    season_id = lookups["seasons"].get(2023)

    races_with_results = fetch_all("2023/results", "RaceTable", "Races", delay=0.8)

    total_results = 0
    for race_data in races_with_results:
        round_no = int(race_data["round"])
        race_id = lookups["races"].get((season_id, round_no))
        if not race_id:
            continue

        results = race_data.get("Results", [])
        for res in results:
            driver_id = lookups["drivers"].get(res["Driver"]["driverId"])
            team_id = lookups["teams"].get(res["Constructor"]["constructorId"])

            if driver_id and team_id:
                cursor.execute(
                    "UPDATE driver SET team_id = %s WHERE driver_id = %s AND team_id IS NULL",
                    (team_id, driver_id)
                )

            pos = int(res["position"]) if res.get("position", "").isdigit() else None
            grid = int(res["grid"]) if res.get("grid", "").isdigit() else None
            laps = int(res["laps"]) if res.get("laps", "").isdigit() else 0
            points = float(res.get("points", 0.0))
            status = res.get("status", "Unknown")

            cursor.execute("SELECT result_id FROM race_result WHERE race_id = %s AND driver_id = %s", (race_id, driver_id))
            existing = cursor.fetchone()
            if existing:
                cursor.execute(
                    """
                    UPDATE race_result
                    SET position = %s, grid_position = %s, laps_completed = %s, points = %s, status = %s, team_id = %s
                    WHERE result_id = %s
                    """,
                    (pos, grid, laps, points, status, team_id, existing[0])
                )
            else:
                next_res_id = get_next_id(cursor, "race_result", "result_id")
                cursor.execute(
                    """
                    INSERT INTO race_result (result_id, race_id, driver_id, position, grid_position, laps_completed, points, status, team_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (next_res_id, race_id, driver_id, pos, grid, laps, points, status, team_id)
                )
            total_results += 1
        print(f"  Round {round_no:02d}: {len(results)} results imported.")

    connection.commit()
    print(f"✓ Total {total_results} race results imported/verified.")


def import_qualifying(cursor, connection):
    """Step 4: Import Qualifying Results in bulk across the season."""
    print("\n--- STEP 4: IMPORTING QUALIFYING RESULTS ---")
    lookups = build_lookups(cursor)
    season_id = lookups["seasons"].get(2023)

    races_with_q = fetch_all("2023/qualifying", "RaceTable", "Races", delay=0.8)

    total_qualifying = 0
    for race_data in races_with_q:
        round_no = int(race_data["round"])
        race_id = lookups["races"].get((season_id, round_no))
        if not race_id:
            continue

        q_results = race_data.get("QualifyingResults", [])
        for q in q_results:
            driver_id = lookups["drivers"].get(q["Driver"]["driverId"])
            pos = int(q["position"]) if q.get("position", "").isdigit() else None
            q1 = parse_lap_time(q.get("Q1"))
            q2 = parse_lap_time(q.get("Q2"))
            q3 = parse_lap_time(q.get("Q3"))

            cursor.execute("SELECT qualifying_id FROM qualifying_result WHERE race_id = %s AND driver_id = %s", (race_id, driver_id))
            existing = cursor.fetchone()
            if existing:
                cursor.execute(
                    "UPDATE qualifying_result SET position = %s, q1_time = %s, q2_time = %s, q3_time = %s WHERE qualifying_id = %s",
                    (pos, q1, q2, q3, existing[0])
                )
            else:
                next_qid = get_next_id(cursor, "qualifying_result", "qualifying_id")
                cursor.execute(
                    """
                    INSERT INTO qualifying_result (qualifying_id, race_id, driver_id, position, q1_time, q2_time, q3_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (next_qid, race_id, driver_id, pos, q1, q2, q3)
                )
            total_qualifying += 1
        print(f"  Round {round_no:02d}: {len(q_results)} qualifying records imported.")

    connection.commit()
    print(f"✓ Total {total_qualifying} qualifying results imported/verified.")


def import_pit_stops(cursor, connection):
    """Step 5: Import Pit Stops round by round with backoff delay."""
    print("\n--- STEP 5: IMPORTING PIT STOPS ---")
    lookups = build_lookups(cursor)
    season_id = lookups["seasons"].get(2023)

    cursor.execute("SELECT round_no, race_id FROM race WHERE season_id = %s ORDER BY round_no", (season_id,))
    races = cursor.fetchall()

    total_stops = 0
    for round_no, race_id in races:
        p_data = fetch_all(f"2023/{round_no}/pitstops", "RaceTable", "Races", delay=0.8)
        if not p_data or not p_data[0].get("PitStops"):
            continue

        stops = p_data[0]["PitStops"]
        for p in stops:
            driver_id = lookups["drivers"].get(p["driverId"])
            lap_number = int(p["lap"])
            stop_time = p.get("time")
            duration = parse_duration(p.get("duration"))

            cursor.execute(
                "SELECT stop_id FROM pit_stop WHERE race_id = %s AND driver_id = %s AND lap_number = %s",
                (race_id, driver_id, lap_number)
            )
            existing = cursor.fetchone()
            if existing:
                cursor.execute(
                    "UPDATE pit_stop SET stop_time = %s, duration = %s WHERE stop_id = %s",
                    (stop_time, duration, existing[0])
                )
            else:
                next_sid = get_next_id(cursor, "pit_stop", "stop_id")
                cursor.execute(
                    """
                    INSERT INTO pit_stop (stop_id, race_id, driver_id, lap_number, stop_time, duration)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (next_sid, race_id, driver_id, lap_number, stop_time, duration)
                )
            total_stops += 1
        print(f"  Round {round_no:02d}: {len(stops)} pit stops imported.")

    connection.commit()
    print(f"✓ Total {total_stops} pit stops imported/verified.")


def import_driver_standings(cursor, connection):
    """Step 6: Import Final 2023 Driver Standings."""
    print("\n--- STEP 6: IMPORTING DRIVER STANDINGS ---")
    lookups = build_lookups(cursor)
    season_id = lookups["seasons"].get(2023)

    standings_raw = fetch_all("2023/driverstandings", "StandingsTable", "StandingsLists", delay=0.8)
    if not standings_raw or not standings_raw[0].get("DriverStandings"):
        print("No standings data found.")
        return

    driver_standings = standings_raw[0]["DriverStandings"]
    for s in driver_standings:
        driver_id = lookups["drivers"].get(s["Driver"]["driverId"])
        pos = int(s["position"]) if s.get("position", "").isdigit() else None
        points = float(s.get("points", 0.0))
        wins = int(s.get("wins", 0))

        cursor.execute("SELECT standing_id FROM driver_standing WHERE season_id = %s AND driver_id = %s", (season_id, driver_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE driver_standing SET position = %s, points = %s, wins = %s WHERE standing_id = %s",
                (pos, points, wins, existing[0])
            )
        else:
            next_sid = get_next_id(cursor, "driver_standing", "standing_id")
            cursor.execute(
                """
                INSERT INTO driver_standing (standing_id, season_id, driver_id, position, points, wins)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (next_sid, season_id, driver_id, pos, points, wins)
            )

    connection.commit()
    print(f"✓ {len(driver_standings)} Driver standings imported/verified.")


def main():
    print("==================================================")
    print("  Motorsport Database Importer (2023 Season)")
    print("==================================================")

    password = getpass("Enter MySQL root password: ")
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password=password,
        database="motorsport_db"
    )
    cursor = connection.cursor()

    try:
        print("\nSelect import phase:")
        print("1. Import Reference Data (Teams, Drivers, Circuits, Season)")
        print("2. Import Races")
        print("3. Import Race Results")
        print("4. Import Qualifying Results")
        print("5. Import Pit Stops")
        print("6. Import Driver Standings")
        print("7. Run ALL Import Stages (1 through 6)")

        choice = input("\nEnter choice (1-7): ").strip()

        if choice == "1":
            import_reference_data(cursor, connection)
        elif choice == "2":
            import_races(cursor, connection)
        elif choice == "3":
            import_race_results(cursor, connection)
        elif choice == "4":
            import_qualifying(cursor, connection)
        elif choice == "5":
            import_pit_stops(cursor, connection)
        elif choice == "6":
            import_driver_standings(cursor, connection)
        elif choice == "7":
            import_reference_data(cursor, connection)
            import_races(cursor, connection)
            import_race_results(cursor, connection)
            import_qualifying(cursor, connection)
            import_pit_stops(cursor, connection)
            import_driver_standings(cursor, connection)
        else:
            print("Invalid choice. Exiting.")

        print("\n==================================================")
        print("Summary of Row Counts in motorsport_db:")
        for table in ["season", "team", "driver", "circuit", "race", "race_result", "qualifying_result", "pit_stop", "driver_standing"]:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table:20s}: {count} rows")
        print("==================================================")

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
