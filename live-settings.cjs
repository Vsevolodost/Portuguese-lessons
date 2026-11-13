function liveSettings(env=process.env){const key=String(env.GEMINI_API_KEY||'').trim(),model=String(env.GEMINI_LIVE_MODEL||'').trim().replace(/^models\//,'');return {key,model,ready:env.BORA_GEMINI_LIVE_ENABLED==='true'&&!!key&&/^gemini-[a-z0-9.-]+$/.test(model)}}
module.exports={liveSettings};
