import assert from 'node:assert/strict';import {programmeCalendar} from '../guide-calendar.mjs';
const args={firm:'Firm',name:'Audit, tax; graduate\nprogramme',date:'2026-10-31',url:'https://example.com/careers'};
const value=programmeCalendar(args,new Date('2026-10-16T12:00:00Z'));assert(value.includes('DTSTART;VALUE=DATE:20261031'));assert(value.includes('TRIGGER:-P1D'));assert(value.includes('Audit\\, tax\\; graduate\\nprogramme'));assert.throws(()=>programmeCalendar({...args,date:'2026-02-31'}));assert.throws(()=>programmeCalendar({...args,url:'javascript:alert(1)'}));console.log('PASS calendar dates, escaping, reminder and safe source URLs');

