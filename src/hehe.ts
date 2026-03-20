import * as data from './data.js';

const unpackMap = (packed: string) => {
	const map: Record<string, string> = {};
	if (!packed) return map;
	for (const item of packed.split('\x02')) {
		const [k, v] = item.split('\x01');
		map[k] = v;
	}
	return map;
};

export const decodeMap = unpackMap(data.decodeData);
export const decodeMapLegacy = unpackMap(data.decodeDataLegacy);
export const decodeMapOverrides = unpackMap(data.decodeDataOverrides);
export const invalidCodePoints = data.invalidCodePoints.split(',').map(Number);

class TrieNode {
	children: Map<string, TrieNode> = new Map();
	isEndOfWord: boolean = false;
}

function buildTrie(words: string[]): TrieNode {
	const root = new TrieNode();
	for (const word of words) {
		let current = root;
		for (const char of word) {
			if (!current.children.has(char)) {
				current.children.set(char, new TrieNode());
			}
			current = current.children.get(char)!;
		}
		current.isEndOfWord = true;
	}
	return root;
}

function trieToRegex(node: TrieNode): string {
	if (node.children.size === 0) return '';
	const parts: string[] = [];
	const sortedChildren = Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	for (const [char, child] of sortedChildren) {
		const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const suffix = trieToRegex(child);
		parts.push(escapedChar + suffix);
	}
	let result: string;
	if (parts.length === 1) {
		result = parts[0];
	} else {
		result = `(?:${parts.join('|')})`;
	}
	return node.isEndOfWord ? `(?:${result})?` : result;
}

const namedReferences = Object.keys(decodeMap).sort((a, b) => b.length - a.length);
const legacyReferences = Object.keys(decodeMapLegacy).sort((a, b) => b.length - a.length);

const regexNamedReferenceSource = `&(${trieToRegex(buildTrie(namedReferences))});`;
const regexLegacyReferenceSource = `&(${trieToRegex(buildTrie(legacyReferences))})`;

const encodeMap: Record<string, string> = {};
for (const [key, val] of Object.entries(decodeMap)) {
	const current = encodeMap[val];
	if (
		!current ||
		key.length < current.length ||
		(key.length === current.length && (key.match(/[A-Z]/g) || []).length < (current.match(/[A-Z]/g) || []).length)
	) {
		encodeMap[val] = key;
	}
}

export interface EncodeOptions {
	allowUnsafeSymbols?: boolean;
	encodeEverything?: boolean;
	strict?: boolean;
	useNamedReferences?: boolean;
	decimal?: boolean;
}

export interface DecodeOptions {
	isAttributeValue?: boolean;
	strict?: boolean;
}

const parseError = (message: string) => {
	throw new Error(`Parse error: ${message}`);
};

const has = (object: object, propertyName: string) => {
	return Object.prototype.hasOwnProperty.call(object, propertyName);
};

const codePointToSymbol = (codePoint: number, strict?: boolean) => {
	if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
		if (strict) {
			parseError('character reference outside the permissible Unicode range');
		}
		return '\uFFFD';
	}
	if (decodeMapOverrides[String(codePoint)]) {
		if (strict) {
			parseError('disallowed character reference');
		}
		return (decodeMapOverrides as any)[codePoint];
	}
	if (strict && invalidCodePoints.includes(codePoint)) {
		parseError('disallowed character reference');
	}
	return String.fromCodePoint(codePoint);
};

const hexEscape = (codePoint: number) => {
	return `&#x${codePoint.toString(16).toUpperCase()};`;
};

const decEscape = (codePoint: number) => {
	return `&#${codePoint};`;
};

