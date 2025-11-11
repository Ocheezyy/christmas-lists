/**
 * Script to clean up duplicate users in the database
 * Run with: npx tsx scripts/cleanup-duplicate-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateUsers() {
  try {
    console.log('🔍 Finding duplicate users...\n');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        credentials: true,
        lists: true,
      },
    });

    // Group users by name
    const usersByName = new Map<string, typeof users>();
    users.forEach(user => {
      const existing = usersByName.get(user.name) || [];
      existing.push(user);
      usersByName.set(user.name, existing);
    });

    // Find duplicates
    const duplicates = Array.from(usersByName.entries())
      .filter(([_, users]) => users.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate users found!');
      return;
    }

    console.log(`Found ${duplicates.length} sets of duplicate users:\n`);

    for (const [name, dupeUsers] of duplicates) {
      console.log(`👤 Name: "${name}" (${dupeUsers.length} users)`);
      
      // Find the user to keep (one with credentials or lists)
      const userToKeep = dupeUsers.find(u => u.credentials.length > 0 || u.lists.length > 0) || dupeUsers[0];
      const usersToDelete = dupeUsers.filter(u => u.id !== userToKeep.id);

      console.log(`   ✓ Keeping: ${userToKeep.id} (${userToKeep.credentials.length} credentials, ${userToKeep.lists.length} lists)`);

      for (const user of usersToDelete) {
        console.log(`   ✗ Deleting: ${user.id} (${user.credentials.length} credentials, ${user.lists.length} lists)`);
        
        // Delete user (credentials will be cascade deleted)
        await prisma.user.delete({
          where: { id: user.id },
        });
      }

      console.log('');
    }

    console.log('✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateUsers();
