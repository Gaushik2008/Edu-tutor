// node demo/export_syllabus.js  ->  backend/app/data/syllabus.json
const fs=require('fs'),path=require('path');
let js=fs.readFileSync(path.join(__dirname,'index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
global.localStorage={getItem:()=>null,setItem(){}};
global.document={addEventListener(){},getElementById:()=>({innerHTML:'',value:''}),querySelectorAll:()=>[]};
global.getComputedStyle=()=>({getPropertyValue:()=>'#888'});
js=js.replace('const App=document.addEventListener','const App0=document.addEventListener');
const out=eval(js+`;({concepts:CONCEPTS.map(c=>({id:c.id,name:c.n,difficulty:c.d,prereqs:c.pre,description:c.desc,objectives:c.obj})),questions:QS})`);
fs.mkdirSync(path.join(__dirname,'../backend/app/data'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'../backend/app/data/syllabus.json'),JSON.stringify(out,null,1));
console.log('exported',out.concepts.length,'concepts,',out.questions.length,'questions');
