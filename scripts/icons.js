// Generate portable PNG icons without dependencies. Artwork matches icon.svg.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i=0;i<8;i++) crc = (crc>>>1) ^ ((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type, data) {
  const content = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(content));
  return Buffer.concat([length,content,crc]);
}
function png(size) {
  const raw=Buffer.alloc((size*3+1)*size);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const nx=x/size*512,ny=y/size*512;
    const distance=Math.hypot(nx-256,ny-256);
    let color=distance>103&&distance<145?[255,253,250]:[49,92,75];
    if(Math.hypot(nx-380,ny-155)<32)color=[236,173,93];
    const i=y*(size*3+1)+1+x*3;
    raw[i]=color[0];raw[i+1]=color[1];raw[i+2]=color[2];
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const directory=path.resolve(__dirname,'../icons');
fs.mkdirSync(directory,{recursive:true});
for(const size of [192,512])fs.writeFileSync(path.join(directory,`icon-${size}.png`),png(size));
