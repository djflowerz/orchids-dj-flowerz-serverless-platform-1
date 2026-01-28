import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const validation = () => {
    if (!connectionString) {
        throw new Error('DATABASE_URL is not defined')
    }
}

const createPrismaClient = () => {
    validation()

    // 1. Development Mode: Standard Client
    if (process.env.NODE_ENV === 'development') {
        console.log('Initialize Prisma Client - Development Mode (Standard Driver)')
        return new PrismaClient({
            log: ['query'],
        })
    }

    // 2. Node.js Environment Detection (Vercel, Build time, or Local Prod)
    // Vercel and most production environments use Node.js runtime
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

    if (isNode && process.env.NEXT_RUNTIME !== 'edge') {
        console.log('Initialize Prisma Client - Node.js Environment (Standard Driver)')
        return new PrismaClient({
            log: ['query'],
        })
    }

    // 3. Edge Runtime Detection (Cloudflare Pages specific)
    if (process.env.NEXT_RUNTIME === 'edge') {
        console.log('Initialize Prisma Client - Edge Mode (Neon Adapter)')
        if (typeof WebSocket !== 'undefined') {
            neonConfig.webSocketConstructor = WebSocket
        }
        neonConfig.poolQueryViaFetch = true

        const pool = new Pool({ connectionString })
        const adapter = new PrismaNeon(pool)

        return new PrismaClient({
            adapter,
            log: ['query'],
        })
    }

    // 4. Fallback (e.g. Browser or unexpected runtime)
    if (typeof WebSocket !== 'undefined') {


        neonConfig.poolQueryViaFetch = true

        const pool = new Pool({ connectionString })
        const adapter = new PrismaNeon(pool)

        return new PrismaClient({
            adapter,
            log: ['query'],
        })
    }

    // 4. Fallback
    console.log('Initialize Prisma Client - Fallback (Standard Driver)')
    return new PrismaClient({
        log: ['query'],
    })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