export const encode = (string: string, options?: EncodeOptions) => {
	const opts = { ...encode.options, ...options };
	if (opts.strict && data.regexInvalidRawCodePoints.test(string)) {
		parseError('forbidden code point');
	}

	const escapeCodePoint = (codePoint: number) => {
		return opts.decimal ? `&#${codePoint};` : `&#x${codePoint.toString(16).toUpperCase()};`;
	};

	const escapeBmpSymbol = (symbol: string) => {
		return escapeCodePoint(symbol.charCodeAt(0));
	};

	let result = string;

	if (opts.encodeEverything) {
		result = result.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g, (symbol) => {
			if (symbol.length > 1) {
				const high = symbol.charCodeAt(0);
				const low = symbol.charCodeAt(1);
				const codePoint = (high - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000;
				return escapeCodePoint(codePoint);
			}
			const res = opts.useNamedReferences ? (encodeMap as any)[symbol] : null;
			return res ? `&${res};` : escapeBmpSymbol(symbol);
		});
	} else {
		if (opts.useNamedReferences) {
			result = result
				.replace(/&gt;\u20D2/g, '&nvgt;')
				.replace(/&lt;\u20D2/g, '&nvlt;');
		}

		result = result.replace(data.regexEncodeNonAscii, (symbol) => {
			if (opts.useNamedReferences) {
				const res = (encodeMap as any)[symbol];
				if (res) return `&${res};`;
			}

			if (opts.allowUnsafeSymbols && /["&'<>`]/.test(symbol)) {
				return symbol;
			}

			return escapeBmpSymbol(symbol);
		});
	}

	return result.replace(data.regexAstralSymbol, ($0) => {
		const high = $0.charCodeAt(0);
		const low = $0.charCodeAt(1);
		const codePoint = (high - 0xD800) * 0x400 + (low - 0xDC00) + 0x10000;
		return escapeCodePoint(codePoint);
	}).replace(data.regexBmpWhitelist, escapeBmpSymbol);
};

encode.options = {
	allowUnsafeSymbols: false,
	encodeEverything: false,
	strict: false,
	useNamedReferences: false,
	decimal: false,
};

export const decode = (html: string, options?: DecodeOptions) => {
	const opts = { ...decode.options, ...options };
	if (opts.strict && /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/.test(html)) {
		parseError('malformed character reference');
	}

	const regexDecode = new RegExp(`${regexNamedReferenceSource}|${data.regexDecimalEscapeSource}|${data.regexHexadecimalEscapeSource}|${regexLegacyReferenceSource}|${data.regexAmbiguousAmpersandSource}`, 'g');
	return html.replace(regexDecode, ($0, $1, $2, $3, $4, $5, $6, $7, offset, string) => {
		if ($1) {
			return (decodeMap as any)[$1];
		}

		if ($2) {
			const decDigits = $2;
			const semicolon = $3;
			if (opts.strict && !semicolon) {
				parseError('character reference was not terminated by a semicolon');
			}
			return codePointToSymbol(parseInt(decDigits, 10), opts.strict);
		}

		if ($4) {
			const hexDigits = $4;
			const semicolon = $5;
			if (opts.strict && !semicolon) {
				parseError('character reference was not terminated by a semicolon');
			}
			return codePointToSymbol(parseInt(hexDigits, 16), opts.strict);
		}

		if ($6) {
			const reference = $6;
			const next = string[offset + $0.length];
			if (opts.isAttributeValue) {
				if (next === '=') {
					if (opts.strict) {
						parseError('`&` did not start a character reference');
					}
					return $0;
				}
				if (next && /[a-zA-Z0-9]/.test(next)) {
					return $0;
				}
			}
			if (opts.strict) {
				parseError('named character reference was not terminated by a semicolon');
			}
			return (decodeMapLegacy as any)[reference];
		}

		if ($7) {
			if (opts.strict) {
				parseError('named character reference was not terminated by a semicolon');
			}
			return $0;
		}

		return $0;
	});
};

decode.options = {
	isAttributeValue: false,
	strict: false,
};

export const escape = (string: string) => {
	return string.replace(/["&'<>`]/g, (symbol) => {
		const escapeMap: Record<string, string> = {
			'"': '&quot;',
			'&': '&amp;',
			'\'': '&#x27;',
			'<': '&lt;',
			'>': '&gt;',
			'`': '&#x60;',
		};
		return escapeMap[symbol];
	});
};

export const unescape = decode;
export const version = data.version;
