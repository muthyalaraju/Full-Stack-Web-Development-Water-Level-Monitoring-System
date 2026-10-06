import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_water_monitoring',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
  },
  tank: {
    defaultId: 1,
    heightCm: 20.0,
    thresholds: {
      low: 20,
      full: 80,
    },
  },
};

