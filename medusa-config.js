const dotenv = require("dotenv");
const path = require("path");

// Existing dotenv configuration
let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  case "development":
  default:
    ENV_FILE_NAME = ".env";
    break;
}

try {
  dotenv.config({ path: path.resolve(process.cwd(), ENV_FILE_NAME) });
  console.log(`Loaded environment file: ${ENV_FILE_NAME}`);
} catch (e) {
  console.error(`Error loading .env file: ${e.message}`);
}

const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001";
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost/medusa-starter-default";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/file-local`,
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/admin",
    options: {
      autoRebuild: process.env.AUTO_REBUILD || true,
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
  {
    resolve: `medusa-plugin-strapi`,
    options: {
      strapi_url: process.env.STRAPI_URL || "http://localhost:1337",
      api_token: process.env.STRAPI_API_TOKEN || "your-default-token-here",
    },
  },
  // Uncomment the following lines if you are using Stripe for payments
  {
    resolve: `medusa-payment-stripe`,
    options: {
      api_key: process.env.STRIPE_API_KEY,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  {
    resolve: `medusa-plugin-wishlist`,
    options: {
      // Set the default wishlist type (e.g., "default", "custom")
      default_type: "default",
    },
  },
  // {
  //   resolve: `medusa-plugin-meilisearch`,
  //   options: {
  //     // config object passed when creating an instance
  //     // of the MeiliSearch client
  //     config: {
  //       host: process.env.MEILISEARCH_HOST,
  //       apiKey: process.env.MEILISEARCH_API_KEY,
  //     },
  //     settings: {
  //       // index settings...
  //     },
  //   },
  // },
];

const projectConfig = {
  jwt_secret: process.env.JWT_SECRET || "supersecret",
  cookie_secret: process.env.COOKIE_SECRET || "supersecret",
  store_cors: STORE_CORS,
  database_url: DATABASE_URL,
  admin_cors: ADMIN_CORS,
  redis_url: REDIS_URL // Enable Redis if necessary
};

const modules = {
  // Other module configurations (if applicable)
};

module.exports = {
  projectConfig,
  plugins,
  modules,
  // loaders,  // Include loaders here if you have any
};
