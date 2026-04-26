// Paste this entire block into your Browser Console on the AdFlow Pro dashboard page

(async function checkSupabase() {
  console.log("🔍 Starting Supabase Client Diagnostics...");

  // 1. Check if Supabase client is attached to the window (Next.js doesn't usually do this natively, 
  // so we will inspect the localStorage tokens directly)
  const storageKeys = Object.keys(localStorage);
  const authKey = storageKeys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  
  if (!authKey) {
    console.error("❌ No Supabase auth token found in localStorage. You might not be logged in.");
    return;
  }

  try {
    const sessionDataStr = localStorage.getItem(authKey);
    const sessionData = JSON.parse(sessionDataStr);
    
    console.log("✅ Found Supabase Session:");
    console.log("User ID:", sessionData.user?.id);
    console.log("Email:", sessionData.user?.email);
    console.log("Role:", sessionData.user?.role);
    
    // 2. Check token expiration
    const expiresAt = new Date(sessionData.expires_at * 1000);
    const now = new Date();
    
    if (now > expiresAt) {
      console.error("❌ SESSION EXPIRED at", expiresAt.toLocaleString(), "- You need to log out and log back in.");
    } else {
      console.log("✅ Session is active. Expires at:", expiresAt.toLocaleString());
    }

    // 3. Test a raw API request to see exactly what PostgREST returns
    // We will pull the URL and ANON key from the NEXT_PUBLIC_ variables embedded in the page
    // Next.js injects these into the window if exposed, but we can also just make a raw fetch
    // to the URL you provided in the prompt.
    
    const url = "https://gthzmeholavvqoejsgxo.supabase.co";
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHptZWhvbGF2dnFvZWpzZ3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Nzg2NDIsImV4cCI6MjA5MTE1NDY0Mn0.l5B8L864fA1Z2s2Vht8o7iIRxdMe26A4lPlmh4uvD-w";
    const token = sessionData.access_token;

    console.log("🔄 Testing raw PostgREST query to public.users...");
    
    const response = await fetch(`${url}/rest/v1/users?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log("✅ Raw API test SUCCESS! Data:", JSON.parse(responseText));
    } else {
      console.error(`❌ Raw API test FAILED with status: ${response.status}`);
      console.error("Response details:", responseText);
      console.error("If this says 'permission denied' or similar, your Postgres GRANTS are missing (run the restore_supabase_grants.sql script).");
    }

  } catch (err) {
    console.error("❌ Error parsing session data or running test:", err);
  }
})();
