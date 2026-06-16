import { createApp } from "./app";
import { COMPANION_PORT } from "./runtimeConfig";

const app = createApp();

try {
  await app.listen({ host: "127.0.0.1", port: COMPANION_PORT });
  console.log(`Local Html Tuner companion listening on http://127.0.0.1:${COMPANION_PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
