/**
 * Fetches DummyJSON products, enriches them with features/specs,
 * and writes server/data/djProducts.js as a static ES-module export.
 * Run once:  node scripts/generateDJProducts.mjs
 */

import { writeFileSync } from "fs";

// ── Seeded pseudo-random (same formula as products.js) ────────────────────
function sr(seed, offset = 0) {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 1e6;
  return x - Math.floor(x);
}

// ── Category map ──────────────────────────────────────────────────────────
const DJ_CATEGORY_MAP = {
  smartphones:           "Electronics > Mobiles",
  laptops:               "Electronics > Computers",
  tablets:               "Electronics > Mobiles",
  "mobile-accessories":  "Electronics > Accessories",
  "kitchen-accessories": "Home & Kitchen",
  "home-decoration":     "Home & Kitchen",
  furniture:             "Home & Kitchen",
  lighting:              "Home & Kitchen",
  groceries:             "Grocery",
  beauty:                "Beauty",
  fragrances:            "Beauty",
  "skin-care":           "Beauty",
  "sports-accessories":  "Sports",
  sunglasses:            "Fashion",
  "mens-shirts":         "Fashion",
  "mens-shoes":          "Fashion",
  "mens-watches":        "Fashion",
  "womens-dresses":      "Fashion",
  "womens-shoes":        "Fashion",
  "womens-watches":      "Fashion",
  "womens-bags":         "Fashion",
  "womens-jewellery":    "Fashion",
  tops:                  "Fashion",
};

// ── Feature generators per original DummyJSON category ───────────────────
const FEATURES = {
  smartphones: (p, r) => [
    `${p.description.split(".")[0].trim() || p.title + " — premium smartphone"}`,
    `${r.ram ? r.ram + "GB RAM" : pick(p.id, 1, ["8GB","6GB","12GB","4GB"]) + " RAM"} with ${r.storage ? r.storage + "GB" : pick(p.id, 2, ["128GB","256GB","64GB"]) + " storage"} for seamless multitasking`,
    `${r.batteryCapacity ? r.batteryCapacity + "mAh" : pick(p.id, 3, ["5000","4500","4000","5500"]) + "mAh"} battery with ${pick(p.id, 4, ["33W","45W","25W","65W"])} fast charging`,
    `${r.screenSize ? r.screenSize + '"' : pick(p.id, 5, ['6.5"','6.7"','6.4"','6.1"'])} ${pick(p.id, 6, ["AMOLED","Super AMOLED","IPS LCD","OLED"])} display with ${pick(p.id, 7, ["120Hz","90Hz","60Hz","144Hz"])} refresh rate`,
    `${pick(p.id, 8, ["Triple","Quad","Dual","Triple"])} rear camera with ${pick(p.id, 9, ["108","64","50","48","12"])}MP primary sensor for professional-grade photography`,
  ],
  tablets: (p, r) => [
    `${p.description.split(".")[0].trim() || p.title + " — versatile tablet"}`,
    `${r.ram ? r.ram + "GB RAM" : pick(p.id, 1, ["8GB","6GB","4GB"]) + " RAM"} with ${pick(p.id, 2, ["128","64","256"])}GB storage, expandable up to 1TB via microSD`,
    `${pick(p.id, 5, ['10.9"','11"','10.4"','8.7"'])} ${pick(p.id, 6, ["IPS LCD","AMOLED","TFT"])} display — perfect for streaming, reading and productivity`,
    `${pick(p.id, 3, ["7040","8000","7200","6000"])}mAh battery for up to ${pick(p.id, 4, ["10","12","8","14"])} hours of continuous use`,
    `Thin and lightweight design — ideal for travel, study, and entertainment on the go`,
  ],
  laptops: (p, r) => [
    `${p.description.split(".")[0].trim() || p.title + " — high-performance laptop"}`,
    `Powered by ${r.processorBrand ? r.processorBrand + " " + r.processorModel : pick(p.id, 1, ["Intel Core i7","Intel Core i5","AMD Ryzen 7","AMD Ryzen 5"])} processor for fast, responsive computing`,
    `${r.memoryType ? r.memorySpeed + "MHz " + r.memoryType : pick(p.id, 2, ["16GB DDR5","8GB DDR4","16GB DDR4","32GB DDR5"])} RAM — runs multiple apps without slowdown`,
    `${r.ssdCapacity ? r.ssdCapacity + "GB SSD" : pick(p.id, 3, ["512GB","256GB","1TB","512GB"])} high-speed solid-state storage for instant boot and fast file access`,
    `${r.displaySize ? r.displaySize + '"' : pick(p.id, 4, ['15.6"','14"','13.3"','16"'])} ${pick(p.id, 5, ["Full HD IPS","QHD","Full HD","4K"])} display — vibrant visuals for work and entertainment`,
  ],
  "mobile-accessories": (p) => [
    `${p.description.split(".")[0].trim() || "Premium mobile accessory for everyday use"}`,
    `Precisely engineered for ${p.brand || "universal"} compatibility — fits most smartphones and tablets`,
    `${pick(p.id, 1, ["Shock-absorbing","Scratch-resistant","Military-grade","Heavy-duty"])} construction that protects your device against daily wear and tear`,
    `${pick(p.id, 2, ["Ultra-slim","Ergonomic","Lightweight","Compact"])} profile — adds protection without adding bulk`,
    `Hassle-free installation and removal — no tools required`,
  ],
  "kitchen-accessories": (p, r) => [
    `${p.description.split(".")[0].trim() || "Essential kitchen accessory"}`,
    `Made from ${pick(p.id, 1, ["food-grade stainless steel","premium-grade polypropylene","BPA-free plastic","food-safe silicone","durable cast iron"])} — safe and built to last`,
    `${r.capacity ? r.capacity + "L capacity" : "Generous capacity"} — ideal for everyday cooking, meal prep and entertaining`,
    `${pick(p.id, 2, ["Dishwasher-safe","Easy-wipe","Hand-wash only","Top-rack dishwasher safe"])} for convenient cleaning`,
    `Compatible with ${pick(p.id, 3, ["gas, induction, and electric stovetops","all cooktop types","oven up to 250°C","microwave and oven"])}`,
  ],
  "home-decoration": (p) => [
    `${p.description.split(".")[0].trim() || "Elegant home décor piece"}`,
    `Crafted from ${pick(p.id, 1, ["solid wood","premium resin","hand-blown glass","high-quality ceramics","natural stone"])} for a stylish, lasting finish`,
    `${pick(p.id, 2, ["Hand-painted","Artisan-crafted","Hand-carved","Machine-finished with hand detailing"])} — every piece has its own unique character`,
    `Versatile design complements ${pick(p.id, 3, ["modern","rustic","minimalist","bohemian","traditional"])} interior styles`,
    `Easy care: ${pick(p.id, 4, ["wipe clean with a dry cloth","spot clean only","dust with a soft brush","wipe with a damp cloth"])}`,
  ],
  furniture: (p, r) => [
    `${p.description.split(".")[0].trim() || "Sturdy and stylish furniture piece"}`,
    `Frame constructed from ${pick(p.id, 1, ["solid oak","engineered hardwood","powder-coated steel","solid sheesham wood","teak veneer"])} for long-term durability`,
    `${r.dimensions ? `Dimensions: ${Math.round(r.dimensions.width)}W × ${Math.round(r.dimensions.height)}H × ${Math.round(r.dimensions.depth)}D cm` : "Space-efficient dimensions ideal for small to medium rooms"}`,
    `Weight capacity: ${pick(p.id, 2, ["100 kg","150 kg","80 kg","120 kg","200 kg"])} — built to handle everyday household use`,
    `${pick(p.id, 3, ["Easy self-assembly","Delivered pre-assembled","Flat-pack with all hardware included"])} — complete setup in under ${pick(p.id, 4, ["30","45","60","20"])} minutes`,
  ],
  lighting: (p) => [
    `${p.description.split(".")[0].trim() || "Modern lighting solution for your home"}`,
    `${pick(p.id, 1, ["Energy-efficient LED","Warm glow incandescent","Colour-changing LED","Adjustable brightness LED"])} technology — ${pick(p.id, 2, ["saves up to 80%","saves up to 60%","saves up to 75%"])} energy vs traditional bulbs`,
    `${pick(p.id, 3, ["2700K warm white","4000K cool daylight","6500K daylight","RGB 16 million colours"])} light tone — sets the perfect ambience for any room`,
    `${pick(p.id, 4, ["Flicker-free","Dimmable","Smart app-controlled","Timer-enabled"])} for eye-comfort and convenience`,
    `Rated lifespan: ${pick(p.id, 5, ["25,000 hours","15,000 hours","20,000 hours","30,000 hours"])} — years of reliable illumination`,
  ],
  groceries: (p) => [
    `${p.description.split(".")[0].trim() || "Premium grocery item for everyday use"}`,
    `${pick(p.id, 1, ["100% natural","No artificial preservatives","Naturally sourced","Organic origin"])} — clean-label formulation you can trust`,
    `${pick(p.id, 2, ["Rich in essential nutrients","High in dietary fibre","Source of natural antioxidants","Packed with vitamins & minerals"])} to support a balanced diet`,
    `${pick(p.id, 3, ["Ready-to-cook","Ready-to-eat","Minimal preparation needed","No added sugar"])} — convenient for busy households`,
    `Shelf life: ${pick(p.id, 4, ["12 months","6 months","18 months","24 months"])} when stored in a cool, dry place`,
  ],
  beauty: (p, r) => [
    `${p.description.split(".")[0].trim() || "Premium beauty product"}`,
    `${pick(p.id, 1, ["Ophthalmologist-tested","Dermatologist-tested","Hypoallergenic","Clinically proven"])} formula — safe for sensitive skin`,
    `${pick(p.id, 2, ["Long-lasting 12-hour wear","Up to 16-hour colour retention","24-hour moisture lock","12-hour fragrance"])} — looks fresh all day`,
    `${pick(p.id, 3, ["Cruelty-free","Vegan-friendly","Paraben-free","Sulphate-free","No harmful chemicals"])} — ethically produced`,
    `${r.shadeRange ? r.shadeRange + " shades available" : pick(p.id, 4, ["Available in 12+ shades","Multiple finishes available","Comes in 8 versatile shades","One universal shade fits all"])}`,
  ],
  fragrances: (p) => [
    `${p.description.split(".")[0].trim() || "Premium fragrance"}`,
    `Top notes: ${pick(p.id, 1, ["bergamot & lemon","rose & jasmine","oud & sandalwood","mandarin & grapefruit","violet & iris"])}`,
    `Heart notes: ${pick(p.id, 2, ["cedarwood & musk","peony & freesia","amber & vanilla","neroli & gardenia","patchouli & vetiver"])}`,
    `${pick(p.id, 3, ["Long-lasting 8–10 hour","All-day 12-hour","Intense 6–8 hour","Moderate 4–6 hour"])} projection on skin`,
    `${pick(p.id, 4, ["Eau de Parfum (EDP)","Eau de Toilette (EDT)","Parfum Intense","Body Mist"])} concentration — ideal for daily wear`,
  ],
  "skin-care": (p) => [
    `${p.description.split(".")[0].trim() || "Premium skin care product"}`,
    `Formulated with ${pick(p.id, 1, ["hyaluronic acid & niacinamide","retinol & vitamin C","ceramides & peptides","vitamin E & aloe vera","kojic acid & glycerin"])} for visible results`,
    `Suitable for ${pick(p.id, 2, ["all skin types","dry to normal skin","oily to combination skin","sensitive skin","mature skin"])}`,
    `${pick(p.id, 3, ["Paraben-free, sulphate-free & fragrance-free","Alcohol-free & non-comedogenic","Vegan & cruelty-free","Dermatologist-approved formula"])}`,
    `Visible results in ${pick(p.id, 4, ["2–4 weeks","4–6 weeks","7 days","3 weeks"])} of regular use`,
  ],
  "sports-accessories": (p, r) => [
    `${p.description.split(".")[0].trim() || "Professional-grade sports accessory"}`,
    `Constructed from ${pick(p.id, 1, ["high-tensile nylon","reinforced polypropylene","breathable mesh fabric","carbon-composite","natural rubber"])} for performance under pressure`,
    `${r.weight ? `Weighs only ${r.weight} kg — lightweight` : "Lightweight design"} for unrestricted movement during intense workouts`,
    `${pick(p.id, 2, ["Anti-sweat grip","Non-slip base","Quick-dry surface","Moisture-wicking fabric"])} — engineered for peak athletic performance`,
    `Suitable for ${pick(p.id, 3, ["gym, yoga, and home workouts","outdoor sports and fitness","running, cycling, and cross-training","team sports and recreational play"])}`,
  ],
  sunglasses: (p) => [
    `${p.description.split(".")[0].trim() || "Stylish sunglasses"}`,
    `${pick(p.id, 1, ["UV400","Polarised UV400","100% UVA/UVB","Photochromic UV"])} protection — shields eyes from harmful sun exposure`,
    `Frame material: ${pick(p.id, 2, ["lightweight TR90","premium acetate","stainless steel","titanium alloy","eco-friendly recycled nylon"])}`,
    `${pick(p.id, 3, ["Impact-resistant","Scratch-resistant","Anti-glare","Blue-light filter"])} lens — clear, distortion-free vision`,
    `${pick(p.id, 4, ["Fits most face shapes","Adjustable nose pads","Spring-hinge temples","Wraparound coverage"])} for comfortable all-day wear`,
  ],
  "mens-shirts": (p) => [
    `${p.description.split(".")[0].trim() || "Premium men's shirt"}`,
    `Fabric: ${pick(p.id, 1, ["100% pure cotton","60% cotton, 40% polyester","100% linen","Oxford weave cotton","stretch poplin"])} — breathable and comfortable all day`,
    `${pick(p.id, 2, ["Regular fit","Slim fit","Relaxed fit","Tailored fit"])} silhouette — versatile enough for office to weekend wear`,
    `${pick(p.id, 3, ["Machine washable at 30°C","Machine washable at 40°C","Dry-clean only","Hand wash cold"])} — low-maintenance care`,
    `Available in a wide colour range — from neutral classics to seasonal bold tones`,
  ],
  "mens-shoes": (p) => [
    `${p.description.split(".")[0].trim() || "Premium men's footwear"}`,
    `Upper: ${pick(p.id, 1, ["genuine leather","suede leather","canvas","premium mesh","patent leather"])} — durable and refined`,
    `${pick(p.id, 2, ["Cushioned memory foam insole","Removable orthotic insole","EVA foam midsole","Contour comfort footbed"])} for all-day support`,
    `Outsole: ${pick(p.id, 3, ["non-slip rubber","thermoplastic rubber (TPR)","natural gum rubber","durable synthetic"])} — excellent traction on all surfaces`,
    `${pick(p.id, 4, ["Lace-up closure","Slip-on","Velcro strap","Buckle closure"])} — easy to put on and take off`,
  ],
  "mens-watches": (p, r) => [
    `${p.description.split(".")[0].trim() || "Premium men's timepiece"}`,
    `Case: ${pick(p.id, 1, ["stainless steel 316L","brushed titanium","IP gold-plated","matte black PVD","rose gold plated"])} — ${r.dimensions ? Math.round(r.dimensions.width) + "mm diameter" : pick(p.id, 2, ["42mm","44mm","40mm","46mm","38mm"])}`,
    `${pick(p.id, 3, ["Japanese quartz movement","Swiss automatic movement","Solar-powered movement","Chronograph movement"])} — ${pick(p.id, 4, ["±15 sec/month accuracy","Swiss precision","±30 sec/month","high accuracy"])}`,
    `${pick(p.id, 5, ["5 ATM water resistant","10 ATM water resistant","3 ATM water resistant","Splash-proof"])} — suitable for daily wear and light water activities`,
    `Strap: ${pick(p.id, 6, ["genuine leather","stainless steel bracelet","silicone sport strap","mesh stainless","NATO nylon"])} — comfortable and stylish`,
  ],
  "womens-dresses": (p) => [
    `${p.description.split(".")[0].trim() || "Elegant women's dress"}`,
    `Fabric: ${pick(p.id, 1, ["100% polyester chiffon","cotton blend","satin crepe","viscose georgette","jersey knit"])} — lightweight, breathable, and flattering`,
    `${pick(p.id, 2, ["A-line silhouette","Wrap-style fit","Bodycon cut","Flowy midi length","Shift dress style"])} that flatters all body types`,
    `${pick(p.id, 3, ["Side zip closure","Back button closure","Elastic waistband","Tie waist detail"])} for effortless styling`,
    `${pick(p.id, 4, ["Machine washable at 30°C","Hand wash recommended","Dry-clean only"])} — easy care for busy lifestyles`,
  ],
  "womens-shoes": (p) => [
    `${p.description.split(".")[0].trim() || "Stylish women's footwear"}`,
    `Upper: ${pick(p.id, 1, ["vegan leather","genuine leather","suede","satin","canvas","mesh knit"])} — on-trend and long-lasting`,
    `${pick(p.id, 2, ["Cushioned footbed","Memory foam insole","Padded ankle strap","Gel-cushion sole"])} for all-day comfort`,
    `${pick(p.id, 3, ["Stiletto heel","Block heel","Kitten heel","Flat sole","Wedge heel"])} — ${pick(p.id, 4, ["4cm","7cm","2.5cm","5cm","flat"])} height for comfortable all-day wear`,
    `${pick(p.id, 5, ["Non-slip rubber outsole","Flexible TPR sole","Leather outsole"])} — safe and steady on all surfaces`,
  ],
  "womens-watches": (p, r) => [
    `${p.description.split(".")[0].trim() || "Elegant women's timepiece"}`,
    `Case: ${pick(p.id, 1, ["rose gold-plated stainless steel","silver-tone alloy","gold-plated brass","stainless steel 316L"])} — ${pick(p.id, 2, ["36mm","34mm","38mm","32mm"])} delicate profile`,
    `${pick(p.id, 3, ["Japanese quartz movement","Solar-powered quartz","Kinetic movement"])} — precision timekeeping`,
    `${pick(p.id, 4, ["Embellished with Swarovski crystals","Stone-studded bezel","Minimalist clean dial","Mother-of-pearl dial"])} for a refined aesthetic`,
    `Strap: ${pick(p.id, 5, ["stainless mesh","genuine leather","ceramic link bracelet","silicone sport band"])} — comfortable for everyday wear`,
  ],
  "womens-bags": (p) => [
    `${p.description.split(".")[0].trim() || "Fashionable women's bag"}`,
    `Material: ${pick(p.id, 1, ["premium vegan leather","genuine pebble leather","nylon canvas","satin clutch fabric","quilted leather"])} — durable and elegant`,
    `${pick(p.id, 2, ["Spacious main compartment","Multiple zip pockets","Adjustable shoulder strap","Detachable crossbody strap"])} — functional and stylish`,
    `${pick(p.id, 3, ["Brass-tone hardware","Gold-plated hardware","Silver-tone hardware"])} — adds a sophisticated finish`,
    `Lining: ${pick(p.id, 4, ["fabric lining","suede interior","easy-clean PU lining"])} with dedicated card slots and zip pocket`,
  ],
  "womens-jewellery": (p) => [
    `${p.description.split(".")[0].trim() || "Elegant women's jewellery"}`,
    `Base metal: ${pick(p.id, 1, ["sterling silver 925","18K gold-plated brass","rose gold-plated copper","stainless steel"])} — hypoallergenic and tarnish-resistant`,
    `${pick(p.id, 2, ["Hand-set cubic zirconia","Freshwater pearl accent","Natural stone inlay","Enamel finish"])} — sparkling and eye-catching`,
    `${pick(p.id, 3, ["Adjustable chain length","Screw-back earrings","Spring-ring clasp","Lobster clasp"])} for secure and comfortable wear`,
    `Suitable for ${pick(p.id, 4, ["daily wear","gifting and special occasions","formal and casual styling","bridal and festive wear"])}`,
  ],
  tops: (p) => [
    `${p.description.split(".")[0].trim() || "Stylish women's top"}`,
    `Fabric: ${pick(p.id, 1, ["100% viscose","polyester-spandex blend","100% cotton","rayon crepe","linen blend"])} — soft, breathable, and skin-friendly`,
    `${pick(p.id, 2, ["Relaxed fit","Cropped length","Oversized silhouette","Fitted cut","Peplum detail"])} — easy to style for any occasion`,
    `${pick(p.id, 3, ["Machine washable at 30°C","Hand wash cold","Dry-clean recommended"])} — simple care routine`,
    `Pair with ${pick(p.id, 4, ["high-waist jeans for a casual look","tailored trousers for smart casual","skirts for a feminine vibe","shorts for summer styling"])}`,
  ],
};

