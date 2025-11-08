"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_server_1 = require("./presentation/http/servers/express-server");
const env_1 = require("./infrastructure/config/env");
const app = (0, express_server_1.createHttpServer)();
app.listen(env_1.env.port, () => {
    console.log(`[clinical-emr-service] Listening on port ${env_1.env.port}`);
});
