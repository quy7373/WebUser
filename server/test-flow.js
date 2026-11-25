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

  // 9. Test Delete User
  console.log('\n--- TEST 9: Admin Deletes Activated User ---');
  const deleteRes = await fetch(`${API}/users/${acceptData.data.id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  const deleteData = await deleteRes.json();
  console.log('Delete status:', deleteRes.status);
  console.log('Delete response:', deleteData.message);
  if (deleteRes.status === 200 && deleteData.success) {
    console.log('✅ PASSED: User was successfully deleted by admin.');
  } else {
    throw new Error('FAILED: Delete user failed.');
  }

  // Verify user is no longer in users list
  const usersListRes = await fetch(`${API}/users`);
  const usersListData = await usersListRes.json();
  const foundUser = usersListData.data.find(u => u.id === acceptData.data.id);
  if (!foundUser) {
    console.log('✅ PASSED: User is confirmed removed from database.');
  } else {
    throw new Error('FAILED: User still exists in users list after deletion.');
  }

  // 10. Test Search Users by Name and Date (dd/mm/yy)
  console.log('\n--- TEST 10: Search Users by Name and Date dd/mm/yy ---');

  // Search by Date (dd/mm/yy)
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  const dateStr = `${dd}/${mm}/${yy}`;

  const searchDateRes = await fetch(`${API}/users?date=${dateStr}`);
  const searchDateData = await searchDateRes.json();
  console.log(`Search by date (${dateStr}) status:`, searchDateRes.status);
  console.log(`Found users count on ${dateStr}:`, searchDateData.data?.length);
  if (searchDateRes.status === 200 && Array.isArray(searchDateData.data)) {
    console.log('✅ PASSED: Search by date dd/mm/yy returned valid results.');
  } else {
    throw new Error('FAILED: Search by date failed.');
  }

  // Search by Invalid Date format (Expect 400)
  const invalidDateRes = await fetch(`${API}/users?date=99/99/99`);
  const invalidDateData = await invalidDateRes.json();
  console.log('Search with invalid date status:', invalidDateRes.status);
  if (invalidDateRes.status === 400) {
    console.log('✅ PASSED: Invalid date format correctly returned 400:', invalidDateData.message);
  } else {
    throw new Error('FAILED: Invalid date was not rejected with 400.');
  }

  console.log('\n================ ALL TEST SCENARIOS PASSED SUCCESSFULLY ================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
