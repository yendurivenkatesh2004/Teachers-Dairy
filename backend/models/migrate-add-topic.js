/**
 * ONE-TIME MIGRATION SCRIPT
 * ---------------------------------------------------------
 * What this does:
 *   Goes through every existing Allocation document and makes sure every
 *   topic and every subtopic inside it has its own unique _id.
 *   (Old documents were saved before we started auto-generating these,
 *   so they don't have one yet. New documents already get one
 *   automatically — this script is only needed ONCE, for old data.)
 *
 * Is it safe to run more than once?
 *   Yes. If a topic/subtopic already has an _id, this script leaves it
 *   alone and skips it. So if it gets interrupted, or you're not sure
 *   if it already ran, just run it again — it will not create duplicate
 *   or extra ids.
 *
 * Does it delete or change any of my real data (titles, progress, etc)?
 *   No. It only ADDS an _id field where one is missing. Nothing else
 *   is touched.
 */

const mongoose = require('mongoose');
const Allocation = require('./Allocation'); // adjust path if needed

const MONGO_URI = 'mongodb://yendurivenkateswarlu:nandu1234@ac-xlzo7qw-shard-00-00.b6hl5cz.mongodb.net:27017,ac-xlzo7qw-shard-00-01.b6hl5cz.mongodb.net:27017,ac-xlzo7qw-shard-00-02.b6hl5cz.mongodb.net:27017/?ssl=true&replicaSet=atlas-d1txvb-shard-0&authSource=admin&appName=Cluster0';

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.\n');

    const allocations = await Allocation.find({});
    console.log(`Found ${allocations.length} allocation document(s) to check.\n`);

    let docsChanged = 0;
    let topicsFixed = 0;
    let subtopicsFixed = 0;

    for (const allocation of allocations) {
        let changed = false;

        for (const topic of allocation.topics) {
            if (!topic._id) {
                topic._id = new mongoose.Types.ObjectId();
                topicsFixed++;
                changed = true;
            }

            for (const subtopic of topic.subtopics) {
                if (!subtopic._id) {
                    subtopic._id = new mongoose.Types.ObjectId();
                    subtopicsFixed++;
                    changed = true;
                }
            }
        }

        if (changed) {
            await allocation.save();
            docsChanged++;
            console.log(`Updated allocation ${allocation._id} (${allocation.className} - ${allocation.section} - ${allocation.subject})`);
        }
    }

    console.log('\n--- Done ---');
    console.log(`Allocation documents updated: ${docsChanged}`);
    console.log(`Topics given a new id:        ${topicsFixed}`);
    console.log(`Subtopics given a new id:     ${subtopicsFixed}`);

    await mongoose.disconnect();
    console.log('\nDisconnected. Safe to close this window.');
}

run().catch(err => {
    console.error('\nSomething went wrong:', err.message);
    process.exit(1);
});
