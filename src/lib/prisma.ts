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

    // 2. Node.js Environment Detection (Build time or Local Prod)
    // Cloudflare Pages Build runs in Node.js. We should use Standard Client there to avoid WS issues.
    // Edge Runtime does not have process.versions.node
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

    if (isNode) {
        console.log('Initialize Prisma Client - Node.js Environment (Standard Driver)')
        return new PrismaClient({
            log: ['query'],
        })
    }

    // 3. Edge / Production Mode (Neon Adapter)
    if (typeof WebSocket !== 'undefined') {
        console.log('Initialize Prisma Client - Edge Mode (Neon Adapter)')
        neonConfig.webSocketConstructor = WebSocket
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
