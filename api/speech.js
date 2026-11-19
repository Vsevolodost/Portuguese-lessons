const {protect}=require('../auth-security.cjs');
module.exports=protect(require('../speech-api.cjs').createSpeechHandler(),{permission:'speech:use'});
