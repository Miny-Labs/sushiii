/**
 * Debug API connectivity from browser context
 */

// Test the exact same API call that the frontend makes
async function testAPICall() {
  console.log('🔍 Testing API call from browser context...')
  
  const API_BASE_URL = 'http://localhost:3005/api/v1'
  
  const policyData = {
    policy_id: 'debug-test',
    version: '1.0.0',
    content_hash: 'abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234',
    uri: 'https://demo.sushiii.com/policies/debug-test/1.0.0',
    jurisdiction: 'US',
    effective_from: new Date().toISOString()
  }
  
  try {
    console.log('📡 Making fetch request to:', `${API_BASE_URL}/policies`)
    console.log('📦 Request data:', policyData)
    
    const response = await fetch(`${API_BASE_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(policyData)
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log('📋 Response data:', result)
    
    if (result.error && result.error.includes('token')) {
      console.log('✅ API call successful (auth error expected)')
      return true
    } else {
      console.log('⚠️ Unexpected response')
      return false
    }
    
  } catch (error) {
    console.error('❌ Network error:', error)
    console.error('❌ Error type:', error.constructor.name)
    console.error('❌ Error message:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('🔍 This looks like a CORS or network connectivity issue')
      console.log('🔍 Possible causes:')
      console.log('   - API server not running on expected port')
      console.log('   - CORS not properly configured')
      console.log('   - Network firewall blocking request')
      console.log('   - Frontend trying to connect to wrong URL')
    }
    
    return false
  }
}

// Also test a simple health check
async function testHealthCheck() {
  console.log('\n🏥 Testing health endpoint...')
  
  try {
    const response = await fetch('http://localhost:3005/health')
    const result = await response.json()
    console.log('✅ Health check successful:', result.status)
    return true
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    return false
  }
}

async function runDebugTests() {
  console.log('🐛 API Debug Tests\n')
  
  const healthOk = await testHealthCheck()
  const apiOk = await testAPICall()
  
  console.log('\n📊 Debug Results:')
  console.log(`Health Check: ${healthOk ? '✅' : '❌'}`)
  console.log(`API Call: ${apiOk ? '✅' : '❌'}`)
  
  if (!healthOk) {
    console.log('\n🚨 API server connectivity issue detected')
    console.log('   Check if API server is running on port 3005')
  } else if (!apiOk) {
    console.log('\n🚨 CORS or network issue detected')
    console.log('   API server is running but frontend cannot connect')
  } else {
    console.log('\n🎉 API connectivity is working!')
    console.log('   The issue might be in the frontend component')
  }
}

runDebugTests().catch(console.error)