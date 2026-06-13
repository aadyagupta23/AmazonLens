// Deterministic review generator — same product ID always produces the same reviews.
// Uses a seeded sine-based PRNG so there are no Date.now() or Math.random() calls.

function sr(seed, offset = 0) {
  const x = Math.sin(seed * 9301 + offset * 49297 + 233) * 1e6;
  return x - Math.floor(x);
}

function strSeed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = Math.imul((h << 5) - h, 1) ^ str.charCodeAt(i);
  return Math.abs(h) % 1000000;
}

function pick(arr, seed, offset) {
  return arr[Math.floor(sr(seed, offset) * arr.length)];
}

// ── Reviewer name pool ─────────────────────────────────────────────────────
const NAMES = [
  ["Rahul", "K", "del"], ["Priya", "S", "mum"], ["Arjun", "M", "blr"],
  ["Sneha", "P", "hyd"], ["Vikram", "N", "chn"], ["Divya", "R", "pun"],
  ["Sanjay", "V", "del"], ["Kavya", "T", "blr"], ["Rohit", "A", "mum"],
  ["Ananya", "G", "kol"], ["Kiran", "B", "hyd"], ["Meera", "J", "chn"],
  ["Aditya", "S", "ahm"], ["Pooja", "M", "del"], ["Nikhil", "C", "blr"],
  ["Sunita", "D", "mum"], ["Gaurav", "H", "pun"], ["Riya", "K", "hyd"],
  ["Manish", "L", "chn"], ["Deepa", "N", "kol"], ["Akash", "V", "del"],
  ["Nandita", "R", "blr"], ["Siddharth", "P", "mum"], ["Lata", "S", "ahm"],
  ["Kunal", "G", "pun"], ["Vandana", "M", "hyd"], ["Abhishek", "C", "chn"],
  ["Tanya", "B", "blr"], ["Vivek", "A", "del"], ["Sonal", "D", "mum"],
  ["Harish", "K", "kol"], ["Uma", "V", "pun"], ["Piyush", "S", "ahm"],
  ["Rekha", "N", "chn"], ["Aarav", "H", "blr"], ["Geeta", "T", "del"],
];

function reviewerHandle(seed, idx) {
  const [first, last, city] = pick(NAMES, seed, idx);
  return `${first.toLowerCase()}_${last.toLowerCase()}${idx}_${city}`;
}

// ── Review templates by sentiment ─────────────────────────────────────────

const POSITIVE = [
  {
    title: "Excellent product, highly recommend",
    body: "Really happy with this purchase. Works exactly as described and the build quality is impressive. Delivery was fast and the packaging was secure. Would buy again without hesitation."
  },
  {
    title: "Great value for money",
    body: "Purchased this after reading multiple reviews and it completely lived up to expectations. Performance is excellent for the price and setup was straightforward. Very satisfied."
  },
  {
    title: "Solid product, no complaints",
    body: "Been using this for about 2 months now and it has been completely reliable. Does exactly what it promises. The quality feels premium and the after-sales support from the seller has been responsive."
  },
  {
    title: "Impressive quality at this price point",
    body: "Did not expect this level of quality at this price. Build is sturdy, looks premium, and performs consistently. Fast delivery from Amazon. Highly recommended to anyone considering this."
  },
  {
    title: "Very happy with this purchase",
    body: "This is my second time buying from this brand and it has not disappointed. Consistent quality across both purchases. Customer support was also helpful when I had a query about the warranty."
  },
  {
    title: "Exactly as described",
    body: "The product arrived exactly as shown in the listing photos. No surprises. Quality is exactly as expected and the packaging was neat and secure. Would recommend this seller to others."
  },
  {
    title: "Perfect for daily use",
    body: "Using this every day for the past 3 months and it has held up really well. The design is practical and the build feels durable. No performance issues. Worth every rupee at this price."
  },
  {
    title: "Good product, prompt delivery",
    body: "The product works as expected. Amazon's prime delivery was very fast — received it the next day. The item was well-packaged and in perfect condition. Happy with the purchase overall."
  },
  {
    title: "Five stars — no hesitation",
    body: "I researched this product for weeks before buying and it turned out to be the right choice. Quality is consistent with the brand's reputation. The seller has been reliable and the item was genuine."
  },
  {
    title: "Genuinely good product",
    body: "Not just hype — this product delivers on its promises. Performance is consistent, build quality is solid, and it has been trouble-free since day one. Will definitely recommend to my contacts."
  },
];

const MIXED = [
  {
    title: "Good product but minor issues",
    body: "Overall I am satisfied with the product but there are a few minor issues — the finish could be better and some features feel slightly rushed. For the price, it is still good value. Customer service was helpful when I raised a complaint."
  },
  {
    title: "Decent product, not exceptional",
    body: "Does what it says on the box, nothing more. Quality is average for the price range. There are better options available at a similar price point but this one gets the job done. Delivery was on time."
  },
  {
    title: "Average experience",
    body: "The product itself is okay but the experience could be better. Had to contact seller support for a minor issue which took 4 days to resolve. Not bad, not great. Would say it is just about worth the price."
  },
  {
    title: "Works fine, some corners cut",
    body: "Performance is fine for everyday use but it is clear that some cost-cutting decisions were made in the build. Plastic parts feel a bit flimsy. Still, for this price point it is serviceable. Delivery was prompt."
  },
];

