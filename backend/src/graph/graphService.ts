import { getNeo4jSession } from './neo4j';

interface IntentSearchResult {
    intent: string;
    products: string[];
}

export async function searchProductsByIntent(query: string): Promise<IntentSearchResult> {
    const session = getNeo4jSession();
    const normalizedQuery = query.toLowerCase();

    try {
        const result = await session.run(
            `
            // 1. Match symptoms contained in the query
            OPTIONAL MATCH (s:Symptom)
            WHERE toLower($query) CONTAINS toLower(s.name)
            WITH collect(DISTINCT s) AS symptoms

            // 2. Match products whose name is contained in the query (or query in product name)
            OPTIONAL MATCH (p:Product)
            WHERE toLower(p.name) CONTAINS toLower($query)
               OR toLower($query) CONTAINS toLower(p.name)
            WITH symptoms, collect(DISTINCT p) AS directMatchProducts

            // 3. Match categories whose name is contained in the query (min 3 chars to avoid junk)
            OPTIONAL MATCH (c:Category)
            WHERE size(c.name) >= 3
              AND (toLower($query) CONTAINS toLower(c.name)
               OR toLower(c.name) CONTAINS toLower($query))
            WITH symptoms, directMatchProducts, collect(DISTINCT c) AS matchedCategories

            // 4. Get products from matched categories (BELONGS_TO)
            UNWIND CASE WHEN size(matchedCategories) = 0 THEN [null] ELSE matchedCategories END AS mc
            OPTIONAL MATCH (catProduct:Product)-[:BELONGS_TO]->(mc)
            WITH symptoms, directMatchProducts, matchedCategories, collect(DISTINCT catProduct) AS categoryProducts

            // 5. Get products from SIMILAR categories (Category -[:SIMILAR_TO]-> Category)
            UNWIND CASE WHEN size(matchedCategories) = 0 THEN [null] ELSE matchedCategories END AS mc2
            OPTIONAL MATCH (mc2)-[:SIMILAR_TO]-(similarCat:Category)
            OPTIONAL MATCH (simProduct:Product)-[:BELONGS_TO]->(similarCat)
            WITH symptoms, directMatchProducts, matchedCategories, categoryProducts,
                 collect(DISTINCT simProduct) AS similarProducts,
                 collect(DISTINCT similarCat) AS similarCats

            // 6. Get products from matched symptoms via TREATS
            UNWIND CASE WHEN size(symptoms) = 0 THEN [null] ELSE symptoms END AS s
            OPTIONAL MATCH (s)-[:TREATS]->(sp:Product)
            WITH symptoms, directMatchProducts, matchedCategories, categoryProducts, similarProducts, similarCats,
                 collect(DISTINCT sp) AS symptomProducts

            // 7. Get products from RELATED_TO symptoms
            UNWIND CASE WHEN size(symptoms) = 0 THEN [null] ELSE symptoms END AS s2
            OPTIONAL MATCH (s2)-[:RELATED_TO]->(related:Symptom)-[:TREATS]->(rp:Product)
            WITH symptoms, directMatchProducts, matchedCategories, categoryProducts, similarProducts, similarCats,
                 symptomProducts, collect(DISTINCT rp) AS relatedProducts

            // 8. Build result
            WITH
                [s IN symptoms WHERE s IS NOT NULL | s.name] AS symptomNames,
                [p IN directMatchProducts WHERE p IS NOT NULL | p.name] AS directNames,
                [c IN matchedCategories WHERE c IS NOT NULL | c.name] AS matchedCatNames,
                [p IN categoryProducts WHERE p IS NOT NULL | p.name] AS catProdNames,
                [p IN similarProducts WHERE p IS NOT NULL | p.name] AS simProdNames,
                [c IN similarCats WHERE c IS NOT NULL | c.name] AS similarCatNames,
                [p IN symptomProducts WHERE p IS NOT NULL | p.name] AS symptomProdNames,
                [p IN relatedProducts WHERE p IS NOT NULL | p.name] AS relatedProdNames

            RETURN symptomNames, directNames, matchedCatNames, catProdNames, simProdNames, similarCatNames, symptomProdNames, relatedProdNames
            `,
            { query: normalizedQuery }
        );

        const productSet = new Set<string>();
        let detectedIntent = '';

        if (result.records.length > 0) {
            const record = result.records[0];
            const symptomNames: string[] = record.get('symptomNames') || [];
            const directNames: string[] = record.get('directNames') || [];
            const matchedCatNames: string[] = record.get('matchedCatNames') || [];
            const catProdNames: string[] = record.get('catProdNames') || [];
            const simProdNames: string[] = record.get('simProdNames') || [];
            const similarCatNames: string[] = record.get('similarCatNames') || [];
            const symptomProdNames: string[] = record.get('symptomProdNames') || [];
            const relatedProdNames: string[] = record.get('relatedProdNames') || [];

            // Determine the intent label
            if (symptomNames.length > 0) {
                detectedIntent = symptomNames.join(' + ');
            } else if (directNames.length > 0) {
                detectedIntent = `Product: ${directNames[0]}`;
            } else if (matchedCatNames.length > 0) {
                const allCats = [...matchedCatNames];
                if (similarCatNames.length > 0) {
                    allCats.push(`+ similar: ${similarCatNames.join(', ')}`);
                }
                detectedIntent = `Category: ${allCats.join(', ')}`;
            }

            // Add all products (direct > category > similar > symptom > related)
            directNames.forEach(p => productSet.add(p));
            catProdNames.forEach(p => productSet.add(p));
            simProdNames.forEach(p => productSet.add(p));
            symptomProdNames.forEach(p => productSet.add(p));
            relatedProdNames.forEach(p => productSet.add(p));
        }

        return {
            intent: detectedIntent || 'No matching intent found',
            products: Array.from(productSet),
        };
    } finally {
        await session.close();
    }
}

