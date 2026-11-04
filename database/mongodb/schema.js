/**
 * Motorsport Race Performance and Strategy Management System
 * MongoDB NoSQL Schema Definition & Validation (Student B)
 * Database: motorsport_telemetry
 */

// Switch / create database
const dbName = 'motorsport_telemetry';

// 1. Collection: telemetry_samples
// Stores high-frequency, time-series sensor telemetry per lap
db.createCollection('telemetry_samples', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['race_id', 'driver_id', 'lap_number', 'timestamp', 'telemetry'],
      properties: {
        race_id: {
          bsonType: 'int',
          description: 'Foreign reference to MySQL race.race_id - required integer'
        },
        driver_id: {
          bsonType: 'int',
          description: 'Foreign reference to MySQL driver.driver_id - required integer'
        },
        driver_code: {
          bsonType: 'string',
          description: 'Driver three-letter acronym (e.g., VER, HAM, ALO)'
        },
        lap_number: {
          bsonType: 'int',
          minimum: 1,
          description: 'Lap sequence number - required positive integer'
        },
        timestamp: {
          bsonType: ['date', 'string'],
          description: 'UTC ISO timestamp of the sensor sample'
        },
        telemetry: {
          bsonType: 'object',
          required: ['speed', 'throttle', 'brake', 'rpm', 'gear', 'drs'],
          properties: {
            speed: {
              bsonType: ['double', 'int'],
              minimum: 0,
              maximum: 400,
              description: 'Vehicle speed in km/h'
            },
            throttle: {
              bsonType: ['double', 'int'],
              minimum: 0,
              maximum: 100,
              description: 'Throttle percentage (0-100%)'
            },
            brake: {
              bsonType: ['double', 'int'],
              minimum: 0,
              maximum: 100,
              description: 'Brake application status or percentage'
            },
            rpm: {
              bsonType: 'int',
              minimum: 0,
              maximum: 15000,
              description: 'Engine rotations per minute'
            },
            gear: {
              bsonType: 'int',
              minimum: 0,
              maximum: 8,
              description: 'Current gear selection (0 = Neutral, 1-8)'
            },
            drs: {
              bsonType: 'int',
              enum: [0, 1],
              description: 'Drag Reduction System status (0 = Closed, 1 = Open)'
            }
          }
        },
        source: {
          bsonType: 'string',
          description: 'Data ingestion source (e.g., OpenF1 API)'
        }
      }
    }
  }
});

// Compound Index 1: Optimize telemetry lookup by race, driver, and lap (Rubric Section 7)
db.telemetry_samples.createIndex(
  { race_id: 1, driver_id: 1, lap_number: 1 },
  { name: 'idx_telemetry_race_driver_lap' }
);


// 2. Collection: race_events
// Stores unstructured/semi-structured race control incidents and flags
db.createCollection('race_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['race_id', 'lap_number', 'timestamp', 'event_type', 'description', 'severity'],
      properties: {
        race_id: {
          bsonType: 'int',
          description: 'Foreign reference to MySQL race.race_id'
        },
        lap_number: {
          bsonType: 'int',
          minimum: 0,
          description: 'Lap during which the event occurred'
        },
        timestamp: {
          bsonType: ['date', 'string'],
          description: 'Time of event deployment'
        },
        event_type: {
          bsonType: 'string',
          enum: ['Yellow Flag', 'Safety Car', 'Virtual Safety Car', 'Red Flag', 'Incident', 'Penalty', 'Overtake'],
          description: 'Classification of race control event'
        },
        driver_id: {
          bsonType: ['int', 'null'],
          description: 'Optional reference to MySQL driver.driver_id'
        },
        driver_name: {
          bsonType: ['string', 'null'],
          description: 'Driver name involved in the incident'
        },
        description: {
          bsonType: 'string',
          description: 'Detailed narrative description of the incident'
        },
        severity: {
          bsonType: 'string',
          enum: ['Low', 'Medium', 'High', 'Critical'],
          description: 'Impact on race flow'
        }
      }
    }
  }
});

// Compound Index 2: Incident lookup by race and event type (Rubric Section 7)
db.race_events.createIndex(
  { race_id: 1, event_type: 1 },
  { name: 'idx_events_race_type' }
);
