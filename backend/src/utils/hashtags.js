// Extracts unique, lowercased hashtags (without the #) from a block of text.
function extractHashtags(text) {
  const matches = text.match(/#[a-zA-Z0-9_]{1,60}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

module.exports = { extractHashtags };
