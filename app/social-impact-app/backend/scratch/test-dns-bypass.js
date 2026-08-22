const mongoose = require('mongoose');

const uri = "mongodb://pr:Pranav%4030@ac-hvcehdy-shard-00-00.v4afw4e.mongodb.net:27017,ac-hvcehdy-shard-00-01.v4afw4e.mongodb.net:27017,ac-hvcehdy-shard-00-02.v4afw4e.mongodb.net:27017/socialimpact?ssl=true&replicaSet=atlas-hvcehdy-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB directly!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Failed to connect:", err);
    process.exit(1);
  });
