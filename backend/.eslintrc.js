module.exports = {
  root: true,
  overrides: [
    {
      files: ["**/src/**/*.ts", "shared/src/**/*.ts", "lib/**/*.ts"],
      rules: {
        // Chặn dùng legacy public connection-pool trong backend
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@hospital/shared/dist/database/connection-pool',
                message:
                  "Không được import 'connection-pool' (schema 'public'). Hãy dùng '@hospital/shared/dist/database/schema-aware-connection-pool'.",
              },
              {
                name: '@hospital/shared/src/database/connection-pool',
                message:
                  "Không được import 'connection-pool' (schema 'public'). Hãy dùng '@hospital/shared/dist/database/schema-aware-connection-pool'.",
              },
            ],
          },
        ],
      },
    },
  ],
};

