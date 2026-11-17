(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const simple={
oi:'Для начала хватит двух фраз. Oi! — привет. Tudo bem? — как дела? На тот же вопрос можно ответить Tudo bem. — всё хорошо.',
nome:'Eu — я. Sou связывает «я» с именем: Eu sou Ana — я Ана. В русском «есть» не говорим, а здесь sou оставляем.',
origem:'Sou de — я из. Sou de Moscou — я из Москвы. Для России говорим da Rússia: de и a соединились в da.',
estar:'Где я или как себя чувствую? Используй estou: Estou em casa — я дома. Estou bem — мне хорошо. Пока потренируй эти две фразы.',
artigos:'Запоминай слово с маленьким словом перед ним: o livro — книга, a casa — дом. Род может отличаться от русского, поэтому учим пару целиком.',
nao:'Хочешь сказать «не»? Поставь não перед действием: Eu falo — я говорю. Eu não falo — я не говорю.',
ter:'Tenho означает «у меня есть»: Tenho uma irmã — у меня есть сестра. Возраст тоже говорим через tenho: Tenho vinte anos — мне двадцать лет.',
familia:'Minha — моя, meu — мой. Выбираем по предмету, а не по владельцу: minha casa — мой дом, meu livro — моя книга.',
rotina:'Для «я» у многих действий на -ar ставим -o: estudar → estudo. Eu estudo — я учусь. Для você другая форма: você estuda — ты учишься.',
gostar:'После gostar оставляем de: Eu gosto de café — мне нравится кофе. Начни с готового кусочка Eu gosto de… и добавь то, что нравится.',
numeros:'Сначала нужны маленькие числа и одна фраза для цены. Quanto custa? — сколько стоит? Не учи все числа за один раз.',
horas:'Для одного часа — É uma hora. Для двух и больше — São duas horas. Сначала научись понимать время своей встречи.',
cafe:'Просьбу можно начать с названия: Um café, por favor — кофе, пожалуйста. Этой короткой фразы достаточно для первого заказа.',
compras:'Posso pagar com cartão? — можно оплатить картой? Posso — могу ли я, pagar — платить, com cartão — картой. Запомни всю просьбу.',
onde:'Onde — где. Onde fica a farmácia? — где аптека? Подставь нужное место в готовый вопрос Onde fica…?',
poder:'Pode repetir? — можете повторить? После pode действие ставим в начальной форме: repetir. Это готовая просьба, когда не понял собеседника.',
saude:'Estou com dor de cabeça — у меня болит голова. Кусочек estou com dor de… помогает назвать место боли.',
telefone:'Pode me mandar uma mensagem? — можете отправить мне сообщение? Me здесь означает «мне». Начни с этой готовой просьбы.',
amanha:'Чтобы сказать о плане, после vou ставим действие: Vou estudar — буду учиться. Amanhã vou estudar — завтра буду учиться.',
ontem:'Сначала выучи одно прошлое действие: fui — сходил / поехал. Ontem fui ao mercado — вчера сходил на рынок. Не нужно сразу знать все формы.',
passado:'Для многих действий на -ar в законченном прошлом с «я» появляется -ei: comprar → comprei. Ontem comprei pão — вчера купил хлеб.',
imperfeito:'Era помогает рассказать, каким всё было раньше. Quando eu era criança — когда я был ребёнком. Это фон истории, а не один отдельный случай.',
comparar:'Сравниваем так: mais barato que — дешевле, чем. Este ônibus é mais barato que o táxi — этот автобус дешевле такси.',
condicional:'Poderia звучит мягче, чем прямое требование. Você poderia repetir? — вы могли бы повторить? Пока достаточно одной этой просьбы.',
conectores:'Связывай две мысли по одной: porque — потому что, mas — но. Quero sair, mas está chovendo — хочу выйти, но идёт дождь.',
opiniao:'Мнение можно начать с Eu acho que… — я считаю, что… Затем скажи одну мысль и одну причину. Длинный текст пока не нужен.',
subjuntivo:'Для возможного будущего запомни готовый кусочек: Quando eu tiver tempo — когда у меня будет время. После него назови план: vou estudar.',
email:'У короткого письма три части: зачем пишу, что прошу, благодарность. Начни с Quero… — хочу… и Poderia…? — могли бы…?',
resumo:'Пересказать главное — значит ответить: что происходит, когда и что нужно сделать. Не нужно переводить каждое слово объявления.',
conversa:'Если не понял, останови разговор одной фразой: Pode repetir? — можете повторить? Pedir ajuda — нормальная часть общения, а не ошибка.'
};
function simpler(l){const lessons=window.BoraCourses[0].lessons,i=lessons.indexOf(l);if(i<=3)return lessons[0];if(i<12)return lessons[3];if(i<18)return lessons[8];if(i<24)return lessons[18];return lessons[23]}
function panel(u,l){const p=simpler(l);return `<section class="comfort-tools"><details ${(u.simpleExplanations||u.experience==='С нуля')?'open':''}><summary>Объясни совсем просто</summary><p>${esc(simple[l.id])}</p><div class="example"><strong lang="pt-BR">${esc(l.examples[0][0])}</strong><p>${esc(l.examples[0][1])}</p>${window.BoraAudio?.button(l.examples[0][0])||''}</div><p class="small">Сначала пойми и повтори этот пример. Потом переходи к остальным.</p></details><details><summary>Слишком сложно — выбрать начало проще</summary><p>Можно повторить основу и двигаться по порядку. Итоги и выполненные уроки останутся в аккаунте.</p><div class="row">${p.id!==l.id?`<a class="btn alt" data-comfort-start="${p.id}" href="#courses/pt/${p.id}">Опора: ${esc(p.title)}</a>`:''}<a class="btn alt" data-comfort-start="oi" href="#courses/pt/oi">Начать с самых первых фраз</a></div><p><a href="#diagnosis">Перепроверить стартовую точку</a></p></details></section>`}
function preferred(u){const lessons=window.BoraCourses[0].lessons,p=lessons.find(l=>l.id===u.learningPath?.lesson);if(p)return p;if(u.diagnosis&&u.diagnosis.version!==3)return lessons.find(l=>!u.courseProgress?.['pt/'+l.id]?.done)||lessons[0];return null}
function bind(u,save,render){document.querySelectorAll('[data-comfort-start]').forEach(b=>b.onclick=e=>{e.preventDefault();const id=b.dataset.comfortStart,l=window.BoraCourses[0].lessons.find(l=>l.id===id);if(!l)return;u.currentLesson=id;u.learningPath={lesson:id,reason:'learner-chose-easier',at:new Date().toISOString()};u.simpleExplanations=true;const r=u.courseProgress?.['pt/'+id];if(r){r.stage=0;if(r.guided)r.guided.index=0;}save();const hash='#courses/pt/'+id;if(location.hash===hash){render();window.scrollTo(0,0)}else location.hash=hash})}
function advance(u,id){if(u.learningPath?.lesson!==id)return;const lessons=window.BoraCourses[0].lessons,index=lessons.findIndex(l=>l.id===id);u.learningPath={...u.learningPath,lesson:lessons[index+1]?.id||null}}
window.BoraComfort={panel,preferred,bind,advance,simple,simpler};
})();
