/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
        }
    })
}

const defaultDbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
if (!process.env.DATABASE_URL) {
    console.log(
        'DATABASE_URL not found in .env.local, using default local Supabase URL: ' + defaultDbUrl
    )
    process.env.DATABASE_URL = defaultDbUrl
}

const isLocal =
    process.env.DATABASE_URL.includes('127.0.0.1') || process.env.DATABASE_URL.includes('localhost')
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
})

const migrationFile = path.join(
    process.cwd(),
    'supabase/migrations/20260129161200_add_company_info_to_settings.sql'
)
const sql = fs.readFileSync(migrationFile, 'utf-8')

;(async () => {
    try {
        await client.connect()
        console.log('Connected to database at ' + process.env.DATABASE_URL.split('@')[1]) // Log safe part of URL
        console.log('Executing migration...')
        await client.query(sql)
        console.log('Migration successfully executed!')
    } catch (err) {
        console.error('Error executing migration:', err)
    } finally {
        await client.end()
    }
})()
