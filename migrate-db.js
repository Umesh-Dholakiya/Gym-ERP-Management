const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017/gym-erp';
const CLOUD_URI = 'mongodb+srv://gym_erp:gym_erp123@cluster0.2qzunj2.mongodb.net/gym-erp?appName=Cluster0';

async function migrateData() {
  console.log('🔄 Starting data migration...');

  let localClient;
  let cloudClient;

  try {
    localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    const localDb = localClient.db();

    cloudClient = new MongoClient(CLOUD_URI);
    await cloudClient.connect();
    const cloudDb = cloudClient.db();

    console.log('✅ Connected to both Local and Cloud databases.');

    // Get all collections from local DB
    const collections = await localDb.listCollections().toArray();
    console.log(`📌 Found ${collections.length} collections locally.`);

    for (let colInfo of collections) {
      const collectionName = colInfo.name;

      if (collectionName.startsWith('system.')) continue;

      console.log(`\n⏳ Migrating collection: ${collectionName}...`);

      const localCol = localDb.collection(collectionName);
      const cloudCol = cloudDb.collection(collectionName);

      // Clear old data from cloud if any
      await cloudCol.deleteMany({});

      const documents = await localCol.find({}).toArray();

      if (documents.length > 0) {
        await cloudCol.insertMany(documents);
        console.log(`✅ Inserted ${documents.length} documents into ${collectionName}`);
      } else {
        console.log(`ℹ️ No documents found in ${collectionName}, skipping.`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (localClient) await localClient.close();
    if (cloudClient) await cloudClient.close();
  }
}

migrateData();
