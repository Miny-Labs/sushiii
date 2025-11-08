#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testAdminAuditorInterfaces() {
  console.log('🚀 Testing Admin and Auditor Interfaces...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test Admin Interface
    console.log('📊 Testing Admin Interface...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    
    // Check if admin page loads
    const adminTitle = await page.$eval('h1', el => el.textContent);
    console.log(`✅ Admin page loaded: "${adminTitle}"`);
    
    // Check for key admin elements
    const adminElements = await page.evaluate(() => {
      const elements = {};
      elements.hasOverviewTab = !!document.querySelector('[role="tab"][aria-controls*="overview"]');
      elements.hasPoliciesTab = !!document.querySelector('[role="tab"][aria-controls*="policies"]');
      elements.hasSystemHealthTab = !!document.querySelector('[role="tab"][aria-controls*="system"]');
      elements.hasMetricsCards = document.querySelectorAll('.glass-card').length >= 4;
      elements.hasNewPolicyButton = !!document.querySelector('button:contains("New Policy")') || 
                                   !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('New Policy'));
      return elements;
    });
    
    console.log('   - Overview tab:', adminElements.hasOverviewTab ? '✅' : '❌');
    console.log('   - Policies tab:', adminElements.hasPoliciesTab ? '✅' : '❌');
    console.log('   - System Health tab:', adminElements.hasSystemHealthTab ? '✅' : '❌');
    console.log('   - Metrics cards:', adminElements.hasMetricsCards ? '✅' : '❌');
    console.log('   - New Policy button:', adminElements.hasNewPolicyButton ? '✅' : '❌');
    
    // Test clicking on Policies tab
    try {
      await page.click('[role="tab"]:nth-child(2)'); // Policies tab
      await page.waitForTimeout(1000);
      console.log('   - Policies tab clickable: ✅');
    } catch (error) {
      console.log('   - Policies tab clickable: ❌');
    }
    
    // Test Auditor Interface
    console.log('\n🔍 Testing Auditor Interface...');
    await page.goto('http://localhost:3000/auditor', { waitUntil: 'networkidle0' });
    
    // Check if auditor page loads
    const auditorTitle = await page.$eval('h1', el => el.textContent);
    console.log(`✅ Auditor page loaded: "${auditorTitle}"`);
    
    // Check for key auditor elements
    const auditorElements = await page.evaluate(() => {
      const elements = {};
      elements.hasOverviewTab = !!document.querySelector('[role="tab"][aria-controls*="overview"]');
      elements.hasConsentAuditTab = !!document.querySelector('[role="tab"]') && 
                                   Array.from(document.querySelectorAll('[role="tab"]')).some(tab => 
                                     tab.textContent.includes('Consent') || tab.textContent.includes('Audit'));
      elements.hasBlockchainTab = !!document.querySelector('[role="tab"]') && 
                                 Array.from(document.querySelectorAll('[role="tab"]')).some(tab => 
                                   tab.textContent.includes('Blockchain'));
      elements.hasProofGenerationTab = !!document.querySelector('[role="tab"]') && 
                                      Array.from(document.querySelectorAll('[role="tab"]')).some(tab => 
                                        tab.textContent.includes('Proof'));
      elements.hasMetricsCards = document.querySelectorAll('.glass-card').length >= 4;
      elements.hasSubjectIdInput = !!document.querySelector('input[placeholder*="subject"]') || 
                                  !!document.querySelector('input[placeholder*="Subject"]');
      return elements;
    });
    
    console.log('   - Overview tab:', auditorElements.hasOverviewTab ? '✅' : '❌');
    console.log('   - Consent Audit tab:', auditorElements.hasConsentAuditTab ? '✅' : '❌');
    console.log('   - Blockchain tab:', auditorElements.hasBlockchainTab ? '✅' : '❌');
    console.log('   - Proof Generation tab:', auditorElements.hasProofGenerationTab ? '✅' : '❌');
    console.log('   - Metrics cards:', auditorElements.hasMetricsCards ? '✅' : '❌');
    console.log('   - Subject ID input:', auditorElements.hasSubjectIdInput ? '✅' : '❌');
    
    // Test clicking on Consent Audit tab
    try {
      const consentTab = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
          tab.textContent.includes('Consent') || tab.textContent.includes('Audit')
        );
      });
      if (consentTab) {
        await consentTab.click();
        await page.waitForTimeout(1000);
        console.log('   - Consent Audit tab clickable: ✅');
      } else {
        console.log('   - Consent Audit tab clickable: ❌');
      }
    } catch (error) {
      console.log('   - Consent Audit tab clickable: ❌');
    }
    
    // Test API connectivity
    console.log('\n🌐 Testing API Connectivity...');
    
    // Check if pages make API calls
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes(':3005')) {
        apiCalls.push(request.url());
      }
    });
    
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    
    console.log(`   - API calls detected: ${apiCalls.length > 0 ? '✅' : '❌'}`);
    if (apiCalls.length > 0) {
      console.log(`   - Sample API calls: ${apiCalls.slice(0, 3).join(', ')}`);
    }
    
    // Test error handling
    console.log('\n🛡️ Testing Error Handling...');
    
    // Check if pages handle API errors gracefully
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    
    const hasErrorHandling = await page.evaluate(() => {
      // Look for loading states or error messages
      const hasLoadingStates = !!document.querySelector('.animate-pulse') || 
                              !!document.querySelector('[class*="loading"]');
      const hasErrorMessages = !!document.querySelector('[class*="error"]') ||
                              !!document.querySelector('.text-destructive') ||
                              Array.from(document.querySelectorAll('*')).some(el => 
                                el.textContent && el.textContent.includes('Failed to load'));
      return { hasLoadingStates, hasErrorMessages };
    });
    
    console.log('   - Loading states:', hasErrorHandling.hasLoadingStates ? '✅' : '❌');
    console.log('   - Error handling:', hasErrorHandling.hasErrorMessages ? '✅' : '❌');
    
    console.log('\n🎉 Admin and Auditor Interface Testing Complete!');
    
    // Summary
    const adminScore = Object.values(adminElements).filter(Boolean).length;
    const auditorScore = Object.values(auditorElements).filter(Boolean).length;
    
    console.log(`\n📈 Results Summary:`);
    console.log(`   - Admin Interface: ${adminScore}/5 features working`);
    console.log(`   - Auditor Interface: ${auditorScore}/6 features working`);
    console.log(`   - API Integration: ${apiCalls.length > 0 ? 'Connected' : 'Not Connected'}`);
    console.log(`   - Error Handling: ${hasErrorHandling.hasLoadingStates || hasErrorHandling.hasErrorMessages ? 'Implemented' : 'Basic'}`);
    
    if (adminScore >= 4 && auditorScore >= 5) {
      console.log('\n✅ Both interfaces are working well!');
      return true;
    } else {
      console.log('\n⚠️ Some features may need attention.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAdminAuditorInterfaces()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });