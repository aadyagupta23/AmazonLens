export function customizeBundle(bundleProducts, prompt, products = []) {
  const lower = prompt.toLowerCase();

  let updated = [...bundleProducts];

  const findBestMatch = (keywords) => {
    return products.find((product) =>
      keywords.some((keyword) =>
        product.name.toLowerCase().includes(keyword)
      )
    );
  };

  if (
    lower.includes("gaming mouse") ||
    lower.includes("better mouse")
  ) {
    const replacement = findBestMatch([
      "mouse",
      "gaming",
    ]);

    updated = updated.map((p) =>
      p.name.toLowerCase().includes("mouse")
        ? replacement || p
        : p
    );
  }

  if (
    lower.includes("wireless keyboard") ||
    lower.includes("keyboard")
  ) {
    const replacement = findBestMatch([
      "keyboard",
    ]);

    updated.push(replacement);
  }

  if (
    lower.includes("better monitor") ||
    lower.includes("gaming monitor")
  ) {
    const replacement = findBestMatch([
      "monitor",
    ]);

    updated = updated.map((p) =>
      p.name.toLowerCase().includes("monitor")
        ? replacement || p
        : p
    );
  }

  if (
    lower.includes("better chair") ||
    lower.includes("ergonomic chair")
  ) {
    const replacement = findBestMatch([
      "chair",
    ]);

    updated = updated.map((p) =>
      p.name.toLowerCase().includes("chair")
        ? replacement || p
        : p
    );
  }

  return updated;
}
