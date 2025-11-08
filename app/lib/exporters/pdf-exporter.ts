/**
 * PDF Policy Exporter
 * Exports privacy policies to professional PDF files
 */

import { jsPDF } from 'jspdf'
import { PolicyExportData } from './html-exporter'

export interface PDFExportOptions {
  includeMetadata?: boolean
  includeApprovalHistory?: boolean
  includeTableOfContents?: boolean
  branding?: {
    companyName?: string
    logo?: string
    colors?: {
      primary?: string
      secondary?: string
    }
  }
}

/**
 * Export policy to PDF
 */
export async function exportPolicyToPDF(
  policy: PolicyExportData,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    includeMetadata = true,
    includeApprovalHistory = true,
    includeTableOfContents = false,
    branding = {}
  } = options

  const { companyName = 'Organization', logo, colors = {} } = branding
  const primaryColor = colors.primary || '#000000'

  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let yPosition = 20
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)

  // Helper function to check if we need a new page
  const checkNewPage = (neededHeight: number = 10) => {
    if (yPosition + neededHeight > pageHeight - margin) {
      pdf.addPage()
      yPosition = 20
      return true
    }
    return false
  }

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  const primaryRgb = hexToRgb(primaryColor)

  // Header - Company Logo (if provided)
  if (logo) {
    try {
      // Logo would need to be loaded and converted to data URL
      // For now, we'll skip actual logo rendering
    } catch (error) {
      console.warn('Could not load logo:', error)
    }
  }

  // Title
  pdf.setFontSize(24)
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  pdf.setFont('helvetica', 'bold')
  pdf.text(policy.policy_id.toUpperCase(), margin, yPosition)
  yPosition += 10

  // Version
  pdf.setFontSize(14)
  pdf.setTextColor(100, 100, 100)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Version ${policy.version}`, margin, yPosition)
  yPosition += 15

  // Metadata section
  if (includeMetadata) {
    checkNewPage(40)

    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition, contentWidth, 35, 'F')

    yPosition += 7
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'bold')

    // Metadata grid
    const metadataItems = [
      { label: 'Jurisdiction:', value: policy.jurisdiction },
      { label: 'Effective From:', value: new Date(policy.effective_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: 'Status:', value: policy.status || 'draft' },
      { label: 'Content Hash:', value: policy.content_hash.substring(0, 32) + '...' }
    ]

    metadataItems.forEach((item, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      const xPos = margin + 5 + (col * (contentWidth / 2))
      const yPos = yPosition + (row * 7)

      pdf.setFont('helvetica', 'bold')
      pdf.text(item.label, xPos, yPos)
      pdf.setFont('helvetica', 'normal')
      pdf.text(item.value, xPos + 35, yPos)
    })

    yPosition += 35
  }

  yPosition += 10
  checkNewPage()

  // Parse and render HTML content
  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
  }

  const parseHtmlContent = (html: string) => {
    const elements: Array<{ type: string; content: string; level?: number }> = []

    // Extract headings
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi
    const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gi
    const pRegex = /<p[^>]*>(.*?)<\/p>/gi
    const liRegex = /<li[^>]*>(.*?)<\/li>/gi

    let tempHtml = html

    // Process headings
    tempHtml.replace(h1Regex, (match, content) => {
      elements.push({ type: 'h1', content: stripHtml(content) })
      return ''
    })

    tempHtml.replace(h2Regex, (match, content) => {
      elements.push({ type: 'h2', content: stripHtml(content) })
      return ''
    })

    tempHtml.replace(h3Regex, (match, content) => {
      elements.push({ type: 'h3', content: stripHtml(content) })
      return ''
    })

    tempHtml.replace(pRegex, (match, content) => {
      const text = stripHtml(content)
      if (text) {
        elements.push({ type: 'p', content: text })
      }
      return ''
    })

    tempHtml.replace(liRegex, (match, content) => {
      elements.push({ type: 'li', content: stripHtml(content) })
      return ''
    })

    return elements
  }

  const elements = parseHtmlContent(policy.text)

  // Render content elements
  elements.forEach(element => {
    checkNewPage(15)

    switch (element.type) {
      case 'h1':
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        const h1Lines = pdf.splitTextToSize(element.content, contentWidth)
        pdf.text(h1Lines, margin, yPosition)
        yPosition += h1Lines.length * 7 + 5

        // Underline
        pdf.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        pdf.line(margin, yPosition - 3, margin + 60, yPosition - 3)
        yPosition += 5
        break

      case 'h2':
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(0, 0, 0)
        const h2Lines = pdf.splitTextToSize(element.content, contentWidth)
        pdf.text(h2Lines, margin, yPosition)
        yPosition += h2Lines.length * 6 + 4
        break

      case 'h3':
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(60, 60, 60)
        const h3Lines = pdf.splitTextToSize(element.content, contentWidth)
        pdf.text(h3Lines, margin, yPosition)
        yPosition += h3Lines.length * 5 + 3
        break

      case 'p':
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        const pLines = pdf.splitTextToSize(element.content, contentWidth)
        pdf.text(pLines, margin, yPosition)
        yPosition += pLines.length * 5 + 3
        break

      case 'li':
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        pdf.text('•', margin + 2, yPosition)
        const liLines = pdf.splitTextToSize(element.content, contentWidth - 8)
        pdf.text(liLines, margin + 8, yPosition)
        yPosition += liLines.length * 5 + 2
        break
    }
  })

  // Approval History
  if (includeApprovalHistory && policy.approval_history && policy.approval_history.length > 0) {
    checkNewPage(30)
    yPosition += 10

    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    pdf.text('Approval History', margin, yPosition)
    yPosition += 10

    policy.approval_history.forEach(entry => {
      checkNewPage(20)

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(`${entry.from_status} → ${entry.to_status}`, margin + 5, yPosition)
      yPosition += 5

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `By ${entry.approver_name} on ${new Date(entry.timestamp).toLocaleString()}`,
        margin + 5,
        yPosition
      )
      yPosition += 5

      if (entry.approval_notes) {
        pdf.setFont('helvetica', 'italic')
        const noteLines = pdf.splitTextToSize(`"${entry.approval_notes}"`, contentWidth - 10)
        pdf.text(noteLines, margin + 5, yPosition)
        yPosition += noteLines.length * 4 + 3
      }

      yPosition += 5
    })
  }

  // Footer on each page
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.setFont('helvetica', 'normal')

    // Left footer
    pdf.text(
      `${companyName} • ${policy.policy_id} v${policy.version}`,
      margin,
      pageHeight - 10
    )

    // Center footer
    pdf.text(
      `Hash: ${policy.content_hash.substring(0, 16)}...`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )

    // Right footer
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // Return as blob
  return pdf.output('blob')
}

/**
 * Download PDF file
 */
export function downloadPDFFile(blob: Blob, filename: string): void {
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
 * Open PDF in new window
 */
export function previewPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
