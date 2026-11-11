import {FEATURES,featureKey} from '/feature-tour.mjs';
const raw=new URLSearchParams(location.search).get('feature');location.replace(raw==='applications'?'/tracker.html':FEATURES[featureKey(raw)].page);
