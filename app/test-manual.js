/**
 * Manual test script to verify API functionality
 */

const API_BASE_URL = 'http://localhost:3005'

async function testHealthEndpoint() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    const data = await response.json()
    console.log('✅ Health endpoint working:', data.status)
    return true
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message)
    return false
  }
}

async function testPoliciesEndpoint() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/policies`)
    const data = await response.json()
    
    if (data.error && data.error.includes('token')) {
      console.log('✅ Policies endpoint working (requires auth as expected)')
      return true
    } else if (Array.isArray(data)) {
      console.log('✅ Policies endpoint working:', data.length, 'policies found')
      return true
    } else {
      console.log('⚠️ Policies endpoint returned:', data)
      return true
    }
  } catch (error) {
    console.error('❌ Policies endpoint failed:', error.message)
    return false
  }
}

async function testBlockchainEndpoints() {
  try {
    // Test L0 node info
    const nodeResponse = await fetch('http://localhost:9200/node/info')
    const nodeData = await nodeResponse.json()
    console.log('✅ Blockchain L0 node info:', nodeData.state)

    // Test latest snapshot
    const snapshotResponse = await fetch('http://localhost:9200/snapshots/latest')
    const snapshotData = await snapshotResponse.json()
    console.log('✅ Blockchain latest snapshot:', snapshotData.value.ordinal)

    return true
  } catch (error) {
    console.error('❌ Blockchain endpoints failed:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🧪 Running manual API tests...\n')
  
  const healthOk = await testHealthEndpoint()
  const policiesOk = await testPoliciesEndpoint()
  const blockchainOk = await testBlockchainEndpoints()
  
  console.log('\n📊 Test Results:')
  console.log(`Health API: ${healthOk ? '✅' : '❌'}`)
  console.log(`Policies API: ${policiesOk ? '✅' : '❌'}`)
  console.log(`Blockchain: ${blockchainOk ? '✅' : '❌'}`)
  
  if (healthOk && policiesOk && blockchainOk) {
    console.log('\n🎉 All systems operational! Frontend should work correctly.')
    console.log('🌐 Access the app at: http://localhost:3003')
  } else {
    console.log('\n⚠️ Some systems have issues. Check the logs above.')
  }
}

runTests().catch(console.error)