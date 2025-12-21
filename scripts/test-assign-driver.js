/**
 * Test script to assign a driver to a ready order
 * Run: node scripts/test-assign-driver.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find a "ready" order or the most recent order
    let order = await prisma.order.findFirst({
      where: { status: 'ready' },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    if (!order) {
      // If no ready order, find any non-delivered order and update it to ready
      order = await prisma.order.findFirst({
        where: { 
          status: { notIn: ['delivered', 'cancelled'] }
        },
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      });

      if (order) {
        console.log(`No ready orders found. Updating order ${order.id} to 'ready' status...`);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'ready' }
        });
        
        // Add status history
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
      console.log('No orders found. Please create an order first.');
      return;
    }

    console.log(`\n📦 Found order #${order.id} (user: ${order.user?.name || order.user?.email})`);
    console.log(`   Current status: ${order.status}`);
    console.log(`   Current driver: ${order.driverName || 'None'}`);

    // Assign a test driver
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        driverName: 'Max Müller',
        driverPhone: '+49 151 12345678',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000), // 30 min from now
        // Optionally set mock driver location
        driverLatitude: 52.5200,  // Berlin center
        driverLongitude: 13.4050,
        driverLocationUpdatedAt: new Date()
      }
    });

    // Add to status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        message: 'Max Müller is on the way with your order'
      }
    });

    console.log(`\n✅ Driver assigned successfully!`);
    console.log(`   Order #${updatedOrder.id}`);
    console.log(`   Status: ${updatedOrder.status}`);
    console.log(`   Driver: ${updatedOrder.driverName}`);
    console.log(`   Phone: ${updatedOrder.driverPhone}`);
    console.log(`   ETA: ${updatedOrder.estimatedDeliveryTime}`);
    console.log(`\n🗺️  Now open your app, go to Orders tab, and you should see the "Track Order" button!`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
