const {protect}=require('../auth-security.cjs');
module.exports=protect(require('../gemini-live.cjs').createLiveSessionHandler(),{permission:'speech:use'});
