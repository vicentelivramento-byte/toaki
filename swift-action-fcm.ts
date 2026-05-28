// Edge Function: swift-action (FCM V1)
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "toaki-b5eb4",
  "private_key_id": "83d870a18f7f602cb9571d4b182ec2bd4e2376c4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDk1if3r02ip+xJ\n6uLrryAtc0EzstkJcOgu742ockvaYbi/z8ub1SIVxJuAoP1O3ir7X9gA2lxbce3p\ngxa+ygPW3du3BmrFqPMWv8raiuTfEiNUokEOqmAtRtXuBtst34wG5eQmDFdcA2X+\nwr2b1MigNxuMnfC0b/n0+PRWktQ8Ewkb4S/bhJxtqfuOY0iC7cFgkdTge0H8nJy6\nWd9jWXIMo060TyUwZfPcAFMZZ4CyuxqMkUOdmcrvBT9JFTBURV+82jNH+QPuHDGW\ngxQV7HyLiFdhDtKHBZBDgnMCEu/iLi9Wf6+WaSz4qbwVVmgcqQ15xI7Rfawfgnr2\n9G11IhHVAgMBAAECggEAD8ZSiYC4Z5jPUVYjj+8p1vA9w6hVzVCO9ONXHtBIOdTo\nNTLIHKUv3RPJS2/tnlDy4hK8k2x6FuSu65y5hevroVV4ZrDGzfrkTQJqI7AU8Gqx\n7EzmErJ8gEqEh0zKMaqaHsScumG56PIkBxCaHQKpVOAPol0l4W5hqvk5cLlc74oX\n/579RdSpbO8HWTV20jzcxExwQUJhDiisrlhlaOjpZdVc0iWRWO7dcq8ClYpNvg5z\nzNarkOqizvJk/SSo0ywYz7/o8Ereh2BuZlPQrCczyO+TTHfkGy7H+rClrBVjdkoG\naH1NYC2rOu3kJv73x02o6G5xwc2fBL2bjNmKd/RjkQKBgQD68+Vnwvza1I+s3fl5\nutomlzjf7GwsQe7/SSF1YhrRETFpgKV9WwMR5dyAVkyKdI+sjdHwnaZ/MqgfWtw1\nuY2UsjS/7hXklLnGgM4byNJOzSD40SAdQc0ghY+MoY4T4iQk8q2DQzNptjXIn03u\nFAUdawu1wn62Q160kiIjUhJRcQKBgQDpcGNtuYjVIMbEQZ1ivNFu8lyQ9MJ4OcP+\nI/7I/K3U1NAM3fZwAQGuEUG2mLnZiRzcUf2P94KMHfyZUd/YmbsRBJIPc+hRRYaG\n3VAMhLK2EqUQj1OjmczG+t8BBmdHB+48K21RALeEeAJN0gXFADcD0HvHv1hx82TL\n0mvZUQLUpQKBgQCPSqZp2gehOBAVx+WEYXHg6SYbjhayKq+56tsE+JCRYfzR3hgg\nfNBC7vo5+YzY3fePsqb2ej4wkQ84YBwvPRUfm6XNFbhAfb+aHcASU1fqkOxLxrVM\nn17uO/Ucer7ykYTL6Bm1QrDfoqARPw0zbRECnDXigfzyO4OfHXYKrvkwsQKBgQDY\nScu2NHu1jULdQDZE79HUzDY8EKvGnS8dX9iH/KZLVkrWQSo+qJAX6eFK/8Li7YmS\nEV2wcJHCpV4P6K5QkE+k+ukh7DDKbHKyroemsaSr0iaia0oBgVUc4ACTgI1cYNq5\nYTtOHC3tTQxFclzqJMLUg+zMLFwUaIFx4CsRFWBcCQKBgBzIwRsppAQ+9SJpo2JP\nPu/vjejIwt9ReIOSh3i/E+XW47VgJEtMQmh1bwwc/X1LKEg5ubXZAv1ePMym+V1K\nqD4gJOwh+bcouoagP1GQfvB6bjQCGdSemJIT7zkME1Z9vR+EqbbGFIxzWiy/cJbz\nnxSKTHL31xoiFAS/Zt4cymO9\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@toaki-b5eb4.iam.gserviceaccount.com",
  "token_uri": "https://oauth2.googleapis.com/token"
};

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: SERVICE_ACCOUNT.token_uri,
    exp: now + 3600,
    iat: now
  };

  const enc = new TextEncoder();
  function b64url(s: string) {
    return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const sigInput = `${h}.${p}`;

  // Import RSA private key
  const pemBody = SERVICE_ACCOUNT.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(sigInput));
  const jwt = `${sigInput}.${b64url(String.fromCharCode(...new Uint8Array(sig)))}`;

  // Exchange JWT for access token
  const res = await fetch(SERVICE_ACCOUNT.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const body = await req.text();
    console.log('Body:', body);
    const { phone, title, body: msgBody, url } = JSON.parse(body);

    const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Buscar tokens FCM do destinatário
    const sbRes = await fetch(
      `${SUPA_URL}/rest/v1/push_subscriptions?phone=eq.${encodeURIComponent(phone)}&select=*`,
      { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` } }
    );
    const subs = await sbRes.json();
    console.log('Subscrições:', subs.length);
    if (!subs.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...cors, 'Content-Type': 'application/json' } });

    const accessToken = await getAccessToken();
    let sent = 0;

    for (const sub of subs) {
      const fcmToken = sub.subscription?.fcmToken || sub.fcm_token;
      if (!fcmToken) { console.log('Sem FCM token para:', sub.phone); continue; }

      const fcmRes = await fetch(
        `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              token: fcmToken,
              data: { title: title || 'TÔAKI 📍', body: msgBody || 'Nova localização!', url: url || '' },
              webpush: {
                notification: {
                  title: title || 'TÔAKI 📍',
                  body: msgBody || 'Nova localização!',
                  icon: 'https://vicentelivramento-byte.github.io/toaki/icon-192.png',
                  requireInteraction: true
                },
                fcm_options: { link: url }
              }
            }
          })
        }
      );
      const fcmData = await fcmRes.json();
      console.log('FCM response:', JSON.stringify(fcmData));
      if (fcmRes.ok) sent++;
    }

    return new Response(JSON.stringify({ sent, total: subs.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}
