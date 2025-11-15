const { PrismaClient } = require('../src/generated/prisma');
const logger = require('../src/utils/logger');
const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  // Create menu categories
  const categories = [
    { name: 'Appetizer', nameEn: 'Appetizer', nameDe: 'Vorspeisen' },
    { name: 'Dips & Toppings', nameEn: 'Dips & Toppings', nameDe: 'Dips & Toppings' },
    { name: 'Schmitzz Fritten', nameEn: 'Schmitzz Fries', nameDe: 'Schmitzz Fritten' },
    { name: 'Burgermeister-Wahl', nameEn: 'Burgermeister Selection', nameDe: 'Burgermeister-Wahl' },
    { name: 'Veggie & vegane Burger', nameEn: 'Veggie & Vegan Burgers', nameDe: 'Veggie & vegane Burger' },
    { name: 'Beilagen', nameEn: 'Sides', nameDe: 'Beilagen' },
    { name: 'Buddah Bowls', nameEn: 'Buddha Bowls', nameDe: 'Buddah Bowls' },
    { name: 'Desserts', nameEn: 'Desserts', nameDe: 'Desserts' },
    { name: 'Softdrinks & Schorlen', nameEn: 'Soft Drinks & Spritzers', nameDe: 'Softdrinks & Schorlen' },
    { name: 'Bier', nameEn: 'Beer', nameDe: 'Bier' },
    { name: 'Wein & Sekt', nameEn: 'Wine & Sparkling', nameDe: 'Wein & Sekt' },
    { name: 'Cocktails', nameEn: 'Cocktails', nameDe: 'Cocktails' },
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
      nameEn: 'Falafel',
      nameDe: 'Falafel',
      description: 'Knusprige Falafel',
      descriptionEn: 'Crispy falafel',
      descriptionDe: 'Knusprige Falafel',
      price: 8.80,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=800&q=80',
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Onion Flower',
      nameEn: 'Onion Flower',
      nameDe: 'Zwiebelblume',
      description: 'Knusprig frittierte Zwiebelblume',
      descriptionEn: 'Crispy fried onion flower',
      descriptionDe: 'Knusprig frittierte Zwiebelblume',
      price: 4.70,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Mozzarella Sticks',
      nameEn: 'Mozzarella Sticks',
      nameDe: 'Mozzarella Sticks',
      description: 'Knusprig panierte Mozzarella Sticks',
      descriptionEn: 'Crispy breaded mozzarella sticks',
      descriptionDe: 'Knusprig panierte Mozzarella Sticks',
      price: 5.40,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Tortilla Wrap mit Steak',
      nameEn: 'Tortilla Wrap with Steak',
      nameDe: 'Tortilla Wrap mit Steak',
      description: 'Mit Salat, Guacamole und 120g Steak',
      descriptionEn: 'With salad, guacamole and 120g steak',
      descriptionDe: 'Mit Salat, Guacamole und 120g Steak',
      price: 9.70,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
    },
    {
      name: 'Tortilla Wrap mit Hähnchen',
      nameEn: 'Tortilla Wrap with Chicken',
      nameDe: 'Tortilla Wrap mit Hähnchen',
      description: 'Mit Salat, Guacamole und 120g Hähnchen',
      descriptionEn: 'With salad, guacamole and 120g chicken',
      descriptionDe: 'Mit Salat, Guacamole und 120g Hähnchen',
      price: 9.70,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
    },
    {
      name: 'Tortilla Wrap mit Falafel',
      nameEn: 'Tortilla Wrap with Falafel',
      nameDe: 'Tortilla Wrap mit Falafel',
      description: 'Mit Salat, Guacamole und Falafel',
      descriptionEn: 'With salad, guacamole and falafel',
      descriptionDe: 'Mit Salat, Guacamole und Falafel',
      price: 8.70,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1593030668942-c4b1f814236a?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'BBQ Wings',
      nameEn: 'BBQ Wings',
      nameDe: 'BBQ Wings',
      description: '5 Stück knusprige Chicken Wings',
      descriptionEn: '5 pieces of crispy chicken wings',
      descriptionDe: '5 Stück knusprige Chicken Wings',
      price: 6.20,
      categoryId: appetizer.id,
      imageUrl: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&q=80',
    },

    // DIPS & TOPPINGS
    {
      name: 'Aioli',
      nameEn: 'Aioli',
      nameDe: 'Aioli',
      description: 'Knoblauch-Mayonnaise',
      descriptionEn: 'Garlic mayonnaise',
      descriptionDe: 'Knoblauch-Mayonnaise',
      price: 1.40,
      categoryId: dips.id,
      imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'BBQ Sauce',
      nameEn: 'BBQ Sauce',
      nameDe: 'BBQ Sauce',
      description: 'Rauchige Barbecue-Sauce',
      descriptionEn: 'Smoky barbecue sauce',
      descriptionDe: 'Rauchige Barbecue-Sauce',
      price: 1.40,
      categoryId: dips.id,
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Guacamole',
      nameEn: 'Guacamole',
      nameDe: 'Guacamole',
      description: 'Frische Avocado-Creme',
      descriptionEn: 'Fresh avocado cream',
      descriptionDe: 'Frische Avocado-Creme',
      price: 2.20,
      categoryId: dips.id,
      imageUrl: 'https://images.unsplash.com/photo-1623961990059-d48ff26eb3f7?w=800&q=80',
      isVegetarian: true,
      isVegan: true,
    },
    {
      name: 'Whiskey-Sauce',
      nameEn: 'Whiskey Sauce',
      nameDe: 'Whiskey-Sauce',
      description: 'Hauseigene Whiskey-Sauce',
      descriptionEn: 'House-made whiskey sauce',
      descriptionDe: 'Hauseigene Whiskey-Sauce',
      price: 2.20,
      categoryId: dips.id,
      imageUrl: 'https://images.unsplash.com/photo-1623428454614-abaf00244e52?w=800&q=80',
    },
    {
      name: 'Sour Cream',
      nameEn: 'Sour Cream',
      nameDe: 'Sour Cream',
      description: 'Kräutersauerrahm',
      descriptionEn: 'Herb sour cream',
      descriptionDe: 'Kräutersauerrahm',
      price: 1.40,
      categoryId: dips.id,
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Burgersauce',
      nameEn: 'Burger Sauce',
      nameDe: 'Burgersauce',
      description: 'Hauseigene Burgersauce',
      descriptionEn: 'House-made burger sauce',
      descriptionDe: 'Hauseigene Burgersauce',
      price: 1.40,
      categoryId: dips.id,
      imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=800&q=80',
      isVegetarian: true,
    },

    // SCHMITZZ FRITTEN
    {
      name: 'Chili & Carne Fritten',
      nameEn: 'Chili & Carne Fries',
      nameDe: 'Chili & Carne Fritten',
      description: '300g Schmitzz Fritten mit Chili con Carne, Käse-Sauce & Sour Cream',
      descriptionEn: '300g Schmitzz fries with chili con carne, cheese sauce & sour cream',
      descriptionDe: '300g Schmitzz Fritten mit Chili con Carne, Käse-Sauce & Sour Cream',
      price: 9.80,
      categoryId: fritten.id,
      imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=800&q=80',
    },
    {
      name: 'TexMex Fritten',
      nameEn: 'TexMex Fries',
      nameDe: 'TexMex Fritten',
      description: '300g Schmitzz Fritten mit Guacamole, Sour Cream und Tomaten-Salsa',
      descriptionEn: '300g Schmitzz fries with guacamole, sour cream and tomato salsa',
      descriptionDe: '300g Schmitzz Fritten mit Guacamole, Sour Cream und Tomaten-Salsa',
      price: 7.80,
      categoryId: fritten.id,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Berliner Currywurst Fritten',
      nameEn: 'Berlin Currywurst Fries',
      nameDe: 'Berliner Currywurst Fritten',
      description: '300g Schmitzz Fritten mit Currywurstscheiben und Currysauce',
      descriptionEn: '300g Schmitzz fries with curry sausage slices and curry sauce',
      descriptionDe: '300g Schmitzz Fritten mit Currywurstscheiben und Currysauce',
      price: 8.70,
      categoryId: fritten.id,
      imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',
    },
    {
      name: 'Pulled Pork Fritten',
      nameEn: 'Pulled Pork Fries',
      nameDe: 'Pulled Pork Fritten',
      description: '300g Schmitzz Fritten mit Pulled Pork, Coleslaw und Sour Cream',
      descriptionEn: '300g Schmitzz fries with pulled pork, coleslaw and sour cream',
      descriptionDe: '300g Schmitzz Fritten mit Pulled Pork, Coleslaw und Sour Cream',
      price: 9.80,
      categoryId: fritten.id,
      imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80',
    },
    {
      name: 'Chili-Cheese Fritten',
      nameEn: 'Chili-Cheese Fries',
      nameDe: 'Chili-Cheese Fritten',
      description: '300g Schmitzz Fritten mit Chili-Cheese-Sauce und Sour Cream',
      descriptionEn: '300g Schmitzz fries with chili-cheese sauce and sour cream',
      descriptionDe: '300g Schmitzz Fritten mit Chili-Cheese-Sauce und Sour Cream',
      price: 7.80,
      categoryId: fritten.id,
      imageUrl: 'https://images.unsplash.com/photo-1629196923009-f6c1ebd2c03b?w=800&q=80',
      isVegetarian: true,
    },

    // BURGERMEISTER-WAHL
    {
      name: 'Say Cheese Schmitzz',
      nameEn: 'Say Cheese Schmitzz',
      nameDe: 'Say Cheese Schmitzz',
      description: '200g Rindfleisch, Burgersauce, Salat, Emmentaler, Cheddar, Tomate, Gurke',
      descriptionEn: '200g beef, burger sauce, lettuce, Emmentaler, cheddar, tomato, cucumber',
      descriptionDe: '200g Rindfleisch, Burgersauce, Salat, Emmentaler, Cheddar, Tomate, Gurke',
      price: 9.90,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    },
    {
      name: 'Say Nothing Schmitzz',
      nameEn: 'Say Nothing Schmitzz',
      nameDe: 'Say Nothing Schmitzz',
      description: '200g Rindfleisch, Burgersauce, Salat, Tomate, Essiggurke, rote Zwiebeln',
      descriptionEn: '200g beef, burger sauce, lettuce, tomato, pickles, red onions',
      descriptionDe: '200g Rindfleisch, Burgersauce, Salat, Tomate, Essiggurke, rote Zwiebeln',
      price: 8.90,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    },
    {
      name: 'Cheese Lover',
      nameEn: 'Cheese Lover',
      nameDe: 'Cheese Lover',
      description: '200g Rindfleisch, doppelt Käse, Käsesauce, Röstzwiebeln',
      descriptionEn: '200g beef, double cheese, cheese sauce, fried onions',
      descriptionDe: '200g Rindfleisch, doppelt Käse, Käsesauce, Röstzwiebeln',
      price: 10.40,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80',
    },
    {
      name: 'Der Burgermeister',
      nameEn: 'The Burgermeister',
      nameDe: 'Der Burgermeister',
      description: '200g Rindfleisch, Burgersauce, Salat, Emmentaler, Bacon, Spiegelei',
      descriptionEn: '200g beef, burger sauce, lettuce, Emmentaler, bacon, fried egg',
      descriptionDe: '200g Rindfleisch, Burgersauce, Salat, Emmentaler, Bacon, Spiegelei',
      price: 12.30,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&q=80',
    },
    {
      name: 'Burgerholic',
      nameEn: 'Burgerholic',
      nameDe: 'Burgerholic',
      description: '200g Rindfleisch, Whiskey-Sauce, Cheddar, Bacon, Röstzwiebeln',
      descriptionEn: '200g beef, whiskey sauce, cheddar, bacon, fried onions',
      descriptionDe: '200g Rindfleisch, Whiskey-Sauce, Cheddar, Bacon, Röstzwiebeln',
      price: 15.70,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&q=80',
    },
    {
      name: 'Pulled Pork Burger',
      nameEn: 'Pulled Pork Burger',
      nameDe: 'Pulled Pork Burger',
      description: '200g Pulled Pork, BBQ-Sauce, Lollo Bianco Salat, Coleslaw',
      descriptionEn: '200g pulled pork, BBQ sauce, Lollo Bianco lettuce, coleslaw',
      descriptionDe: '200g Pulled Pork, BBQ-Sauce, Lollo Bianco Salat, Coleslaw',
      price: 15.70,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    },
    {
      name: 'Burger 202',
      nameEn: 'Burger 202',
      nameDe: 'Burger 202',
      description: '200g Rindfleisch, Burgersauce, BBQ-Sauce, doppelt Bacon, Käse',
      descriptionEn: '200g beef, burger sauce, BBQ sauce, double bacon, cheese',
      descriptionDe: '200g Rindfleisch, Burgersauce, BBQ-Sauce, doppelt Bacon, Käse',
      price: 17.60,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80',
    },
    {
      name: 'Obere Burger',
      nameEn: 'Upper Burger',
      nameDe: 'Obere Burger',
      description: '400g Rindfleisch, Burgersauce, Salat, Emmentaler, Bacon',
      descriptionEn: '400g beef, burger sauce, lettuce, Emmentaler, bacon',
      descriptionDe: '400g Rindfleisch, Burgersauce, Salat, Emmentaler, Bacon',
      price: 19.40,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80',
    },
    {
      name: 'Der Oberburgermeister',
      nameEn: 'The Supreme Burgermeister',
      nameDe: 'Der Oberburgermeister',
      description: '600g Rindfleisch, Burgersauce, Cheddar, Bacon, Röstzwiebeln',
      descriptionEn: '600g beef, burger sauce, cheddar, bacon, fried onions',
      descriptionDe: '600g Rindfleisch, Burgersauce, Cheddar, Bacon, Röstzwiebeln',
      price: 22.40,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80',
    },
    {
      name: 'Omas Grilled Hähnchen Burger',
      nameEn: "Grandma's Grilled Chicken Burger",
      nameDe: 'Omas Grilled Hähnchen Burger',
      description: '200g Hähnchenbrust, Teriyakimayonnaise, Lollo Bianco Salat',
      descriptionEn: '200g chicken breast, teriyaki mayonnaise, Lollo Bianco lettuce',
      descriptionDe: '200g Hähnchenbrust, Teriyakimayonnaise, Lollo Bianco Salat',
      price: 11.80,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80',
    },
    {
      name: 'Der Fishtown Burger',
      nameEn: 'The Fishtown Burger',
      nameDe: 'Der Fishtown Burger',
      description: '200g Fischpatty, Sour Cream, Friséesalat, Tomate',
      descriptionEn: '200g fish patty, sour cream, frisée lettuce, tomato',
      descriptionDe: '200g Fischpatty, Sour Cream, Friséesalat, Tomate',
      price: 12.30,
      categoryId: burger.id,
      imageUrl: 'https://images.unsplash.com/photo-1585238341710-4a1d127b3ed4?w=800&q=80',
    },

    // VEGGIE & VEGANE BURGER
    {
      name: 'Die Zicke',
      nameEn: 'The Goat',
      nameDe: 'Die Zicke',
      description: '200g veganes Patty, gebratener Ziegenkäse, Friséesalat',
      descriptionEn: '200g vegan patty, fried goat cheese, frisée lettuce',
      descriptionDe: '200g veganes Patty, gebratener Ziegenkäse, Friséesalat',
      price: 14.30,
      categoryId: veggie.id,
      imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Das Mauerblümchen',
      nameEn: 'The Wallflower',
      nameDe: 'Das Mauerblümchen',
      description: '200g veganes Patty, Champignons, Kidneybohnen, Friséesalat',
      descriptionEn: '200g vegan patty, mushrooms, kidney beans, frisée lettuce',
      descriptionDe: '200g veganes Patty, Champignons, Kidneybohnen, Friséesalat',
      price: 10.90,
      categoryId: veggie.id,
      imageUrl: 'https://images.unsplash.com/photo-1585238341710-4a1d127b3ed4?w=800&q=80',
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

  // Create default settings
  logger.info('Creating default settings...');
  const minOrderValue = await prisma.settings.findUnique({
    where: { key: 'minOrderValue' }
  });
  if (!minOrderValue) {
    await prisma.settings.create({
      data: {
        key: 'minOrderValue',
        value: '10.00',
        description: 'Minimum order value in EUR'
      }
    });
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
