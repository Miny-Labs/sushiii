/**
 * Professional Policy Templates
 *
 * These templates are starter templates and should be reviewed by legal counsel
 * before use. They include GDPR Article 13/14 required information.
 */

export interface PolicyTemplate {
  id: string
  name: string
  description: string
  jurisdiction: string
  framework: string[]
  content: string
}

export const GDPR_PRIVACY_POLICY: PolicyTemplate = {
  id: 'gdpr-privacy-policy',
  name: 'GDPR Privacy Policy',
  description: 'Comprehensive privacy policy compliant with GDPR Article 13/14 requirements',
  jurisdiction: 'EU',
  framework: ['GDPR'],
  content: `<h1>Privacy Policy</h1>

<p><em>Last Updated: {{effective_date}}</em></p>

<p>At <strong>{{company_name}}</strong>, we are committed to protecting your personal data and respecting your privacy rights. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.</p>

<h2>1. Data Controller</h2>

<p>The data controller responsible for your personal data is:</p>

<ul>
  <li><strong>Company:</strong> {{company_name}}</li>
  <li><strong>Address:</strong> {{company_address}}</li>
  <li><strong>Email:</strong> {{contact_email}}</li>
  <li><strong>Phone:</strong> {{contact_phone}}</li>
</ul>

<h2>2. Personal Data We Collect</h2>

<p>We collect and process the following categories of personal data:</p>

<h3>2.1 Information You Provide</h3>

<ul>
  <li><strong>Identity Data:</strong> Name, username, title</li>
  <li><strong>Contact Data:</strong> Email address, telephone number, billing address</li>
  <li><strong>Account Data:</strong> Username, password, account preferences</li>
  <li><strong>Transaction Data:</strong> Purchase history, payment details</li>
</ul>

<h3>2.2 Information We Collect Automatically</h3>

<ul>
  <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
  <li><strong>Usage Data:</strong> Information about how you use our services</li>
  <li><strong>Cookie Data:</strong> Data from cookies and similar technologies (see Cookie Policy)</li>
</ul>

<h2>3. Legal Basis for Processing</h2>

<p>We process your personal data under the following legal bases (GDPR Article 6):</p>

<ul>
  <li><strong>Contract Performance:</strong> To provide services you requested</li>
  <li><strong>Consent:</strong> Where you have given explicit consent</li>
  <li><strong>Legitimate Interests:</strong> For business operations and service improvement</li>
  <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
</ul>

<h2>4. Purposes of Processing</h2>

<p>We use your personal data for:</p>

<ol>
  <li>Providing and managing your account</li>
  <li>Processing transactions and payments</li>
  <li>Communicating with you about our services</li>
  <li>Improving our services through analytics</li>
  <li>Detecting and preventing fraud</li>
  <li>Complying with legal obligations</li>
</ol>

<h2>5. Data Recipients</h2>

<p>We may share your personal data with:</p>

<ul>
  <li><strong>Service Providers:</strong> Payment processors, hosting providers, analytics services</li>
  <li><strong>Business Partners:</strong> With your consent, for joint offerings</li>
  <li><strong>Legal Authorities:</strong> When required by law</li>
  <li><strong>Corporate Transactions:</strong> In case of merger, acquisition, or asset sale</li>
</ul>

<p>We ensure all third parties respect the security of your data and treat it in accordance with the law.</p>

<h2>6. International Data Transfers</h2>

<p>Your data may be transferred to and processed in countries outside the European Economic Area (EEA). When we transfer data internationally, we use:</p>

<ul>
  <li>European Commission-approved Standard Contractual Clauses</li>
  <li>Adequacy decisions for certain countries</li>
  <li>Your explicit consent where required</li>
</ul>

<h2>7. Data Retention</h2>

<p>We retain your personal data only as long as necessary:</p>

<ul>
  <li><strong>Account Data:</strong> Duration of relationship plus {{retention_period_account}} years</li>
  <li><strong>Transaction Records:</strong> {{retention_period_transactions}} years (legal requirement)</li>
  <li><strong>Marketing Data:</strong> Until you withdraw consent</li>
</ul>

<h2>8. Your Rights (GDPR Articles 15-22)</h2>

<p>Under the GDPR, you have the following rights:</p>

<ul>
  <li><strong>Right to Access (Art. 15):</strong> Request copies of your personal data</li>
  <li><strong>Right to Rectification (Art. 16):</strong> Correct inaccurate data</li>
  <li><strong>Right to Erasure (Art. 17):</strong> Request deletion of your data ("right to be forgotten")</li>
  <li><strong>Right to Restrict Processing (Art. 18):</strong> Limit how we use your data</li>
  <li><strong>Right to Data Portability (Art. 20):</strong> Receive your data in a machine-readable format</li>
  <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interests</li>
  <li><strong>Right to Withdraw Consent (Art. 7(3)):</strong> Withdraw consent at any time</li>
  <li><strong>Right to Lodge a Complaint:</strong> Contact your supervisory authority</li>
</ul>

<p>To exercise these rights, contact us at <strong>{{privacy_email}}</strong></p>

<h2>9. Security Measures</h2>

<p>We implement appropriate technical and organizational measures to protect your data:</p>

<ul>
  <li>Encryption of data in transit and at rest</li>
  <li>Regular security assessments and audits</li>
  <li>Access controls and authentication</li>
  <li>Employee training on data protection</li>
  <li>Incident response procedures</li>
</ul>

<h2>10. Automated Decision-Making</h2>

<p>We <strong>{{uses_automated_decisions}}</strong> use automated decision-making or profiling. {{automated_decision_details}}</p>

<h2>11. Children's Privacy</h2>

<p>Our services are not directed to children under 16. We do not knowingly collect data from children. If you believe we have collected data from a child, please contact us immediately.</p>

<h2>12. Changes to This Policy</h2>

<p>We may update this Privacy Policy periodically. We will notify you of significant changes by email or prominent notice on our website at least {{notice_period}} days before the changes take effect.</p>

<h2>13. Contact Us</h2>

<p>For questions about this Privacy Policy or our data practices:</p>

<ul>
  <li><strong>Data Protection Officer:</strong> {{dpo_name}}</li>
  <li><strong>Email:</strong> {{dpo_email}}</li>
  <li><strong>Address:</strong> {{company_address}}</li>
</ul>

<p><strong>EU Representative (if applicable):</strong> {{eu_representative}}</p>

<h2>14. Supervisory Authority</h2>

<p>You have the right to lodge a complaint with your local supervisory authority:</p>

<ul>
  <li><strong>Authority:</strong> {{supervisory_authority}}</li>
  <li><strong>Website:</strong> {{supervisory_authority_url}}</li>
</ul>

<hr>

<p><em>This privacy policy complies with GDPR requirements including Articles 13, 14, 15-22. It should be reviewed by legal counsel before publication.</em></p>`
}

