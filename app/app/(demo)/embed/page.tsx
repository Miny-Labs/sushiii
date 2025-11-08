'use client'

import { useState } from 'react'
import ConsentWidget, { ConsentWidgetConfig } from '@/components/embed/ConsentWidget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Code, Copy, CheckCircle, Settings, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmbedPage() {
  const [config, setConfig] = useState<ConsentWidgetConfig>({
    primaryColor: '#000000',
    accentColor: '#22c55e',
    borderRadius: '8px',
    fontFamily: 'system-ui, sans-serif',
    showPolicyDetails: true,
    allowIndividualRevoke: true,
    requireAllConsent: false
  })

  const [embedCode, setEmbedCode] = useState('')

  const generateEmbedCode = () => {
    const configString = JSON.stringify(config, null, 2)

    const code = `<!-- Sushiii Consent Widget -->
<div id="sushiii-consent-widget"></div>
<script src="https://cdn.sushiii.com/widget.js"></script>
<script>
  SushiiiConsent.init({
    containerId: 'sushiii-consent-widget',
    config: ${configString}
  });
</script>`

    setEmbedCode(code)
    return code
  }

  const copyToClipboard = () => {
    const code = embedCode || generateEmbedCode()
    navigator.clipboard.writeText(code)
    toast.success('Embed code copied to clipboard!')
  }

  const handleConfigChange = (key: keyof ConsentWidgetConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-expanded">Embeddable Consent Widget</h1>
        <p className="text-muted-foreground font-semi-expanded mt-2">
          Customize and embed the consent widget on your website
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Widget Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="appearance">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Color (Buttons)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Input
                      type="text"
                      value={config.borderRadius}
                      onChange={(e) => handleConfigChange('borderRadius', e.target.value)}
                      placeholder="8px"
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Input
                      type="text"
                      value={config.fontFamily}
                      onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                      placeholder="system-ui, sans-serif"
                      className="font-mono"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Policy Details</Label>
                    <input
                      type="checkbox"
                      checked={config.showPolicyDetails}
                      onChange={(e) => handleConfigChange('showPolicyDetails', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Allow Individual Revoke</Label>
                    <input
                      type="checkbox"
                      checked={config.allowIndividualRevoke}
                      onChange={(e) => handleConfigChange('allowIndividualRevoke', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Require All Consent</Label>
                    <input
                      type="checkbox"
                      checked={config.requireAllConsent}
                      onChange={(e) => handleConfigChange('requireAllConsent', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pre-filled Subject ID (Optional)</Label>
                    <Input
                      type="text"
                      value={config.subjectId || ''}
                      onChange={(e) => handleConfigChange('subjectId', e.target.value)}
                      placeholder="user@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to show input field to users
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Embed Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>HTML Embed Code</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto border">
                  <code>{embedCode || generateEmbedCode()}</code>
                </pre>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateEmbedCode}
                  className="flex-1"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Generate Code
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
                <p className="font-semibold">Implementation Notes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Add the widget div to your page where you want it to appear</li>
                  <li>The script will automatically render the consent widget</li>
                  <li>Customize colors and behavior using the config object</li>
                  <li>All consent events are securely stored on the blockchain</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConsentWidget
                {...config}
                onConsentGranted={(policyIds) => {
                  console.log('Consents granted:', policyIds)
                  toast.success(`Consent granted for ${policyIds.length} policies`)
                }}
                onConsentRevoked={(policyIds) => {
                  console.log('Consents revoked:', policyIds)
                  toast.success(`Consent revoked for ${policyIds.length} policies`)
                }}
              />
            </CardContent>
          </Card>

          {/* Integration Options */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">React/Next.js</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border">
                  <code>{`import ConsentWidget from '@sushiii/widget'

<ConsentWidget
  primaryColor="${config.primaryColor}"
  accentColor="${config.accentColor}"
  showPolicyDetails={${config.showPolicyDetails}}
/>`}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">WordPress</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border">
                  <code>{`[sushiii-consent
  primary_color="${config.primaryColor}"
  accent_color="${config.accentColor}"]`}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Vanilla JavaScript</h3>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto border">
                  <code>{`SushiiiConsent.init({
  containerId: 'widget-container',
  config: ${JSON.stringify({ primaryColor: config.primaryColor }, null, 2)}
});`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
