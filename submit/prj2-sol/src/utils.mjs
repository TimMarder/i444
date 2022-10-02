export function namePrefixes(name) {
  const prefixes = name.split(/\s+/)
	.reduce((acc, w) => acc.concat(wordPrefixes(w)), []);
  return prefixes;
}

function wordPrefixes(word) {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  return Array.from({ length: cleanWord.length })
    .map((_, i) => cleanWord.slice(0, i + 1));
}


