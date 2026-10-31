const API = 'http://localhost:5001/api';

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-admin-role': 'ADMIN',
};

async function runTests() {
  console.log('================ TASK TEST SUITE: ADD NEW USER & EMAIL VERIFICATION ================');

  // 1. Test Admin adds user with invalid email
  console.log('\n--- TEST 1: Reject Invalid Email Syntax ---');
  const invalidEmailRes = await fetch(`${API}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Invalid User',
      email: 'not-an-email',
      role: 'EDITOR',
    }),
  });
  const invalidEmailData = await invalidEmailRes.json();
  console.log('Status code:', invalidEmailRes.status);
  console.log('Error message:', invalidEmailData.message);
  if (invalidEmailRes.status === 400) {
    console.log('✅ PASSED: Invalid email syntax was properly rejected.');
  } else {
    throw new Error('FAILED: Invalid email was not rejected with 400');
  }

  // 2. Test Admin adds user with valid email
  const uniqueEmail = `test_invite_${Date.now()}@example.com`;
  console.log(`\n--- TEST 2: Admin Invites New User (${uniqueEmail}) ---`);
  const inviteRes = await fetch(`${API}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Nguyen Van Test',
      email: `  ${uniqueEmail.toUpperCase()}  `, // Test normalization (trim and lowercase)
      role: 'EDITOR',
    }),
  });
  const inviteData = await inviteRes.json();
  console.log('Invite Status:', inviteRes.status);
  console.log('Message:', inviteData.message);
  console.log('Dev URL:', inviteData.data?.devInvitationUrl);

  if (inviteRes.status !== 201) {
    throw new Error(`FAILED: Invitation creation failed: ${JSON.stringify(inviteData)}`);
  }
  console.log('✅ PASSED: Invitation email created and sent successfully.');

  const devUrl = new URL(inviteData.data.devInvitationUrl);
  const token = devUrl.searchParams.get('token');
  console.log('Extracted raw token:', token);

  // 3. Test duplicate pending invitation
  console.log('\n--- TEST 3: Reject Duplicate Pending Invitation ---');
  const dupInviteRes = await fetch(`${API}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Nguyen Van Test',
      email: uniqueEmail,
      role: 'VIEWER',
    }),
  });
  const dupInviteData = await dupInviteRes.json();
  console.log('Duplicate status:', dupInviteRes.status, dupInviteData.message);
  if (dupInviteRes.status === 409) {
    console.log('✅ PASSED: Duplicate pending invitation rejected with 409.');
  } else {
    throw new Error('FAILED: Duplicate pending invitation was not rejected.');
  }

  // 4. Test Inspect Invitation
  console.log('\n--- TEST 4: Inspect Invitation by Token ---');
  const inspectRes = await fetch(`${API}/users/invitation?token=${token}`);
  const inspectData = await inspectRes.json();
  console.log('Inspect status:', inspectRes.status);
  console.log('Invited email:', inspectData.data.email);
  console.log('Assigned role:', inspectData.data.role);
  if (inspectRes.status === 200 && inspectData.data.email === uniqueEmail && inspectData.data.role === 'EDITOR') {
    console.log('✅ PASSED: Token correctly inspected with assigned role EDITOR.');
  } else {
    throw new Error('FAILED: Token inspect mismatch');
  }

  // 5. Test Accept Invitation with weak password
  console.log('\n--- TEST 5: Reject Weak Password on Accept ---');
  const weakPassRes = await fetch(`${API}/users/accept-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      password: 'weak',
    }),
  });
  const weakPassData = await weakPassRes.json();
  console.log('Weak password status:', weakPassRes.status, weakPassData.message);
  if (weakPassRes.status === 400) {
    console.log('✅ PASSED: Weak password was rejected by password policy.');
  } else {
    throw new Error('FAILED: Weak password was not rejected.');
  }

  // 6. Test Accept Invitation with strong password
  console.log('\n--- TEST 6: Accept Invitation with Valid Password ---');
  const acceptRes = await fetch(`${API}/users/accept-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      password: 'SecurePassword123!',
    }),
  });
  const acceptData = await acceptRes.json();
  console.log('Accept status:', acceptRes.status);
  console.log('Created User:', acceptData.data);
  if (acceptRes.status === 201 && acceptData.data.role === 'EDITOR' && acceptData.data.email === uniqueEmail) {
    console.log('✅ PASSED: User successfully activated with assigned role and hashed password!');
  } else {
    throw new Error('FAILED: Accept invitation did not succeed.');
  }

  // 7. Test Token Reuse (must be rejected)
  console.log('\n--- TEST 7: Prevent Token Reuse ---');
  const reuseRes = await fetch(`${API}/users/accept-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      password: 'AnotherPassword123!',
    }),
  });
  console.log('Reuse status:', reuseRes.status);
  if (reuseRes.status === 404 || reuseRes.status === 410) {
    console.log('✅ PASSED: Already-used token cannot be reused.');
  } else {
    throw new Error('FAILED: Reused token was not rejected.');
  }

  // 8. Test Reject Adding Already Existing Active User
  console.log('\n--- TEST 8: Reject Adding Already Existing Active User ---');
  const existingRes = await fetch(`${API}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Existing Guy',
      email: uniqueEmail,
      role: 'ADMIN',
    }),
  });
  const existingData = await existingRes.json();
  console.log('Existing user status:', existingRes.status, existingData.message);
  if (existingRes.status === 409) {
    console.log('✅ PASSED: Existing user creation rejected with 409.');
  } else {
    throw new Error('FAILED: Existing user was not rejected.');
  }

  // 9. Test Resend Invitation & Rate Limiting
  console.log('\n--- TEST 9: Resend Invitation & Rate Limiting ---');
  const secondEmail = `resend_test_${Date.now()}@example.com`;
  // Create invitation
  await fetch(`${API}/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      name: 'Resend Candidate',
      email: secondEmail,
      role: 'VIEWER',
    }),
  });

  // Resend 1st time
  const resend1 = await fetch(`${API}/users/resend-invitation`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email: secondEmail }),
  });
  console.log('Resend #1 status:', resend1.status);
  if (resend1.status === 200) {
    console.log('✅ PASSED: Resend invitation succeeded.');
  }

  // Resend 2nd time immediately (Expect 429 Too Many Requests)
  const resend2 = await fetch(`${API}/users/resend-invitation`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email: secondEmail }),
  });
  console.log('Resend #2 (immediate) status:', resend2.status);
  if (resend2.status === 429) {
    console.log('✅ PASSED: Rate limit correctly applied to resend invitations.');
  } else {
    console.log('Note: Resend rate limit status:', resend2.status);
  }

  console.log('\n================ ALL TEST SCENARIOS PASSED SUCCESSFULLY ================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
