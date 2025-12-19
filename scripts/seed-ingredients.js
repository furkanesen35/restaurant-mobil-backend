// Seed script for initial ingredients
const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

const ingredients = [
  // Proteins
  { name: "Beef Patty", nameEn: "Beef Patty", nameDe: "Rindfleisch-Patty", category: "protein", pricePerUnit: 3.80 },
  { name: "Chicken Breast", nameEn: "Chicken Breast", nameDe: "Hähnchenbrust", category: "protein", pricePerUnit: 3.00 },
  { name: "Vegan Patty", nameEn: "Vegan Patty", nameDe: "Veganes Patty", category: "protein", pricePerUnit: 4.00 },
  { name: "Bacon Strips", nameEn: "Bacon Strips", nameDe: "Speckstreifen", category: "protein", pricePerUnit: 1.50 },
  { name: "Fried Egg", nameEn: "Fried Egg", nameDe: "Spiegelei", category: "protein", pricePerUnit: 1.50 },
  
  // Vegetables
  { name: "Lettuce", nameEn: "Lettuce", nameDe: "Salat", category: "vegetable", pricePerUnit: 0 },
  { name: "Tomato", nameEn: "Tomato", nameDe: "Tomate", category: "vegetable", pricePerUnit: 0 },
  { name: "Onion", nameEn: "Onion", nameDe: "Zwiebel", category: "vegetable", pricePerUnit: 0 },
  { name: "Pickles", nameEn: "Pickles", nameDe: "Gurken", category: "vegetable", pricePerUnit: 0 },
  { name: "Jalapeños", nameEn: "Jalapeños", nameDe: "Jalapeños", category: "vegetable", pricePerUnit: 0.50 },
  { name: "Grilled Onions", nameEn: "Grilled Onions", nameDe: "Gegrillte Zwiebeln", category: "vegetable", pricePerUnit: 0.80 },
  { name: "Mushrooms", nameEn: "Mushrooms", nameDe: "Pilze", category: "vegetable", pricePerUnit: 1.00 },
  
  // Cheese
  { name: "Cheddar Cheese", nameEn: "Cheddar Cheese", nameDe: "Cheddar-Käse", category: "cheese", pricePerUnit: 1.20 },
  { name: "Swiss Cheese", nameEn: "Swiss Cheese", nameDe: "Schweizer Käse", category: "cheese", pricePerUnit: 1.50 },
  { name: "Mozzarella", nameEn: "Mozzarella", nameDe: "Mozzarella", category: "cheese", pricePerUnit: 1.30 },
  { name: "Blue Cheese", nameEn: "Blue Cheese", nameDe: "Blauschimmelkäse", category: "cheese", pricePerUnit: 1.80 },
  
  // Bread
  { name: "Sesame Bun", nameEn: "Sesame Bun", nameDe: "Sesam-Brötchen", category: "bread", pricePerUnit: 0 },
  { name: "Whole Wheat Bun", nameEn: "Whole Wheat Bun", nameDe: "Vollkorn-Brötchen", category: "bread", pricePerUnit: 0.50 },
  { name: "Brioche Bun", nameEn: "Brioche Bun", nameDe: "Brioche-Brötchen", category: "bread", pricePerUnit: 0.80 },
  
  // Sauces
  { name: "Ketchup", nameEn: "Ketchup", nameDe: "Ketchup", category: "sauce", pricePerUnit: 0 },
  { name: "Mayonnaise", nameEn: "Mayonnaise", nameDe: "Mayonnaise", category: "sauce", pricePerUnit: 0 },
  { name: "Mustard", nameEn: "Mustard", nameDe: "Senf", category: "sauce", pricePerUnit: 0 },
  { name: "BBQ Sauce", nameEn: "BBQ Sauce", nameDe: "BBQ-Sauce", category: "sauce", pricePerUnit: 0.50 },
  { name: "Ranch Dressing", nameEn: "Ranch Dressing", nameDe: "Ranch-Dressing", category: "sauce", pricePerUnit: 0.50 },
  { name: "Spicy Mayo", nameEn: "Spicy Mayo", nameDe: "Scharfe Mayo", category: "sauce", pricePerUnit: 0.50 },
  { name: "Garlic Aioli", nameEn: "Garlic Aioli", nameDe: "Knoblauch-Aioli", category: "sauce", pricePerUnit: 0.60 },
  
  // Extras
  { name: "French Fries", nameEn: "French Fries", nameDe: "Pommes Frites", category: "extras", pricePerUnit: 2.50 },
  { name: "Sweet Potato Fries", nameEn: "Sweet Potato Fries", nameDe: "Süßkartoffel-Pommes", category: "extras", pricePerUnit: 3.50 },
  { name: "Coleslaw", nameEn: "Coleslaw", nameDe: "Krautsalat", category: "extras", pricePerUnit: 1.50 },
];

async function seedIngredients() {
  console.log("Seeding ingredients...");

  for (const ingredient of ingredients) {
    const existing = await prisma.ingredient.findFirst({
      where: { name: ingredient.name },
    });

    if (!existing) {
      await prisma.ingredient.create({
        data: ingredient,
      });
      console.log(`Created ingredient: ${ingredient.name}`);
    } else {
      console.log(`Ingredient already exists: ${ingredient.name}`);
    }
  }

  console.log("Ingredients seeding completed!");
}

seedIngredients()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
