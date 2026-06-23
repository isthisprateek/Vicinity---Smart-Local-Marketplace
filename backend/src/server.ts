import app from './app';
import { connectDB } from './config/db';
import { initNeo4jDriver, closeNeo4jDriver } from './graph/neo4j';
import { seedGraph } from './graph/graphSeeder';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async () => {
    // Initialize Neo4j and seed graph data
    try {
        initNeo4jDriver();
        await seedGraph();
        console.log('Neo4j ready');
    } catch (err) {
        console.error('Neo4j initialization failed:', err);
        console.warn('Server will continue without Neo4j graph search');
    }

    // Start Server
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await closeNeo4jDriver();
    process.exit(0);
});
