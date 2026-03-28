export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const body = await req.json();
    const prompt = body.prompt || '';
    const neg = body.negative_prompt || 'blurry, bad quality, ugly';

    const res = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: neg,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            width: 1024,
            height: 1024,
          }
        }),
      }
    );

    if (!res.ok) {
      let msg = `خطأ ${res.status}`;
      if (res.status === 503) msg = 'النموذج يحمّل، انتظر 20 ثانية وحاول مجدداً';
      if (res.status === 429) msg = 'طلبات كثيرة، انتظر قليلاً';
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const buf = await res.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'image/jpeg' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}

export const config = { runtime: 'edge' };
