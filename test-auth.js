/**
 * Quick OAuth Testing Script
 *
 * This script can be run in the Electron DevTools console to test OAuth functionality.
 *
 * Usage:
 * 1. Open the app with `npm run dev`
 * 2. Open DevTools (should open automatically)
 * 3. Copy and paste this entire script into the console
 * 4. Call any of the test functions:
 *    - testLogin()
 *    - testCheckAuth()
 *    - testGetStatus()
 *    - testLogout()
 *    - runAllTests()
 */

// Test 1: Login with Google
async function testLogin() {
  console.log('\n=== Testing Google Login ===');
  try {
    const result = await window.electronAPI.googleAuth();
    console.log('✅ Login result:', result);
    return result;
  } catch (error) {
    console.error('❌ Login error:', error);
    return { error };
  }
}

// Test 2: Check authentication status
async function testCheckAuth() {
  console.log('\n=== Testing Check Auth ===');
  try {
    const result = await window.electronAPI.checkAuth();
    console.log('✅ Auth status:', result);
    return result;
  } catch (error) {
    console.error('❌ Check auth error:', error);
    return { error };
  }
}

// Test 3: Get detailed authentication status
async function testGetStatus() {
  console.log('\n=== Testing Get Auth Status ===');
  try {
    const result = await window.electronAPI.getAuthStatus();
    console.log('✅ Detailed status:', result);

    if (result.expiresAt) {
      const expiryDate = new Date(result.expiresAt);
      const now = new Date();
      const minutesUntilExpiry = Math.floor((expiryDate - now) / 1000 / 60);
      console.log(`⏰ Token expires in ${minutesUntilExpiry} minutes (${expiryDate.toLocaleString()})`);
    }

    return result;
  } catch (error) {
    console.error('❌ Get status error:', error);
    return { error };
  }
}

// Test 4: Logout
async function testLogout() {
  console.log('\n=== Testing Logout ===');
  try {
    const result = await window.electronAPI.logout();
    console.log('✅ Logout result:', result);
    return result;
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { error };
  }
}

// Run all tests in sequence
async function runAllTests() {
  console.log('\n🚀 Running all OAuth tests...\n');

  // Test 1: Check initial status
  await testCheckAuth();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Get detailed status
  await testGetStatus();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Login (if not authenticated)
  const status = await window.electronAPI.checkAuth();
  if (!status.authenticated) {
    console.log('\n⚠️  Not authenticated, initiating login...');
    await testLogin();
    console.log('\n⏳ Waiting for you to complete OAuth flow in browser...');
    console.log('After completing login in browser, run: continueTests()');
  } else {
    console.log('\n✅ Already authenticated, skipping login test');
    await continueTests();
  }
}

// Continue tests after OAuth flow
async function continueTests() {
  console.log('\n📋 Continuing tests...\n');

  // Verify authentication
  await testCheckAuth();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGetStatus();
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n✅ All tests completed!');
  console.log('\n📝 To test logout, run: testLogout()');
}

// Print available functions
console.log('🧪 OAuth Test Functions Available:');
console.log('  - testLogin()       : Test Google OAuth login');
console.log('  - testCheckAuth()   : Check if authenticated');
console.log('  - testGetStatus()   : Get detailed auth status');
console.log('  - testLogout()      : Test logout');
console.log('  - runAllTests()     : Run all tests in sequence');
console.log('\n💡 Tip: Start with runAllTests() for a complete test');
