const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const output=path.join(root,"dist");
const files=["index.html","styles.css","app.js","manifest.webmanifest","icon.svg","sw.js"];
require('./icons.js');

fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(output,file));
fs.cpSync(path.join(root,"src"),path.join(output,"src"),{recursive:true});
fs.cpSync(path.join(root,"icons"),path.join(output,"icons"),{recursive:true});
console.log(`Orbit build ready: ${output}`);
