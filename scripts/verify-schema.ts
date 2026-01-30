import { Client } from 'pg'

async function verifySchema() {
    console.log('Verifying transactions table schema...')

    const client = new Client({
        user: 'postgres',
        host: '127.0.0.1',
        database: 'postgres',
        password: 'postgres',
        port: 54322,
    })

    try {
        await client.connect()

        // Check columns
        const columnsRes = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'transactions';
        `)
        console.log('Columns:', columnsRes.rows)

        // Check Policies
        const policiesRes = await client.query(`
            select * from pg_policies where tablename = 'transactions';
        `)
        console.log('Policies:', policiesRes.rows)
    } catch (err) {
        console.error('Verification failed:', err)
    } finally {
        await client.end()
    }
}

verifySchema()
