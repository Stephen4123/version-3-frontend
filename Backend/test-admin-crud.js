const fetch = global.fetch ? global.fetch : (...args) => import('node-fetch').then(({ default: f }) => f(...args));


const BASE = 'http://127.0.0.1:3000';
const EMAIL = process.env.ADMIN_EMAIL || 'stephensam2001@gmail.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin@123';

async function login() {
  const r = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const j = await r.json();
  if (!j.token) throw new Error('Login failed: ' + JSON.stringify(j));
  return j.token;
}

async function main() {
  const token = await login();
  const auth = { Authorization: `Bearer ${token}` };

  const resources = [
    {
      name: 'posts',
      base: '/api/admin/posts',
      create: {
        title: 'Test Post',
        content: 'hello',
        excerpt: 'x',
        type: 'news',
        language: 'English',
        published: true,
        publishDate: new Date().toISOString()
      }
    },
    {
      name: 'speeches',
      base: '/api/admin/speeches',
      create: {
        title: 'Test Speech',
        content: 'hello',
        authorName: 'Author',
        authorImage: '',
        date: new Date().toISOString(),
        cardLabel: 'Speech',
        published: true
      }
    },
    {
      name: 'programs',
      base: '/api/admin/programs',
      create: {
        title: 'Test Program',
        lead: 'lead',
        summary: 'summary',
        image: '',
        sections: [],
        howToBegin: ''
      }
    },
    {
      name: 'contributors',
      base: '/api/admin/contributors',
      create: {
        name: 'Test Contributor',
        picture: '',
        bio: 'bio',
        designation: 'desig',
        socialLinks: {},
        active: true,
        order: 1
      }
    },
    {
      name: 'board-members',
      base: '/api/admin/board-members',
      create: {
        name: 'Test Board Member',
        picture: '',
        bio: 'bio',
        designation: 'desig',
        category: 'board',

        socialLinks: {},
        order: 1,
        active: true
      }
    }
  ];

  for (const r of resources) {
    console.log(`\n=== ${r.name} ===`);
    const cRes = await fetch(`${BASE}${r.base}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify(r.create)
    });
    const cJson = await cRes.json();
    console.log('create status', cRes.status);
    if (!cJson.success) throw new Error(`Create failed ${r.name}: ${JSON.stringify(cJson)}`);
    const id = cJson.data?._id || cJson.data?.id;

    const lRes = await fetch(`${BASE}${r.base}`, { headers: auth });
    const lJson = await lRes.json();
    console.log('list status', lRes.status, 'count', Array.isArray(lJson.data) ? lJson.data.length : 'n/a');

    if (id) {
      const gRes = await fetch(`${BASE}${r.base}/${id}`, { headers: auth });
      const gJson = await gRes.json();
      console.log('get by id', gRes.status);

      const dRes = await fetch(`${BASE}${r.base}/${id}`, { method: 'DELETE', headers: auth });
      const dJson = await dRes.json();
      console.log('delete', dRes.status);
    }
  }

  console.log('\nAll tests passed');
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});

