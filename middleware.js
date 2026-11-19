import {rewrite} from '@vercel/functions';

// Only intercept the four library assets; all other routing stays unchanged.
export const config={matcher:['/library.html','/video-library.html','/video-library.json','/interview-brain-teasers.js']};
const assets={'/library.html':'library','/video-library.html':'videos','/video-library.json':'videoData','/interview-brain-teasers.js':'brain'};
export default function middleware(request){
 const url=new URL(request.url),asset=assets[url.pathname];
 if(!asset)return;
 url.pathname='/api/member-library';url.search='?asset='+asset;
 return rewrite(url);
}
