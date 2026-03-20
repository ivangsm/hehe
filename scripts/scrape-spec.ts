import { JSDOM } from 'jsdom';
import jsesc from 'jsesc';
import fs from 'node:fs';
import path from 'node:path';

const SPEC_URL = 'https://html.spec.whatwg.org/';
const DATA_DIR = path.resolve(import.meta.dirname, '../data');

async function scrape() {
	console.log(`Fetching spec from ${SPEC_URL}...`);
	const response = await fetch(SPEC_URL);
	const html = await response.text();
	const dom = new JSDOM(html);
	const document = dom.window.document;

	function codePointToSymbol(codePoint: number) {
		return String.fromCodePoint(codePoint);
	}

	const range = (start: number, stop: number) => {
		const result = [];
		for (let i = start; i <= stop; i++) {
			result.push(i);
		}
		return result;
	};

	// Code points that cause parse errors when used in character references
	const table = document.querySelector('#table-charref-overrides');
	if (!table) throw new Error('Could not find #table-charref-overrides');

	const siblings = Array.from(table.parentElement!.children);
	const text = siblings[siblings.length - 1].textContent || '';
	
	let charRefCodePoints: number[] = [];
	text.replace(/0x([a-fA-F0-9]+)\s+to\s+0x([a-fA-F0-9]+)/g, (_, start, end) => {
		charRefCodePoints = charRefCodePoints.concat(range(parseInt(start, 16), parseInt(end, 16)));
		return '';
	}).replace(/0x([a-fA-F0-9]+)/g, (_, codePoint) => {
		charRefCodePoints.push(parseInt(codePoint, 16));
		return '';
	});

	charRefCodePoints.sort((a, b) => a - b);

	// Character reference overrides
	const cells = table.querySelectorAll('td');
	const keys: number[] = [];
	const values: string[] = [];

	cells.forEach((cell, index) => {
		if (index % 3 === 0) {
			keys.push(Number(cell.textContent?.trim()));
		} else if (index % 3 === 1) {
			const hex = cell.textContent?.trim().replace('U+', '') || '0';
			values.push(codePointToSymbol(parseInt(hex, 16)));
		}
	});

	const overrides: Record<number, string> = {};
	keys.forEach((codePoint, index) => {
		const symbol = codePointToSymbol(codePoint);
		const correspondingValue = values[index];
		const mapsToItself = symbol === correspondingValue;
		const alreadyMarkedAsInvalid = charRefCodePoints.includes(codePoint);
		
		if (mapsToItself && !alreadyMarkedAsInvalid) {
			charRefCodePoints.push(codePoint);
		} else if (!mapsToItself || !alreadyMarkedAsInvalid) {
			overrides[codePoint] = correspondingValue;
		}
	});

	// Code points for symbols that cause parse errors when in the HTML source
	const header = document.querySelector('#preprocessing-the-input-stream');
	let element = header;
	let preprocessingText = '';
	while (element && (element = element.nextSibling as Element)) {
		const textContent = element.textContent?.trim() || '';
		if (/Any occurrences of any characters in the ranges/.test(textContent)) {
			preprocessingText = textContent;
			break;
		}
	}

	let rawCodePoints: number[] = [];
	preprocessingText.replace(/U\+([a-fA-F0-9]+)\s+to\s+U\+([a-fA-F0-9]+)/g, (_, start, end) => {
		rawCodePoints = rawCodePoints.concat(range(parseInt(start, 16), parseInt(end, 16)));
		return '';
	}).replace(/U\+([a-fA-F0-9]+)/g, (_, codePoint) => {
		rawCodePoints.push(parseInt(codePoint, 16));
		return '';
	});

	rawCodePoints.sort((a, b) => a - b);
	rawCodePoints.unshift(0x0000);

	const writeJSON = (fileName: string, data: any) => {
		const contents = jsesc(data, {
			json: true,
			compact: false,
		});
		fs.writeFileSync(path.join(DATA_DIR, fileName), contents + '\n');
		console.log(`${fileName} created successfully.`);
	};

	writeJSON('decode-map-overrides.json', overrides);
	writeJSON('decode-code-points-overrides.json', Object.keys(overrides).map(Number));
	writeJSON('invalid-character-reference-code-points.json', charRefCodePoints);
	writeJSON('invalid-raw-code-points.json', rawCodePoints);
}

scrape().catch(console.error);
