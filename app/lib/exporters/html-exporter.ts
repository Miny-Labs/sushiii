/**
 * HTML Policy Exporter
 * Exports privacy policies to standalone HTML files with professional formatting
 */

export interface PolicyExportData {
  policy_id: string
  version: string
  text: string
  content_hash: string
  jurisdiction: string
  effective_from: string
  status?: string
  created_at?: string
  updated_at?: string
  approval_history?: Array<{
    from_status: string
    to_status: string
    approver_name: string
    approval_notes: string
    timestamp: string
  }>
}

export interface HTMLExportOptions {
  includeMetadata?: boolean
  includeApprovalHistory?: boolean
  includeTableOfContents?: boolean
  theme?: 'light' | 'dark' | 'print'
  customCSS?: string
  branding?: {
    companyName?: string
    logo?: string
    colors?: {
      primary?: string
      secondary?: string
    }
  }
}

export function exportPolicyToHTML(
  policy: PolicyExportData,
  options: HTMLExportOptions = {}
): string {
  const {
    includeMetadata = true,
    includeApprovalHistory = true,
    includeTableOfContents = true,
    theme = 'light',
    customCSS = '',
    branding = {}
  } = options

  const { companyName = 'Organization', logo, colors = {} } = branding
  const primaryColor = colors.primary || '#000000'
  const secondaryColor = colors.secondary || '#666666'

  // Generate table of contents from headings in policy text
  const generateTOC = (): string => {
    if (!includeTableOfContents) return ''

    const headingRegex = /<h([1-3])[^>]*>(.*?)<\/h[1-3]>/gi
    const headings: Array<{ level: number; text: string; id: string }> = []
    let match

    while ((match = headingRegex.exec(policy.text)) !== null) {
      const level = parseInt(match[1])
      const text = match[2].replace(/<[^>]*>/g, '') // Strip HTML tags
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      headings.push({ level, text, id })
    }

    if (headings.length === 0) return ''

    return `
      <nav class="table-of-contents">
        <h2>Table of Contents</h2>
        <ul>
          ${headings.map(h => `
            <li class="toc-level-${h.level}">
              <a href="#${h.id}">${h.text}</a>
            </li>
          `).join('')}
        </ul>
      </nav>
    `
  }

  // Add IDs to headings for linking
  const addHeadingIDs = (html: string): string => {
    return html.replace(/<h([1-3])[^>]*>(.*?)<\/h[1-3]>/gi, (match, level, text) => {
      const plainText = text.replace(/<[^>]*>/g, '')
      const id = plainText.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return `<h${level} id="${id}">${text}</h${level}>`
    })
  }

  const policyTextWithIDs = addHeadingIDs(policy.text)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${policy.policy_id} v${policy.version} - ${companyName}</title>
  <meta name="description" content="${policy.policy_id} version ${policy.version} effective from ${new Date(policy.effective_from).toLocaleDateString()}">
  <meta name="keywords" content="privacy policy, ${policy.jurisdiction}, GDPR, data protection">

  <style>
    /* Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary-color: ${primaryColor};
      --secondary-color: ${secondaryColor};
      --background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
      --text: ${theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
      --text-secondary: ${theme === 'dark' ? '#a0a0a0' : '#666666'};
      --border: ${theme === 'dark' ? '#333333' : '#e5e7eb'};
      --highlight: ${theme === 'dark' ? '#2a2a2a' : '#f9fafb'};
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--background);
      padding: 2rem 1rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      border-bottom: 2px solid var(--primary-color);
      padding-bottom: 2rem;
      margin-bottom: 3rem;
    }

    .logo {
      max-width: 200px;
      max-height: 60px;
      margin-bottom: 1rem;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.25rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    /* Metadata */
    .metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      background: var(--highlight);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
    }

    .metadata-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .metadata-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text);
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      background: var(--primary-color);
      color: white;
    }

    /* Table of Contents */
    .table-of-contents {
      background: var(--highlight);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }

    .table-of-contents h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--primary-color);
    }

    .table-of-contents ul {
      list-style: none;
    }

    .table-of-contents li {
      margin: 0.5rem 0;
    }

    .table-of-contents a {
      color: var(--text);
      text-decoration: none;
      transition: color 0.2s;
    }

    .table-of-contents a:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .toc-level-1 {
      font-weight: 600;
      margin-top: 1rem;
    }

    .toc-level-2 {
      padding-left: 1.5rem;
      font-size: 0.95rem;
    }

    .toc-level-3 {
      padding-left: 3rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    /* Policy Content */
    .policy-content {
      font-size: 1rem;
      line-height: 1.8;
    }

    .policy-content h1 {
      font-size: 2rem;
      font-weight: 700;
      margin: 2.5rem 0 1rem;
      color: var(--primary-color);
      border-bottom: 2px solid var(--border);
      padding-bottom: 0.5rem;
    }

    .policy-content h2 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 2rem 0 1rem;
      color: var(--text);
    }

    .policy-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 1.5rem 0 0.75rem;
      color: var(--text);
    }

    .policy-content p {
      margin: 1rem 0;
    }

    .policy-content ul, .policy-content ol {
      margin: 1rem 0;
      padding-left: 2rem;
    }

    .policy-content li {
      margin: 0.5rem 0;
    }

    .policy-content strong {
      font-weight: 600;
      color: var(--text);
    }

    .policy-content a {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .policy-content a:hover {
      opacity: 0.8;
    }

    /* Approval History */
    .approval-history {
      margin: 3rem 0;
      background: var(--highlight);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .approval-history h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--primary-color);
    }

    .approval-entry {
      border-left: 3px solid var(--primary-color);
      padding-left: 1rem;
      margin: 1rem 0;
    }

    .approval-status {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .approval-meta {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .approval-notes {
      font-size: 0.95rem;
      font-style: italic;
      color: var(--text-secondary);
    }

    /* Footer */
    .footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .hash-display {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--highlight);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      word-break: break-all;
    }

    /* Print Styles */
    @media print {
      body {
        padding: 0;
        max-width: 100%;
      }

      .table-of-contents {
        page-break-after: always;
      }

      .policy-content h1,
      .policy-content h2,
      .policy-content h3 {
        page-break-after: avoid;
      }

      .approval-history {
        page-break-before: always;
      }
    }

    /* Custom CSS */
    ${customCSS}
  </style>
</head>
<body>
  <header class="header">
    ${logo ? `<img src="${logo}" alt="${companyName} Logo" class="logo">` : ''}
    <h1 class="title">${policy.policy_id}</h1>
    <p class="subtitle">Version ${policy.version}</p>
  </header>

  ${includeMetadata ? `
  <section class="metadata">
    <div class="metadata-item">
      <span class="metadata-label">Jurisdiction</span>
      <span class="metadata-value">${policy.jurisdiction}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Effective From</span>
      <span class="metadata-value">${new Date(policy.effective_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    ${policy.status ? `
    <div class="metadata-item">
      <span class="metadata-label">Status</span>
      <span class="metadata-value"><span class="badge">${policy.status}</span></span>
    </div>
    ` : ''}
    ${policy.created_at ? `
    <div class="metadata-item">
      <span class="metadata-label">Created</span>
      <span class="metadata-value">${new Date(policy.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    ` : ''}
    <div class="metadata-item">
      <span class="metadata-label">Content Hash (SHA-256)</span>
      <div class="hash-display">${policy.content_hash}</div>
    </div>
  </section>
  ` : ''}

  ${generateTOC()}

  <main class="policy-content">
    ${policyTextWithIDs}
  </main>

  ${includeApprovalHistory && policy.approval_history && policy.approval_history.length > 0 ? `
  <section class="approval-history">
    <h2>Approval History</h2>
    ${policy.approval_history.map(entry => `
      <div class="approval-entry">
        <div class="approval-status">
          ${entry.from_status} → ${entry.to_status}
        </div>
        <div class="approval-meta">
          Approved by ${entry.approver_name} on ${new Date(entry.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
        ${entry.approval_notes ? `
        <div class="approval-notes">"${entry.approval_notes}"</div>
        ` : ''}
      </div>
    `).join('')}
  </section>
  ` : ''}

  <footer class="footer">
    <p>
      <strong>${companyName}</strong><br>
      This policy is secured on the blockchain with hash: <code>${policy.content_hash.substring(0, 16)}...</code><br>
      Generated on ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </p>
  </footer>
</body>
</html>`

  return html
}

/**
 * Triggers a download of the HTML file in the browser
 */
export function downloadHTMLFile(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Preview HTML in a new browser window
 */
export function previewHTML(html: string): void {
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.write(html)
    newWindow.document.close()
  }
}
