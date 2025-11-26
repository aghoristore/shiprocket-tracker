const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const SR_EMAIL = process.env.SR_EMAIL;
const SR_PASSWORD = process.env.SR_PASSWORD;

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const res = await fetch(
    'https://apiv2.shiprocket.in/v1/external/auth/login',
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SR_EMAIL, password: SR_PASSWORD })
    }
  );

  const json = await res.json();
  cachedToken = json.token;
  tokenExpiry = now + (9 * 24 * 60 * 60 * 1000);
  return cachedToken;
}

app.get("/track/awb/:awb", async (req, res) => {
  try {
    const awb = req.params.awb;
    const token = await getToken();

    const url = `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`;

    const r = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await r.json();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
