import {testimonialsForSlot} from '/data/testimonials.mjs';
for(const slot of document.querySelectorAll('[data-testimonial-slot]')){
 const seen=new Set(),cards=[];
 for(const item of testimonialsForSlot(slot.dataset.testimonialSlot)){
  if(item.slot!==slot.dataset.testimonialSlot||!item.quote||!item.name)continue;
  const key=item.name+'|'+item.quote;if(seen.has(key))continue;seen.add(key);
  const card=document.createElement('figure');card.className='testimonial-card';
  const initial=document.createElement('span');initial.className='testimonial-initial';initial.setAttribute('aria-hidden','true');initial.textContent=Array.from(item.name.trim())[0];
  const body=document.createElement('div'),quote=document.createElement('blockquote'),credit=document.createElement('figcaption');
  quote.textContent='“'+item.quote+'”';credit.textContent=[item.name,item.uni,item.outcome].filter(Boolean).join(' · ');
  body.append(quote,credit);card.append(initial,body);cards.push(card);
 }
 slot.replaceChildren(...cards);slot.hidden=cards.length===0;
}
