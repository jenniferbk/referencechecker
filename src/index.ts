import app from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`Reference Checker API running on port ${config.port}`);
});