const SUSPICIOUS = [
  {
    title: "AMAZING PRODUCT BEST BUY DON'T MISS",
    body: "AMAZING PRODUCT SUPERB QUALITY BEST IN CLASS BUY NOW DON'T MISS EXCELLENT VALUE TOP NOTCH QUALITY HIGHLY RECOMMEND",
    suspicious: true,
    suspiciousReason: "All-caps repetitive phrasing, 0-day account — bot pattern detected"
  },
  {
    title: "BEST PRODUCT EVER 5 STARS MUST BUY",
    body: "BEST PRODUCT EVER SUPERB QUALITY MUST BUY BEST PRICE GREAT VALUE HIGHLY RECOMMEND DON'T THINK TWICE",
    suspicious: true,
    suspiciousReason: "All-caps text, coordinated burst — posted within 2h of 3 other identical-pattern reviews"
  },
  {
    title: "Superb Quality Excellent Product",
    body: "Superb quality excellent product very good material fast delivery good packaging best seller recommend to all friends family everyone must buy 5 star product",
    suspicious: true,
    suspiciousReason: "Repetitive keyword stuffing, unverified account with no purchase history"
  },
  {
    title: "SUPERB PRODUCT 10/10 BUY NOW",
    body: "SUPERB PRODUCT 10/10 BUY NOW AMAZING QUALITY GREAT PACKAGING FAST DELIVERY BEST PRICE BEST SELLER BEST PRODUCT",
    suspicious: true,
    suspiciousReason: "All-caps pattern, account created same day as review — synthetic review signal"
  },
];

const DEFECT = [
  {
    title: "Stopped working after 3 weeks",
    body: "The product stopped working completely after just 3 weeks of normal use. Tried to claim warranty but the process was slow and frustrating. Had to follow up multiple times. Poor quality control for this price range.",
    verified: true
  },
  {
    title: "Defective unit — right side dead on arrival",
    body: "Received a defective unit. One part was completely dead on arrival. Amazon's return process was smooth but I had to wait 10 days for a replacement. Suggests quality consistency issues at the factory level.",
    verified: true
  },
  {
    title: "Warranty claim was a nightmare",
    body: "The product developed a malfunction within 2 months. The warranty claim process took over 3 weeks. Multiple follow-ups required. The product itself is not bad but the after-sales support is poor.",
    verified: true
  },
];

const RETURN = [
  {
    title: "Returned — product not as described",
    body: "The product did not match the listing description. The colour was different and some features shown in photos were absent. I returned the item. Amazon's return process was easy but the listing is misleading.",
    verified: true
  },
  {
    title: "Had to return — quality below expectations",
    body: "Returned after 3 days as the quality was well below what I expected from the photos and description. Not as described. The seller should update the listing to be more accurate.",
    verified: true
  },
];

// ── Review date generator (recent, deterministic) ─────────────────────────
const DATE_OFFSETS = [15, 32, 48, 67, 82, 103, 118, 145, 167, 190];
function reviewDate(seed, idx) {
  const offsetDays = DATE_OFFSETS[idx % DATE_OFFSETS.length] + Math.floor(sr(seed, idx + 100) * 30);
  const d = new Date(2025, 10, 1); // base: Nov 2025
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── Main generator ─────────────────────────────────────────────────────────

export function generateReviews(product, targetCount = 10) {
  const existing = product.reviews || [];
  const needed = Math.max(0, targetCount - existing.length);
  if (needed === 0) return existing;

  const seed = strSeed(product.id);
  const trustScore = product.trustScore || 75;

  // Determine review mix based on trust tier
  let suspiciousQuota, defectQuota, returnQuota;
  if (trustScore > 75) {
    suspiciousQuota = 0; defectQuota = 0; returnQuota = 0;
  } else if (trustScore >= 60) {
    suspiciousQuota = 1; defectQuota = 1; returnQuota = 1;
  } else if (trustScore >= 50) {
    suspiciousQuota = 2; defectQuota = 1; returnQuota = 1;
  } else {
    suspiciousQuota = 3; defectQuota = 2; returnQuota = 1;
  }

  const generated = [];
  let suspAdded = 0, defAdded = 0, retAdded = 0;
  let posIdx = 0;

  for (let i = 0; i < needed; i++) {
    const slot = i + existing.length;
    const rng = sr(seed, i + 50);

    let template;
    let isSusp = false, isVerified = true;

    if (suspAdded < suspiciousQuota && rng < 0.35) {
      template = pick(SUSPICIOUS, seed, i + 200);
      isSusp = true;
      isVerified = false;
      suspAdded++;
    } else if (defAdded < defectQuota && rng > 0.75 && rng < 0.90) {
      template = pick(DEFECT, seed, i + 300);
      defAdded++;
    } else if (retAdded < returnQuota && rng > 0.90) {
      template = pick(RETURN, seed, i + 400);
      retAdded++;
    } else {
      const usePos = POSITIVE.concat(sr(seed, i + 600) > 0.5 ? MIXED : []);
      template = usePos[posIdx % usePos.length];
      posIdx++;
    }

    const helpful = isSusp ? 0 : Math.floor(sr(seed, i + 700) * 200 + 5);
    const rating = isSusp ? 5 : (template.verified ? Math.max(2, Math.round(2 + sr(seed, i + 800) * 3)) : Math.round(3 + sr(seed, i + 800) * 2));

    generated.push({
      id: `${product.id}_gr${slot}`,
      author: reviewerHandle(seed, i + existing.length),
      rating,
      title: template.title,
      body: template.body,
      date: reviewDate(seed, slot),
      helpful,
      verified: isVerified,
      suspicious: !!template.suspicious,
      ...(template.suspicious ? { suspiciousReason: template.suspiciousReason } : {}),
    });
  }

  return [...existing, ...generated];
}
