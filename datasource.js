const { DataSource } = require("typeorm");
const { Product } = require("./dist/models/products"); // Adjust if necessary

const AppDataSource = new DataSource({
  type: "postgres",
  host: "db1.sigma.thechristmasfabric.com",
  port: 49327,
  username: "tcfxxx54asdalk",
  password: "PaDGBC6CKF8J9lEKHWf3Cga8p9f9Hs3WYAnxZY26hex27lprG7kRpQ",
  database: "tcf_live",
  ssl: { rejectUnauthorized: false },
  entities: [
    Product,  // Ensure your extended Product entity is included
    "dist/models/*.js",  // Add this if other models are needed dynamically
  ],
  migrations: [
    "dist/migrations/*.js",
  ],
});

module.exports = {
  datasource: AppDataSource,
};
