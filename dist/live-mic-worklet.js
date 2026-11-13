class BoraMicProcessor extends AudioWorkletProcessor {
 constructor(){super();this.phase=0;this.sum=0;this.count=0;this.chunk=new Float32Array(1600);this.size=0}
 process(inputs){const input=inputs[0]?.[0];if(!input)return true;for(const sample of input){this.sum+=sample;this.count++;this.phase+=16000;if(this.phase>=sampleRate){this.phase-=sampleRate;this.chunk[this.size++]=this.sum/this.count;this.sum=0;this.count=0;if(this.size===1600){const chunk=this.chunk;this.port.postMessage(chunk.buffer,[chunk.buffer]);this.chunk=new Float32Array(1600);this.size=0}}}return true}
}
registerProcessor('bora-mic',BoraMicProcessor);