/**
 * Add a seller's product to the Neo4j graph.
 * Creates Product node, Category node, BELONGS_TO relationship,
 * and SIMILAR_TO relationships to related categories.
 */
export async function addProductToGraph(
    productName: string,
    categoryName: string,
    similarTo: string[] = []
): Promise<void> {
    const session = getNeo4jSession();

    // Validate inputs
    const cleanCategory = categoryName.trim();
    if (!productName.trim() || cleanCategory.length < 2) return;

    try {
        // 1. Create product + category + BELONGS_TO
        await session.run(
            `
            MERGE (p:Product {name: $productName})
            MERGE (c:Category {name: $categoryName})
            MERGE (p)-[:BELONGS_TO]->(c)
            `,
            { productName: productName.trim(), categoryName: cleanCategory }
        );

        // 2. Create SIMILAR_TO relationships
        for (const raw of similarTo) {
            const similar = raw.trim();
            if (similar.length < 2) continue; // Skip junk
            await session.run(
                `
                MERGE (c1:Category {name: $categoryName})
                MERGE (c2:Category {name: $similarName})
                MERGE (c1)-[:SIMILAR_TO]->(c2)
                `,
                { categoryName: cleanCategory, similarName: similar }
            );
        }
    } finally {
        await session.close();
    }
}

/**
 * Remove a product from the Neo4j graph (detach delete).
 */
export async function removeProductFromGraph(productName: string): Promise<void> {
    const session = getNeo4jSession();
    try {
        await session.run(
            `MATCH (p:Product {name: $productName}) DETACH DELETE p`,
            { productName }
        );
    } finally {
        await session.close();
    }
}

/**
 * Return all category names from the Neo4j graph.
 */
export async function getGraphCategories(): Promise<string[]> {
    const session = getNeo4jSession();
    try {
        const result = await session.run(`MATCH (c:Category) RETURN c.name AS name ORDER BY name`);
        return result.records.map(r => r.get('name') as string);
    } finally {
        await session.close();
    }
}
