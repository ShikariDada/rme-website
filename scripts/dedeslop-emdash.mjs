#!/usr/bin/env node
/**
 * Removes em dashes from all customer-visible copy (per user constraint:
 * no em dashes anywhere on the site). Skips code comments.
 * Deterministic, idempotent exact-string replacements.
 */
import { readFileSync, writeFileSync } from "node:fs";

const ops = [];
function rep(file, from, to) {
  ops.push([file, from, to]);
}

// Blanket alt-text pattern in products.json
rep(
  "content/seed/products.json",
  " \u2014 tile surface texture",
  ", tile surface texture"
);

rep(
  "content/seed/products.json",
  "it reads like marble at a vitrified tile price.",
  "it reads like marble at a vitrified tile price."
);
rep(
  "content/seed/products.json",
  "The most popular choice for living rooms in our showroom \u2014 it reads like marble",
  "The most popular choice for living rooms in our showroom, because it reads like marble"
);
rep(
  "content/seed/products.json",
  "Natural marble, by definition, varies more from piece to piece \u2014 see our marble category if you want the real thing.",
  "Natural marble, by definition, varies more from piece to piece. See our marble category if you want the real thing."
);
rep(
  "content/seed/products.json",
  "The matt version of our best-selling Bianco Carrara \u2014 calmer under interior lighting",
  "The matt version of our best-selling Bianco Carrara, calmer under interior lighting"
);
rep(
  "content/seed/products.json",
  "Black base with metallic gold-toned veining \u2014 a luxury accent wall tile.",
  "Black base with metallic gold-toned veining. A luxury accent wall tile."
);
rep(
  "content/seed/products.json",
  "the exact rate depends on the batch in stock \u2014 ask us for today's figure.",
  "the exact rate depends on the batch in stock, so ask us for today's figure."
);
rep(
  "content/seed/products.json",
  "Wood-grain porcelain strip tile \u2014 the warmth of timber with tile maintenance.",
  "Wood-grain porcelain strip tile: the warmth of timber with tile maintenance."
);
rep(
  "content/seed/products.json",
  "Professional handling and adhesive system required \u2014 ask us about laying service.",
  "Professional handling and adhesive system required. Ask us about laying service."
);
rep(
  "content/seed/products.json",
  "Batch-dependent shade \u2014 inspect before purchase",
  "Batch-dependent shade, inspect before purchase"
);
rep(
  "content/seed/products.json",
  "Strong lot-to-lot variation in veining and base tone \u2014 select your actual slab in the showroom.",
  "Strong lot-to-lot variation in veining and base tone. Select your actual slab in the showroom."
);
rep(
  "content/seed/products.json",
  "Imported lots \u2014 ask for current stock",
  "Imported lots, ask for current stock"
);

rep(
  "content/seed/announcements.json",
  "DEMO announcement \u2014 configure a real offer/message in the CMS to show this bar.",
  "DEMO announcement. Configure a real offer in the CMS to show this bar."
);

rep(
  "content/seed/settings.json",
  "Rajasthan Marble Enterprises \u2014 Marble, Tiles & Granite in Mathura",
  "Rajasthan Marble Enterprises: Marble, Tiles & Granite in Mathura"
);

rep(
  "content/seed/brands.json",
  "DEMO SEED \u2014 the owner must still obtain written Varmora authorisation",
  "DEMO SEED. The owner must still obtain written Varmora authorisation"
);

