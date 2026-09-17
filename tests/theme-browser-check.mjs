import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

// Run with npm run test:theme; requires Google Chrome installed.
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5189', '--strictPort'], { stdio: 'ignore' });
for (let attempt = 0; attempt < 100; attempt++) {
  try { if ((await fetch('http://127.0.0.1:5189/popup.html')).ok) break; } catch {}
  await setTimeout(100);
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 780, height: 600 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  const item = {
    id: 'theme-test', companyName: 'Theme Test', role: 'Engineer', timestamp: Date.now(),
    jobDescription: 'Engineer', originalResume: '', pinned: false,
    tailoredResume: '# Alex Smith\nalex@example.com | +1 555-123-4567 | linkedin.com/in/alex\n\n## Experience\n**Software Engineer**\nExample Corp | 2020 - Present\n' + '- Built reliable software with **TypeScript** and React.\n'.repeat(24) + '\n## Education\nComputer Science\n\n## Skills\n**Languages:** TypeScript, Python\n\n## Summary\nSoftware engineer creating useful products.',
  };
  const second = { ...item, id: 'second', companyName: 'Second Resume', tailoredResume: item.tailoredResume.replace('## Skills', '## Technical Skills').replace('## Experience', '## Professional Experience'), theme: { font: 'arial', accentColor: '#166534', headerAlignment: 'center', sectionOrder: [] } };
  const store = { doneItems: localStorage.getItem('empty-list') ? [] : [item, second], workingItems: [], ...JSON.parse(localStorage.getItem('test-settings') || '{}') };
  window.testStore = store;
  window.downloadBlobs = [];
  window.chrome = {
    runtime: { sendMessage: (msg, callback) => {
      if (msg.type === 'GET_STATE') callback?.(store);
      if (msg.type === 'UPDATE_DONE') Object.assign(item, msg.updates);
    }, onMessage: { addListener() {}, removeListener() {} } },
    storage: { local: { get: (key, cb) => window.setTimeout(() => cb(store), 200), set(values, cb) {
      window.setTimeout(() => {
        if (window.failNextSave) {
          window.failNextSave = false;
          window.chrome.runtime.lastError = { message: 'Storage failure' };
          cb?.();
          delete window.chrome.runtime.lastError;
          return;
        }
        Object.assign(store, values);
        localStorage.setItem('test-settings', JSON.stringify({ resumeTheme: store.resumeTheme, resumeThemeLibrary: store.resumeThemeLibrary }));
        cb?.();
      }, 100);
    } }, onChanged: { addListener() {}, removeListener() {} } },
  };
  const arrayBuffer = Blob.prototype.arrayBuffer;
  Blob.prototype.arrayBuffer = function() { window.previewBlob = this; return arrayBuffer.call(this); };
  const createURL = URL.createObjectURL;
  URL.createObjectURL = function(blob) { window.downloadBlobs.push(blob); window.downloadMatchesPreview = blob === window.previewBlob; return createURL.call(this, blob); };
});
try {
  await page.goto('http://127.0.0.1:5189/popup.html');
  const defaultsMatch = await page.evaluate(async () => {
    const { generateResumePDFBlob } = await import('/src/services/pdfGenerator.ts');
    const { DEFAULT_RESUME_THEME, mergeResumeTheme } = await import('/src/utils/resumeTheme.ts');
    const { loadResumeFonts } = await import('/src/services/resumeFonts.ts');
    const options = { content: '# Alex Smith\nalex@example.com\n## Education\nComputer Science\n## Skills\n**Languages:** TypeScript\n## Summary\nAn engineer.', filename: 'test.pdf' };
    await loadResumeFonts(DEFAULT_RESUME_THEME.font);
    const pdf = await generateResumePDFBlob({ ...options, theme: DEFAULT_RESUME_THEME }).text();
    return /Tinos/.test(pdf) && DEFAULT_RESUME_THEME.headerAlignment === 'right' && DEFAULT_RESUME_THEME.accentColor === '#8b5a2b' && mergeResumeTheme({ font: 'jetbrainsMono' }).font === 'timesNewRoman';
  });
  assert.equal(defaultsMatch, true, 'defaults retain Classic serif styling and migrate removed fonts');
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  await page.locator('canvas').first().waitFor();
  assert.equal(await page.getByLabel('Font', { exact: true }).inputValue(), 'timesNewRoman');
  const canvasCount = await page.locator('canvas').count();
  assert.ok(canvasCount >= 2, 'all PDF pages render');
  const fontChoices = { arial: 'Arimo', calibri: 'Carlito', aptos: 'Lato', helvetica: 'Arimo', roboto: 'Roboto', georgia: 'Gelasio', garamond: 'EBGaramond', cambria: 'Caladea', timesNewRoman: 'Tinos', verdana: 'OpenSans' };
  assert.equal(await page.getByLabel('Font', { exact: true }).locator('option').count(), 10);
  for (const [font, family] of Object.entries(fontChoices)) {
    await page.getByLabel('Font', { exact: true }).selectOption(font);
    await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0 && !document.querySelector('[role="status"]'));
    const output = await page.evaluate(() => window.previewBlob.text());
    assert.ok(output.includes(family), `${font} embeds ${family} and renders its preview`);
    assert.equal(await page.getByRole('alert').count(), 0);
  }
  await page.getByLabel('Font', { exact: true }).selectOption('roboto');
  await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0 && !document.querySelector('[role="status"]'));
  const fontPDF = await page.evaluate(async () => new TextDecoder().decode(await window.previewBlob.arrayBuffer()));
  assert.match(fontPDF, /Roboto/);
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  assert.equal(await page.evaluate(() => window.downloadMatchesPreview), true, 'download saves the exact preview blob');
  await page.getByLabel('Left align header').click();
  await page.getByLabel('Move Skills up').click();
  await page.getByLabel('Theme name', { exact: true }).fill('My engineering resume');
  await page.getByRole('button', { name: 'Save & apply' }).click();
  await page.getByText('Active theme: My engineering resume. Used automatically for every resume.').waitFor();
  assert.equal(await page.evaluate(() => window.testStore.resumeTheme.name), 'My engineering resume');
  assert.equal(await page.evaluate(() => window.testStore.resumeTheme.font), 'roboto');
  assert.equal(await page.evaluate(() => window.testStore.doneItems[0].theme), undefined, 'theme is saved once, not on resume records');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByText('Second Resume', { exact: true }).click();
  await page.locator('canvas').first().waitFor();
  assert.equal(await page.getByLabel('Font', { exact: true }).count(), 0, 'customization is outside individual resumes');
  const secondPDF = await page.evaluate(() => window.previewBlob.text());
  assert.match(secondPDF, /Roboto/, 'shared theme overrides legacy per-resume styling');
  const sectionText = await page.evaluate(async () => {
    const { getDocument, GlobalWorkerOptions } = await import('/node_modules/pdfjs-dist/build/pdf.mjs');
    GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
    const pdf = await getDocument({ data: await window.previewBlob.arrayBuffer(), isEvalSupported: false }).promise;
    const text = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      text.push(...(await page.getTextContent()).items.map(item => item.str));
    }
    await pdf.destroy();
    return text.join(' ').replace(/\s+/g, ' ');
  });
  assert.ok(sectionText.indexOf('TECHNICAL SKILLS') >= 0 && sectionText.indexOf('TECHNICAL SKILLS') < sectionText.indexOf('SUMMARY'), `shared order applies to differently named sections: ${sectionText}`);
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  assert.equal(await page.evaluate(() => window.downloadMatchesPreview), true);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.evaluate(() => { window.downloadBlobs = []; });
  await page.getByRole('button', { name: 'All PDFs (2)', exact: true }).click();
  await page.waitForFunction(() => window.downloadBlobs.length === 2);
  const bulk = await page.evaluate(() => Promise.all(window.downloadBlobs.map(blob => blob.text())));
  for (const pdf of bulk) assert.match(pdf, /Roboto/, 'bulk downloads use shared font');
  await page.evaluate(() => {
    const newResume = { ...window.testStore.doneItems[0], id: 'new-generated', companyName: 'Newly Generated', timestamp: Date.now() };
    window.testStore.doneItems = [newResume, ...window.testStore.doneItems];
    window.dispatchEvent(new Event('focus'));
  });
  await page.getByText('Newly Generated', { exact: true }).click();
  await page.locator('canvas').first().waitFor();
  assert.match(await page.evaluate(() => window.previewBlob.text()), /Roboto/, 'newly generated resumes immediately inherit the saved theme');
  await page.reload();
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  assert.equal(await page.getByLabel('Font', { exact: true }).inputValue(), 'roboto', 'global theme survives reopening');
  assert.equal(await page.getByLabel('Theme name', { exact: true }).inputValue(), 'My engineering resume', 'theme name survives delayed storage loading');
  await page.getByLabel('Theme name', { exact: true }).fill('Renamed theme');
  await page.evaluate(() => { window.failNextSave = true; });
  await page.getByRole('button', { name: 'Save & apply' }).click();
  await page.getByText('Could not save theme. Your previous theme is still active. Please retry.').waitFor();
  assert.equal(await page.evaluate(() => window.testStore.resumeTheme.name), 'My engineering resume', 'failed writes preserve active theme');
  await page.getByRole('button', { name: 'Save & apply' }).click();
  await page.getByText('Active theme: Renamed theme. Used automatically for every resume.').waitFor();
  await page.getByRole('button', { name: 'New theme', exact: true }).click();
  await page.getByLabel('Theme name', { exact: true }).fill('Office theme');
  await page.getByLabel('Font', { exact: true }).selectOption('calibri');
  await page.getByRole('button', { name: 'Save & apply' }).click();
  await page.getByText('Active theme: Office theme. Used automatically for every resume.').waitFor();
  assert.equal(await page.evaluate(() => window.testStore.resumeThemeLibrary.themes.length), 2, 'saving a new preset preserves the original');
  await page.reload();
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  assert.equal(await page.getByLabel('Font', { exact: true }).inputValue(), 'calibri');
  assert.equal(await page.getByLabel('Saved themes', { exact: true }).locator('option').count(), 2, 'all named presets survive reopening');
  await page.getByLabel('Saved themes', { exact: true }).selectOption({ label: 'Renamed theme' });
  assert.equal(await page.getByLabel('Font', { exact: true }).inputValue(), 'roboto', 'selecting a preset restores its settings');
  assert.equal(await page.evaluate(() => window.testStore.resumeTheme.name), 'Office theme', 'previewing another preset does not silently change active theme');
  await page.getByRole('button', { name: 'Save & apply' }).click();
  await page.getByText('Active theme: Renamed theme. Used automatically for every resume.').waitFor();
  assert.equal(await page.evaluate(() => window.testStore.resumeThemeLibrary.themes.length), 2, 'switching does not duplicate a preset');
  assert.equal(await page.evaluate(() => window.testStore.resumeThemeLibrary.themes.find(entry => entry.theme.name === 'Office theme').theme.font), 'calibri', 'inactive preset retains its own settings');
  await page.getByLabel('Reset theme').click();
  assert.equal(await page.getByLabel('Font', { exact: true }).inputValue(), 'timesNewRoman');
  await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0 && !document.querySelector('[role="status"]'));
  const inspectAppearance = async () => page.evaluate(async () => {
    const { getDocument, GlobalWorkerOptions, OPS } = await import('/node_modules/pdfjs-dist/build/pdf.mjs');
    GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
    const pdf = await getDocument({ data: await window.previewBlob.arrayBuffer(), isEvalSupported: false }).promise;
    let rectangles = 0;
    let curves = 0;
    const text = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      const pdfPage = await pdf.getPage(index);
      text.push(...(await pdfPage.getTextContent()).items.map(item => item.str));
      const operations = await pdfPage.getOperatorList();
      operations.fnArray.forEach((op, opIndex) => {
        if (op !== OPS.constructPath) return;
        for (const pathOp of operations.argsArray[opIndex][0]) {
          if (pathOp === OPS.rectangle) rectangles++;
          if (pathOp === OPS.curveTo) curves++;
        }
      });
    }
    await pdf.destroy();
    const pixel = [...document.querySelector('canvas').getContext('2d').getImageData(2, 2, 1, 1).data];
    return { rectangles, curves, text: text.join(' ').replace(/\s+/g, ' '), pixel };
  });
  const originalAppearance = await inspectAppearance();
  assert.ok(originalAppearance.rectangles > 0 && originalAppearance.curves > 0, 'default header is filled and experience uses circles');
  assert.match(originalAppearance.text, /•/, 'default contact separator is a dot');
  await page.getByLabel('Layout', { exact: true }).selectOption('modern');
  await page.getByLabel('Header background', { exact: true }).uncheck();
  await page.getByLabel('Contact separator', { exact: true }).selectOption('bar');
  await page.getByLabel('Experience bullets', { exact: true }).selectOption('dash');
  await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0 && !document.querySelector('[role="status"]'));
  const customAppearance = await inspectAppearance();
  assert.equal(customAppearance.rectangles, 0, 'plain header and Modern headings contain no large filled bars');
  assert.equal(customAppearance.curves, 0, 'experience dashes replace circular markers');
  assert.deepEqual(customAppearance.pixel, [255, 255, 255, 255], 'removed header background renders white');
  assert.match(customAppearance.text, /alex@example.com \|/, 'vertical bar separates contact information');
  assert.match(customAppearance.text, /linkedin.com\/in\/alex/, 'contact text is preserved');
  await page.getByLabel('Theme name', { exact: true }).fill('Modern plain header');
  await page.getByRole('button', { name: 'Save & apply' }).click();
  await page.getByText('Active theme: Modern plain header. Used automatically for every resume.').waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  assert.equal(await page.getByLabel('Header background', { exact: true }).isChecked(), false);
  assert.equal(await page.getByLabel('Contact separator', { exact: true }).inputValue(), 'bar');
  assert.equal(await page.getByLabel('Experience bullets', { exact: true }).inputValue(), 'dash');
  assert.equal(await page.getByLabel('Layout', { exact: true }).inputValue(), 'modern');
  await page.evaluate(() => localStorage.setItem('empty-list', 'true'));
  await page.reload();
  await page.getByRole('button', { name: 'Theme', exact: true }).click();
  await page.locator('canvas').first().waitFor();
  assert.match(await page.getByLabel('Preview', { exact: true }).textContent(), /Sample resume/, 'theme configuration works before tailoring a resume');
  assert.deepEqual(errors, []);
  console.log('PASS: multiple presets, switching, migration, persistence, save recovery, new resume inheritance, fonts and PDF preview.');
} finally {
  await browser.close();
  server.kill();
}
