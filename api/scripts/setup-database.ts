#!/usr/bin/env tsx
/**
 * Database Setup Script
 *
 * This script:
 * 1. Runs Prisma migrations
 * 2. Executes custom SQL migrations (RLS, triggers, seeds)
 * 3. Creates initial test tenant and admin user
 * 4. Verifies the setup
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/db/client.js';
import { authService } from '../src/auth/authentication.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runPrismaMigrations() {
  console.log('\n📦 Running Prisma migrations...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
    });
    console.log('✅ Prisma migrations completed');
  } catch (error) {
    console.error('❌ Prisma migrations failed:', error);
    throw error;
  }
}

async function runCustomMigrations() {
  console.log('\n🔧 Running custom SQL migrations...');
  try {
    const migrationPath = join(__dirname, '../prisma/migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (error: any) {
        // Ignore errors for statements that might already exist
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log(`⚠️  Skipping: ${error.message.split('\n')[0]}`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Custom SQL migrations completed');
  } catch (error) {
    console.error('❌ Custom SQL migrations failed:', error);
    throw error;
  }
}

async function createInitialData() {
  console.log('\n🌱 Creating initial data...');

  try {
    // Create test tenant
    console.log('  Creating test tenant...');
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'test-tenant' },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          slug: 'test-tenant',
          apiKey: `sk_test_${Math.random().toString(36).substring(2, 15)}`,
          settings: {},
        },
      });
      console.log(`  ✓ Test tenant created (ID: ${tenant.id})`);
    } else {
      console.log(`  ✓ Test tenant already exists (ID: ${tenant.id})`);
    }

    // Create tenant quota
    const existingQuota = await prisma.tenantQuota.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!existingQuota) {
      await prisma.tenantQuota.create({
        data: {
          tenantId: tenant.id,
          maxPolicies: 1000,
          maxConsentsPerMonth: 10000,
          maxProofBundlesPerDay: 100,
          maxUsers: 50,
          maxStorageMb: 1024,
        },
      });
      console.log('  ✓ Tenant quota created');
    } else {
      console.log('  ✓ Tenant quota already exists');
    }

    // Get ADMIN role
    const adminRole = await prisma.role.findFirst({
      where: {
        name: 'ADMIN',
        isSystemRole: true,
      },
    });

    if (!adminRole) {
      throw new Error('ADMIN role not found. Please ensure migrations ran correctly.');
    }

    // Create admin user
    console.log('  Creating admin user...');
    const adminEmail = 'admin@test.com';
    let adminUser = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: adminEmail,
      },
    });

    if (!adminUser) {
      const passwordHash = await authService.hashPassword('admin123');
      adminUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          name: 'Admin User',
          passwordHash,
          status: 'active',
        },
      });
      console.log(`  ✓ Admin user created (email: ${adminEmail}, password: admin123)`);
    } else {
      console.log(`  ✓ Admin user already exists (email: ${adminEmail})`);
    }

    // Assign ADMIN role
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
          grantedBy: adminUser.id,
        },
      });
      console.log('  ✓ ADMIN role assigned to admin user');
    } else {
      console.log('  ✓ ADMIN role already assigned');
    }

    // Create a sample policy template
    console.log('  Creating sample policy template...');
    const existingTemplate = await prisma.policyTemplate.findFirst({
      where: {
        name: 'Basic Privacy Policy',
        jurisdiction: 'US',
      },
    });

    if (!existingTemplate) {
      await prisma.policyTemplate.create({
        data: {
          name: 'Basic Privacy Policy',
          description: 'A basic privacy policy template compliant with GDPR and CCPA',
          jurisdiction: 'US',
          category: 'privacy',
          complianceFrameworks: ['GDPR', 'CCPA'],
          templateData: {
            policyText: 'This privacy policy describes how we collect, use, and protect your personal data...',
            dataTypes: ['name', 'email', 'address'],
            purposes: ['service_delivery', 'analytics', 'marketing'],
            retentionPeriod: 365,
          },
          isActive: true,
        },
      });
      console.log('  ✓ Sample policy template created');
    } else {
      console.log('  ✓ Sample policy template already exists');
    }

    console.log('\n✅ Initial data created successfully');
    console.log('\n📋 Test credentials:');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: admin123`);
    console.log(`   API Key: ${tenant.apiKey}`);

  } catch (error) {
    console.error('❌ Failed to create initial data:', error);
    throw error;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');

  try {
    // Check tables exist
    const tables = await prisma.$queryRaw<any[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log(`  ✓ Found ${tables.length} tables in database`);

    // Check roles exist
    const rolesCount = await prisma.role.count();
    console.log(`  ✓ Found ${rolesCount} roles`);

    // Check permissions
    const permissions = await prisma.role.findMany({
      where: { isSystemRole: true },
      select: { name: true, permissions: true },
    });
    console.log(`  ✓ System roles configured:`);
    for (const role of permissions) {
      const perms = role.permissions as string[];
      console.log(`    - ${role.name}: ${perms.length} permissions`);
    }

    // Check tenants
    const tenantsCount = await prisma.tenant.count();
    console.log(`  ✓ Found ${tenantsCount} tenant(s)`);

    // Check users
    const usersCount = await prisma.user.count();
    console.log(`  ✓ Found ${usersCount} user(s)`);

    console.log('\n✅ Setup verification completed successfully!');

  } catch (error) {
    console.error('❌ Setup verification failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database setup...\n');

  try {
    await runPrismaMigrations();
    await runCustomMigrations();
    await createInitialData();
    await verifySetup();

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('   1. Start the API server: npm run dev');
    console.log('   2. Test login: POST /api/v1/auth/login');
    console.log('   3. Create policies, consents, and proof bundles');
    console.log('   4. Check the API documentation for available endpoints\n');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
