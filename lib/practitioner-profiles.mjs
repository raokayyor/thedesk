const RAO={id:'kayyor-rao',name:'Kayyor Rao',photo:'/assets/kayyor-rao.jpg',title:'The Desk practitioner'};
// Approved route assignments can be added here. Rao is the requested default for now.
const bySector={banking:RAO,markets:RAO,accounting:RAO,advisory:RAO,general:RAO};
export function practitionerForRoute(route=''){const s=String(route).toLowerCase(),key=/audit|account|tax/.test(s)?'accounting':/trading|markets/.test(s)?'markets':/consult|advisory|deals/.test(s)?'advisory':/bank|asset|invest/.test(s)?'banking':'general';return {...bySector[key],sector:key,route:String(route).slice(0,160)}}
