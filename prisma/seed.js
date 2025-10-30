const { PrismaClient } = require('../src/generated/prisma');
const logger = require('../src/utils/logger');
const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  // Create menu categories
  const categories = [
    { name: 'Appetizer' },
    { name: 'Dips & Toppings' },
    { name: 'Schmitzz Fritten' },
    { name: 'Burgermeister-Wahl' },
    { name: 'Veggie & vegane Burger' },
    { name: 'Beilagen' },
    { name: 'Buddah Bowls' },
    { name: 'Desserts' },
    { name: 'Softdrinks & Schorlen' },
    { name: 'Bier' },
    { name: 'Wein & Sekt' },
    { name: 'Cocktails' },
  ];

  logger.info('Creating categories...');
  for (const category of categories) {
    const existing = await prisma.menuCategory.findFirst({
      where: { name: category.name }
    });
    if (!existing) {
      await prisma.menuCategory.create({
        data: category,
      });
    }
  }

  // Get categories with their IDs
  const appetizer = await prisma.menuCategory.findFirst({ where: { name: 'Appetizer' } });
  const dips = await prisma.menuCategory.findFirst({ where: { name: 'Dips & Toppings' } });
  const fritten = await prisma.menuCategory.findFirst({ where: { name: 'Schmitzz Fritten' } });
  const burger = await prisma.menuCategory.findFirst({ where: { name: 'Burgermeister-Wahl' } });
  const veggie = await prisma.menuCategory.findFirst({ where: { name: 'Veggie & vegane Burger' } });
  const beilagen = await prisma.menuCategory.findFirst({ where: { name: 'Beilagen' } });
  const bowls = await prisma.menuCategory.findFirst({ where: { name: 'Buddah Bowls' } });
  const desserts = await prisma.menuCategory.findFirst({ where: { name: 'Desserts' } });
  const drinks = await prisma.menuCategory.findFirst({ where: { name: 'Softdrinks & Schorlen' } });
  const bier = await prisma.menuCategory.findFirst({ where: { name: 'Bier' } });
  const wein = await prisma.menuCategory.findFirst({ where: { name: 'Wein & Sekt' } });
  const cocktails = await prisma.menuCategory.findFirst({ where: { name: 'Cocktails' } });

  // Schmitzz Menu Items
  const menuItems = [
    // APPETIZER
    {
      name: 'Falafel',
      description: 'Knusprige Falafel',
      price: 8.80,
      categoryId: appetizer.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Onion Flower',
      description: 'Knusprig frittierte Zwiebelblume',
      price: 4.70,
      categoryId: appetizer.id,
      isVegetarian: true,
    },
    {
      name: 'Mozzarella Sticks',
      description: 'Knusprig panierte Mozzarella Sticks',
      price: 5.40,
      categoryId: appetizer.id,
      isVegetarian: true,
    },
    {
      name: 'Tortilla Wrap mit Steak',
      description: 'Mit Salat, Guacamole und 120g Steak',
      price: 9.70,
      categoryId: appetizer.id,
    },
    {
      name: 'Tortilla Wrap mit Hähnchen',
      description: 'Mit Salat, Guacamole und 120g Hähnchen',
      price: 9.70,
      categoryId: appetizer.id,
    },
    {
      name: 'Tortilla Wrap mit Falafel',
      description: 'Mit Salat, Guacamole und Falafel',
      price: 8.70,
      categoryId: appetizer.id,
      isVegetarian: true,
    },
    {
      name: 'BBQ Wings',
      description: '5 Stück knusprige Chicken Wings',
      price: 6.20,
      categoryId: appetizer.id,
    },

    // DIPS & TOPPINGS
    {
      name: 'Aioli',
      description: 'Knoblauch-Mayonnaise',
      price: 1.40,
      categoryId: dips.id,
      isVegetarian: true,
    },
    {
      name: 'BBQ Sauce',
      description: 'Rauchige Barbecue-Sauce',
      price: 1.40,
      categoryId: dips.id,
      isVegetarian: true,
    },
    {
      name: 'Guacamole',
      description: 'Frische Avocado-Creme',
      price: 2.20,
      categoryId: dips.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Whiskey-Sauce',
      description: 'Hauseigene Whiskey-Sauce',
      price: 2.20,
      categoryId: dips.id,
    },
    {
      name: 'Sour Cream',
      description: 'Kräutersauerrahm',
      price: 1.40,
      categoryId: dips.id,
      isVegetarian: true,
    },
    {
      name: 'Burgersauce',
      description: 'Hauseigene Burgersauce',
      price: 1.40,
      categoryId: dips.id,
      isVegetarian: true,
    },

    // SCHMITZZ FRITTEN
    {
      name: 'Chili & Carne Fritten',
      description: '300g Schmitzz Fritten mit Chili con Carne, Käse-Sauce & Sour Cream',
      price: 9.80,
      categoryId: fritten.id,
    },
    {
      name: 'TexMex Fritten',
      description: '300g Schmitzz Fritten mit Guacamole, Sour Cream und Tomaten-Salsa',
      price: 7.80,
      categoryId: fritten.id,
      isVegetarian: true,
    },
    {
      name: 'Berliner Currywurst Fritten',
      description: '300g Schmitzz Fritten mit Currywurstscheiben und Currysauce',
      price: 8.70,
      categoryId: fritten.id,
    },
    {
      name: 'Pulled Pork Fritten',
      description: '300g Schmitzz Fritten mit Pulled Pork, Coleslaw und Sour Cream',
      price: 9.80,
      categoryId: fritten.id,
    },
    {
      name: 'Chili-Cheese Fritten',
      description: '300g Schmitzz Fritten mit Chili-Cheese-Sauce und Sour Cream',
      price: 7.80,
      categoryId: fritten.id,
      isVegetarian: true,
    },

    // BURGERMEISTER-WAHL
    {
      name: 'Say Cheese Schmitzz',
      description: '200g Rindfleisch, Burgersauce, Salat, Emmentaler, Cheddar, Tomate, Gurke',
      price: 9.90,
      categoryId: burger.id,
    },
    {
      name: 'Say Nothing Schmitzz',
      description: '200g Rindfleisch, Burgersauce, Salat, Tomate, Essiggurke, rote Zwiebeln',
      price: 8.90,
      categoryId: burger.id,
    },
    {
      name: 'Cheese Lover',
      description: '200g Rindfleisch, doppelt Käse, Käsesauce, Röstzwiebeln',
      price: 10.40,
      categoryId: burger.id,
    },
    {
      name: 'Der Burgermeister',
      description: '200g Rindfleisch, Burgersauce, Salat, Emmentaler, Bacon, Spiegelei',
      price: 12.30,
      categoryId: burger.id,
    },
    {
      name: 'Burgerholic',
      description: '200g Rindfleisch, Whiskey-Sauce, Cheddar, Bacon, Röstzwiebeln',
      price: 15.70,
      categoryId: burger.id,
    },
    {
      name: 'Pulled Pork Burger',
      description: '200g Pulled Pork, BBQ-Sauce, Lollo Bianco Salat, Coleslaw',
      price: 15.70,
      categoryId: burger.id,
    },
    {
      name: 'Burger 202',
      description: '200g Rindfleisch, Burgersauce, BBQ-Sauce, doppelt Bacon, Käse',
      price: 17.60,
      categoryId: burger.id,
    },
    {
      name: 'Obere Burger',
      description: '400g Rindfleisch, Burgersauce, Salat, Emmentaler, Bacon',
      price: 19.40,
      categoryId: burger.id,
    },
    {
      name: 'Der Oberburgermeister',
      description: '600g Rindfleisch, Burgersauce, Cheddar, Bacon, Röstzwiebeln',
      price: 22.40,
      categoryId: burger.id,
    },
    {
      name: 'Omas Grilled Hähnchen Burger',
      description: '200g Hähnchenbrust, Teriyakimayonnaise, Lollo Bianco Salat',
      price: 11.80,
      categoryId: burger.id,
    },
    {
      name: 'Der Fishtown Burger',
      description: '200g Fischpatty, Sour Cream, Friséesalat, Tomate',
      price: 12.30,
      categoryId: burger.id,
    },

    // VEGGIE & VEGANE BURGER
    {
      name: 'Die Zicke',
      description: '200g veganes Patty, gebratener Ziegenkäse, Friséesalat',
      price: 14.30,
      categoryId: veggie.id,
      isVegetarian: true,
    },
    {
      name: 'Das Mauerblümchen',
      description: '200g veganes Patty, Champignons, Kidneybohnen, Friséesalat',
      price: 10.90,
      categoryId: veggie.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Mediterraner Schmitzz',
      description: '200g veganes Patty, gegrillte Zucchini, Parmesan',
      price: 14.60,
      categoryId: veggie.id,
      isVegetarian: true,
    },

    // BEILAGEN
    {
      name: 'Schmitzz Fritten',
      description: 'Knusprige Pommes Frites',
      price: 3.60,
      categoryId: beilagen.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Die Süsse Fritte',
      description: 'Süßkartoffel Pommes',
      price: 4.60,
      categoryId: beilagen.id,
      isVegetarian: true,
      isVegan: true,
    },

    // BUDDAH BOWLS
    {
      name: 'Vegan Bowl',
      description: 'Curry Couscous, Salatmix, Zucchini, Rotkraut, Hummus, Guacamole, Falafel',
      price: 12.80,
      categoryId: bowls.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Mexican Bowl',
      description: 'Vollkornreis, Salatmix, Chili con Carne, Parmesanchips, Guacamole',
      price: 13.50,
      categoryId: bowls.id,
    },
    {
      name: 'Garnelen Bowl',
      description: 'Curry Couscous, Salatmix, gebratene Garnelen, Curry-Mango-Dip',
      price: 14.60,
      categoryId: bowls.id,
    },

    // DESSERTS
    {
      name: 'Käsekuchen',
      description: 'Mit einer Kugel Vanilleeis und auf Wunsch mit Sahne',
      price: 5.30,
      categoryId: desserts.id,
      isVegetarian: true,
    },
    {
      name: 'Schoko-Karamell-Walnussbrownie',
      description: 'Mit einer Kugel Vanilleeis und auf Wunsch mit Sahne',
      price: 5.30,
      categoryId: desserts.id,
      isVegetarian: true,
    },

    // DRINKS
    {
      name: 'Watermelon-Schorle',
      description: 'Lemon Squash, Wassermelonensirup, Mangosirup, Soda (0,5L)',
      price: 4.20,
      categoryId: drinks.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Coca-Cola',
      description: 'Erfrischende Cola (0,2L)',
      price: 3.20,
      categoryId: drinks.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Fritz Kola',
      description: 'Viel viel Koffein (0,2L)',
      price: 3.20,
      categoryId: drinks.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Apfelsaft',
      description: 'Frischer Apfelsaft (0,3L)',
      price: 3.00,
      categoryId: drinks.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Orangensaft',
      description: 'Frischer Orangensaft (0,3L)',
      price: 3.00,
      categoryId: drinks.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Acqua Morelli Sprudel',
      description: 'Mineralwasser mit Kohlensäure (0,25L)',
      price: 3.10,
      categoryId: drinks.id,
      isVegetarian: true,
      isVegan: true,
    },

    // BIER
    {
      name: 'Bayreuther Hell',
      description: 'Bayerisches helles Bier (0,5L)',
      price: 5.30,
      categoryId: bier.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Grevensteiner',
      description: 'Naturtrübes Landbier (0,5L)',
      price: 5.30,
      categoryId: bier.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'San Miguel',
      description: 'Spanisches Lagerbier (0,5L)',
      price: 5.10,
      categoryId: bier.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Corona',
      description: 'Mexikanisches Bier (0,33L)',
      price: 3.90,
      categoryId: bier.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Maisels Weisse Original',
      description: 'Bayerisches Weißbier (0,5L)',
      price: 5.20,
      categoryId: bier.id,
      isVegetarian: true,
      isVegan: true,
    },

    // WEIN
    {
      name: 'Chardonnay',
      description: 'Weißwein trocken (0,2L)',
      price: 4.90,
      categoryId: wein.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Riesling',
      description: 'Weißwein halbtrocken (0,2L)',
      price: 6.90,
      categoryId: wein.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Merlot',
      description: 'Rotwein halbtrocken (0,2L)',
      price: 4.60,
      categoryId: wein.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Primitivo',
      description: 'Rotwein halbtrocken (0,2L)',
      price: 5.60,
      categoryId: wein.id,
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Prosecco',
      description: 'Schaumwein herb (0,1L)',
      price: 4.80,
      categoryId: wein.id,
      isVegetarian: true,
      isVegan: true,
    },

    // COCKTAILS
    {
      name: 'Aperol Spritz',
      description: 'Aperol, Prosecco, Soda (0,3L)',
      price: 8.90,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
    {
      name: 'Hugo',
      description: 'Holundersirup, Prosecco, Minze, Lime Juice (0,3L)',
      price: 8.90,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
    {
      name: 'Mojito',
      description: 'Weißer Rum, Limetten, Minze, Soda (0,3L)',
      price: 8.90,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
    {
      name: 'Margarita Classic',
      description: 'Weißer Tequila, Triple Sec, Zitrone, Lime Juice (0,3L)',
      price: 8.90,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
    {
      name: 'Piña Colada',
      description: 'Ananas, Coconut Cream, Sahne, weißer Rum (0,3L)',
      price: 8.90,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
    {
      name: 'Sex on the Beach',
      description: 'Vodka, Peach Likör, Lemon Squash, Orange (0,3L)',
      price: 8.90,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
    {
      name: 'Long Island Ice Tea',
      description: 'Rum, Vodka, Gin, Triple Sec, Tequila, Coca-Cola (0,5L)',
      price: 15.00,
      categoryId: cocktails.id,
      isVegetarian: true,
    },
  ];

  logger.info('Creating menu items...');
  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { 
        name: item.name,
        categoryId: item.categoryId
      }
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: item,
      });
    }
  }

  logger.info('✅ Database seeded successfully!');
  logger.info(`Created ${categories.length} categories`);
  logger.info(`Created ${menuItems.length} menu items`);
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
