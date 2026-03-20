# @ivangsm0/hehe 🚀

An ultra-lite, **100% WHATWG-compliant** HTML entity encoder/decoder. Rewritten in TypeScript. Optimized for maximum performance and minimal footprint.

Formerly known as `he`, **@ivangsm0/hehe** has been completely modernized and ultra-optimized to break size and performance barriers while maintaining perfect compliance with the HTML specification.

## ✨ Key Improvements over `he`

| Metric | `he` v1.2.0 | **@ivangsm0/hehe** | Improvement |
|:---|:---:|:---:|:---:|
| **Minified Bundle (ESM)** | ~55 KB* | **36.48 KB** | **~35% smaller** |
| **Unpacked Package Size** | 124.1 KB | **84.7 KB** | **32% smaller** |
| **Download Size (Packed)** | 40.3 KB | **31.3 KB** | **22% smaller** |
| **Execution Performance** | 225.8 ms | **65.9 ms** | **3.4x faster** |
| **Language** | JavaScript (ES5) | **TypeScript** | Type-safe |

*\*Estimated minified size based on original source.*

---

## 🛠 Installation

```bash
# Using Bun (Recommended)
bun add @ivangsm0/hehe

# Using NPM
npm install @ivangsm0/hehe
```

## 📖 Usage

### Encoding

```typescript
import hehe from '@ivangsm0/hehe';

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
import { decode } from '@ivangsm0/hehe';

// Standard decoding
decode('foo &copy; bar');
// → 'foo © bar'

// Strict mode
decode('&#xZ', { strict: true });
// → Parse error!
```

### Escaping (Security first)

```typescript
import { escape } from '@ivangsm0/hehe';

escape('<img src="x" onerror="prompt(1)">');
// → '&lt;img src=&quot;x&quot; onerror=&quot;prompt(&#x60;1&#x60;)&quot;&gt;'
```

---

## 🚀 Why hehe?

`@ivangsm0/hehe` uses advanced computer science techniques to provide the smallest possible bundle without sacrificing compliance:

1.  **Trie-based Regex Compression**: We compress 2,000+ entity patterns into a prefix-tree (Trie) to generate a high-efficiency matching regex.
2.  **Packed Strings**: We store entity data in high-density strings with non-printable delimiters, eliminating JSON overhead.
3.  **Dynamic Map Generation**: We generate lookup maps at runtime during module initialization, keeping the wire size tiny.

## ⚖️ License

MIT License. Developed by **Iván Salazar** ([hi@ivansalazar.dev](mailto:hi@ivansalazar.dev)).
Inspired by the original `he` by Mathias Bynens.
