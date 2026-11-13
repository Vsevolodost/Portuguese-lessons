import {GoogleGenAI} from '@google/genai';
// Provider boundary: the UI consumes normalized audio/transcript events, not Google SDK classes.
async function connect({token,model,onEvent}){
 const ai=new GoogleGenAI({apiKey:token,httpOptions:{apiVersion:'v1beta'}});
 const session=await ai.live.connect({model,callbacks:{
  onmessage:message=>{const c=message.serverContent;if(c){if(c.interrupted)onEvent({type:'interrupted'});for(const part of c.modelTurn?.parts||[]){if(part.inlineData?.data&&part.inlineData.mimeType?.startsWith('audio/pcm'))onEvent({type:'audio',data:part.inlineData.data,rate:Number(part.inlineData.mimeType.match(/rate=(\d+)/)?.[1]||24000)})}if(c.inputTranscription?.text)onEvent({type:'transcript',role:'user',text:c.inputTranscription.text,finished:c.inputTranscription.finished===true});if(c.outputTranscription?.text)onEvent({type:'transcript',role:'assistant',text:c.outputTranscription.text,finished:c.outputTranscription.finished===true});if(c.turnComplete)onEvent({type:'turn-complete'})}if(message.goAway)onEvent({type:'ending'})},
  onerror:()=>onEvent({type:'error'}),onclose:()=>onEvent({type:'closed'})
 },config:{}});
 return {sendAudio(data,rate){session.sendRealtimeInput({audio:{data,mimeType:'audio/pcm;rate='+rate}})},sendText(text){session.sendClientContent({turns:text,turnComplete:true})},pauseInput(){session.sendRealtimeInput({audioStreamEnd:true})},close(){session.close()}};
}
window.BoraLiveAdapters={...(window.BoraLiveAdapters||{}),gemini:{connect}};
