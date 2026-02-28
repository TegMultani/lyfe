// Firebase Realtime DB REST API bindings

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://schemaflow-4a0c5-default-rtdb.firebaseio.com';

export async function fetchData(path: string) {
    try {
        const res = await fetch(`${DB_URL}/${path}.json`);
        if (!res.ok) throw new Error('Failed to fetch from Firebase');
        return await res.json();
    } catch (error) {
        console.error('Firebase fetch error:', error);
        return null;
    }
}

export async function updateData(path: string, data: any) {
    try {
        const res = await fetch(`${DB_URL}/${path}.json`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update Firebase');
        return await res.json();
    } catch (error) {
        console.error('Firebase update error:', error);
        return null;
    }
}
