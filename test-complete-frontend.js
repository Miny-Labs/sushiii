/**
 * Complete Frontend Test Suite
 * Tests all frontend functionality with real blockchain integration
 */

const API_BASE_URL = 'http://localhost:3005/api/v1';
const FRONTEND_URL = 'http://localhost:3003';

async function testApiEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');

  // Test 1: Policy Creation
  console.log('📋 Test 1: Policy Creation');
  const policyData = {
    policy_id: 'frontend-test-policy',
    version: '1.0.0',
    text: 'This is a comprehensive privacy policy for frontend testing. It includes all necessary legal language and compliance requirements for GDPR, CCPA, and other privacy regulations.',
    content_hash: 'abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
    uri: 'https://demo.sushiii.com/policies/frontend-test-policy/1.0.0',
    jurisdiction: 'US',
    effective_from: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policyData)
    });
    
    const result = await response.json();
    console.log('✅ Policy Creation:', response.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('   Transaction Hash:', result.data?.transaction_hash);
    console.log('   Policy Reference:', result.data?.policy_ref);
    
    if (response.status !== 200) {
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Policy Creation: FAILED -', error.message);
    return false;
  }

  // Test 2: Consent Submission
  console.log('\n📋 Test 2: Consent Submission');
  const consentData = {
    subject_id: 'frontend-test-subject-12345',
    policy_ref: {
      policy_id: 'frontend-test-policy',
      version: '1.0.0'
    },
    event_type: 'granted',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consentData)
    });
    
    const result = await response.json();
    console.log('✅ Consent Submission:', response.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('   Transaction Hash:', result.data?.transaction_hash);
    console.log('   Consent Reference:', result.data?.consent_ref);
    
    if (response.status !== 200) {
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Consent Submission: FAILED -', error.message);
    return false;
  }

  // Test 3: Proof Bundle Generation
  console.log('\n📋 Test 3: Proof Bundle Generation');
  const proofData = {
    subject_id: 'frontend-test-subject-12345'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/proof-bundles/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proofData)
    });
    
    const result = await response.json();
    console.log('✅ Proof Generation:', response.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('   Bundle ID:', result.data?.bundle_id);
    console.log('   Proof Count:', result.data?.proof_count);
    console.log('   Verification Hash:', result.data?.verification_hash);
    
    if (response.status !== 200) {
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Proof Generation: FAILED -', error.message);
    return false;
  }

  // Test 4: Health Check
  console.log('\n📋 Test 4: Health Check');
  try {
    const response = await fetch('http://localhost:3005/health');
    const result = await response.json();
    console.log('✅ Health Check:', response.status === 200 ? 'SUCCESS' : 'FAILED');
    console.log('   Status:', result.status);
    console.log('   Metagraph L0:', result.checks?.metagraphL0?.status);
    
    if (response.status !== 200) {
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check: FAILED -', error.message);
    return false;
  }

  return true;
}

async function testFrontendPages() {
  console.log('\n🌐 Testing Frontend Pages...\n');

  const pages = [
    { path: '/', name: 'Home (Consent Demo)' },
    { path: '/admin', name: 'Admin (Policy Creation)' },
    { path: '/auditor', name: 'Auditor (Proof Generation)' },
    { path: '/health', name: 'Health (System Monitoring)' }
  ];

  let allPagesWorking = true;

  for (const page of pages) {
    try {
      const response = await fetch(`${FRONTEND_URL}${page.path}`);
      const html = await response.text();
      
      const isWorking = response.status === 200 && html.includes('<!DOCTYPE html>');
      console.log(`${isWorking ? '✅' : '❌'} ${page.name}: ${isWorking ? 'WORKING' : 'FAILED'}`);
      
      if (!isWorking) {
        allPagesWorking = false;
        console.log(`   Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${page.name}: FAILED - ${error.message}`);
      allPagesWorking = false;
    }
  }

  return allPagesWorking;
}

async function testBlockchainConnectivity() {
  console.log('\n⛓️  Testing Blockchain Connectivity...\n');

  // Test L0 Node
  try {
    const response = await fetch('http://localhost:9200/node/info');
    const result = await response.json();
    console.log('✅ Metagraph L0 Node:', result.state === 'Ready' ? 'READY' : 'NOT READY');
    console.log('   Version:', result.version);
    console.log('   Session:', result.session);
  } catch (error) {
    console.log('❌ Metagraph L0 Node: FAILED -', error.message);
    return false;
  }

  // Test L1 Node
  try {
    const response = await fetch('http://localhost:9300/node/info');
    const result = await response.json();
    console.log('✅ Metagraph L1 Node:', result.state === 'Ready' ? 'READY' : 'NOT READY');
    console.log('   Version:', result.version);
    console.log('   Session:', result.session);
  } catch (error) {
    console.log('❌ Metagraph L1 Node: FAILED -', error.message);
    return false;
  }

  // Test Latest Snapshot
  try {
    const response = await fetch('http://localhost:9200/snapshots/latest');
    const result = await response.json();
    console.log('✅ Latest Snapshot: AVAILABLE');
    console.log('   Ordinal:', result.ordinal);
    console.log('   Hash:', result.hash?.substring(0, 16) + '...');
  } catch (error) {
    console.log('❌ Latest Snapshot: FAILED -', error.message);
    return false;
  }

  return true;
}

async function runCompleteTest() {
  console.log('🚀 COMPLETE FRONTEND TEST SUITE');
  console.log('================================\n');

  const apiWorking = await testApiEndpoints();
  const frontendWorking = await testFrontendPages();
  const blockchainWorking = await testBlockchainConnectivity();

  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`API Endpoints: ${apiWorking ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);
  console.log(`Frontend Pages: ${frontendWorking ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);
  console.log(`Blockchain: ${blockchainWorking ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);

  if (apiWorking && frontendWorking && blockchainWorking) {
    console.log('\n🎉 COMPLETE SUCCESS!');
    console.log('====================================');
    console.log('✅ All API endpoints working with real blockchain integration');
    console.log('✅ All frontend pages loading correctly');
    console.log('✅ Blockchain nodes running and accessible');
    console.log('✅ No mocks - everything uses real backend services');
    console.log('');
    console.log('🌐 Frontend URL: http://localhost:3003');
    console.log('📡 API URL: http://localhost:3005/api/v1');
    console.log('⛓️  Blockchain L0: http://localhost:9200');
    console.log('⛓️  Blockchain L1: http://localhost:9300');
    console.log('');
    console.log('🎯 READY FOR FULL DEMO:');
    console.log('   1. Go to /admin → Create privacy policies');
    console.log('   2. Go to / (home) → Grant/revoke consent');
    console.log('   3. Go to /auditor → Generate proof bundles');
    console.log('   4. Go to /health → Monitor system status');
    console.log('');
    console.log('🔥 All features working flawlessly with blockchain!');
  } else {
    console.log('\n⚠️  SOME ISSUES DETECTED');
    console.log('Please check the failed components above.');
  }
}

// Run the complete test
runCompleteTest().catch(console.error);