module.exports = {
  apps: [
    {
      name: "backend",
      script: "./backend/server.js",
      watch: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