export const CCPA_PRIVACY_POLICY: PolicyTemplate = {
  id: 'ccpa-privacy-policy',
  name: 'CCPA Privacy Policy',
  description: 'California Consumer Privacy Act compliant privacy policy',
  jurisdiction: 'US',
  framework: ['CCPA', 'CPRA'],
  content: `<h1>California Privacy Rights</h1>

<p><em>Last Updated: {{effective_date}}</em></p>

<p>This California Privacy Notice applies to California residents and supplements our Privacy Policy.</p>

<h2>1. Personal Information We Collect</h2>

<p>In the past 12 months, we have collected the following categories of personal information:</p>

<ul>
  <li><strong>Identifiers:</strong> Name, email, phone, IP address, account ID</li>
  <li><strong>Commercial Information:</strong> Purchase history, product interests</li>
  <li><strong>Internet Activity:</strong> Browsing history, search history, interactions</li>
  <li><strong>Geolocation Data:</strong> Approximate location based on IP</li>
  <li><strong>Professional Information:</strong> Job title, company name</li>
  <li><strong>Inferences:</strong> Preferences and characteristics derived from your activity</li>
</ul>

<h2>2. Sources of Personal Information</h2>

<p>We collect personal information from:</p>

<ul>
  <li>Directly from you</li>
  <li>Automatically through cookies and tracking technologies</li>
  <li>Service providers and business partners</li>
  <li>Publicly available sources</li>
</ul>

<h2>3. Business Purposes for Collection</h2>

<p>We use personal information for:</p>

<ol>
  <li>Providing products and services</li>
  <li>Processing transactions</li>
  <li>Customer support and communication</li>
  <li>Security and fraud prevention</li>
  <li>Service improvement and analytics</li>
  <li>Marketing and advertising</li>
  <li>Legal compliance</li>
</ol>

<h2>4. Sharing Personal Information</h2>

<p>We share personal information with:</p>

<ul>
  <li><strong>Service Providers:</strong> For business operations</li>
  <li><strong>Analytics Partners:</strong> For usage analysis</li>
  <li><strong>Advertising Networks:</strong> For targeted advertising</li>
  <li><strong>Business Partners:</strong> With your consent</li>
</ul>

<p><strong>Sale of Personal Information:</strong> We <strong>{{sells_personal_info}}</strong> sell your personal information as defined by CCPA.</p>

<h2>5. Your California Privacy Rights</h2>

<p>California residents have the right to:</p>

<h3>Right to Know (CCPA § 1798.100)</h3>
<p>Request disclosure of:</p>
<ul>
  <li>Categories of personal information collected</li>
  <li>Sources of collection</li>
  <li>Business purposes for collection</li>
  <li>Categories of third parties with whom we share</li>
  <li>Specific pieces of personal information we hold about you</li>
</ul>

<h3>Right to Delete (CCPA § 1798.105)</h3>
<p>Request deletion of your personal information, subject to exceptions.</p>

<h3>Right to Opt-Out (CCPA § 1798.120)</h3>
<p>Opt out of the sale of your personal information.</p>

<h3>Right to Non-Discrimination (CCPA § 1798.125)</h3>
<p>You will not receive discriminatory treatment for exercising your privacy rights.</p>

<h3>Right to Correct (CPRA § 1798.106)</h3>
<p>Request correction of inaccurate personal information.</p>

<h3>Right to Limit Use (CPRA § 1798.121)</h3>
<p>Limit use and disclosure of sensitive personal information.</p>

<h2>6. How to Exercise Your Rights</h2>

<p>To submit a request:</p>

<ul>
  <li><strong>Online:</strong> {{request_portal_url}}</li>
  <li><strong>Email:</strong> {{privacy_email}}</li>
  <li><strong>Phone:</strong> {{toll_free_number}}</li>
  <li><strong>Do Not Sell Link:</strong> <a href="{{do_not_sell_url}}">Do Not Sell My Personal Information</a></li>
</ul>

<p>We will respond within <strong>45 days</strong> (extendable by 45 days if needed).</p>

<h2>7. Verification Process</h2>

<p>To protect your privacy, we verify your identity before processing requests by:</p>

<ul>
  <li>Matching provided information to information in our records</li>
  <li>Requiring multi-factor authentication for account holders</li>
  <li>Using authorized agents with written permission</li>
</ul>

<h2>8. Sensitive Personal Information</h2>

<p>We <strong>{{collects_sensitive_info}}</strong> collect sensitive personal information (e.g., Social Security numbers, precise geolocation, health data). {{sensitive_info_details}}</p>

<h2>9. Retention</h2>

<p>We retain personal information for {{retention_period}} or as required by law.</p>

<h2>10. Contact Us</h2>

<p>For questions about this notice:</p>

<ul>
  <li><strong>Privacy Officer:</strong> {{privacy_officer_name}}</li>
  <li><strong>Email:</strong> {{privacy_email}}</li>
  <li><strong>Address:</strong> {{company_address}}</li>
</ul>

<hr>

<p><em>This notice complies with CCPA/CPRA (Cal. Civ. Code §§ 1798.100-1798.199). Review by legal counsel recommended.</em></p>`
}

