const fs=require('node:fs'),path=require('node:path');
const defaults=JSON.parse(fs.readFileSync(path.join(__dirname,'supabase-public.json'),'utf8').replace(/^\uFEFF/,''));
function publicConfig(env=process.env){const key=env.SUPABASE_PUBLISHABLE_KEY||defaults.supabaseKey;return {speechProvider:require('./azure-speech.cjs').settings(env).ready?'azure':'edge',emailConfirmationRequired:defaults.emailConfirmationRequired!==false,supabaseUrl:env.SUPABASE_URL||defaults.supabaseUrl,supabaseKey:key.startsWith('sb_publishable_')?key:''}}
module.exports={publicConfig};