// ── Spec generators ───────────────────────────────────────────────────────
const SPECS = {
  smartphones: (p, r) => ({
    Brand: p.brand || "Generic",
    Display: `${r.screenSize ? r.screenSize + '"' : pick(p.id, 5, ['6.5"','6.7"','6.4"','6.1"'])} ${pick(p.id, 6, ["AMOLED","Super AMOLED","IPS LCD","OLED"])}`,
    Processor: pick(p.id, 10, ["Snapdragon 8 Gen 2","MediaTek Dimensity 9000","Exynos 2200","Snapdragon 7s Gen 2"]),
    RAM: `${r.ram ? r.ram : pick(p.id, 1, [8,6,12,4])}GB`,
    Storage: `${r.storage ? r.storage : pick(p.id, 2, [128,256,64,512])}GB`,
    Battery: `${r.batteryCapacity || pick(p.id, 3, [5000,4500,4000,5500])}mAh`,
    "Rear Camera": `${pick(p.id, 9, [108,64,50,48,12])}MP + ${pick(p.id, 11, [12,8,5,10])}MP + ${pick(p.id, 12, [5,2,5,8])}MP`,
    "Front Camera": `${pick(p.id, 13, [16,20,12,32])}MP`,
    OS: `Android ${pick(p.id, 14, [14,13,12])}`,
    SIM: pick(p.id, 15, ["Dual SIM (Nano + Nano)","Single SIM","Dual SIM (Nano + eSIM)"]),
    Connectivity: "5G / Wi-Fi 6 / Bluetooth 5.2 / NFC",
    Warranty: r.warrantyInformation || "1 Year Manufacturer Warranty",
  }),
  tablets: (p, r) => ({
    Brand: p.brand || "Generic",
    Display: `${pick(p.id, 5, ['10.9"','11"','10.4"','8.7"'])} ${pick(p.id, 6, ["IPS LCD","AMOLED","TFT"])}`,
    Processor: pick(p.id, 10, ["Snapdragon 680","MediaTek Helio G99","Unisoc T618","Exynos 1280"]),
    RAM: `${pick(p.id, 1, [8,6,4,12])}GB`,
    Storage: `${pick(p.id, 2, [128,64,256,32])}GB (expandable up to 1TB)`,
    Battery: `${pick(p.id, 3, [7040,8000,7200,6000])}mAh`,
    Connectivity: "Wi-Fi 6 / Bluetooth 5.0 / USB-C",
    OS: `Android ${pick(p.id, 14, [14,13,12])}`,
    Warranty: r.warrantyInformation || "1 Year Manufacturer Warranty",
  }),
  laptops: (p, r) => ({
    Brand: p.brand || "Generic",
    Display: `${r.displaySize ? r.displaySize + '"' : pick(p.id, 4, ['15.6"','14"','13.3"','16"'])} ${pick(p.id, 5, ["Full HD IPS","QHD","Full HD TN","4K OLED"])}`,
    Processor: r.processorBrand ? `${r.processorBrand} ${r.processorModel}` : pick(p.id, 1, ["Intel Core i7-1255U","Intel Core i5-1235U","AMD Ryzen 7 6800H","AMD Ryzen 5 6600H"]),
    RAM: `${r.memoryType ? r.memorySpeed + "MHz " + r.memoryType : pick(p.id, 2, ["16GB DDR5","8GB DDR4","16GB DDR4","32GB DDR5"])}`,
    Storage: `${r.ssdCapacity ? r.ssdCapacity + "GB SSD" : pick(p.id, 3, ["512GB NVMe SSD","256GB SSD","1TB NVMe SSD"])}`,
    Graphics: pick(p.id, 6, ["NVIDIA GeForce RTX 3050","Intel Iris Xe","AMD Radeon 680M","NVIDIA GeForce RTX 4060"]),
    Battery: `${pick(p.id, 7, [56,72,45,86])}Whr — up to ${pick(p.id, 8, [8,10,6,12])} hours`,
    OS: pick(p.id, 9, ["Windows 11 Home","Windows 11 Pro","Windows 10 Home","DOS (No OS)"]),
    Weight: `${parseFloat((1.4 + sr(p.id, 20) * 1.2).toFixed(1))} kg`,
    Warranty: r.warrantyInformation || "1 Year On-site Warranty",
  }),
  "mobile-accessories": (p, r) => ({
    Brand: p.brand || "Generic",
    Material: pick(p.id, 1, ["Polycarbonate","Thermoplastic Polyurethane (TPU)","Tempered Glass","Silicone","Hard Plastic"]),
    Compatibility: `${p.brand || "Universal"} — compatible with most smartphones`,
    Connectivity: pick(p.id, 2, ["Wired","Bluetooth 5.0","USB-C","3.5mm Audio Jack","Wireless"]),
    Weight: `${Math.round(20 + sr(p.id, 5) * 200)}g`,
    Warranty: r.warrantyInformation || "6 Months Warranty",
  }),
  "kitchen-accessories": (p, r) => ({
    Material: pick(p.id, 1, ["Food-grade Stainless Steel","BPA-free Polypropylene","Cast Iron","Silicone","Anodised Aluminium"]),
    Capacity: r.capacity ? r.capacity + "L" : pick(p.id, 2, ["2L","3L","1.5L","5L","500ml"]),
    Dimensions: r.dimensions
      ? `${Math.round(r.dimensions.width)}W × ${Math.round(r.dimensions.height)}H × ${Math.round(r.dimensions.depth)}D cm`
      : pick(p.id, 3, ["25 × 15 × 10 cm","30 × 20 × 15 cm","20 × 12 × 8 cm","35 × 25 × 18 cm"]),
    Weight: r.weight ? r.weight + " kg" : pick(p.id, 4, ["0.5 kg","1.2 kg","0.8 kg","2.0 kg","0.3 kg"]),
    "Dishwasher Safe": pick(p.id, 5, ["Yes","Top Rack Only","No","Yes"]),
    "Induction Compatible": pick(p.id, 6, ["Yes","No","Yes","Yes"]),
    Warranty: r.warrantyInformation || "1 Year Warranty",
  }),
  "home-decoration": (p, r) => ({
    Material: pick(p.id, 1, ["Solid Wood","Resin","Ceramic","Metal","Handblown Glass","Natural Stone"]),
    Dimensions: r.dimensions
      ? `${Math.round(r.dimensions.width)}W × ${Math.round(r.dimensions.height)}H × ${Math.round(r.dimensions.depth)}D cm`
      : pick(p.id, 3, ["20 × 30 × 10 cm","15 × 40 × 15 cm","25 × 25 × 12 cm","40 × 20 × 20 cm"]),
    Weight: r.weight ? r.weight + " kg" : pick(p.id, 4, ["0.5 kg","1.0 kg","0.3 kg","0.8 kg"]),
    Finish: pick(p.id, 5, ["Matte","Glossy","Antique Distressed","Natural Wax","Metallic Sheen"]),
    "Indoor/Outdoor": pick(p.id, 6, ["Indoor only","Indoor & Covered Outdoor","Indoor only"]),
    Warranty: r.warrantyInformation || "6 Months against manufacturing defects",
  }),
  furniture: (p, r) => ({
    Material: pick(p.id, 1, ["Solid Sheesham Wood","Engineered Wood (MDF)","Steel Frame","Solid Pine","Solid Oak"]),
    Dimensions: r.dimensions
      ? `${Math.round(r.dimensions.width)}W × ${Math.round(r.dimensions.height)}H × ${Math.round(r.dimensions.depth)}D cm`
      : pick(p.id, 3, ["120 × 75 × 60 cm","90 × 90 × 45 cm","180 × 80 × 40 cm","60 × 120 × 30 cm"]),
    Weight: r.weight ? r.weight + " kg" : pick(p.id, 4, ["12 kg","20 kg","8 kg","35 kg","50 kg"]),
    "Weight Capacity": pick(p.id, 2, ["100 kg","150 kg","80 kg","200 kg","120 kg"]),
    Finish: pick(p.id, 5, ["Teak Finish","Walnut Veneer","White Matt","Natural Oak","Ebony Stain"]),
    Assembly: pick(p.id, 6, ["Self-assembly (tools included)","Pre-assembled","Flat-pack with instructions"]),
    Warranty: r.warrantyInformation || "1 Year Warranty",
  }),
  lighting: (p, r) => ({
    Type: pick(p.id, 1, ["LED Bulb","LED Strip","CFL Bulb","Pendant Light","Floor Lamp","Table Lamp"]),
    Wattage: `${pick(p.id, 2, [9,12,18,7,24])}W`,
    "Light Colour": pick(p.id, 3, ["2700K Warm White","4000K Cool White","6500K Daylight","RGB (16M colours)"]),
    Lumens: pick(p.id, 4, ["800 lm","1200 lm","600 lm","1500 lm","400 lm"]),
    Lifespan: `${pick(p.id, 5, [25000,15000,20000,30000])} hours`,
    "Base Type": pick(p.id, 6, ["B22 Bayonet","E27 Edison Screw","E14 Small Screw","GU10"]),
    Voltage: "220–240V AC",
    Warranty: r.warrantyInformation || "1 Year Warranty",
  }),
  groceries: (p, r) => ({
    Weight: r.weight ? r.weight + " kg" : pick(p.id, 1, ["500g","1 kg","250g","200g","100g"]),
    "Serving Size": pick(p.id, 2, ["30g","100g","50g","200ml","one piece"]),
    Calories: `${pick(p.id, 3, [120,250,80,350,45])} kcal per serving`,
    "Shelf Life": pick(p.id, 4, ["12 months","6 months","18 months","24 months","3 months"]),
    "Storage": pick(p.id, 5, ["Cool, dry place","Refrigerate after opening","Room temperature","Freeze after opening"]),
    "Country of Origin": pick(p.id, 6, ["India","Thailand","USA","Italy","Sri Lanka"]),
  }),
  beauty: (p, r) => ({
    Volume: r.weight ? Math.round(r.weight * 1000) + " ml" : pick(p.id, 1, ["30 ml","50 ml","15 ml","100 ml","5 ml"]),
    "Skin Type": pick(p.id, 2, ["All skin types","Dry to Normal","Oily to Combination","Sensitive","Mature"]),
    "Key Ingredients": pick(p.id, 3, ["Hyaluronic Acid, Niacinamide","Vitamin C, Retinol","Ceramides, Peptides","Vitamin E, Aloe Vera","Kojic Acid, Glycerin"]),
    "Free From": pick(p.id, 4, ["Paraben, Sulphate, Fragrance","Alcohol, Non-comedogenic","Mineral Oil, SLS","Artificial Fragrance, Dye"]),
    "Shelf Life": pick(p.id, 5, ["12 months","24 months","18 months","36 months"]),
    Finish: pick(p.id, 6, ["Matte","Dewy/Luminous","Satin","Natural/No Transfer"]),
  }),
  fragrances: (p, r) => ({
    Volume: r.weight ? Math.round(r.weight * 1000) + " ml" : pick(p.id, 1, ["50 ml","100 ml","30 ml","75 ml","200 ml"]),
    Concentration: pick(p.id, 2, ["Eau de Parfum (EDP)","Eau de Toilette (EDT)","Parfum Intense","Eau Fraîche"]),
    "Top Notes": pick(p.id, 3, ["Bergamot & Lemon","Rose & Jasmine","Mandarin & Grapefruit","Violet & Iris"]),
    "Heart Notes": pick(p.id, 4, ["Cedarwood & Musk","Amber & Vanilla","Neroli & Gardenia","Patchouli & Vetiver"]),
    "Base Notes": pick(p.id, 5, ["Sandalwood & Oakmoss","White Musk & Amber","Vetiver & Tonka","Incense & Oud"]),
    Longevity: `${pick(p.id, 6, [8,10,6,12])} hours`,
    Gender: pick(p.id, 7, ["Unisex","Men's Fragrance","Women's Fragrance"]),
  }),
  "skin-care": (p, r) => ({
    Volume: r.weight ? Math.round(r.weight * 1000) + " ml" : pick(p.id, 1, ["30 ml","50 ml","15 ml","100 ml","200 ml"]),
    "Skin Type": pick(p.id, 2, ["All skin types","Dry to Normal","Oily to Combination","Sensitive","Mature"]),
    "Key Active Ingredients": pick(p.id, 3, ["Hyaluronic Acid 2%, Niacinamide 5%","Retinol 0.3%, Vitamin C 10%","Ceramide NP, Hyaluronic Acid","Vitamin E 1%, Aloe Barbadensis"]),
    "Free From": pick(p.id, 4, ["Paraben, Sulphate, Fragrance","Alcohol, Artificial Colour","Mineral Oil, SLS, SLES","Phthalates, Artificial Fragrance"]),
    SPF: pick(p.id, 5, ["No SPF","SPF 15","SPF 30","SPF 50"]),
    "Usage": pick(p.id, 6, ["AM & PM","PM only","AM only","Twice weekly"]),
    "Shelf Life": "12 months after opening",
  }),
  "sports-accessories": (p, r) => ({
    Material: pick(p.id, 1, ["High-tensile Nylon","Reinforced Polypropylene","Natural Rubber","Carbon-Composite","Breathable Mesh Fabric"]),
    Weight: r.weight ? r.weight + " kg" : pick(p.id, 2, ["0.3 kg","0.8 kg","0.5 kg","1.2 kg","0.1 kg"]),
    Dimensions: r.dimensions
      ? `${Math.round(r.dimensions.width)}W × ${Math.round(r.dimensions.height)}H × ${Math.round(r.dimensions.depth)}D cm`
      : pick(p.id, 3, ["30 × 20 × 5 cm","60 × 30 × 10 cm","180 × 60 × 0.5 cm","25 × 10 × 10 cm"]),
    "Colour Options": `${Math.round(3 + sr(p.id, 10) * 6)} colours available`,
    "Recommended Use": pick(p.id, 4, ["Gym & Home Workout","Outdoor Sports & Fitness","Yoga & Pilates","Running & Cross-training"]),
    Warranty: r.warrantyInformation || "6 Months against manufacturing defects",
  }),
  sunglasses: (p) => ({
    "Frame Material": pick(p.id, 1, ["TR90 Lightweight Plastic","Premium Acetate","Stainless Steel","Titanium Alloy","Recycled Nylon"]),
    "Lens Material": pick(p.id, 2, ["Polycarbonate","CR-39 Optical","Glass","TAC Polarised"]),
    "UV Protection": pick(p.id, 3, ["UV400","100% UVA/UVB","Polarised UV400","Photochromic"]),
    "Lens Width": `${Math.round(50 + sr(p.id, 4) * 12)}mm`,
    "Bridge Width": `${Math.round(16 + sr(p.id, 5) * 6)}mm`,
    "Temple Length": `${Math.round(135 + sr(p.id, 6) * 10)}mm`,
    "Face Shape": pick(p.id, 7, ["Oval","Square","Round","Heart","All face shapes"]),
    Warranty: "6 Months against manufacturing defects",
  }),
  "mens-shirts": (p, r) => ({
    Fabric: pick(p.id, 1, ["100% Cotton","60% Cotton 40% Polyester","100% Linen","Oxford Weave Cotton","Stretch Poplin"]),
    Fit: pick(p.id, 2, ["Regular Fit","Slim Fit","Relaxed Fit","Tailored Fit"]),
    Collar: pick(p.id, 3, ["Classic Spread Collar","Button-down Collar","Cutaway Collar","Mandarin Collar"]),
    Closure: pick(p.id, 4, ["Button Placket","Hidden Placket","Snap Buttons","Zip Placket"]),
    Care: pick(p.id, 5, ["Machine Wash 30°C","Machine Wash 40°C","Dry Clean Only","Hand Wash Cold"]),
    Sizes: "XS / S / M / L / XL / XXL / XXXL",
    Weight: `${Math.round(180 + sr(p.id, 6) * 120)}g`,
  }),
  "mens-shoes": (p, r) => ({
    "Upper Material": pick(p.id, 1, ["Genuine Leather","Suede Leather","Canvas","Premium Mesh","Patent Leather"]),
    "Sole Material": pick(p.id, 2, ["Rubber","Thermoplastic Rubber (TPR)","Natural Gum Rubber","Synthetic"]),
    Closure: pick(p.id, 3, ["Lace-up","Slip-on","Velcro Strap","Buckle"]),
    "Toe Shape": pick(p.id, 4, ["Round Toe","Square Toe","Pointed Toe","Almond Toe"]),
    "Heel Height": `${pick(p.id, 5, [2,3,1,4])} cm`,
    Sizes: "UK 6 – UK 12",
    Weight: `${Math.round(350 + sr(p.id, 6) * 250)}g (per pair)`,
    Warranty: r.warrantyInformation || "6 Months against manufacturing defects",
  }),
  "mens-watches": (p, r) => ({
    "Case Material": pick(p.id, 1, ["Stainless Steel 316L","Titanium","IP Gold-plated","PVD Black Coated"]),
    "Case Diameter": `${pick(p.id, 2, [42,44,40,46,38])}mm`,
    "Case Thickness": `${pick(p.id, 3, [10,12,9,11])}mm`,
    Movement: pick(p.id, 4, ["Japanese Quartz","Swiss Automatic","Solar Quartz","Mechanical Hand-wind"]),
    "Water Resistance": pick(p.id, 5, ["5 ATM (50m)","10 ATM (100m)","3 ATM (30m)","20 ATM (200m)"]),
    "Strap Material": pick(p.id, 6, ["Genuine Leather","Stainless Steel Bracelet","Silicone","NATO Nylon","Mesh Stainless"]),
    Warranty: r.warrantyInformation || "1 Year Manufacturer Warranty",
  }),
  "womens-dresses": (p) => ({
    Fabric: pick(p.id, 1, ["100% Polyester Chiffon","Cotton Blend","Satin Crepe","Viscose Georgette","Jersey Knit"]),
    Fit: pick(p.id, 2, ["A-line","Wrap","Bodycon","Shift","Maxi","Midi"]),
    Neckline: pick(p.id, 3, ["V-neck","Round Neck","Square Neck","Off-shoulder","Halter Neck"]),
    Sleeve: pick(p.id, 4, ["Sleeveless","Short Sleeve","3/4 Sleeve","Full Sleeve","Flutter Sleeve"]),
    Length: pick(p.id, 5, ["Mini (above knee)","Midi (knee to calf)","Maxi (floor length)"]),
    Care: pick(p.id, 6, ["Machine Wash 30°C","Hand Wash Cold","Dry Clean Only"]),
    Sizes: "XS / S / M / L / XL / XXL",
  }),
  "womens-shoes": (p) => ({
    "Upper Material": pick(p.id, 1, ["Vegan Leather","Genuine Leather","Suede","Satin","Canvas","Mesh Knit"]),
    "Heel Type": pick(p.id, 2, ["Stiletto","Block Heel","Kitten Heel","Flat","Wedge","Platform"]),
    "Heel Height": `${pick(p.id, 3, [4,7,2,9,0,10])} cm`,
    "Sole Material": pick(p.id, 4, ["Non-slip Rubber","Flexible TPR","Leather","Synthetic Crepe"]),
    Closure: pick(p.id, 5, ["Buckle Strap","Slip-on","Lace-up","Zip","Velcro"]),
    Sizes: "UK 3 – UK 8",
    Warranty: "6 Months against manufacturing defects",
  }),
  "womens-watches": (p) => ({
    "Case Material": pick(p.id, 1, ["Rose Gold-plated Stainless Steel","Silver-tone Alloy","Gold-plated Brass","Stainless Steel 316L"]),
    "Case Diameter": `${pick(p.id, 2, [36,34,38,32])}mm`,
    Movement: pick(p.id, 3, ["Japanese Quartz","Solar-powered Quartz","Kinetic"]),
    "Water Resistance": pick(p.id, 4, ["3 ATM","5 ATM","Splash-proof"]),
    "Strap Material": pick(p.id, 5, ["Stainless Mesh","Genuine Leather","Ceramic Link","Silicone Sport Band"]),
    "Dial Feature": pick(p.id, 6, ["Swarovski Crystal Embellishment","Stone-studded Bezel","Minimalist Clean Dial","Mother-of-Pearl Dial"]),
    Warranty: "1 Year Manufacturer Warranty",
  }),
  "womens-bags": (p, r) => ({
    Material: pick(p.id, 1, ["Premium Vegan Leather","Genuine Pebble Leather","Nylon Canvas","Quilted Leather","Satin"]),
    Dimensions: r.dimensions
      ? `${Math.round(r.dimensions.width)}W × ${Math.round(r.dimensions.height)}H × ${Math.round(r.dimensions.depth)}D cm`
      : pick(p.id, 2, ["30W × 22H × 12D cm","25W × 18H × 8D cm","15W × 20H × 5D cm","40W × 30H × 15D cm"]),
    "Hardware Colour": pick(p.id, 3, ["Gold-tone","Silver-tone","Gunmetal","Rose Gold"]),
    Closure: pick(p.id, 4, ["Zip Top","Magnetic Snap","Drawstring","Buckle Flap"]),
    Compartments: pick(p.id, 5, ["1 Main + 2 Inner Zip + Card Slots","1 Main + Laptop Sleeve + 3 Pockets","1 Main + 1 Zip Pocket"]),
    Strap: pick(p.id, 6, ["Detachable Shoulder Strap","Fixed Dual Handle","Adjustable Crossbody Strap","Chain Strap"]),
  }),
  "womens-jewellery": (p, r) => ({
    "Base Metal": pick(p.id, 1, ["Sterling Silver 925","18K Gold-plated Brass","Rose Gold-plated Copper","Stainless Steel"]),
    Stone: pick(p.id, 2, ["Cubic Zirconia","Freshwater Pearl","Natural Amethyst","Onyx","No Stone — Polished Metal"]),
    "Stone Colour": pick(p.id, 3, ["Clear White","Champagne","Blush Pink","Midnight Blue","Emerald Green"]),
    Clasp: pick(p.id, 4, ["Spring-ring Clasp","Lobster Clasp","Screw Back","Push Back","Toggle Clasp"]),
    Length: r.dimensions ? `${Math.round(r.dimensions.width)} cm` : pick(p.id, 5, ["42 cm","45 cm","38 cm","50 cm","18 cm"]),
    Finish: pick(p.id, 6, ["High Polish","Satin Matte","Antique Oxidised","Rhodium Plated"]),
  }),
  tops: (p) => ({
    Fabric: pick(p.id, 1, ["100% Viscose","Polyester-Spandex Blend","100% Cotton","Rayon Crepe","Linen Blend"]),
    Fit: pick(p.id, 2, ["Regular Fit","Relaxed Fit","Cropped","Oversized","Fitted"]),
    Neckline: pick(p.id, 3, ["V-neck","Round Neck","Square Neck","Off-shoulder","Boat Neck","Halter"]),
    Sleeve: pick(p.id, 4, ["Sleeveless","Short Sleeve","3/4 Sleeve","Puff Sleeve","Flutter Sleeve"]),
    Care: pick(p.id, 5, ["Machine Wash 30°C","Hand Wash Cold","Dry Clean Recommended"]),
    Sizes: "XS / S / M / L / XL / XXL",
    Weight: `${Math.round(150 + sr(p.id, 6) * 100)}g`,
  }),
};

