import requests
import mysql.connector
from getpass import getpass

BASE_URL = "https://api.jolpi.ca/ergast/f1"
HEADERS = {
    "User-Agent": "MotorsportRaceAnalysis/1.0"
}


def fetch_all(endpoint, table_name, records_key):
    """Fetch every page of an endpoint using Jolpica pagination."""
    all_records = []
    offset = 0
    limit = 100

    while True:
        url = f"{BASE_URL}/{endpoint}/"

        response = requests.get(
            url,
            params={"limit": limit, "offset": offset},
            headers=HEADERS,
            timeout=30
        )
        response.raise_for_status()

        mr_data = response.json()["MRData"]

        table_data = mr_data[table_name]
        records = table_data[records_key]

        all_records.extend(records)

        total = int(mr_data["total"])
        offset += len(records)

        if not records or offset >= total:
            break

    return all_records


def main():
    print("Connecting to MySQL...")

    password = getpass("Enter your MySQL password: ")

    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password=password,
        database="motorsport_db"
    )

    print("MySQL connection successful!")

    print("\nFetching 2023 F1 data from Jolpica...")

    teams = fetch_all("2023/constructors", "ConstructorTable", "Constructors")
    drivers = fetch_all("2023/drivers", "DriverTable", "Drivers")
    races = fetch_all("2023/races", "RaceTable", "Races")

    print("\n--- IMPORT PREVIEW ---")
    print("Teams:", len(teams))
    print("Drivers:", len(drivers))
    print("Races:", len(races))

    if teams:
        print("\nExample team:", teams[0]["name"])

    if drivers:
        print(
            "Example driver:",
            drivers[0]["givenName"],
            drivers[0]["familyName"]
        )

    if races:
        print("Example race:", races[0]["raceName"])
        print("Example circuit:", races[0]["Circuit"]["circuitName"])

    connection.close()
    print("\nPreview complete. No records were inserted.")


if __name__ == "__main__":
    main()