rep(
  "content/seed/guides.json",
  "where large formats pay off \u2014 and where they don't.",
  "and where large formats pay off, and where they do not."
);
rep(
  "content/seed/guides.json",
  "\"2x2\" means 2 feet by 2 feet \u2014 600x600 mm. \"2x4\" is 600x1200 mm.",
  "\"2x2\" means 2 feet by 2 feet, which is 600x600 mm. \"2x4\" is 600x1200 mm."
);
rep(
  "content/seed/guides.json",
  "increase cutting wastage \u2014 plan 12\u201315% instead of the usual 8\u201310%.",
  "increase cutting wastage. Plan 12\u201315% instead of the usual 8\u201310%."
);
rep(
  "content/seed/guides.json",
  "none of the three is universally better \u2014 they fail differently",
  "none of the three is universally better, because they fail differently"
);
rep(
  "content/seed/guides.json",
  "Higher \u2014 walls mainly",
  "Higher, mainly on walls"
);
rep(
  "content/seed/guides.json",
  "Soft \u2014 will scratch and polish out",
  "Soft, will scratch and polish out"
);
rep(
  "content/seed/guides.json",
  "We publish manufacturer-documented figures only \u2014 ask to see the datasheet",
  "We publish manufacturer-documented figures only. Ask to see the datasheet"
);
rep(
  "content/seed/guides.json",
  "Keep one spare box per home after laying \u2014 future repairs will not match a new batch.",
  "Keep one spare box per home after laying. Future repairs will not match a new batch."
);

rep(
  "content/seed/categories.json",
  "every size from 300x600 wall tiles to 1200x2400 slabs \u2014 with honest per-square-foot prices",
  "in every size from 300x600 wall tiles to 1200x2400 slabs, with honest per-square-foot prices"
);
rep(
  "content/seed/categories.json",
  "Tiles in Mathura \u2014 Prices, Sizes & Stock | Rajasthan Marble Enterprises",
  "Tiles in Mathura: Prices, Sizes & Stock | Rajasthan Marble Enterprises"
);
rep(
  "content/seed/categories.json",
  "Every slab is unique \u2014 see it in the showroom before you buy.",
  "Every slab is unique. See it in the showroom before you buy."
);
rep(
  "content/seed/categories.json",
  "Prices vary by slab thickness and lot \u2014 current ranges are listed with each product.",
  "Prices vary by slab thickness and lot. Current ranges are listed with each product."
);

rep(
  "content/seed/projects.json",
  "Showroom display \u2014 Bianco living-room floor set",
  "Showroom display: Bianco living-room floor set"
);
rep(
  "content/seed/projects.json",
  "Sample display imagery \u2014 replace with real project photography once available.",
  "Sample display imagery. Replace with real project photography once available."
);
rep(
  "content/seed/projects.json",
  "Showroom display \u2014 bathroom wall & floor combination",
  "Showroom display: bathroom wall & floor combination"
);
rep(
  "content/seed/projects.json",
  "Showroom display \u2014 kitchen floor & splashback pairing",
  "Showroom display: kitchen floor & splashback pairing"
);

rep(
  "content/seed/faqs.json",
  "vary by lot and thickness \u2014 we confirm the exact figure",
  "vary by lot and thickness, so we confirm the exact figure"
);
rep(
  "content/seed/faqs.json",
  "nearby towns through local transport \u2014 the exact charge depends on distance",
  "nearby towns through local transport. The exact charge depends on distance"
);
rep(
  "content/seed/faqs.json",
  "Yes \u2014 visit the showroom and take tile samples.",
  "Yes. Visit the showroom and take tile samples."
);
rep(
  "content/seed/faqs.json",
  "Natural stone varies in shade, vein and pattern between lots \u2014 no photograph can guarantee",
  "Natural stone varies in shade, vein and pattern between lots. No photograph can guarantee"
);
rep(
  "content/seed/faqs.json",
  "Real wastage depends on room shape and laying pattern \u2014 confirm the final quantity",
  "Real wastage depends on room shape and laying pattern, so confirm the final quantity"
);

// app pages
rep(
  "app/(site)/category/CategoryPage.tsx",
  "New {category.name.toLowerCase()} stock arrives weekly \u2014 ask us for current arrivals.",
  "New {category.name.toLowerCase()} stock arrives weekly. Ask us for current arrivals."
);
rep(
  "app/(site)/category/CategoryPage.tsx",
  "title: `${name} in Mathura \u2014 prices, sizes & stock`",
  "title: `${name} in Mathura: prices, sizes & stock`"
);

