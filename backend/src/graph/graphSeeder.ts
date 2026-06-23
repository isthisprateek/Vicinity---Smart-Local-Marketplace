import { getNeo4jSession } from './neo4j';

export async function seedGraph(): Promise<void> {
    const session = getNeo4jSession();

    try {
        // ─── Create Symptom nodes ───
        await session.run(`
            MERGE (:Symptom {name: "cold"})
            MERGE (:Symptom {name: "cough"})
            MERGE (:Symptom {name: "fever"})
            MERGE (:Symptom {name: "headache"})
            MERGE (:Symptom {name: "sore throat"})
        `);

        // ─── Create Product nodes ───
        await session.run(`
            MERGE (:Product {name: "Honey", productId: "p-honey"})
            MERGE (:Product {name: "Ginger Tea", productId: "p-ginger-tea"})
            MERGE (:Product {name: "Paracetamol", productId: "p-paracetamol"})
            MERGE (:Product {name: "Cough Drops", productId: "p-cough-drops"})
            MERGE (:Product {name: "Vicks VapoRub", productId: "p-vicks"})
            MERGE (:Product {name: "Peppermint Oil", productId: "p-peppermint"})
            MERGE (:Product {name: "Tiger Balm", productId: "p-tiger-balm"})
            MERGE (:Product {name: "Thermometer", productId: "p-thermometer"})
            MERGE (:Product {name: "Electrolyte Powder", productId: "p-electrolyte"})
        `);

        // ─── Create Category nodes ───
        await session.run(`
            MERGE (:Category {name: "Natural Remedies"})
            MERGE (:Category {name: "Medicine"})
            MERGE (:Category {name: "Wellness"})
        `);

        // ─── TREATS relationships ───
        // Cold → products
        await session.run(`
            MATCH (s:Symptom {name: "cold"}), (p:Product {name: "Honey"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "cold"}), (p:Product {name: "Ginger Tea"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "cold"}), (p:Product {name: "Paracetamol"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "cold"}), (p:Product {name: "Vicks VapoRub"}) MERGE (s)-[:TREATS]->(p)
        `);

        // Cough → products
        await session.run(`
            MATCH (s:Symptom {name: "cough"}), (p:Product {name: "Cough Drops"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "cough"}), (p:Product {name: "Honey"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "cough"}), (p:Product {name: "Ginger Tea"}) MERGE (s)-[:TREATS]->(p)
        `);

        // Fever → products
        await session.run(`
            MATCH (s:Symptom {name: "fever"}), (p:Product {name: "Paracetamol"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "fever"}), (p:Product {name: "Thermometer"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "fever"}), (p:Product {name: "Electrolyte Powder"}) MERGE (s)-[:TREATS]->(p)
        `);

        // Headache → products
        await session.run(`
            MATCH (s:Symptom {name: "headache"}), (p:Product {name: "Paracetamol"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "headache"}), (p:Product {name: "Peppermint Oil"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "headache"}), (p:Product {name: "Tiger Balm"}) MERGE (s)-[:TREATS]->(p)
        `);

        // Sore throat → products
        await session.run(`
            MATCH (s:Symptom {name: "sore throat"}), (p:Product {name: "Honey"}) MERGE (s)-[:TREATS]->(p)
        `);
        await session.run(`
            MATCH (s:Symptom {name: "sore throat"}), (p:Product {name: "Ginger Tea"}) MERGE (s)-[:TREATS]->(p)
        `);

        // ─── BELONGS_TO relationships ───
        await session.run(`
            MATCH (p:Product {name: "Honey"}), (c:Category {name: "Natural Remedies"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Ginger Tea"}), (c:Category {name: "Natural Remedies"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Paracetamol"}), (c:Category {name: "Medicine"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Cough Drops"}), (c:Category {name: "Medicine"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Vicks VapoRub"}), (c:Category {name: "Medicine"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Peppermint Oil"}), (c:Category {name: "Wellness"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Tiger Balm"}), (c:Category {name: "Medicine"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Thermometer"}), (c:Category {name: "Wellness"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);
        await session.run(`
            MATCH (p:Product {name: "Electrolyte Powder"}), (c:Category {name: "Wellness"}) MERGE (p)-[:BELONGS_TO]->(c)
        `);

        // ─── RELATED_TO symptom relationships ───
        await session.run(`
            MATCH (a:Symptom {name: "cold"}), (b:Symptom {name: "cough"}) MERGE (a)-[:RELATED_TO]->(b)
        `);
        await session.run(`
            MATCH (a:Symptom {name: "cold"}), (b:Symptom {name: "fever"}) MERGE (a)-[:RELATED_TO]->(b)
        `);
        await session.run(`
            MATCH (a:Symptom {name: "cold"}), (b:Symptom {name: "sore throat"}) MERGE (a)-[:RELATED_TO]->(b)
        `);
        await session.run(`
            MATCH (a:Symptom {name: "cough"}), (b:Symptom {name: "sore throat"}) MERGE (a)-[:RELATED_TO]->(b)
        `);
        await session.run(`
            MATCH (a:Symptom {name: "fever"}), (b:Symptom {name: "headache"}) MERGE (a)-[:RELATED_TO]->(b)
        `);

        // ─── SIMILAR_TO category relationships ───
        await session.run(`
            MATCH (a:Category {name: "Natural Remedies"}), (b:Category {name: "Wellness"}) MERGE (a)-[:SIMILAR_TO]->(b)
        `);
        await session.run(`
            MATCH (a:Category {name: "Medicine"}), (b:Category {name: "Wellness"}) MERGE (a)-[:SIMILAR_TO]->(b)
        `);

        console.log('✅ Neo4j graph seeded successfully');
    } catch (error) {
        console.error('❌ Failed to seed Neo4j graph:', error);
    } finally {
        await session.close();
    }
}
