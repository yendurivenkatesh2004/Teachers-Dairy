/**
 * DIAGNOSTIC SCRIPT (read-only)
 * ---------------------------------------------------------
 * Bypasses Mongoose schema hydration entirely and looks at the RAW
 * bytes stored in MongoDB for this allocation, using the native driver.
 * This tells us definitively whether _id is actually persisted in the
 * database, or whether it's being generated fresh every time Mongoose
 * loads the document (which would explain ids changing between reads).
 */

const mongoose = require('mongoose');

const MONGO_URI = 'PASTE_YOUR_MONGODB_CONNECTION_STRING_HERE';
const ALLOCATION_ID = '6a3684248fc414c16ddec6af';

async function run() {
    await mongoose.connect(MONGO_URI);

    // Go around Mongoose's schema/model layer completely — talk to the
    // raw collection the way the MongoDB driver itself sees it.
    const raw = await mongoose.connection.db
        .collection('allocations')
        .findOne({ _id: new mongoose.Types.ObjectId(ALLOCATION_ID) });

    if (!raw) {
        console.log('Not found in raw collection.');
        await mongoose.disconnect();
        return;
    }

    console.log('=== RAW document from MongoDB (no Mongoose hydration) ===\n');
    console.log(JSON.stringify(raw, null, 2));

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
