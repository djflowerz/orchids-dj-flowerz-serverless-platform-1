const fs = require('fs');
const sa = {
  "type": "service_account",
  "project_id": "flowpay-401a4",
  "private_key_id": "79446312c133ddf6b604296a5ff8501049512021",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDMAfIlZrPraXd+\nLt3SX+9wIN0ob8GDHMIZEllXk1O5bXhRrhnnjgkSLEQK2zKARJyDJBfY6pmFAbOr\n/ZjSTIqsp7xSa/qRq7S7Yu+USDu/wb5wSN29cHaj5UiINLZwckbTMzemIYzmfF5Q\nJ9ZQ0XTeKhP5k7yNOjEAFGplB6ytfME7if4ipCND89z5BzAp1ZGK2RscoUC9LRZl\nO8GMp6gNuBAQotjZe6zwxvz2eGFodwOsvVyVBGLzAgL7+9DZkF6I2JLs+modf1k7\ncijemgbIR6zX884o0zWWp4N7RZcUJpnqcvPcIyT/JxKpg9x3PTQ8iWeyOQ0fOSQT\no7oPM/EHAgMBAAECggEAGeSNVU3pvBFQx0UvhkoC29pv93fnubpmsEPx7vmWAMzy\nHnvYcdlHMXVI1Y/oovsSWlq0ZCWygn0qzsOLJ/XrC+rmLhfiX6bJc5clDU71tmri\nvuGgszCY/khVomP+W9tFPf0cLQvJFF/ooIfN3cgX6zKwAldL8SjXm0j8EAKfWg1n\naZ3Vvq/EPrH9VjCEPdJD21WDADH//ETcRaa4sECNTRXt1wnmXwD1a4td6CZk30Fo\n6YvCcmj5t/YDktHYd2bL4oK9S3WKF7M0akt31l1jwdI/EzheAQAxW2DSby3kJj9l\npNCQsCOrshzxxTGAlm5yUNw5T7ioLldp+lL45XNmsQKBgQDw52YEy24e6oMAXpsA\nsdZyycteLfmrvXQQdkZQ2mBOC7S+XbOBPNjRlo8Uf9zTcWbyZynaLMI05fTaimBE\ncuM6wQ2yWYtPJ6qzJlXSfBtIfrSS8JCCupsxIEqVfmulpF9Wb/Djy8bd+NaP5Iz7\vilcqsOZkwZUETQUNiT4GOKwewKBgQDYyqdZKbz5gHVaqKVa6jlMQRqXo9YsGphx\n4dE8h+RTfo8T/ik4cCdeMvwYXdqdfL9tcvtZl5xZ+J+7Cbk9NIh52myFp9gRQh3k\wlM9Jy55Xz3CwsflhI59HrSmF+y8zehCbPW8k3U2Km0yvvRcYq+7xMihntxOGySh\nBA9PB3tJ5QKBgDtuWtTD+x7VbAwjSsoZFXasIefSH84mpwOIqkA4H5oheS2doDM5\n96N9KT89bBUd3O/gU4rnj+HM+WMQ0D8SuMw95EsjnCKi/pHD21haFcEEwTee8YfO\n0YqFFOFcluH+cya35w3Lr/wC76wADmfsufeKiUbR5rXGqLpzwRsTyJkRAoGAYt+6\nh33zxE+ENn7oO5jL3S1sNXDxw1e142q8hUDtL+9uzg2DO0xbiCj0tSBJDr7Qh9iD\nLo9pLdeo8iMzKukEvZ6TFDpC30wqWiUO1btDBPQdNPClPtbALeyNM5uBy3KV1YXg\nZctTEAs1lolk5aXUxGyxnJTZoX3brNwvJzogTskCgYEA5aMJB8STNstsw45FVXP6\nCCOoD0D5uLK0de9GN397EoFlJ0bDLuH4GQ8F6oSeJeiDZDPrXUYHyLg2kCHcJixj\nPuW0ohHhiGVGuedmnGYkzoa2t92c4HiuHfa0t0kHCNrQkOPK4L6wPYQQ62I0eAB5\xi76SvyRldERUnTWQPxPN3M=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@flowpay-401a4.iam.gserviceaccount.com",
  "client_id": "115674054818625929532",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40flowpay-401a4.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const env = `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCJ-yumwuCfGwxgjRhyCUIIc50_tcmEwb4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flowpay-401a4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flowpay-401a4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flowpay-401a4.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=990425156188
NEXT_PUBLIC_FIREBASE_APP_ID=1:990425156188:web:0b95648801bdd2a7d3f499

FIREBASE_CLIENT_EMAIL=${sa.client_email}
FIREBASE_PRIVATE_KEY="${sa.private_key.replace(/\n/g, '\\n')}"

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_2ed6a5c46ebab203998efd1f5d9c22d2dcc05f71
PAYSTACK_SECRET_KEY=sk_live_ec66162f517e07fb5e2322ec5e5281e2fe3ab74b

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
`;

fs.writeFileSync('.env.local', env);
console.log('.env.local updated');
