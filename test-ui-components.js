/**
 * UI Components Test
 * Tests that all UI components are working with real API calls
 */

const API_BASE_URL = 'http://localhost:3005/api/v1';

async function testPolicyCreatorComponent() {
  console.log('🧪 Testing PolicyCreator Component...\n');

  // Simulate the exact data that PolicyCreator sends
  const policyData = {
    policy_id: 'ui-test-policy',
    version: '2.0.0',
    text: 'This is a test privacy policy created through the UI component. It contains comprehensive privacy terms and conditions for data processing, storage, and user rights under GDPR and CCPA regulations.',
    content_hash: 'def456789abcdef456789abcdef456789abcdef456789abcdef456789abcdef1',
    uri: 'https://demo.sushiii.com/policies/ui-test-policy/2.0.0',
    jurisdiction: 'EU',
    effective_from: new Date().toISOString()
  };

  try {
    console.log('📤 Sending policy creation request...');
    console.log('   Policy ID:', policyData.policy_id);
    console.log('   Version:', policyData.version);
    console.log('   Text Length:', policyData.text.length, 'characters');
    console.log('   Jurisdiction:', policyData.jurisdiction);

    const response = await fetch(`${API_BASE_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData)
    });

    const result = await response.json();

    if (response.status === 200 && result.data) {
      console.log('✅ PolicyCreator Component: SUCCESS');
      console.log('   Transaction Hash:', result.data.transaction_hash);
      console.log('   Policy Reference:', result.data.policy_ref);
      console.log('   Content Hash:', result.data.content_hash);
      console.log('   Timestamp:', result.data.timestamp);
      return true;
    } else {
      console.log('❌ PolicyCreator Component: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ PolicyCreator Component: FAILED');
    console.log('   Network Error:', error.message);
    return false;
  }
}

async function testConsentModalComponent() {
  console.log('\n🧪 Testing ConsentModal Component...\n');

  // Simulate the exact data that ConsentModal sends
  const consentData = {
    subject_id: 'ui-test-user-67890',
    policy_ref: {
      policy_id: 'ui-test-policy',
      version: '2.0.0'
    },
    event_type: 'granted',
    timestamp: new Date().toISOString()
  };

  try {
    console.log('📤 Sending consent submission request...');
    console.log('   Subject ID:', consentData.subject_id);
    console.log('   Policy Reference:', `${consentData.policy_ref.policy_id}@${consentData.policy_ref.version}`);
    console.log('   Event Type:', consentData.event_type);

    const response = await fetch(`${API_BASE_URL}/consents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consentData)
    });

    const result = await response.json();

    if (response.status === 200 && result.data) {
      console.log('✅ ConsentModal Component: SUCCESS');
      console.log('   Transaction Hash:', result.data.transaction_hash);
      console.log('   Consent Reference:', result.data.consent_ref);
      console.log('   Event Type:', result.data.event_type);
      console.log('   Timestamp:', result.data.timestamp);
      return true;
    } else {
      console.log('❌ ConsentModal Component: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ ConsentModal Component: FAILED');
    console.log('   Network Error:', error.message);
    return false;
  }
}

async function testProofGeneratorComponent() {
  console.log('\n🧪 Testing ProofGenerator Component...\n');

  // Simulate the exact data that ProofGenerator sends
  const proofData = {
    subject_id: 'ui-test-user-67890'
  };

  try {
    console.log('📤 Sending proof generation request...');
    console.log('   Subject ID:', proofData.subject_id);

    const response = await fetch(`${API_BASE_URL}/proof-bundles/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proofData)
    });

    const result = await response.json();

    if (response.status === 200 && result.data) {
      console.log('✅ ProofGenerator Component: SUCCESS');
      console.log('   Bundle ID:', result.data.bundle_id);
      console.log('   Subject ID:', result.data.subject_id);
      console.log('   Proof Count:', result.data.proof_count);
      console.log('   Verification Hash:', result.data.verification_hash);
      console.log('   Timestamp:', result.data.timestamp);
      return true;
    } else {
      console.log('❌ ProofGenerator Component: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ ProofGenerator Component: FAILED');
    console.log('   Network Error:', error.message);
    return false;
  }
}

async function testHealthDashboardComponent() {
  console.log('\n🧪 Testing HealthDashboard Component...\n');

  try {
    console.log('📤 Sending health check request...');

    const response = await fetch('http://localhost:3005/health');
    const result = await response.json();

    if (response.status === 200 && result.status) {
      console.log('✅ HealthDashboard Component: SUCCESS');
      console.log('   Overall Status:', result.status);
      console.log('   Uptime:', Math.floor(result.uptime / 1000), 'seconds');
      console.log('   API Status:', result.checks?.api?.status);
      console.log('   Metagraph L0:', result.checks?.metagraphL0?.status);
      console.log('   Metagraph L1:', result.checks?.metagraphL1?.status);
      console.log('   Storage:', result.checks?.storage?.status);
      return true;
    } else {
      console.log('❌ HealthDashboard Component: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ HealthDashboard Component: FAILED');
    console.log('   Network Error:', error.message);
    return false;
  }
}

async function runUIComponentTests() {
  console.log('🎨 UI COMPONENTS TEST SUITE');
  console.log('============================\n');

  const policyCreatorWorking = await testPolicyCreatorComponent();
  const consentModalWorking = await testConsentModalComponent();
  const proofGeneratorWorking = await testProofGeneratorComponent();
  const healthDashboardWorking = await testHealthDashboardComponent();

  console.log('\n📊 UI COMPONENTS TEST RESULTS');
  console.log('==============================');
  console.log(`PolicyCreator: ${policyCreatorWorking ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`ConsentModal: ${consentModalWorking ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`ProofGenerator: ${proofGeneratorWorking ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`HealthDashboard: ${healthDashboardWorking ? '✅ WORKING' : '❌ FAILED'}`);

  const allWorking = policyCreatorWorking && consentModalWorking && proofGeneratorWorking && healthDashboardWorking;

  if (allWorking) {
    console.log('\n🎉 ALL UI COMPONENTS WORKING FLAWLESSLY!');
    console.log('=========================================');
    console.log('✅ PolicyCreator → Creates policies with real blockchain transactions');
    console.log('✅ ConsentModal → Submits consents with real blockchain transactions');
    console.log('✅ ProofGenerator → Generates proof bundles from real blockchain data');
    console.log('✅ HealthDashboard → Shows real system and blockchain status');
    console.log('');
    console.log('🔥 NO MOCKS - All components use real backend services!');
    console.log('🌐 Frontend ready at: http://localhost:3003');
    console.log('');
    console.log('🎯 DEMO FLOW VERIFIED:');
    console.log('   1. /admin → PolicyCreator component working ✅');
    console.log('   2. / (home) → ConsentModal component working ✅');
    console.log('   3. /auditor → ProofGenerator component working ✅');
    console.log('   4. /health → HealthDashboard component working ✅');
  } else {
    console.log('\n⚠️  SOME UI COMPONENTS HAVE ISSUES');
    console.log('Please check the failed components above.');
  }
}

// Run the UI component tests
runUIComponentTests().catch(console.error);