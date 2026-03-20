import { encode as heheEncode, decode as heheDecode } from '../src/index.js';
import * as entities from 'entities';
import * as htmlEntities from 'html-entities';

const testString = 'The quick brown fox jumps over the lazy dog. © & 𝔄 < > " \'';
const iterations = 50000;

function benchmark(name, fn) {
	const start = performance.now();
	for (let i = 0; i < iterations; i++) {
		fn();
	}
	const end = performance.now();
	return end - start;
}

console.log(`🚀 Benchmarking HTML Entities (${iterations.toLocaleString()} iterations)`);
console.log('-----------------------------------------------------------');

const results = [
	{
		name: 'hehe (Ultra-Lite)',
		encode: benchmark('hehe Encode', () => heheEncode(testString, { useNamedReferences: true })),
		decode: benchmark('hehe Decode', () => heheDecode('&copy; &#x1D306; &amp;')),
	},
	{
		name: 'entities (Standard)',
		encode: benchmark('entities Encode', () => entities.encodeHTML(testString)),
		decode: benchmark('entities Decode', () => entities.decodeHTML('&copy; &#x1D306; &amp;')),
	},
	{
		name: 'html-entities (Robust)',
		encode: benchmark('html-entities Encode', () => htmlEntities.encode(testString)),
		decode: benchmark('html-entities Decode', () => htmlEntities.decode('&copy; &#x1D306; &amp;')),
	}
];

console.table(results.map(r => ({
	Library: r.name,
	'Encode (ms)': r.encode.toFixed(2),
	'Decode (ms)': r.decode.toFixed(2),
	'Total (ms)': (r.encode + r.decode).toFixed(2)
})));

console.log('\n📊 Conclusion:');
const best = results.sort((a,b) => (a.encode + a.decode) - (b.encode + b.decode))[0];
console.log(`The fastest library for this payload is: ${best.name}`);
