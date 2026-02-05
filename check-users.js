// Run this script: node check-users.js
const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        loyaltyPoints: true,
        createdAt: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    ALL USER ACCOUNTS                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    if (users.length === 0) {
      console.log('❌ No users found in database\n');
    } else {
      console.table(users.map(u => ({
        ID: u.id,
        Email: u.email,
        Name: u.name,
        Role: u.role,
        Verified: u.isVerified ? '✅' : '❌',
        Points: u.loyaltyPoints,
        Joined: u.createdAt.toLocaleDateString()
      })));
      console.log(`\n📊 Total users: ${users.length}\n`);
    }

    console.log('💡 Note: Passwords are hashed and cannot be viewed.');
    console.log('   Use the forgot-password feature in the app to reset.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
