import { createHttpServer } from './presentation/http/servers/express-server';
import { env } from './infrastructure/config/env';

const app = createHttpServer();

app.listen(env.port, () => {
  console.log(`[clinical-emr-service] Listening on port ${env.port}`);
});
