import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { tenantStorage } from '../src/common/storage/tenant.storage.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    private readonly pool: Pool;
    private readonly _client: PrismaClient;
    public readonly tenantClient: any;

    constructor() {
        // Read the connection string inside the constructor so it happens 
        // AFTER NestJS ConfigModule has loaded the .env file.
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL is not defined in the environment variables.');
        }

        this.pool = new Pool({ connectionString });
        const adapter = new PrismaPg(this.pool);

        // Initialize the base client
        this._client = new PrismaClient({ adapter });

        // Initialize the tenant-scoped client
        this.tenantClient = this.createTenantClient();
    }

    // Expose the base client for system-level operations (e.g. Authentication)
    get client() {
        return this._client;
    }

    private createTenantClient() {
        const baseClient = this._client;

        return baseClient.$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }: any) {
                        const excludedModels = ['Tenant', 'User']; // Users usually need cross-tenant lookup for login

                        if (excludedModels.includes(model)) {
                            return query(args);
                        }

                        const store = tenantStorage.getStore();
                        const tenantId = store?.tenantId;

                        if (tenantId) {
                            args = args || {};

                            // Prisma RLS Fix for findUnique/findUniqueOrThrow
                            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
                                const fallbackOp = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
                                args.where = { ...(args.where || {}), tenantId };
                                // @ts-ignore
                                return baseClient[model][fallbackOp](args);
                            }

                            const whereOps = [
                                'findFirst', 'findFirstOrThrow', 'findMany',
                                'update', 'updateMany',
                                'delete', 'deleteMany',
                                'count', 'aggregate', 'groupBy',
                            ];

                            if (whereOps.includes(operation)) {
                                args.where = { ...(args.where || {}), tenantId };
                            }

                            if (['create', 'createMany'].includes(operation)) {
                                const data = args.data || {};
                                if (Array.isArray(data)) {
                                    args.data = data.map((item: any) => ({ ...item, tenantId }));
                                } else {
                                    args.data = { ...data, tenantId };
                                }
                            }

                            if (operation === 'upsert') {
                                args.where = { ...(args.where || {}), tenantId };
                                args.create = { ...(args.create || {}), tenantId };
                            }
                        }

                        return query(args);
                    },
                },
            },
        });
    }

    async onModuleInit() {
        await this._client.$connect();
        this.logger.log('PostgreSQL Database connected via Prisma Serverless Adapter');
    }

    async onModuleDestroy() {
        await this._client.$disconnect();
        await this.pool.end(); // Gracefully close the pg pool connection
    }
}