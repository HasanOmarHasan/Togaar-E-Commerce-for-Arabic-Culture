const fs = require('fs');
// require('colors');
const dotenv = require('dotenv');
const Products = require('../../models/productModel');
const dbConnection = require('../../config/db');

dotenv.config({ path: '../../config/setting.env' });

// connect to DB
dbConnection();

// Read data
const products = JSON.parse(fs.readFileSync('./products.json'));


// Insert data into DB
const insertData = async () => {
  try {
    await Products.create(products);

    console.log('Data Inserted');
    process.exit();
  } catch (error) {
    console.log(error);
     process.exit(1);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await Products.deleteMany();
    console.log('Data Destroyed');
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// node seeder.js -d
if (process.argv[2] === '-i') {
  insertData();
} else if (process.argv[2] === '-d') {
  destroyData();
}
