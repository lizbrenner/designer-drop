import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface DescriptionViewProps {
  content: string
  className?: string
}

/** Allowed HTML tags from TipTap editor output (bold, italic, underline, strike, lists, link, blockquote, code) */
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'span']

function isHtml(content: string): boolean {
  const t = content.trim()
  return t.startsWith('<') && (t.includes('</p>') || t.includes('<p>') || t.includes('<ul>') || t.includes('<strong>'))
}

/** Convert __underline__ to <u> for legacy markdown */
function underlineToHtml(text: string): string {
  return text.replace(/__([^_]*?)__/g, '<u>$1</u>')
}

/** Renders description: HTML from TipTap (sanitized) or legacy markdown */
export function DescriptionView({ content, className }: DescriptionViewProps) {
  if (!content?.trim()) return null

  if (isHtml(content)) {
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS,
      ADD_ATTR: ['target', 'rel', 'href'],
    })
    return (
      <div
        className={cn(
          'description-view text-sm text-zinc-700 dark:text-zinc-300',
          className
        )}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    )
  }

  const withUnderline = underlineToHtml(content)
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-zinc-700 dark:prose-invert dark:text-zinc-300',
        'prose-p:my-2 prose-ul:my-2 prose-li:my-0',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {withUnderline}
      </ReactMarkdown>
    </div>
  )
}
