import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';

// Import common languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import shell from 'highlight.js/lib/languages/shell';
import bash from 'highlight.js/lib/languages/bash';
import powershell from 'highlight.js/lib/languages/powershell';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import makefile from 'highlight.js/lib/languages/makefile';
import dockerfile from 'highlight.js/lib/languages/dockerfile';

// Register languages with highlight.js
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('c++', cpp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('kt', kotlin);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('sh', shell);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('ps1', powershell);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('sass', scss);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('make', makefile);
hljs.registerLanguage('dockerfile', dockerfile);

// Configure markdown-it with all features enabled
export const md: MarkdownIt = new MarkdownIt({
  html: true,           // Enable HTML tags in source
  xhtmlOut: true,      // Use '/' to close single tags (<br />)
  breaks: true,        // Convert '\n' in paragraphs into <br>
  langPrefix: 'hljs language-',  // CSS language prefix for fenced blocks
  linkify: true,       // Autoconvert URL-like text to links
  typographer: true,   // Enable smartquotes and other typographic replacements
  quotes: '""\'\'',     // Quote characters for typographer (primary and secondary)
  highlight: function (str, lang) {
    // Create a friendly display name for the language
    const getLanguageDisplayName = (langCode: string): string => {
      const languageNames: { [key: string]: string } = {
        'js': 'JavaScript',
        'javascript': 'JavaScript',
        'ts': 'TypeScript',
        'typescript': 'TypeScript',
        'py': 'Python',
        'python': 'Python',
        'java': 'Java',
        'cs': 'C#',
        'csharp': 'C#',
        'cpp': 'C++',
        'c++': 'C++',
        'c': 'C',
        'go': 'Go',
        'golang': 'Go',
        'rs': 'Rust',
        'rust': 'Rust',
        'php': 'PHP',
        'rb': 'Ruby',
        'ruby': 'Ruby',
        'swift': 'Swift',
        'kt': 'Kotlin',
        'kotlin': 'Kotlin',
        'scala': 'Scala',
        'sh': 'Shell',
        'shell': 'Shell',
        'bash': 'Bash',
        'ps1': 'PowerShell',
        'powershell': 'PowerShell',
        'sql': 'SQL',
        'json': 'JSON',
        'xml': 'XML',
        'html': 'HTML',
        'yml': 'YAML',
        'yaml': 'YAML',
        'md': 'Markdown',
        'markdown': 'Markdown',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'Sass',
        'make': 'Makefile',
        'makefile': 'Makefile',
        'dockerfile': 'Dockerfile'
      };
      return languageNames[langCode.toLowerCase()] || langCode.toUpperCase();
    };

    if (lang && hljs.getLanguage(lang)) {
      try {
        const result = hljs.highlight(str, { language: lang });
        const displayName = getLanguageDisplayName(lang);
        return `<pre class="hljs bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto relative" data-language="${displayName}"><code class="hljs language-${lang}">${result.value}</code></pre>`;
      } catch (__) {
        // Fall back to escaped content if highlighting fails
      }
    }
    
    const displayName = lang ? getLanguageDisplayName(lang) : 'Code';
    return `<pre class="hljs bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto relative" data-language="${displayName}"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

md.enable([
  'table',
  'code',
  'fence',
  'blockquote',
  'hr',
  'list',
  'reference',
  'heading',
  'lheading',
  'html_block',
  'paragraph'
]);

md.renderer.rules.heading_open = function(tokens: any, idx: number, options: any, env: any, renderer: any): string {
  const token = tokens[idx];
  const level = token.markup.length;
  
  if (level === 2 || level === 3) {
    const textToken = tokens[idx + 1];
    if (textToken && textToken.type === 'inline') {
      const headingText = textToken.content;
      const id = generateHeadingId(headingText);
      return `<h${level} id="${id}">`;
    }
  }
  
  return `<h${level}>`;
};

md.renderer.rules.code_inline = function(tokens: any, idx: number, options: any, env: any, renderer: any): string {
  const token = tokens[idx];
  return `<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">${md.utils.escapeHtml(token.content)}</code>`;
};

export interface HeadingInfo {
  text: string;
  id: string;
  level: number;
}

export interface NestedHeading extends HeadingInfo {
  children: HeadingInfo[];
}

export const createNestedHeadings = (headings: HeadingInfo[]): NestedHeading[] => {
  const nested: NestedHeading[] = [];
  let currentH2: NestedHeading | null = null;

  for (const heading of headings) {
    if (heading.level === 2) {
      // Create new H2 heading with children array
      currentH2 = {
        ...heading,
        children: []
      };
      nested.push(currentH2);
    } else if (heading.level === 3 && currentH2) {
      // Add H3 as child of current H2
      currentH2.children.push(heading);
    } else if (heading.level === 3 && !currentH2) {
      // H3 without parent H2 - create a standalone entry
      nested.push({
        ...heading,
        children: []
      });
    }
  }

  return nested;
};

export const extractHeadings = (markdownContent: string): HeadingInfo[] => {
  const headings: HeadingInfo[] = [];
  const lines = markdownContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('### ')) {
      const text = trimmedLine.substring(3).trim();
      if (text) {
        const id = generateHeadingId(text);
        headings.push({
          text,
          id,
          level: 2
        });
      }
    }
    else if (trimmedLine.startsWith('### ') && !trimmedLine.startsWith('#### ')) {
      const text = trimmedLine.substring(4).trim();
      if (text) {
        const id = generateHeadingId(text);
        headings.push({
          text,
          id,
          level: 3
        });
      }
    }
  }
  
  return headings;
};


export const generateHeadingId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

export default md;
