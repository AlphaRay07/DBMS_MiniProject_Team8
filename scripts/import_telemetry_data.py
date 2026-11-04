"""
Motorsport Race Performance and Strategy Management System
Telemetry & Race Events ETL Pipeline (Python version - Student B)
Database: motorsport_telemetry
"""

import os
import sys
import json
import math
import random
from datetime import datetime, timezone
import requests

try:
    from pymongo import MongoClient
except ImportError:
    print("[Notice] pymongo is not installed in the python environment.")
    print("Run `pip install pymongo` or use the Node.js runner: `node scripts/import_telemetry_data.js`")
    sys.exit(0)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/motorsport_telemetry")
OPENF1_BASE = "https://api.openf1.org/v1"

def run_etl():
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    
    # Ensure indexes
    db.telemetry_samples.create_index([("race_id", 1), ("driver_id", 1), ("lap_number", 1)])
    db.race_events.create_index([("race_id", 1), ("event_type", 1)])
    
    print("Connected to MongoDB & ensured indexes.")

if __name__ == "__main__":
    run_etl()