rep("app/(site)/contact/page.tsx",
  'title: "Get a quote \u2014 tiles, marble & granite"',
  'title: "Get a quote for tiles, marble & granite"');
rep("app/(site)/contact/page.tsx",
  "Share your list or rough area \u2014 we respond with current prices and stock.",
  "Share your list or rough area. We respond with current prices and stock.");
rep("app/(site)/contact/page.tsx",
  "Send what you have \u2014 a material list, a rough area, or just the look",
  "Send what you have: a material list, a rough area, or just the look");

rep("app/(site)/about/page.tsx",
  "A local ${settings.address.city} showroom for tiles, marble and granite \u2014 how we work",
  "A local ${settings.address.city} showroom for tiles, marble and granite: how we work");
rep("app/(site)/about/page.tsx",
  "granite \u2014 plus the adhesives", "granite, plus the adhesives");
rep("app/(site)/about/page.tsx",
  "Browse the catalogue here \u2014 filter by room",
  "Browse the catalogue here and filter by room");
rep("app/(site)/about/page.tsx",
  "Prices carry verification dates \u2014 no stale figures",
  "Prices carry verification dates, with no stale figures");

rep("app/(site)/brand/[slug]/page.tsx",
  "Manufacturer figures and marketing change often \u2014",
  "Manufacturer figures and marketing change often,");
rep("app/(site)/brand/[slug]/page.tsx",
  "ranges rotate through the showroom \u2014 ask us",
  "ranges rotate through the showroom. Ask us");

rep("app/(site)/guides/page.tsx",
  "Buying guides \u2014 tiles, marble & granite explained",
  "Buying guides: tiles, marble & granite explained");
rep("app/(site)/guides/page.tsx",
  "The answers our counter staff give every day \u2014 written down properly.",
  "The answers our counter staff give every day, written down properly.");
rep("app/(site)/guides/page.tsx",
  "Guides are on the way \u2014 ask us anything in the showroom meanwhile.",
  "Guides are on the way. Ask us anything in the showroom meanwhile.");

rep("app/(site)/page.tsx",
  "We stock each surface with the room in mind \u2014 not one range sold for everything.",
  "We stock each surface for the room it will serve, not one range sold for everything.");
rep("app/(site)/page.tsx",
  "Exact prices and stock states on every card \u2014 verified, with the date.",
  "Exact prices and stock states on every card, verified, with the date.");
rep("app/(site)/page.tsx",
  "The short version \u2014 longer answers live in the guides.",
  "The short version, with longer answers in the guides.");
rep("app/(site)/page.tsx",
  "compare full-scale displays under real light \u2014 no appointment needed",
  "compare full-scale displays under real light. No appointment needed");

rep("app/(site)/privacy/page.tsx",
  "Consent to be contacted is an explicit checkbox \u2014", "Consent to be contacted is an explicit checkbox,");
rep("app/(site)/privacy/page.tsx",
  "their terms \u2014 not in our website database", "their terms, not in our website database");
rep("app/(site)/privacy/page.tsx",
  "We will do it promptly \u2014", "We will do it promptly,");
rep("app/(site)/privacy/page.tsx",
  "title: `Privacy \u2014 ${settings.businessName}`", "title: `Privacy: ${settings.businessName}`");

rep("app/(site)/product/[slug]/page.tsx",
  "${product.name} \u2014 price, stock & specs", "${product.name}: price, stock & specs");
rep("app/(site)/product/[slug]/page.tsx",
  "${product.name} \u2014 see current price", "${product.name}. See current price");
rep("app/(site)/product/[slug]/page.tsx",
  "between lots \u2014 the", "between lots, so the");

