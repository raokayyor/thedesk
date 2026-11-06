class DeskPcmCapture extends AudioWorkletProcessor{
 constructor(){super();this.buffer=new Float32Array(4096);this.offset=0}
 process(inputs){const channels=inputs[0];if(!channels?.length)return true;const mono=channels[0];for(let i=0;i<mono.length;i++){let value=0;for(const channel of channels)value+=channel[i]||0;this.buffer[this.offset++]=value/channels.length;if(this.offset===4096){this.port.postMessage(this.buffer);this.buffer=new Float32Array(4096);this.offset=0}}return true}
}
registerProcessor('desk-pcm-capture',DeskPcmCapture);
