// ─── Food database ─────────────────────────────────────────────────────────
// All macros are per BASE_AMOUNT of BASE_UNIT.
//   baseUnit: 'g' | 'ml' | 'piece'
//   baseAmount: typically 100 for g/ml, 1 for piece
//   defaultServing: suggested quantity prefilled in the form
//
// To add a new food, just push a new entry. Aliases improve search matching.

export const FOODS = [
  // ── Meat ────────────────────────────────────────────────────────────────
  { id: 'chicken-breast', name: 'Chicken breast (cooked)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 165, p: 31, c: 0, f: 3.6, aliases: ['chicken', 'breast'] },
  { id: 'chicken-thigh', name: 'Chicken thigh (cooked)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 209, p: 26, c: 0, f: 11, aliases: ['thigh'] },
  { id: 'ground-beef-lean', name: 'Ground beef 90/10 (cooked)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 217, p: 26, c: 0, f: 12, aliases: ['beef', 'mince', 'lean beef'] },
  { id: 'ground-turkey', name: 'Ground turkey (cooked)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 170, p: 27, c: 0, f: 7, aliases: ['turkey mince'] },
  { id: 'steak-sirloin', name: 'Sirloin steak (cooked)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 200,
    cal: 219, p: 32, c: 0, f: 9, aliases: ['steak', 'sirloin'] },
  { id: 'pork-loin', name: 'Pork loin (cooked)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 197, p: 30, c: 0, f: 8, aliases: ['pork'] },
  { id: 'bacon', name: 'Bacon (cooked)', cat: 'Meat',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 2,
    cal: 43, p: 3, c: 0.1, f: 3.3, aliases: ['bacon slice'] },
  { id: 'deli-turkey', name: 'Deli turkey (sliced)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 50,
    cal: 104, p: 17, c: 4, f: 1.7, aliases: ['turkey slice'] },
  { id: 'ham', name: 'Ham (sliced)', cat: 'Meat',
    baseUnit: 'g', baseAmount: 100, defaultServing: 50,
    cal: 145, p: 21, c: 1.5, f: 6 },

  // ── Fish & seafood ──────────────────────────────────────────────────────
  { id: 'salmon', name: 'Salmon (cooked)', cat: 'Fish',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 208, p: 22, c: 0, f: 13, aliases: ['salmon fillet'] },
  { id: 'tuna-canned', name: 'Tuna (canned in water)', cat: 'Fish',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 116, p: 26, c: 0, f: 1, aliases: ['tuna', 'canned tuna'] },
  { id: 'tuna-steak', name: 'Tuna steak (cooked)', cat: 'Fish',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 184, p: 30, c: 0, f: 6 },
  { id: 'cod', name: 'Cod (cooked)', cat: 'Fish',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 105, p: 23, c: 0, f: 0.9 },
  { id: 'tilapia', name: 'Tilapia (cooked)', cat: 'Fish',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 129, p: 26, c: 0, f: 2.7 },
  { id: 'shrimp', name: 'Shrimp (cooked)', cat: 'Fish',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 99, p: 24, c: 0, f: 0.3, aliases: ['prawns'] },

  // ── Eggs ────────────────────────────────────────────────────────────────
  { id: 'egg', name: 'Egg (large, whole)', cat: 'Eggs',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 2,
    cal: 78, p: 6.3, c: 0.4, f: 5.3, aliases: ['eggs', 'whole egg'] },
  { id: 'egg-white', name: 'Egg white (large)', cat: 'Eggs',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 4,
    cal: 17, p: 3.6, c: 0.2, f: 0.1, aliases: ['egg whites', 'whites'] },

  // ── Dairy ───────────────────────────────────────────────────────────────
  { id: 'greek-yogurt', name: 'Greek yogurt (non-fat)', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 200,
    cal: 59, p: 10, c: 3.6, f: 0.4, aliases: ['yogurt', 'greek'] },
  { id: 'greek-yogurt-2', name: 'Greek yogurt (2%)', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 200,
    cal: 73, p: 10, c: 3.9, f: 1.9 },
  { id: 'cottage-cheese', name: 'Cottage cheese (low fat)', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 81, p: 11, c: 4, f: 2.3, aliases: ['cottage'] },
  { id: 'milk-whole', name: 'Milk (whole)', cat: 'Dairy',
    baseUnit: 'ml', baseAmount: 100, defaultServing: 250,
    cal: 61, p: 3.2, c: 4.8, f: 3.3, aliases: ['milk'] },
  { id: 'milk-skim', name: 'Milk (skim)', cat: 'Dairy',
    baseUnit: 'ml', baseAmount: 100, defaultServing: 250,
    cal: 34, p: 3.4, c: 5, f: 0.1, aliases: ['skim milk', 'fat free milk'] },
  { id: 'almond-milk', name: 'Almond milk (unsweetened)', cat: 'Dairy',
    baseUnit: 'ml', baseAmount: 100, defaultServing: 250,
    cal: 13, p: 0.4, c: 0.6, f: 1.1 },
  { id: 'oat-milk', name: 'Oat milk', cat: 'Dairy',
    baseUnit: 'ml', baseAmount: 100, defaultServing: 250,
    cal: 43, p: 1, c: 7, f: 1.5 },
  { id: 'cheddar', name: 'Cheddar cheese', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 403, p: 25, c: 1.3, f: 33 },
  { id: 'mozzarella', name: 'Mozzarella (part skim)', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 254, p: 25, c: 2.8, f: 16, aliases: ['mozzarella'] },
  { id: 'feta', name: 'Feta cheese', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 264, p: 14, c: 4.1, f: 21 },
  { id: 'parmesan', name: 'Parmesan cheese', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 15,
    cal: 431, p: 38, c: 4.1, f: 29 },
  { id: 'butter', name: 'Butter', cat: 'Dairy',
    baseUnit: 'g', baseAmount: 100, defaultServing: 10,
    cal: 717, p: 0.9, c: 0.1, f: 81 },

  // ── Grains & starches ──────────────────────────────────────────────────
  { id: 'oats', name: 'Oats (rolled, dry)', cat: 'Grains',
    baseUnit: 'g', baseAmount: 100, defaultServing: 40,
    cal: 379, p: 13.2, c: 67.7, f: 6.5,
    aliases: ['oats', 'oatmeal', 'rolled oats', 'porridge'] },
  { id: 'rice-white', name: 'White rice (cooked)', cat: 'Grains',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 130, p: 2.7, c: 28.2, f: 0.3, aliases: ['rice', 'white rice'] },
  { id: 'rice-brown', name: 'Brown rice (cooked)', cat: 'Grains',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 112, p: 2.6, c: 23.5, f: 0.9 },
  { id: 'quinoa', name: 'Quinoa (cooked)', cat: 'Grains',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 120, p: 4.4, c: 21.3, f: 1.9 },
  { id: 'pasta', name: 'Pasta (cooked)', cat: 'Grains',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 158, p: 5.8, c: 31, f: 0.9, aliases: ['spaghetti', 'penne', 'fusilli'] },
  { id: 'bread-whole-wheat', name: 'Bread (whole wheat, slice)', cat: 'Grains',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 2,
    cal: 79, p: 4, c: 14, f: 1.1, aliases: ['bread', 'whole wheat bread', 'brown bread'] },
  { id: 'bread-white', name: 'Bread (white, slice)', cat: 'Grains',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 2,
    cal: 75, p: 2.6, c: 14, f: 1, aliases: ['white bread'] },
  { id: 'tortilla', name: 'Tortilla (flour, medium)', cat: 'Grains',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 144, p: 4, c: 24, f: 4, aliases: ['wrap', 'tortilla'] },
  { id: 'bagel', name: 'Bagel (medium)', cat: 'Grains',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 245, p: 10, c: 48, f: 1.5 },
  { id: 'couscous', name: 'Couscous (cooked)', cat: 'Grains',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 112, p: 3.8, c: 23, f: 0.2 },

  // ── Vegetables ──────────────────────────────────────────────────────────
  { id: 'broccoli', name: 'Broccoli', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 34, p: 2.8, c: 7, f: 0.4 },
  { id: 'spinach', name: 'Spinach', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 23, p: 2.9, c: 3.6, f: 0.4 },
  { id: 'kale', name: 'Kale', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 49, p: 4.3, c: 9, f: 0.9 },
  { id: 'carrot', name: 'Carrot', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 41, p: 0.9, c: 9.6, f: 0.2, aliases: ['carrots'] },
  { id: 'bell-pepper', name: 'Bell pepper', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 31, p: 1, c: 6, f: 0.3, aliases: ['pepper', 'capsicum'] },
  { id: 'onion', name: 'Onion', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 50,
    cal: 40, p: 1.1, c: 9.3, f: 0.1 },
  { id: 'tomato', name: 'Tomato', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 18, p: 0.9, c: 3.9, f: 0.2, aliases: ['tomatoes'] },
  { id: 'cucumber', name: 'Cucumber', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 16, p: 0.7, c: 3.6, f: 0.1 },
  { id: 'zucchini', name: 'Zucchini', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 17, p: 1.2, c: 3.1, f: 0.3, aliases: ['courgette'] },
  { id: 'mushrooms', name: 'Mushrooms', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 22, p: 3.1, c: 3.3, f: 0.3 },
  { id: 'cauliflower', name: 'Cauliflower', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 25, p: 1.9, c: 5, f: 0.3 },
  { id: 'asparagus', name: 'Asparagus', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 20, p: 2.2, c: 3.9, f: 0.1 },
  { id: 'green-beans', name: 'Green beans', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 31, p: 1.8, c: 7, f: 0.2 },
  { id: 'brussels-sprouts', name: 'Brussels sprouts', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 43, p: 3.4, c: 9, f: 0.3 },
  { id: 'sweet-potato', name: 'Sweet potato', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 86, p: 1.6, c: 20, f: 0.1 },
  { id: 'potato', name: 'Potato', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 77, p: 2, c: 17, f: 0.1, aliases: ['potatoes'] },
  { id: 'avocado', name: 'Avocado', cat: 'Vegetables',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 160, p: 2, c: 9, f: 15 },

  // ── Fruits ──────────────────────────────────────────────────────────────
  { id: 'apple', name: 'Apple (medium)', cat: 'Fruits',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 95, p: 0.5, c: 25, f: 0.3 },
  { id: 'banana', name: 'Banana (medium)', cat: 'Fruits',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 105, p: 1.3, c: 27, f: 0.4 },
  { id: 'blueberries', name: 'Blueberries', cat: 'Fruits',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 57, p: 0.7, c: 14, f: 0.3 },
  { id: 'strawberries', name: 'Strawberries', cat: 'Fruits',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 32, p: 0.7, c: 7.7, f: 0.3 },
  { id: 'raspberries', name: 'Raspberries', cat: 'Fruits',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 52, p: 1.2, c: 12, f: 0.7 },
  { id: 'orange', name: 'Orange (medium)', cat: 'Fruits',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 62, p: 1.2, c: 15.4, f: 0.2 },
  { id: 'grapes', name: 'Grapes', cat: 'Fruits',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 69, p: 0.7, c: 18, f: 0.2 },
  { id: 'mango', name: 'Mango', cat: 'Fruits',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 60, p: 0.8, c: 15, f: 0.4 },
  { id: 'pineapple', name: 'Pineapple', cat: 'Fruits',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 50, p: 0.5, c: 13, f: 0.1 },
  { id: 'pear', name: 'Pear (medium)', cat: 'Fruits',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 101, p: 0.6, c: 27, f: 0.3 },
  { id: 'peach', name: 'Peach (medium)', cat: 'Fruits',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 58, p: 1.4, c: 14, f: 0.4 },
  { id: 'kiwi', name: 'Kiwi (medium)', cat: 'Fruits',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 2,
    cal: 42, p: 0.8, c: 10, f: 0.4 },

  // ── Nuts, seeds & fats ──────────────────────────────────────────────────
  { id: 'almonds', name: 'Almonds', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 579, p: 21, c: 22, f: 50 },
  { id: 'walnuts', name: 'Walnuts', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 654, p: 15, c: 14, f: 65 },
  { id: 'cashews', name: 'Cashews', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 553, p: 18, c: 30, f: 44 },
  { id: 'peanuts', name: 'Peanuts', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 30,
    cal: 567, p: 26, c: 16, f: 49 },
  { id: 'peanut-butter', name: 'Peanut butter', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 20,
    cal: 588, p: 25, c: 20, f: 50, aliases: ['pb'] },
  { id: 'almond-butter', name: 'Almond butter', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 20,
    cal: 614, p: 21, c: 19, f: 56 },
  { id: 'chia-seeds', name: 'Chia seeds', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 15,
    cal: 486, p: 17, c: 42, f: 31 },
  { id: 'flax-seeds', name: 'Flax seeds', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 15,
    cal: 534, p: 18, c: 29, f: 42, aliases: ['linseeds'] },
  { id: 'olive-oil', name: 'Olive oil', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 15,
    cal: 884, p: 0, c: 0, f: 100, aliases: ['oil'] },
  { id: 'coconut-oil', name: 'Coconut oil', cat: 'Nuts & Fats',
    baseUnit: 'g', baseAmount: 100, defaultServing: 15,
    cal: 862, p: 0, c: 0, f: 100 },

  // ── Legumes & plant proteins ────────────────────────────────────────────
  { id: 'black-beans', name: 'Black beans (cooked)', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 132, p: 8.9, c: 24, f: 0.5 },
  { id: 'chickpeas', name: 'Chickpeas (cooked)', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 164, p: 8.9, c: 27, f: 2.6, aliases: ['garbanzo'] },
  { id: 'lentils', name: 'Lentils (cooked)', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 116, p: 9, c: 20, f: 0.4 },
  { id: 'kidney-beans', name: 'Kidney beans (cooked)', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 127, p: 8.7, c: 23, f: 0.5 },
  { id: 'hummus', name: 'Hummus', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 50,
    cal: 166, p: 7.9, c: 14, f: 9.6 },
  { id: 'tofu', name: 'Tofu (firm)', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 150,
    cal: 144, p: 17, c: 3, f: 9 },
  { id: 'tempeh', name: 'Tempeh', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 192, p: 20, c: 7.6, f: 11 },
  { id: 'edamame', name: 'Edamame (cooked)', cat: 'Legumes',
    baseUnit: 'g', baseAmount: 100, defaultServing: 100,
    cal: 121, p: 12, c: 9, f: 5 },

  // ── Supplements ─────────────────────────────────────────────────────────
  { id: 'whey-protein', name: 'Whey protein', cat: 'Supplements',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 120, p: 24, c: 3, f: 1.5,
    aliases: ['protein powder', 'whey', 'scoop', 'shake'] },
  { id: 'casein', name: 'Casein protein', cat: 'Supplements',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 110, p: 24, c: 3, f: 1, aliases: ['casein'] },
  { id: 'protein-bar', name: 'Protein bar', cat: 'Supplements',
    baseUnit: 'piece', baseAmount: 1, defaultServing: 1,
    cal: 200, p: 20, c: 20, f: 7 },

  // ── Other ───────────────────────────────────────────────────────────────
  { id: 'honey', name: 'Honey', cat: 'Other',
    baseUnit: 'g', baseAmount: 100, defaultServing: 20,
    cal: 304, p: 0.3, c: 82, f: 0 },
  { id: 'maple-syrup', name: 'Maple syrup', cat: 'Other',
    baseUnit: 'g', baseAmount: 100, defaultServing: 20,
    cal: 260, p: 0, c: 67, f: 0 },
  { id: 'dark-chocolate', name: 'Dark chocolate (70%)', cat: 'Other',
    baseUnit: 'g', baseAmount: 100, defaultServing: 20,
    cal: 598, p: 7.8, c: 46, f: 43 },
  { id: 'soy-sauce', name: 'Soy sauce', cat: 'Other',
    baseUnit: 'g', baseAmount: 100, defaultServing: 15,
    cal: 53, p: 8, c: 4.9, f: 0.1 },
];

// ─── Friendly unit label ───────────────────────────────────────────────────
export function unitLabel(food, qty) {
  if (food.baseUnit === 'piece') {
    return qty === 1 ? 'piece' : 'pieces';
  }
  return food.baseUnit; // 'g' or 'ml'
}

// ─── Search ────────────────────────────────────────────────────────────────
// Returns top 6 matches ranked by how well they match the query.
export function searchFoods(query, limit = 6) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const scored = FOODS.map(f => {
    const name = f.name.toLowerCase();
    const aliases = (f.aliases || []).map(a => a.toLowerCase());
    let score = 0;
    if (name.startsWith(q)) score = 100;
    else if (aliases.some(a => a.startsWith(q))) score = 90;
    else if (name.includes(q)) score = 50;
    else if (aliases.some(a => a.includes(q))) score = 40;
    return { f, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.f);
}

// ─── Compute macros for a given quantity ──────────────────────────────────
export function computeMacros(food, qty) {
  const q = parseFloat(qty);
  if (!food || !q || q <= 0) return null;
  const ratio = q / food.baseAmount;
  return {
    cal: Math.round(food.cal * ratio),
    p: Math.round(food.p * ratio * 10) / 10,
    c: Math.round(food.c * ratio * 10) / 10,
    f: Math.round(food.f * ratio * 10) / 10,
  };
}

// ─── Popular foods (shown as quick-tap chips) ─────────────────────────────
export const POPULAR_IDS = [
  'chicken-breast', 'egg', 'oats', 'rice-white',
  'salmon', 'whey-protein', 'banana', 'greek-yogurt',
];
