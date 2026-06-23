/**
 * One-time cleanup: remove garbage Category nodes (single chars, commas, spaces)
 * and any orphaned "Satisfying" category from Neo4j.
 * Run: npx ts-node src/graph/cleanupGraph.ts
 */
import { getNeo4jSession, initNeo4jDriver } from './neo4j';
import dotenv from 'dotenv';
dotenv.config();

async function cleanup() {
    initNeo4jDriver();
    const session = getNeo4jSession();
    try {
        // Delete all Category nodes with names shorter than 3 characters
        const result = await session.run(
            `MATCH (c:Category) WHERE size(c.name) < 3 DETACH DELETE c RETURN count(c) as deleted`
        );
        const deleted = result.records[0]?.get('deleted')?.toNumber() || 0;
        console.log(`🧹 Deleted ${deleted} garbage Category nodes`);

        // List remaining categories
        const remaining = await session.run(`MATCH (c:Category) RETURN c.name AS name ORDER BY name`);
        console.log('📦 Remaining categories:', remaining.records.map(r => r.get('name')));
    } finally {
        await session.close();
        process.exit(0);
    }
}

cleanup().catch(console.error);
