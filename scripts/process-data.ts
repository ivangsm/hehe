import fs from 'node:fs';
import path from 'node:path';
import jsesc from 'jsesc';

const DATA_DIR = path.resolve(import.meta.dirname, '../data');
const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'entities.json'), 'utf8'));

const encodeMap: Record<string, string> = {};
let encodeMultipleSymbols: string[] = [];
let encodeSingleCodePoints: number[] = [];
const decodeMap: Record<string, string> = {};
const decodeMapLegacy: Record<string, string> = {};

for (const [key, value] of Object.entries(data)) {
	const referenceWithLeadingAmpersand = key;
	const referenceWithoutLeadingAmpersand = referenceWithLeadingAmpersand.replace(/^&/, '');
	const referenceOnly = referenceWithoutLeadingAmpersand.replace(/;$/, '');
	const characters = (value as any).characters;
	const codePoints = (value as any).codepoints;

	if (referenceWithoutLeadingAmpersand.endsWith(';')) {
		const existing = encodeMap[characters];
		if (
			!existing ||
			existing.length > referenceOnly.length ||
			(existing.length === referenceOnly.length &&
				(referenceOnly.match(/[A-Z]/g) || []).length < (existing.match(/[A-Z]/g) || []).length)
		) {
			encodeMap[characters] = referenceOnly;
		}

		if (codePoints.length === 1) {
			encodeSingleCodePoints.push(codePoints[0]);
		} else {
			encodeMultipleSymbols.push(characters);
		}
	}

	if (referenceWithoutLeadingAmpersand.endsWith(';')) {
		decodeMap[referenceWithoutLeadingAmpersand.replace(/;$/, '')] = characters;
	} else {
		decodeMapLegacy[referenceWithoutLeadingAmpersand] = characters;
	}
}

encodeMultipleSymbols = [...new Set(encodeMultipleSymbols)].sort();
encodeSingleCodePoints = [...new Set(encodeSingleCodePoints)].sort((a, b) => a - b);

const legacyReferences = Object.keys(decodeMapLegacy).sort((a, b) => {
	if (a.length !== b.length) return b.length - a.length;
	return a < b ? -1 : a > b ? 1 : 0;
});

const sortObject = (obj: Record<string, any>) => {
	return Object.keys(obj)
		.sort()
		.reduce((result: Record<string, any>, key) => {
			result[key] = obj[key];
			return result;
		}, {});
};

const writeJSON = (fileName: string, object: any) => {
	const json = jsesc(object, {
		compact: false,
		json: true,
	});
	fs.writeFileSync(path.join(DATA_DIR, fileName), json + '\n');
};

writeJSON('decode-map.json', sortObject(decodeMap));
writeJSON('decode-map-legacy.json', sortObject(decodeMapLegacy));
writeJSON('decode-legacy-named-references.json', legacyReferences);
writeJSON('encode-map.json', sortObject(encodeMap));
writeJSON('encode-paired-symbols.json', encodeMultipleSymbols);
writeJSON('encode-lone-code-points.json', encodeSingleCodePoints);

console.log('Data processing complete.');
