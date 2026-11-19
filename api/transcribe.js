const {protect}=require('../auth-security.cjs');
module.exports=protect(require('../transcribe-api.cjs').createTranscribeHandler(),{permission:'speech:use'});
