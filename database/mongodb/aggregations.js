/**
 * Motorsport Race Performance and Strategy Management System
 * MongoDB NoSQL Aggregation Pipelines (Student B - Rubric Section 7)
 * Database: motorsport_telemetry
 */

// Aggregation Pipeline 1: Speed Trap Leaderboard & Lap Telemetry Summary
// Computes max speed, average throttle percentage, and total DRS activations per lap.
const speedTrapPipeline = [
  { 
    $match: { 
      race_id: 1 // Example: Bahrain GP
    } 
  },
  {
    $group: {
      _id: {
        driver_id: "$driver_id",
        driver_code: "$driver_code"
      },
      top_speed_kmh: { $max: "$telemetry.speed" },
      avg_speed_kmh: { $avg: "$telemetry.speed" },
      avg_throttle_pct: { $avg: "$telemetry.throttle" },
      total_drs_samples: { $sum: "$telemetry.drs" },
      sample_count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      driver_id: "$_id.driver_id",
      driver_code: "$_id.driver_code",
      top_speed_kmh: { $round: ["$top_speed_kmh", 1] },
      avg_speed_kmh: { $round: ["$avg_speed_kmh", 1] },
      avg_throttle_pct: { $round: ["$avg_throttle_pct", 1] },
      total_drs_samples: 1,
      sample_count: 1
    }
  },
  { 
    $sort: { top_speed_kmh: -1 } 
  }
];

// Aggregation Pipeline 2: Race Event Severity & Flag Incident Distribution
// Aggregates safety car and yellow flag interventions by severity to evaluate race disruption.
const incidentAnalysisPipeline = [
  {
    $group: {
      _id: {
        race_id: "$race_id",
        event_type: "$event_type"
      },
      incident_count: { $sum: 1 },
      affected_drivers: { $addToSet: "$driver_name" }
    }
  },
  {
    $sort: { incident_count: -1 }
  }
];

module.exports = {
  speedTrapPipeline,
  incidentAnalysisPipeline
};
