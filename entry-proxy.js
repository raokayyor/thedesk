import {rewrite,next} from '@vercel/functions';
import {TOOL_FILES} from './lib/tool-links.mjs';
// Before the filesystem/cache: existing static HTML must not bypass trial selection.
export default function entryProxy(request){const url=new URL(request.url),file=url.pathname.slice(1);if(url.pathname==='/try.html'||url.searchParams.has('taster')){url.pathname='/api/legacy-entry';return rewrite(url);}if(Object.hasOwn(TOOL_FILES,file)||file==='members-only.html'){url.pathname='/api/tool-entry';url.searchParams.set('file',file);return rewrite(url);}return next();}
