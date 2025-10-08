const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();


exports.getMenu = async (req, res) => {
  try {
    const rawCategories = await prisma.menuCategory.findMany({
      include: { items: true }
    });
    
    // Convert IDs to strings for frontend compatibility
    const categories = rawCategories.map(c => ({ 
      id: c.id.toString(), 
      name: c.name 
    }));
    
    const items = rawCategories.flatMap(c =>
      (c.items || []).map(item => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: c.id.toString()
      }))
    );
    
  console.log(`Sending menu data: ${categories.length} categories, ${items.length} items`);
    res.json({ categories, items });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getMenuItem = async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({
      ...item,
      id: item.id.toString(),
      categoryId: item.categoryId.toString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Function to seed menu data
exports.seedMenu = async (req, res) => {
  try {
    // Remove all menu items and categories (for demo purposes, not for production!)
    await prisma.menuItem.deleteMany();
    await prisma.menuCategory.deleteMany();

    // Create categories
    const categories = await prisma.$transaction([
      prisma.menuCategory.create({ data: { name: 'Starters' } }),
      prisma.menuCategory.create({ data: { name: 'Grill' } }),
      prisma.menuCategory.create({ data: { name: 'Burgers' } }),
      prisma.menuCategory.create({ data: { name: 'Salads' } }),
      prisma.menuCategory.create({ data: { name: 'Sides' } }),
      prisma.menuCategory.create({ data: { name: 'Cocktails' } }),
      prisma.menuCategory.create({ data: { name: 'Drinks' } }),
      prisma.menuCategory.create({ data: { name: 'Desserts' } }),
      prisma.menuCategory.create({ data: { name: 'Specials' } }),
    ]);

    const [starters, grill, burgers, salads, sides, cocktails, drinks, desserts, specials] = categories;

    // Create menu items
    await prisma.menuItem.createMany({
      data: [
        // Starters
        { name: 'Buffalo Wings', description: 'Spicy chicken wings with blue cheese dip.', price: 12.99, categoryId: starters.id },
        { name: 'Loaded Nachos', description: 'Tortilla chips, cheese, jalapeños, guacamole.', price: 10.99, categoryId: starters.id },
        { name: 'Mozzarella Sticks', description: 'Fried mozzarella, marinara sauce.', price: 8.99, categoryId: starters.id },
        { name: 'Crispy Calamari', description: 'Fried calamari rings, lemon aioli.', price: 13.99, categoryId: starters.id },
        { name: 'Jalapeño Poppers', description: 'Stuffed jalapeños, cheddar, ranch dip.', price: 9.99, categoryId: starters.id },
        { name: 'BBQ Chicken Quesadilla', description: 'Grilled chicken, BBQ sauce, cheese, salsa.', price: 11.99, categoryId: starters.id },

        // Grill
        { name: 'Ribeye Steak', description: '12oz ribeye, garlic butter, fries.', price: 32.99, categoryId: grill.id },
        { name: 'BBQ Ribs', description: 'Slow-cooked pork ribs, house BBQ sauce.', price: 27.99, categoryId: grill.id },
        { name: 'Grilled Salmon', description: 'Atlantic salmon, lemon herb butter.', price: 24.99, categoryId: grill.id },
        { name: 'Chicken Skewers', description: 'Marinated chicken, grilled veggies.', price: 17.99, categoryId: grill.id },
        { name: 'Smoked Brisket', description: 'Texas-style beef brisket, pickles.', price: 29.99, categoryId: grill.id },
        { name: 'Grilled Veggie Platter', description: 'Seasonal vegetables, balsamic glaze.', price: 15.99, categoryId: grill.id },

        // Burgers
        { name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, onion, sauce.', price: 14.99, categoryId: burgers.id },
        { name: 'Bacon Cheeseburger', description: 'Beef, bacon, cheddar, lettuce, tomato.', price: 16.99, categoryId: burgers.id },
        { name: 'Mushroom Swiss Burger', description: 'Beef, sautéed mushrooms, Swiss cheese.', price: 15.99, categoryId: burgers.id },
        { name: 'Spicy Jalapeño Burger', description: 'Beef, jalapeños, pepper jack, chipotle mayo.', price: 15.99, categoryId: burgers.id },
        { name: 'Veggie Burger', description: 'Plant-based patty, avocado, greens.', price: 13.99, categoryId: burgers.id },
        { name: 'BBQ Pulled Pork Burger', description: 'Pulled pork, BBQ sauce, slaw.', price: 15.49, categoryId: burgers.id },

        // Salads
        { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, Caesar dressing.', price: 10.99, categoryId: salads.id },
        { name: 'Grilled Chicken Salad', description: 'Mixed greens, grilled chicken, vinaigrette.', price: 13.99, categoryId: salads.id },
        { name: 'Greek Salad', description: 'Tomato, cucumber, feta, olives, oregano.', price: 11.99, categoryId: salads.id },
        { name: 'Steak Salad', description: 'Sliced steak, arugula, blue cheese, walnuts.', price: 16.99, categoryId: salads.id },

        // Sides
        { name: 'French Fries', description: 'Crispy golden fries.', price: 4.99, categoryId: sides.id },
        { name: 'Sweet Potato Fries', description: 'Sweet potato fries, chipotle mayo.', price: 5.99, categoryId: sides.id },
        { name: 'Onion Rings', description: 'Beer-battered onion rings.', price: 5.49, categoryId: sides.id },
        { name: 'Coleslaw', description: 'Creamy house slaw.', price: 3.99, categoryId: sides.id },
        { name: 'Mac & Cheese', description: 'Cheesy baked macaroni.', price: 6.99, categoryId: sides.id },

        // Cocktails
        { name: 'Classic Mojito', description: 'Rum, mint, lime, soda.', price: 9.99, categoryId: cocktails.id },
        { name: 'Whiskey Sour', description: 'Whiskey, lemon, sugar, bitters.', price: 10.99, categoryId: cocktails.id },
        { name: 'Margarita', description: 'Tequila, lime, triple sec.', price: 10.99, categoryId: cocktails.id },
        { name: 'Espresso Martini', description: 'Vodka, espresso, coffee liqueur.', price: 11.99, categoryId: cocktails.id },
        { name: 'Berry Smash', description: 'Gin, berries, lemon, soda.', price: 10.49, categoryId: cocktails.id },

        // Drinks
        { name: 'Coca Cola', description: 'Classic Coca Cola served chilled.', price: 3.99, categoryId: drinks.id },
        { name: 'Fresh Lemonade', description: 'Freshly squeezed lemon juice with mint.', price: 4.99, categoryId: drinks.id },
        { name: 'Iced Tea', description: 'Refreshing iced tea with lemon slice.', price: 3.49, categoryId: drinks.id },
        { name: 'Craft Beer', description: 'Rotating selection of local craft beers.', price: 6.99, categoryId: drinks.id },
        { name: 'Sparkling Water', description: 'Chilled sparkling mineral water.', price: 2.99, categoryId: drinks.id },

        // Desserts
        { name: 'Chocolate Cake', description: 'Rich chocolate layer cake with chocolate frosting.', price: 7.99, categoryId: desserts.id },
        { name: 'Cheesecake', description: 'New York style cheesecake with berry compote.', price: 8.99, categoryId: desserts.id },
        { name: 'Ice Cream Sundae', description: 'Vanilla ice cream with chocolate sauce and whipped cream.', price: 5.99, categoryId: desserts.id },
        { name: 'Apple Pie', description: 'Warm apple pie, cinnamon, vanilla ice cream.', price: 6.99, categoryId: desserts.id },
        { name: 'Brownie Explosion', description: 'Chocolate brownie, fudge, ice cream.', price: 7.49, categoryId: desserts.id },

        // Specials
        { name: 'Surf & Turf', description: 'Grilled steak and shrimp, garlic butter.', price: 36.99, categoryId: specials.id },
        { name: 'BBQ Sampler Platter', description: 'Ribs, brisket, wings, fries, slaw.', price: 39.99, categoryId: specials.id },
        { name: 'Ultimate Burger Challenge', description: 'Triple patty burger, fries, shake.', price: 24.99, categoryId: specials.id },
        { name: 'Vegan Feast', description: 'Grilled veggies, vegan burger, salad.', price: 21.99, categoryId: specials.id },
      ]
    });

    res.json({ message: 'Menu data seeded with next-level bar & grill items!' });
  } catch (err) {
    console.error('Seeding error:', err);
    res.status(500).json({ error: 'Failed to seed menu data', details: err.message });
  }
};

// Create new menu item (admin only)
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, categoryId } = req.body;
    
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId)
      }
    });
    
    res.status(201).json({
      ...menuItem,
      id: menuItem.id.toString(),
      categoryId: menuItem.categoryId.toString()
    });
  } catch (err) {
    console.error('Create menu item error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update menu item (admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { name, description, price, categoryId } = req.body;
    
    const menuItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(categoryId && { categoryId: parseInt(categoryId) })
      }
    });
    
    res.json({
      ...menuItem,
      id: menuItem.id.toString(),
      categoryId: menuItem.categoryId.toString()
    });
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete menu item (admin only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    
    await prisma.menuItem.delete({
      where: { id: itemId }
    });
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
