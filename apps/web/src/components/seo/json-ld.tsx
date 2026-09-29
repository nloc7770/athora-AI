interface JsonLdProps {
  data: Record<string, unknown>
  nonce?: string
}

export function JsonLd({ data, nonce }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Browsers hide the nonce attribute after parsing (reads back as ""), so React always flags a mismatch
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