export const COOKIE_POLICY: PolicyTemplate = {
  id: 'cookie-policy',
  name: 'Cookie Policy',
  description: 'Comprehensive cookie and tracking technology policy',
  jurisdiction: 'EU',
  framework: ['GDPR', 'ePrivacy Directive'],
  content: `<h1>Cookie Policy</h1>

<p><em>Last Updated: {{effective_date}}</em></p>

<p>This Cookie Policy explains how <strong>{{company_name}}</strong> uses cookies and similar tracking technologies on our website and services.</p>

<h2>1. What Are Cookies?</h2>

<p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.</p>

<h2>2. Types of Cookies We Use</h2>

<h3>2.1 Strictly Necessary Cookies</h3>
<p>Essential for the website to function. Cannot be disabled.</p>
<ul>
  <li><strong>Session Management:</strong> Authentication, security</li>
  <li><strong>Load Balancing:</strong> Server distribution</li>
  <li><strong>Security:</strong> Fraud prevention, CSRF protection</li>
</ul>

<h3>2.2 Functional Cookies</h3>
<p>Remember your preferences and choices.</p>
<ul>
  <li><strong>Language Preference:</strong> Your selected language</li>
  <li><strong>Region Selection:</strong> Your country/location</li>
  <li><strong>UI Preferences:</strong> Theme, layout options</li>
</ul>

<h3>2.3 Analytics Cookies</h3>
<p>Help us understand how visitors use our site.</p>
<ul>
  <li><strong>Google Analytics:</strong> Usage statistics, demographics</li>
  <li><strong>Hotjar:</strong> Heatmaps, user recordings</li>
  <li><strong>Internal Analytics:</strong> Custom tracking</li>
</ul>

<h3>2.4 Marketing Cookies</h3>
<p>Track your activity to show relevant ads.</p>
<ul>
  <li><strong>Google Ads:</strong> Remarketing, conversion tracking</li>
  <li><strong>Facebook Pixel:</strong> Social media advertising</li>
  <li><strong>LinkedIn Insight:</strong> B2B advertising</li>
</ul>

<h2>3. Cookie Details</h2>

<table>
  <thead>
    <tr>
      <th>Cookie Name</th>
      <th>Purpose</th>
      <th>Duration</th>
      <th>Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>session_id</td>
      <td>Session management</td>
      <td>Session</td>
      <td>Necessary</td>
    </tr>
    <tr>
      <td>_ga</td>
      <td>Google Analytics</td>
      <td>2 years</td>
      <td>Analytics</td>
    </tr>
    <tr>
      <td>_fbp</td>
      <td>Facebook Pixel</td>
      <td>3 months</td>
      <td>Marketing</td>
    </tr>
  </tbody>
</table>

<h2>4. Third-Party Cookies</h2>

<p>We use third-party services that set cookies:</p>

<ul>
  <li><strong>Google Analytics:</strong> <a href="https://policies.google.com/privacy">Privacy Policy</a></li>
  <li><strong>Facebook:</strong> <a href="https://www.facebook.com/privacy/explanation">Privacy Policy</a></li>
  <li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/legal/privacy-policy">Privacy Policy</a></li>
</ul>

<h2>5. Managing Cookies</h2>

<h3>5.1 Cookie Consent Manager</h3>
<p>Use our cookie banner to manage your preferences: <a href="{{cookie_preferences_url}}">Cookie Preferences</a></p>

<h3>5.2 Browser Settings</h3>
<p>Most browsers allow you to:</p>
<ul>
  <li>View and delete cookies</li>
  <li>Block third-party cookies</li>
  <li>Block all cookies (may affect functionality)</li>
</ul>

<p><strong>Browser Help:</strong></p>
<ul>
  <li><a href="https://support.google.com/chrome/answer/95647">Chrome</a></li>
  <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop">Firefox</a></li>
  <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac">Safari</a></li>
  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09">Edge</a></li>
</ul>

<h3>5.3 Opt-Out Tools</h3>
<ul>
  <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout">Opt-out Browser Add-on</a></li>
  <li><strong>NAI Opt-Out:</strong> <a href="http://www.networkadvertising.org/choices/">Network Advertising Initiative</a></li>
  <li><strong>DAA Opt-Out:</strong> <a href="http://www.aboutads.info/choices/">Digital Advertising Alliance</a></li>
</ul>

<h2>6. Do Not Track</h2>

<p>We <strong>{{honors_dnt}}</strong> honor Do Not Track signals. {{dnt_details}}</p>

<h2>7. Updates to This Policy</h2>

<p>We may update this Cookie Policy. Changes will be posted with a new "Last Updated" date.</p>

<h2>8. Contact Us</h2>

<p>Questions about our cookie practices:</p>

<ul>
  <li><strong>Email:</strong> {{privacy_email}}</li>
  <li><strong>Address:</strong> {{company_address}}</li>
</ul>

<hr>

<p><em>This policy complies with GDPR and ePrivacy Directive requirements. Legal review recommended.</em></p>`
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  GDPR_PRIVACY_POLICY,
  CCPA_PRIVACY_POLICY,
  COOKIE_POLICY,
]

/**
 * Get a template by ID
 */
export function getTemplate(id: string): PolicyTemplate | undefined {
  return POLICY_TEMPLATES.find(t => t.id === id)
}

/**
 * Substitute template variables in content
 */
export function substituteVariables(content: string, variables: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value)
  }
  return result
}

/**
 * Extract template variables from content
 */
export function extractVariables(content: string): string[] {
  const regex = /{{(\w+)}}/g
  const matches = content.matchAll(regex)
  const variables = new Set<string>()
  for (const match of matches) {
    variables.add(match[1])
  }
  return Array.from(variables).sort()
}
