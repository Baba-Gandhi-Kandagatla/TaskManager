const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const root=__dirname;
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const requested=pathname==="/"?"index.html":pathname.slice(1);
  const file=path.resolve(root,requested);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end("Forbidden")}
  fs.readFile(file,(error,data)=>{
    if(error){fs.readFile(path.join(root,"index.html"),(fallbackError,fallback)=>{res.writeHead(fallbackError?404:200,{"Content-Type":"text/html; charset=utf-8"});res.end(fallbackError?"Not found":fallback)})}
    else{res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Cache-Control":"no-cache"});res.end(data)}
  });
});
const port=Number(process.env.PORT)||8080;
server.listen(port,()=>console.log(`Orbit is running at http://localhost:${port}`));
