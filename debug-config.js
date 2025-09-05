// Debug script to check NODE_ENV and config loading
console.log('=== DEBUG CONFIG LOADING ===');
console.log('1. Raw NODE_ENV:', process.env.NODE_ENV);
console.log('2. Typeof NODE_ENV:', typeof process.env.NODE_ENV);

const env = process.env.NODE_ENV || 'development';
console.log('3. Final env variable:', env);
console.log('4. Typeof env:', typeof env);

try {
  const configFile = require('./config/config.json');
  console.log('5. Config file loaded successfully');
  console.log('6. Config file keys:', Object.keys(configFile));
  console.log('7. Config file structure:', JSON.stringify(configFile, null, 2));
  
  const config = configFile[env];
  console.log('8. Selected config for env "' + env + '":', config);
  console.log('9. Config exists?', !!config);
  
  if (!config) {
    console.log('10. ERROR: Config is undefined for environment:', env);
    console.log('11. Available environments:', Object.keys(configFile));
  }
} catch (error) {
  console.log('ERROR loading config:', error.message);
}