// ── Pick helper — returns a value from an array based on seeded index ─────
function pick(id, offset, arr) {
  return arr[Math.floor(sr(id, offset) * arr.length)];
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching DummyJSON products…");
  const djRes = await fetch(
    "https://dummyjson.com/products?limit=200&select=id,title,description,category,price,discountPercentage,rating,stock,brand,thumbnail,images,ram,storage,battery,batteryCapacity,screenSize,processorBrand,processorModel,memoryType,memorySpeed,ssdCapacity,displaySize,capacity,weight,dimensions,warrantyInformation,shippingInformation,sku,tags,shadeRange"
  );
  const { products: raw } = await djRes.json();
  const filtered = raw.filter(p => DJ_CATEGORY_MAP[p.category]);
  console.log(`Fetched ${raw.length} total, ${filtered.length} after category filter`);

  const products = filtered.map(p => {
    const id = p.id;
    const cat = p.category;

    // Generate features and specs using category-specific templates
    const featFn = FEATURES[cat] || FEATURES["home-decoration"];
    const specFn = SPECS[cat] || SPECS["home-decoration"];
    const features = featFn(p, p);
    const specs = specFn(p, p);

    // Compute price fields (same as mapDJProduct)
    const priceINR = Math.round(p.price * 83);
    const disc = Math.min(80, Math.round(p.discountPercentage));
    const originalINR = Math.round(priceINR / Math.max(0.25, 1 - disc / 100));
    const isSuspiciousSeller = sr(id, 22) > 0.88;
    const trust = isSuspiciousSeller
      ? Math.max(22, Math.min(52, Math.round(18 + p.rating * 5 + sr(id, 1) * 10)))
      : Math.max(55, Math.min(96, Math.round(50 + p.rating * 8 + sr(id, 1) * 12)));
    const isFakeDisc = disc > 45 && sr(id, 2) > 0.5;

    const priceHistory = Array.from({ length: 12 }, (_, i) => {
      const spike = sr(id, i + 20) > 0.78;
      return spike ? Math.round(originalINR * (0.82 + sr(id, i + 30) * 0.35)) : priceINR;
    });
    priceHistory[11] = priceINR;
    const spikePriceMonths = priceHistory.map((price, i) => price > priceINR * 1.12 ? i : -1).filter(i => i >= 0);

    return {
      id: `dj${id}`,
      name: p.title,
      brand: p.brand || "Generic",
      category: DJ_CATEGORY_MAP[cat],
      price: priceINR,
      originalPrice: originalINR,
      discount: disc,
      rating: Math.round(p.rating * 10) / 10,
      reviewCount: Math.round(200 + sr(id, 3) * 75000),
      inStock: p.stock > 0,
      isPrime: sr(id, 4) > 0.3,
      delivery: sr(id, 5) > 0.5 ? "Get it by Tomorrow, 6 PM" : "Get it by Day after Tomorrow",
      deliveryFree: true,
      trustScore: trust,
      trustLabel: trust > 75 ? "Genuine" : trust >= 50 ? "Mixed" : "Suspicious",
      isFakeDiscount: isFakeDisc,
      fakeDiscountNote: isFakeDisc ? "High discount rate — listed MRP may be aspirational" : null,
      buyNowOrWait: sr(id, 6) > 0.55 ? "buy" : "wait",
      waitReason: sr(id, 6) <= 0.55 ? "Sale expected in the next 2 weeks based on historical patterns." : null,
      spikePriceMonths,
      priceHistory,
      thumbnail: p.thumbnail,
      images: [p.thumbnail, ...(p.images || []).slice(0, 2)],
      description: p.description || "",
      features,
      specs,
      witnesses: [],
      reviews: [],
      soldBy: p.brand || "Third-party Seller",
      soldByRating: isSuspiciousSeller
        ? parseFloat((2.0 + sr(id, 7) * 0.9).toFixed(1))
        : parseFloat((3.8 + sr(id, 7) * 1.2).toFixed(1)),
      sellerSince: isSuspiciousSeller
        ? String(2021 + Math.floor(sr(id, 8) * 4))
        : String(2010 + Math.floor(sr(id, 8) * 12)),
      fulfillment: isSuspiciousSeller ? "Seller fulfilled" : (sr(id, 9) > 0.4 ? "Fulfilled by Amazon" : "Seller fulfilled"),
      trustBreakdown: {
        reviewAuthenticity: { score: Math.max(14, Math.min(96, trust + Math.round((sr(id, 11) - 0.5) * 28))), detail: null },
        returnRate:         { score: Math.max(14, Math.min(96, trust + Math.round((sr(id, 12) - 0.5) * 22))), detail: null },
        warrantyClaims:     { score: Math.max(14, Math.min(96, trust + Math.round((sr(id, 13) - 0.5) * 18))), detail: null },
        sellerReliability:  { score: Math.max(14, Math.min(96, trust + 8 + Math.round((sr(id, 14) - 0.5) * 16))), detail: null },
        priceStability:     { score: Math.max(14, Math.min(96, (isFakeDisc ? trust - 28 : trust) + Math.round((sr(id, 15) - 0.5) * 22))), detail: null },
      },
    };
  });

  console.log(`Generated ${products.length} products`);

  // Write as ES module
  const code = `// AUTO-GENERATED — do not edit by hand. Re-run scripts/generateDJProducts.mjs to regenerate.
// DummyJSON products migrated to static data with enriched features and specs.
// Total: ${products.length} products

export const djProducts = ${JSON.stringify(products, null, 2)};
`;

  writeFileSync("server/data/djProducts.js", code, "utf-8");
  console.log(`Written server/data/djProducts.js (${Math.round(Buffer.byteLength(code, "utf-8") / 1024)} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
