import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver;

export function initNeo4jDriver(): Driver {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    console.log('Neo4j driver initialized');
    return driver;
}

export function getNeo4jSession(): Session {
    if (!driver) {
        initNeo4jDriver();
    }
    return driver.session();
}

export async function closeNeo4jDriver(): Promise<void> {
    if (driver) {
        await driver.close();
        console.log('Neo4j driver closed');
    }
}
