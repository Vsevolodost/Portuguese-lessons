const {protect}=require('../auth-security.cjs');
module.exports=protect(require('../exam-feedback.cjs').createExamFeedbackHandler(),{permission:'tutor:use'});
