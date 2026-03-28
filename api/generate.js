export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await req.formData();
    const model = body.get('model') || 'core';

    let endpoint = '';
    if (model === 'core') endpoint = 'https://api.stability.ai/v2beta/stable-image/generate/core';
    else if (model === 'ultra') endpoint = 'https://api.stability.ai/v2beta/stable-image/generate/ultra';
    else endpoint = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

    const formData = new FormData();
    for (const [key, value] of body.entries()) {
      if (key !== 'model') formData.append(key, value);
    }
    if (model === 'sd3') formData.append('model', 'sd3.5-large-turbo');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_KEY}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      let errMsg = `Error ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.errors) errMsg = errData.errors.join(', ');
        else if (errData.message) errMsg = errData.message;
        if (response.status === 401) errMsg = 'API Key غير صحيح';
        if (response.status === 402) errMsg = 'رصيد غير كافٍ';
        if (response.status === 422) errMsg = 'محتوى غير مسموح به';
        if (response.status === 429) errMsg = 'انتظر قليلاً';
      } catch {}
      return new Response(JSON.stringify({ error: errMsg }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
