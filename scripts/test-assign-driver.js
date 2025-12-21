/**
 * Test script to create a test order and assign a driver
 * Run: node scripts/test-assign-driver.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find or create a test user
    let user = await prisma.user.findFirst({
      where: { email: { contains: 'test' } }
    });

    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      console.log('No users found. Please create a user first by registering in the app.');
      return;
    }

    console.log(`\n👤 Using user: ${user.name || user.email}`);

    // Find a menu item
    const menuItem = await prisma.menuItem.findFirst();
    if (!menuItem) {
      console.log('No menu items found. Please run seed first.');
      return;
    }

    // Check for existing ready order with no driver
    let order = await prisma.order.findFirst({
      where: { 
        status: 'ready',
        driverName: null 
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    if (!order) {
      // Find any active order
      order = await prisma.order.findFirst({
        where: { 
          status: { notIn: ['delivered', 'cancelled'] }
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      });

      if (order) {
        console.log(`\n📦 Found existing order #${order.id}, updating to 'ready'...`);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'ready' }
        });
        
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'ready',
            message: 'Order is ready for pickup'
          }
        });
      }
    }

    if (!order) {
      // Create a new test order
      console.log(`\n📝 Creating new test order...`);
      
      order = await prisma.order.create({
        data: {
          userId: user.id,
          status: 'ready',
          items: {
            create: [{
              menuItemId: menuItem.id,
              quantity: 1
            }]
          }
        },
        include: { 
          user: true,
          items: { include: { menuItem: true } }
        }
      });

      await prisma.orderStatusHistory.createMany({
        data: [
          { orderId: order.id, status: 'pending', message: 'Order received' },
          { orderId: order.id, status: 'confirmed', message: 'Order confirmed' },
          { orderId: order.id, status: 'preparing', message: 'Kitchen is preparing your order' },
          { orderId: order.id, status: 'ready', message: 'Order is ready for pickup' }
        ]
      });

      console.log(`   Created order #${order.id} with ${order.items?.length || 0} item(s)`);
    }

    console.log(`\n📦 Order #${order.id}`);
    console.log(`   User: ${order.user?.name || order.user?.email}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Current driver: ${order.driverName || 'None'}`);

    // Assign a test driver
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        driverName: 'Max Müller',
        driverPhone: '+49 151 12345678',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000), // 30 min from now
        // Set mock driver location (Berlin)
        driverLatitude: 52.5200,
        driverLongitude: 13.4050,
        driverLocationUpdatedAt: new Date()
      }
    });

    // Add driver assignment to status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'ready',
        message: 'Max Müller is on the way with your order'
      }
    });

    console.log(`\n✅ Driver assigned successfully!`);
    console.log(`   Order #${updatedOrder.id}`);
    console.log(`   Status: ${updatedOrder.status}`);
    console.log(`   Driver: ${updatedOrder.driverName}`);
    console.log(`   Phone: ${updatedOrder.driverPhone}`);
    console.log(`   ETA: ${updatedOrder.estimatedDeliveryTime}`);
    console.log(`   Driver Location: ${updatedOrder.driverLatitude}, ${updatedOrder.driverLongitude}`);
    console.log(`\n🗺️  Now open the app, go to Orders tab, and you should see the "Track Order" button!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
