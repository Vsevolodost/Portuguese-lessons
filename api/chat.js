const {protect}=require('../auth-security.cjs');
module.exports=protect(require('../chat-api.cjs').createChatHandler({limiter:require('../shared-limiter.cjs').createSharedLimiter()}),{permission:'tutor:use'});
