'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-sm max-w-none prose-zinc prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-code:text-xs prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <p className="text-base font-bold text-zinc-900 my-2">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="text-sm font-bold text-zinc-900 my-1.5">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="text-sm font-semibold text-zinc-800 my-1.5">{children}</p>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-200 bg-zinc-50 px-2 py-1 text-left text-xs font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-200 px-2 py-1 text-xs">{children}</td>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
              {children}
            </pre>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.startsWith('language-')
            if (isBlock) {
              return <code className={codeClassName}>{children}</code>
            }
            return (
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono text-zinc-800">
                {children}
              </code>
            )
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline hover:text-purple-700">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
