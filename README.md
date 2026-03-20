# hehe 🚀

An ultra-lite, **100% WHATWG-compliant** HTML entity encoder/decoder. Rewritten in TypeScript. Optimized for maximum performance and minimal footprint.

Formerly known as `he`, **hehe** has been completely modernized and ultra-optimized to break size and performance barriers while maintaining perfect compliance with the HTML specification.

## ✨ Key Improvements over `he`

| Feature | `he` (Original) | **hehe** (New) | Improvement |
|:---|:---:|:---:|:---:|
| **Bundle Size (ESM)** | ~124 KB (unpacked) | **36.97 KB** | **~70% smaller** |
| **Performance** | 225.85ms | **65.89ms** | **3.4x faster!** |
| **Language** | JavaScript (ES5) | **TypeScript** | Type-safe & Modern |
| **Data Architecture** | Large JSON Maps | **Packed Strings** | High Density |
| **Regex Engine** | Literal Strings | **Trie-Compressed** | Faster Matching |
| **Startup** | Static | **Dynamic (4ms)** | Ultra-Lite Payload |
| **Runtime** | Node.js | **Bun / Node.js** | Native Performance |

---

## 🛠 Installation

```bash
# Using Bun (Recommended)
bun add hehe

# Using NPM
npm install hehe
```

## 📖 Usage

### Encoding

```typescript
import hehe from 'hehe';

// Basic encoding
hehe.encode('foo © bar');
// → 'foo &#xA9; bar'

// Use named references
hehe.encode('foo © bar', { useNamedReferences: true });
// → 'foo &copy; bar'

// Encode everything
hehe.encode('a', { encodeEverything: true });
// → '&#x61;'
```

### Decoding

```typescript
import { decode } from 'hehe';

// Standard decoding
decode('foo &copy; bar');
// → 'foo © bar'

// Strict mode
decode('&#xZ', { strict: true });
// → Parse error!
```

### Escaping (Security first)

```typescript
import { escape } from 'hehe';

escape('<img src="x" onerror="prompt(1)">');
// → '&lt;img src=&quot;x&quot; onerror=&quot;prompt(&#x60;1&#x60;)&quot;&gt;'
```

---

## 🚀 Why hehe?

`hehe` uses advanced computer science techniques to provide the smallest possible bundle without sacrificing compliance:

1.  **Trie-based Regex Compression**: We compress 2,000+ entity patterns into a prefix-tree (Trie) to generate a high-efficiency matching regex.
2.  **Packed Strings**: We store entity data in high-density strings with non-printable delimiters, eliminating JSON overhead.
3.  **Dynamic Map Generation**: We generate lookup maps at runtime during module initialization, keeping the wire size tiny.

## ⚖️ License

MIT License. Developed by **Iván Salazar** ([hi@ivansalazar.dev](mailto:hi@ivansalazar.dev)).
Inspired by the original `he` by Mathias Bynens.