rep("app/(site)/products/page.tsx",
  "${materialLabel()} \u2014 sizes, finishes & prices", "${materialLabel()}: sizes, finishes & prices");
rep("app/(site)/products/products-client.tsx",
  "verified regularly \u2014 confirm current", "verified regularly. Confirm current");

rep("app/(site)/projects/page.tsx",
  "See materials laid at full scale \u2014 showroom displays", "See materials laid at full scale: showroom displays");
rep("app/(site)/projects/page.tsx",
  "the way they actually lay \u2014 walk on them", "the way they actually lay. Walk on them");
rep("app/(site)/projects/page.tsx",
  "Project photos are coming soon \u2014 visit the showroom", "Project photos are coming soon. Visit the showroom");
rep("app/(site)/projects/[slug]/page.tsx",
  "sample installations \u2014 not private customer homes.", "sample installations, not private customer homes.");

rep("app/(site)/room/page.tsx",
  "elevation \u2014 materials picked for each space", "elevation: materials picked for each space");
rep("app/(site)/room/page.tsx",
  "Every space fails differently \u2014 we stock materials", "Every space fails differently, so we stock materials");
rep("app/(site)/room/[slug]/page.tsx",
  "${app.name} \u2014 tiles & surfaces", "${app.name}: tiles & surfaces");
rep("app/(site)/room/[slug]/page.tsx",
  "We are photographing this range now \u2014 WhatsApp us", "We are photographing this range now. WhatsApp us");

rep("app/(site)/showroom/page.tsx",
  "Visit our showroom \u2014 ${settings.address.city}", "Showroom visits in ${settings.address.city}");
rep("app/(site)/showroom/page.tsx",
  "Materials read differently in person \u2014 bring your room measurements",
  "Materials read differently in person, so bring your room measurements");
rep("app/(site)/showroom/page.tsx",
  "The map loads only when you ask \u2014 saving your data.", "The map loads only when you ask, saving your data.");

rep("app/(site)/terms/page.tsx",
  "others may not \u2014 each listing states which", "others may not. Each listing states which");
rep("app/(site)/terms/page.tsx",
  "planned estimates \u2014 the final order", "planned estimates. The final order");
rep("app/(site)/terms/page.tsx",
  "arranged case by case \u2014 cost depends", "arranged case by case, because cost depends");
rep("app/(site)/terms/page.tsx",
  "title: `Terms \u2014 ${settings.businessName}`", "title: `Terms: ${settings.businessName}`");

rep("app/(site)/tile-calculator/page.tsx",
  "Tile calculator \u2014 how many boxes do I need?",
  "Tile calculator: how many boxes do I need?");
rep("app/(site)/tile-calculator/page.tsx",
  "your room \u2014 by total area or room dimensions", "your room, by total area or room dimensions");
rep("app/(site)/visualizer/page.tsx",
  "See tiles in your room \u2014 visualizer", "See tiles in your room: visualizer");
rep("app/(site)/visualizer/page.tsx",
  "wall \u2014 locally in your browser", "wall, locally in your browser");

rep("app/not-found.tsx",
  "The catalogue is the fastest way back \u2014 or WhatsApp us",
  "The catalogue is the fastest way back, or WhatsApp us");

rep("components/calculator/TileCalculator.tsx",
  'hint="Planning estimate \u2014 not a fixed rule"', 'hint="Planning estimate, not a fixed rule"');
rep("components/calculator/TileCalculator.tsx",
  'hint="Optional \u2014 printed on every product page"', 'hint="Optional, printed on every product page"');
rep("components/calculator/TileCalculator.tsx",
  "and site conditions \u2014 confirm the", "and site conditions. Confirm the");

rep("components/catalogue/ProductCard.tsx",
  "or ask us on WhatsApp \u2014", "or ask us on WhatsApp.");

rep("components/forms/QuoteForm.tsx",
  "Something went wrong \u2014 please call or WhatsApp us instead.",
  "Something went wrong. Please call or WhatsApp us instead.");
