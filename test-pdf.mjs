
import * as fs from 'fs';
import { createRequire } from 'module';

async function testPdfParse() {
  console.log('Testing pdf-parse import...');

  try {
    const pdfModule = await import('pdf-parse');
    const PDFParse = pdfModule.PDFParse;
    // Check if it's the class directly or default
    const Target = PDFParse || pdfModule.default || pdfModule;

    console.log('Target type:', typeof Target);

    // Mock buffer
    const buffer = Buffer.from('test pdf content'); // This won't validly parse but will test invocation

    // Test invocation without new
    try {
        console.log('Attempting Target(buffer)...');
        await Target(buffer);
        console.log('Target(buffer) success (promise returned)');
    } catch (e) {
        console.log('Target(buffer) failed:', e.message);
    }

    // Test invocation with new
    try {
        console.log('Attempting new Target(buffer)...');
        const instance = new Target(buffer);
        console.log('new Target(buffer) success');
        console.log('Instance keys:', Object.keys(instance));
        console.log('Instance toString:', instance.toString());
        // Check for common properties
        if (instance.text) console.log('Has .text property');
        if (typeof instance.parse === 'function') console.log('Has .parse() method');
        if (instance instanceof Promise) console.log('Instance IS a Promise (unlikely for class)');
    } catch (e) {
        console.log('new Target(buffer) failed:', e.message);
    }

    // Test correct usage based on source code
    try {
        console.log('Attempting new Target({ data: buffer }).getText()...');
        const instance = new Target({ data: buffer });
        console.log('Instance created');
        if (typeof instance.getText === 'function') {
             // getText() is async and returns { text: string, ... }
             // Since buffer is invalid PDF, this will likely fail, but we check if method exists andPromise is returned
             const promise = instance.getText();
             console.log('getText() returned promise:', promise instanceof Promise);
             // await promise; // This would throw invalid pdf
        } else {
             console.log('getText method missing!');
             console.log('Instance keys:', Object.keys(instance));
        }
    } catch (e) {
        console.log('Usage test failed:', e.message);
    }

  } catch (err) {
    console.error('Main block failed:', err);
  }
}

testPdfParse();
