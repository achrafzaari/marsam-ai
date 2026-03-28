export default async function handler(req) {
  const h = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  if(req.method==='OPTIONS') return new Response(null,{headers:h});
  try {
    const b = await req.json();
    const r = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',{
      method:'POST',
      headers:{'Authorization':`Bearer ${process.env.HF_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({inputs:b.prompt||'',parameters:{negative_prompt:b.negative_prompt||'blurry',num_inference_steps:28,guidance_scale:3.5,width:1024,height:1024}})
    });
    if(!r.ok){
      let m=`خطأ ${r.status}`;
      if(r.status===503)m='النموذج يحمّل، انتظر 20 ثانية';
      if(r.status===429)m='انتظر قليلاً';
      return new Response(JSON.stringify({error:m}),{status:r.status,headers:{...h,'Content-Type':'application/json'}});
    }
    return new Response(await r.arrayBuffer(),{status:200,headers:{...h,'Content-Type':'image/jpeg'}});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:{...h,'Content-Type':'application/json'}});
  }
}
export const config={runtime:'edge'};
