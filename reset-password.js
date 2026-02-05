// Run this to manually reset your password: node reset-password.js
const { PrismaClient } = require("./src/generated/prisma");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function resetPassword() {
  const email = "furkanesen35@gmail.com"; // Your email
  const newPassword = "YourNewPassword123!"; // CHANGE THIS to your desired password

  try {
    console.log('\n🔄 Resetting password for:', email);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        // Also clear any reset tokens
        resetToken: null,
        resetTokenExpiry: null
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    console.log('\n✅ Password reset successfully!');
    console.log('📧 Email:', updatedUser.email);
    console.log('🔑 New password:', newPassword);
    console.log('\n⚠️  REMEMBER TO CHANGE THE PASSWORD IN THE APP!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
