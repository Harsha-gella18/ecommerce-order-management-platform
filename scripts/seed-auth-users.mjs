/**
 * Inserts demo users into MongoDB (auth_db.users_auth) with BCrypt hashes compatible
 * with Spring Security (cost 10). Skips emails that already exist.
 *
 * Usage (from repo root):
 *   npm run seed:users
 *
 * Requires MongoDB running. Uses AUTH_MONGODB_URI from env or .env at repo root,
 * default mongodb://127.0.0.1:27017/auth_db
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = parseEnvFile(path.join(root, '.env'));
let uri =
  process.env.AUTH_MONGODB_URI ||
  fileEnv.AUTH_MONGODB_URI ||
  'mongodb://127.0.0.1:27017/auth_db';

/* Atlas / SRV URIs must include the database path before "?": ...mongodb.net/auth_db?... */
if (/\.mongodb\.net\/(\?|$)/i.test(uri) || /\.mongodb\.net\/\s*$/i.test(uri.split('?')[0])) {
  console.error(
    'AUTH_MONGODB_URI must include the database name, e.g. ...mongodb.net/auth_db?retryWrites=true&w=majority'
  );
  process.exit(1);
}

/** Same accounts as auth-service DataSeed + docs/demo-credentials.md */
const SEED_USERS = [
  { email: 'admin@example.com', password: 'Admin@123', role: 'ADMIN' },
  { email: 'ops.admin@example.com', password: 'OpsAdmin@123', role: 'ADMIN' },
  { email: 'customer@example.com', password: 'Customer@123', role: 'CUSTOMER' },
  { email: 'demo.shopper@example.com', password: 'Shopper@123', role: 'CUSTOMER' },
  { email: 'jane.buyer@example.com', password: 'Buyer@123', role: 'CUSTOMER' },
  { email: 'alex.martinez@example.com', password: 'AlexDemo@123', role: 'CUSTOMER' },
  { email: 'store.demo@example.com', password: 'StoreDemo@123', role: 'CUSTOMER' },
  { email: 'direct.login@example.com', password: 'DirectLogin@123', role: 'CUSTOMER' },
  { email: 'simple.user@example.com', password: 'SimpleUser@1', role: 'CUSTOMER' },
  { email: 'admin.direct@example.com', password: 'AdminDirect@123', role: 'ADMIN' },
];

const COLLECTION = 'users_auth';

async function main() {
  console.log('MongoDB:', uri.replace(/:[^:@/]+@/, ':****@'));
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20_000 });
  await client.connect();
  const db = client.db();
  const col = db.collection(COLLECTION);

  let added = 0;
  let skipped = 0;

  for (const u of SEED_USERS) {
    const email = u.email.toLowerCase().trim();
    const exists = await col.findOne({ email });
    if (exists) {
      console.log('  skip (exists):', email);
      skipped++;
      continue;
    }
    const passwordHash = bcrypt.hashSync(u.password, 10);
    await col.insertOne({
      _id: new ObjectId(),
      email,
      passwordHash,
      role: u.role,
      status: 'ACTIVE',
      createdAt: new Date(),
    });
    console.log('  added:', email, `(${u.role})`);
    added++;
  }

  await client.close();
  console.log(`Done. Added ${added}, skipped ${skipped}. Log in via the app with the emails/passwords in docs/demo-credentials.md`);
}

main().catch((e) => {
  const msg = e.message || String(e);
  console.error(msg);
  if (/ECONNREFUSED|timed out|Server selection/i.test(msg)) {
    console.error('Tip (Atlas): Network Access → allow your IP; URI must include /auth_db before ?.');
  }
  process.exit(1);
});
