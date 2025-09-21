const dbConnection = () =>
  require("mongoose")
    .connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
    })
    .then((conn) => console.log(`db is connected ${conn.connection.host}`))
    .catch((err) => {
      console.log(`db is not connected ${err}`);
      process.exit(1);
    });

module.exports = dbConnection;
