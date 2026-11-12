const {createChatHandler}=require('../chat-api.cjs');
const {createSharedLimiter}=require('../shared-limiter.cjs');
module.exports=createChatHandler({limiter:createSharedLimiter()});
