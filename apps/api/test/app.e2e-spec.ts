import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from './../src/app.module'; // <-- Removed .js
import { PrismaService } from './../prisma/prisma.service'; // <-- Removed .js

describe('Rental Management SaaS - Core Loop (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // State variables to hold data between tests
  let tenantAToken: string;
  let tenantBToken: string;
  let propertyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enforce the same validation rules as production
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // CLEAN SLATE: Wipe the database before running tests to ensure idempotency
    await prisma.client.auditLog.deleteMany();
    await prisma.client.payment.deleteMany();
    await prisma.client.rentInvoice.deleteMany();
    await prisma.client.rentalAgreement.deleteMany();
    await prisma.client.unit.deleteMany();
    await prisma.client.property.deleteMany();
    await prisma.client.user.deleteMany();
    await prisma.client.tenant.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication & Onboarding', () => {
    it('/auth/register (POST) - Should create Tenant A', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          companyName: 'Alpha Properties',
          email: 'admin@alphaprops.co.ke',
          password: 'SecurePassword123!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      // Save token for future requests
      tenantAToken = response.body.data.accessToken;
    });

    it('/auth/register (POST) - Should create Tenant B (The Rival Agency)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          companyName: 'Beta Housing',
          email: 'admin@betahousing.co.ke',
          password: 'SecurePassword123!',
        })
        .expect(201);

      tenantBToken = response.body.data.accessToken;
    });
  });

  describe('2. Core Operations (Properties & Units)', () => {
    it('/properties (POST) - Tenant A can create a property', async () => {
      const response = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          name: 'Sunrise Apartments',
          address: 'Westlands, Nairobi',
          type: 'APARTMENT',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Sunrise Apartments');

      propertyId = response.body.data.id; // Save for unit creation
    });

    it('/units (POST) - Tenant A can add a unit to their property', async () => {
      const response = await request(app.getHttpServer())
        .post('/units')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({
          propertyId: propertyId,
          name: 'A1 - Bedsitter',
          rentAmount: 1500000, // 15,000 KES in cents
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('A1 - Bedsitter');
    });
  });

  describe('3. Security & Multi-Tenancy Isolation', () => {
    it('/properties (GET) - Tenant A should see their property', async () => {
      const response = await request(app.getHttpServer())
        .get('/properties')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Sunrise Apartments');
    });

    it('/properties (GET) - Tenant B MUST NOT see Tenant A\'s property', async () => {
      const response = await request(app.getHttpServer())
        .get('/properties')
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(200);

      // This proves your TenantInterceptor is working flawlessly!
      expect(response.body.data.length).toBe(0);
    });

    it('/properties/:id (PATCH) - Tenant B cannot modify Tenant A\'s property', async () => {
      await request(app.getHttpServer())
        .patch(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ name: 'Hacked Apartments' })
        .expect(404); // Should throw a NotFoundException because the ID + TenantB's ID yields no result
    });
  });
});