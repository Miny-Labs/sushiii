const axios = require('axios');

const APP_URL = 'http://localhost:3003';
const API_URL = 'http://localhost:3001';

// Test routes and pages
const routes = [
  { path: '/', name: 'Home Page' },
  { path: '/dashboard', name: 'Dashboard Page' },
  { path: '/demo/dashboard', name: 'Demo Dashboard Page' },
  { path: '/health', name: 'Health Check Page' },
  { path: '/demo/health', name: 'Demo Health Check Page' },
];

// API endpoints to test
const apiEndpoints = [
  { path: '/api/health', name: 'API Health Check' },
  { path: '/api/demo/health', name: 'Demo API Health Check' },
  { path: '/api/demo/policies', name: 'Demo Policies API' },
  { path: '/api/demo/consents', name: 'Demo Consents API' },
];

async function testRoute(url, name) {
  try {
    const response = await axios.get(url, { 
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    });
    
    console.log(`✅ ${name}: ${response.status} - ${url}`);
    return { success: true, status: response.status, url, name };
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${url}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message, url, name };
  }
}

async function testAllRoutes() {
  console.log('🚀 Testing Sushiii Application Routes and APIs\n');
  console.log(`Frontend URL: ${APP_URL}`);
  console.log(`API URL: ${API_URL}\n`);
  
  const results = [];
  
  // Test frontend routes
  console.log('📱 Testing Frontend Routes:');
  console.log('=' .repeat(50));
  
  for (const route of routes) {
    const result = await testRoute(`${APP_URL}${route.path}`, route.name);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
  
  console.log('\n🔌 Testing API Endpoints:');
  console.log('=' .repeat(50));
  
  // Test API endpoints
  for (const endpoint of apiEndpoints) {
    const result = await testRoute(`${API_URL}${endpoint.path}`, endpoint.name);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
  
  // Test API with POST request for demo consent
  console.log('\n📝 Testing POST Endpoints:');
  console.log('=' .repeat(50));
  
  try {
    const consentData = {
      subject_id: 'test-subject-' + Date.now(),
      policy_ref: {
        policy_id: 'test-policy',
        version: '1.0.0'
      },
      event_type: 'granted',
      purposes: ['marketing', 'analytics'],
      conditions: {
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    const response = await axios.post(`${API_URL}/api/demo/consents`, consentData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Demo Consent Creation: ${response.status} - POST /api/demo/consents`);
    results.push({ success: true, status: response.status, url: '/api/demo/consents', name: 'Demo Consent Creation' });
  } catch (error) {
    console.log(`❌ Demo Consent Creation: ERROR - POST /api/demo/consents`);
    console.log(`   Error: ${error.message}`);
    results.push({ success: false, error: error.message, url: '/api/demo/consents', name: 'Demo Consent Creation' });
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n🔗 Application Links:');
  console.log('=' .repeat(50));
  console.log(`🏠 Home Page: ${APP_URL}`);
  console.log(`📊 Dashboard: ${APP_URL}/dashboard`);
  console.log(`🎯 Demo Dashboard: ${APP_URL}/demo/dashboard`);
  console.log(`💚 Health Check: ${APP_URL}/health`);
  console.log(`🔧 Demo Health: ${APP_URL}/demo/health`);
  console.log(`🔌 API Health: ${API_URL}/api/health`);
  
  return results;
}

// Run the tests
testAllRoutes().catch(console.error);