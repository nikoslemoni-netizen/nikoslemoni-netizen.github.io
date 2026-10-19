// Keep crawlable article lists in HTML, using the same data and markup as the browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const start = source.indexOf('const POSTS = [');
const end = source.indexOf('function renderBlog(){', start);
if (start < 0 || end < 0) throw new Error('Blog source boundaries were not found');
// Temporary badges are added by the browser, so static HTML cannot retain an expired badge.
class StaticDate extends Date { static now() { return Infinity; } }
const context = { Date: StaticDate };
vm.createContext(context);
vm.runInContext(source.slice(start, end) + '\nresult = [...POSTS].sort((a,b)=>new Date(b.date)-new Date(a.date)); render = buildPostCards;', context);
for (const directory of [root, path.join(root, '_site')].filter(fs.existsSync)) {
  for (const [filename, id, count] of [['blog.html', 'blogRecent', 3], ['blog-library.html', 'blogLibrary', context.result.length]]) {
    const file = path.join(directory, filename);
    let html = fs.readFileSync(file, 'utf8');
    const content = `<!-- POSTS:start -->\n        <div id="${id}" class="posts-grid">${context.render(context.result.slice(0, count))}\n        </div>\n        <!-- POSTS:end -->`;
    const previous = /<!-- POSTS:start -->[\s\S]*?<!-- POSTS:end -->/;
    if (previous.test(html)) html = html.replace(previous, content);
    else {
      const placeholder = `<div id="${id}" class="posts-grid"></div>`;
      if (!html.includes(placeholder)) throw new Error(`Missing blog list in ${file}`);
      html = html.replace(placeholder, content);
    }
    fs.writeFileSync(file, html.replace(/[ \t]+$/gm, ''));
  }
}
console.log('Updated static recent articles and library in both site copies.');
