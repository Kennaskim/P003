import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { tenantStorage } from '../src/common/storage/tenant.storage.js';

function createPrismaClient() {
    const connectionString = process.env['DATABASE_URL']!;
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private readonly _client = createPrismaClient();

    get client() {
        return this._client;
    }

    public readonly tenantClient = createPrismaClient().$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }: any) {
                    const excludedModels = ['Tenant'];

                    if (excludedModels.includes(model)) {
                        return query(args);
                    }

                    const store = tenantStorage.getStore();
                    const tenantId = store?.tenantId;

                    if (tenantId) {
                        const whereOps = [
                            'findUnique', 'findFirst', 'findMany',
                            'update', 'updateMany',
                            'delete', 'deleteMany',
                            'count', 'aggregate', 'groupBy',
                        ];

                        if (whereOps.includes(operation)) {
                            args.where = { ...args.where, tenantId };
                        }

                        if (['create', 'createMany'].includes(operation)) {
                            const data = args.data as any;
                            if (Array.isArray(data)) {
                                args.data = data.map((item: any) => ({ ...item, tenantId }));
                            } else {
                                args.data = { ...data, tenantId };
                            }
                        }

                        if (operation === 'upsert') {
                            args.where = { ...args.where, tenantId };
                            args.create = { ...args.create, tenantId };
                            args.update = { ...args.update };
                        }
                    }

                    return query(args);
                },
            },
        },
    });

    async onModuleInit() {
        await this._client.$connect();
        this.logger.log('PostgreSQL Database connected via Prisma');
    }

    async onModuleDestroy() {
        await this._client.$disconnect();
    }
}