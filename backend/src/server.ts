import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`Backend server listening on port ${env.port}`);
});