rep("components/forms/QuoteForm.tsx",
  "Network problem \u2014 please try again, or WhatsApp us.",
  "Network problem. Please try again, or WhatsApp us.");
rep("components/forms/QuoteForm.tsx",
  "Nothing was sent yet \u2014 hand it over with one tap.", "Nothing was sent yet. Hand it over with one tap.");
rep("components/forms/QuoteForm.tsx",
  "The email notification could not be sent \u2014 please continue on WhatsApp so we definitely see your request.",
  "The email notification could not be sent. Please continue on WhatsApp so we definitely see your request.");
rep("components/forms/QuoteForm.tsx",
  "Product names, sizes, or SKUs \u2014 whatever you have", "Product names, sizes, or SKUs, whatever you have");
rep("components/forms/QuoteForm.tsx",
  'hint="Approximate \u2014 helps us estimate quantity"', 'hint="Approximate, helps us estimate quantity"');
rep("components/forms/QuoteForm.tsx",
  'Message us on WhatsApp</a> \u2014 usually the fastest route.', 'Message us on WhatsApp</a>. Usually the fastest route.');

rep("components/home/BrowseRails.tsx",
  "current price state and stock \u2014 verified, with dates.",
  "current price state and stock, verified, with dates.");
rep("components/home/FeaturedBrandBlock.tsx",
  "arrive in the showroom regularly \u2014", "arrive in the showroom regularly,");
rep("components/home/Hero.tsx",
  "Bianco Carrara \u2014 polished porcelain", "Bianco Carrara, polished porcelain");
rep("components/home/Hero.tsx",
  "Marble, tiles &amp; granite \u2014", "Marble, tiles &amp; granite,");
rep("components/home/PriceGuideTeaser.tsx",
  "thickness and finish \u2014 the exact figure", "thickness and finish. The exact figure");
rep("components/home/SeeInYourRoom.tsx",
  "Open any tile, marble or granite \u2014 or start in the visualizer", "Open any tile, marble or granite, or start in the visualizer");
rep("components/home/SeeInYourRoom.tsx",
  "actual product imagery \u2014 not a", "actual product imagery, not a");
rep("components/home/SeeInYourRoom.tsx",
  "room visualizer \u2014 wall and floor tile combination", "room visualizer: wall and floor tile combination");
rep("components/layout/Header.tsx",
  "aria-label={`${settings.businessName} \u2014 home`}", "aria-label={`${settings.businessName} home`}");
rep("components/product/ProductGallery.tsx",
  "aria-label={`${name} \u2014 image", "aria-label={`${name} image");
rep("components/product/QuantityCalculatorEmbed.tsx",
  "Wastage \u2014 planning estimate (%)", "Wastage, planning estimate (%)");
rep("components/product/QuantityCalculatorEmbed.tsx",
  "Planning estimate only \u2014 confirm the final quantity", "Planning estimate only. Confirm the final quantity");
rep("components/showroom/MapEmbed.tsx",
  "title={`Map \u2014 ${query}`}", "title={`Map: ${query}`}");

let applied = 0, missed = [];
const byFile = new Map();
for (const [file, from, to] of ops) {
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push([from, to]);
}
for (const [file, pairs] of byFile) {
  let s;
  try {
    s = readFileSync(file, "utf8");
  } catch {
    missed.push(`READ FAIL ${file}`);
    continue;
  }
  for (const [from, to] of pairs) {
    if (s.includes(from)) {
      s = s.split(from).join(to);
      applied++;
    } else {
      if (from.startsWith("it reads")) continue; // dummy no-op rep
      missed.push(`${file} :: ${from.slice(0, 60)}`);
    }
  }
  writeFileSync(file, s);
}
console.log(`applied ${applied}/${ops.length - 1}`);
if (missed.length) {
  console.log("MISSED:");
  for (const m of missed) console.log("  " + m);
}
