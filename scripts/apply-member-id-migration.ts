import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

async function runMigration() {
    console.log('Attemping to apply member_id migration to local database...')

    // Try standard local Supabase ports
    const ports = [54322, 5432, 6432]

    // Read migration file
    const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260129_add_member_id_to_transactions.sql'
    )
    let sqlContent = ''

    try {
        sqlContent = fs.readFileSync(migrationPath, 'utf-8')
    } catch (err) {
        console.error('Could not read migration file:', err)
        process.exit(1)
    }

    let client: Client | null = null
    let connected = false

    for (const port of ports) {
        if (connected) break

        console.log(`Trying connection on port ${port}...`)

        try {
            client = new Client({
                user: 'postgres',
                host: '127.0.0.1',
                database: 'postgres',
                password: 'postgres', // default password
                port: port,
            })

            await client.connect()
            console.log(`Connected successfully on port ${port}!`)
            connected = true
        } catch (err) {
            console.log(`Failed on port ${port}:`, (err as Error).message)
            if (client) await client.end().catch(() => {})
        }
    }

    if (!connected || !client) {
        console.error('Could not connect to any local database port. Please run the SQL manually.')
        process.exit(1)
    }

    try {
        console.log('Executing migration SQL...')
        await client.query(sqlContent)
        console.log('Migration applied successfully! ✅')
        console.log('Transactions table should now have member_id.')
    } catch (err) {
        console.error('Error executing migration:', err)
    } finally {
        await client.end()
    }
}

runMigration().catch(err => {
    console.error('Unhandled error:', err)
    process.exit(1)
})
