(function(){
  var root=document.documentElement;
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q=new URLSearchParams(location.search);
  if(q.has('static'))root.classList.add('static');
  var STATIC=RM||root.classList.contains('static');
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function pad(n){return (n<10?'0':'')+n}

  /* placeholder labels: what goes there + real size */
  function phSize(){$$('.phd .phl').forEach(function(l){var e=l.parentNode,w=Math.round(e.offsetWidth),h=Math.round(e.offsetHeight);l.innerHTML=l.getAttribute('data-l')+'<b>'+w+' × '+h+' px</b>'})}
  phSize();
  /* unified diagonal decor: one set of lines over the whole page, drawn per section in page coordinates */
  var NS='http://www.w3.org/2000/svg';
  function deco(){
    var t=+root.getAttribute('data-deco-t')||0.2,x0=+root.getAttribute('data-deco-x0')||560,P=1100;
    var W=document.body.clientWidth,cx=W/2,by=document.body.getBoundingClientRect().top;
    // per period: pale band + thin line (thin line k%3==0 turns red on dark)
    var parts=[{a:-300,b:-170,lt:'rgba(10,23,54,.032)',dk:'rgba(70,110,220,.075)'},{a:-1.5,b:1.5,lt:'rgba(10,23,54,.075)',dk:'rgba(46,92,214,.6)',red:'rgba(227,19,44,.6)'}];
    $$('body>section').forEach(function(sec,si){
      var old=sec.querySelector(':scope>.dl');if(old)old.remove();
      if(sec.matches('.foot,[data-nodeco]'))return;
      var r=sec.getBoundingClientRect(),top=r.top-by,H=r.height;
      var svg=document.createElementNS(NS,'svg');svg.setAttribute('class','dl');svg.setAttribute('width',W);svg.setAttribute('height',H);
      var dks=[];if(sec.matches('.navybg'))dks.push([0,0,W,H]);
      $$('.navybg,[data-dk]',sec).forEach(function(e){var q=e.getBoundingClientRect();dks.push([q.left-r.left,q.top-r.top,q.width,q.height])});
      var defs=document.createElementNS(NS,'defs'),cp=document.createElementNS(NS,'clipPath');cp.id='dk'+si;
      dks.forEach(function(d){var re=document.createElementNS(NS,'rect');re.setAttribute('x',d[0]);re.setAttribute('y',d[1]);re.setAttribute('width',d[2]);re.setAttribute('height',d[3]);cp.appendChild(re)});
      defs.appendChild(cp);svg.appendChild(defs);
      var gL=document.createElementNS(NS,'g'),gD=document.createElementNS(NS,'g');gD.setAttribute('clip-path','url(#dk'+si+')');
      var kmin=Math.floor((-cx-x0-200)/P)-1,kmax=Math.ceil((W-cx-x0+(top+H)*t+400)/P)+1;
      for(var k=kmin;k<=kmax;k++){
        var xc=cx+x0+k*P,xt=xc-top*t,xb=xc-(top+H)*t;
        parts.forEach(function(p){
          var pts=[xt+p.a,0,xt+p.b,0,xb+p.b,H,xb+p.a,H].join(' ');
          var a=document.createElementNS(NS,'polygon');a.setAttribute('points',pts);a.setAttribute('fill',p.lt);gL.appendChild(a);
          if(dks.length){var b=a.cloneNode();b.setAttribute('fill',(p.red&&((k%3)+3)%3===0)?p.red:p.dk);gD.appendChild(b)}
        });
      }
      svg.appendChild(gL);if(dks.length)svg.appendChild(gD);
      sec.insertBefore(svg,sec.firstChild);
    });
  }
  deco();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(deco);
  addEventListener('load',deco);
  var dT;addEventListener('resize',function(){clearTimeout(dT);dT=setTimeout(deco,120)});
  if('ResizeObserver' in window){var lastH=0;new ResizeObserver(function(){var h=document.body.scrollHeight;if(Math.abs(h-lastH)>2){lastH=h;clearTimeout(dT);dT=setTimeout(deco,120)}}).observe(document.body)}
  /* sticky header */
  var hdr=document.querySelector('.hdr');
  function onScroll(){if(hdr)hdr.classList.toggle('scrolled',window.scrollY>24)}
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* hero intro: release animation lock so hover works afterwards */
  $$('.hi,.hcard,.hphoto').forEach(function(el){
    el.addEventListener('animationend',function(e){if(e.target!==el)return;el.classList.remove('hi','hcard','hphoto');el.style.opacity=1;})
  });
  requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.add('loaded')})});

  /* reveal on scroll with stagger */
  $$('[data-stagger]').forEach(function(c){
    Array.prototype.forEach.call(c.children,function(ch,i){ch.setAttribute('data-r','');ch.style.setProperty('--d',(i*90)+'ms')});
  });
  var rev=$$('[data-r]');
  function done(el){el.addEventListener('transitionend',function h(e){if(e.propertyName==='opacity'){el.removeAttribute('data-r');el.style.removeProperty('--d');el.removeEventListener('transitionend',h)}})}
  if(STATIC||!('IntersectionObserver' in window)){rev.forEach(function(e){e.classList.add('in');e.removeAttribute('data-r')})}
  else{
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){done(e.target);e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    rev.forEach(function(e){io.observe(e)});
  }

  /* squad carousel + tabs */
  $$('[data-squad]').forEach(function(sec){
    var track=sec.querySelector('.sqt'),vis=+sec.getAttribute('data-vis'),ctl=sec.querySelector('.field'),num=ctl.querySelector('.n');
    var prev=ctl.querySelectorAll('.circ')[0],next=ctl.querySelectorAll('.circ')[1],empty=sec.querySelector('.sq-empty');
    var i=0;
    function cards(){return $$('.pc',track).filter(function(c){return !c.hidden})}
    function upd(){
      var cs=cards(),pages=Math.max(1,cs.length-vis+1);i=Math.max(0,Math.min(i,pages-1));
      var w=cs[0]?cs[0].offsetWidth+16:0;track.style.transform=MOB()?'':'translateX('+(-i*w)+'px)';cs.forEach(function(c,k){c.classList.toggle('out',k<i||k>=i+vis)});
      num.textContent=pad(i+1)+' / '+pad(pages);prev.classList.toggle('off',i===0);next.classList.toggle('off',i>=pages-1);
      empty.classList.toggle('show',cs.length===0);track.style.display=cs.length?'':'none';
    }
    prev.addEventListener('click',function(){i--;upd()});next.addEventListener('click',function(){i++;upd()});
    $$('.tabs span',sec).forEach(function(t){t.addEventListener('click',function(){
      if(t.classList.contains('on'))return;$$('.tabs span',sec).forEach(function(x){x.classList.remove('on')});t.classList.add('on');
      var f=t.getAttribute('data-f');track.classList.add('fade');
      setTimeout(function(){$$('.pc',track).forEach(function(c){c.hidden=!(f==='all'||c.getAttribute('data-role')===f)});i=0;upd();track.classList.remove('fade')},STATIC?0:230);
    })});
    upd();
  });

  /* media carousel (looped) */
  $$('[data-media]').forEach(function(sec){
    var slides=$$('.slide',sec),n=slides.length,idx=0,thumbs=$$('.thumbs .phd',sec),num=sec.querySelector('.field .n');
    var gap=24;
    function lay(){
      if(MOB()){slides.forEach(function(s){s.style.transform='';s.style.opacity='';s.style.zIndex='';s.classList.add('on')});return}
      var sw=slides[0].offsetWidth;
      slides.forEach(function(s,k){var d=((k-idx)%n+n)%n;if(d>n/2)d-=n;
        var a=Math.abs(d);s.style.transform='translateX('+(d*(sw+gap))+'px) scale('+(a?0.9:1)+')';
        s.style.opacity=a===0?1:(a===1?0.45:0);s.style.zIndex=a===0?3:(a===1?2:1);s.classList.toggle('on',a===0)});
      thumbs.forEach(function(t,k){t.classList.toggle('on',k===idx)});num.textContent=pad(idx+1)+' / '+pad(n);
    }
    function go(k){idx=(k+n)%n;lay()}
    $$('[data-prev]',sec).forEach(function(b){b.addEventListener('click',function(){go(idx-1)})});
    $$('[data-next]',sec).forEach(function(b){b.addEventListener('click',function(){go(idx+1)})});
    thumbs.forEach(function(t,k){t.addEventListener('click',function(){go(k)})});
    slides.forEach(function(s,k){s.addEventListener('click',function(){if(k!==idx)go(k)})});
    lay();
  });

  /* nav links */
  function MOB(){return root.classList.contains('mob')}
  var bg=document.querySelector('.burger');
  if(bg)bg.addEventListener('click',function(){root.classList.toggle('menu-open')});
  /* dropdown parents are real links; on mobile the first tap opens the menu */
  $$('.nav .dd').forEach(function(d){d.addEventListener('click',function(e){
    if(!MOB()||(e.target.closest&&e.target.closest('.ddm')))return;
    e.preventDefault();d.classList.toggle('open');
  })});
  $$('.nav a').forEach(function(a){a.addEventListener('click',function(e){
    var parent=a.parentElement;
    if(MOB()&&parent&&parent.classList.contains('dd')&&!(e.target.closest&&e.target.closest('.ddm')))return;
    root.classList.remove('menu-open');
  })});
  /* news page: tabs, filters, load more, subscribe */
  $$('[data-news]').forEach(function(sec){
    var tabs=$$('.tabs span',sec),panels=$$('.npanel',sec),btn=sec.querySelector('[data-more-btn]'),wrapM=sec.querySelector('.nmore');
    function cur(){return panels.filter(function(p){return !p.hidden})[0]}
    function updMore(){if(wrapM&&cur())wrapM.classList.toggle('done',!cur().querySelector('[data-more][hidden]'))}
    function activate(t,instant){
      if(!t||t.classList.contains('on'))return;
      tabs.forEach(function(x){x.classList.remove('on')});t.classList.add('on');
      var p=cur(),n=panels.filter(function(x){return x.getAttribute('data-panel')===t.getAttribute('data-tab')})[0];
      if(!n)return;
      function sw(){if(p&&p!==n){p.hidden=true;p.classList.remove('fade')}n.classList.add('fade');n.hidden=false;
        $$('.ncard,.nrow,.nfeat,.jcard,.rcard',n).forEach(function(c,i){if(c.hidden)return;c.classList.remove('in');c.setAttribute('data-r','');c.style.setProperty('--d',(i*70)+'ms')});
        requestAnimationFrame(function(){requestAnimationFrame(function(){n.classList.remove('fade');$$('.ncard,.nrow,.nfeat,.jcard,.rcard',n).forEach(function(c){c.classList.add('in')})})});updMore();phSize()}
      if(instant||STATIC){if(p&&p!==n)p.hidden=true;n.hidden=false;n.classList.remove('fade');updMore();phSize();return}
      if(p)p.classList.add('fade');setTimeout(sw,250);
    }
    tabs.forEach(function(t){t.addEventListener('click',function(){
      if(t.classList.contains('on'))return;activate(t,false);
      if(history.replaceState)history.replaceState(null,'','#'+(t.getAttribute('data-tab')||''));
    })});
    $$('.nfil span',sec).forEach(function(f){f.addEventListener('click',function(){$$('.nfil span',sec).forEach(function(x){x.classList.remove('on')});f.classList.add('on')})});
    if(btn)btn.addEventListener('click',function(){var h=$$('[data-more][hidden]',cur());h.forEach(function(c,i){c.hidden=false;if(!STATIC){c.classList.remove('in');c.setAttribute('data-r','');c.style.setProperty('--d',(i*90)+'ms');requestAnimationFrame(function(){requestAnimationFrame(function(){c.classList.add('in')})})}});updMore();phSize()});
    updMore();
    function fromHash(){var h=(location.hash||'').replace(/^#/,'').split(/[?&]/)[0];if(!h)return;var t=tabs.filter(function(x){return x.getAttribute('data-tab')===h})[0];if(t)activate(t,true)}
    fromHash();addEventListener('hashchange',fromHash);
  });
  $$('.sf').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();f.classList.add('sent')})});
  /* club: achievements timeline + player */
  $$('[data-tline] span').forEach(function(t){t.addEventListener('click',function(){
    if(t.classList.contains('on'))return;$$('[data-tline] span').forEach(function(x){x.classList.remove('on')});t.classList.add('on');
    var k=t.getAttribute('data-s'),cur=$$('.achp').filter(function(e){return !e.hidden}),nx=document.querySelector('.achp[data-sp="'+k+'"]');
    function sw(){cur.forEach(function(e){e.hidden=true;e.classList.remove('fade')});nx.classList.add('fade');nx.hidden=false;requestAnimationFrame(function(){requestAnimationFrame(function(){nx.classList.remove('fade')})})}
    if(STATIC){cur.forEach(function(e){e.hidden=true});nx.hidden=false;return}
    cur.forEach(function(e){e.classList.add('fade')});setTimeout(sw,250);
  })});
  $$('[data-play]').forEach(function(b){b.addEventListener('click',function(){(b.closest('.player')||b.closest('.edplay')).classList.toggle('on')})});
  /* kids branches filter */
  $$('[data-kbr] .tabs span').forEach(function(t){t.addEventListener('click',function(){
    $$('[data-kbr] .tabs span').forEach(function(x){x.classList.remove('on')});t.classList.add('on');var f=t.getAttribute('data-f');
    $$('[data-kbr] tr[data-city]').forEach(function(r){r.hidden=!(f==='all'||r.getAttribute('data-city')===f)});
  })});
  /* squad page filter */
  $$('[data-sqf] .tabs span').forEach(function(t){t.addEventListener('click',function(){
    if(t.classList.contains('on'))return;$$('[data-sqf] .tabs span').forEach(function(x){x.classList.remove('on')});t.classList.add('on');
    var f=t.getAttribute('data-f'),secs=$$('[data-sqs]');
    secs.forEach(function(sc){var show=f==='all'||sc.getAttribute('data-sqs')===f;sc.hidden=!show;sc.style.paddingTop=''});
    var vis=secs.filter(function(sc){return !sc.hidden});if(vis[0])vis[0].style.paddingTop='0';
    vis.forEach(function(sc){$$('[data-stagger] > *,[data-r]',sc).forEach(function(e){e.classList.add('in')})});
    phSize&&phSize();if(typeof deco==='function')deco();
  })});
  /* match-center tournament tabs */
  $$('[data-mc] .tabs span').forEach(function(t,_,all){t.addEventListener('click',function(){
    if(t.classList.contains('on'))return;$$('[data-mc] .tabs span').forEach(function(x){x.classList.remove('on')});t.classList.add('on');
    var k=t.getAttribute('data-tour'),cur=$$('[data-tp]').filter(function(e){return !e.hidden}),nxt=$$('[data-tp="'+k+'"]');
    function sw(){cur.forEach(function(e){e.hidden=true;e.classList.remove('fade')});nxt.forEach(function(e){e.classList.add('fade');e.hidden=false});
      requestAnimationFrame(function(){requestAnimationFrame(function(){nxt.forEach(function(e){e.classList.remove('fade')})})})}
    if(STATIC){cur.forEach(function(e){e.hidden=true});nxt.forEach(function(e){e.hidden=false});return}
    cur.forEach(function(e){e.classList.add('fade')});setTimeout(sw,250);
  })});
  /* hero match slider */
  $$('[data-mslider]').forEach(function(sl){
    var track=sl.querySelector('.mst'),cs=$$('.mcard',track),vis=+sl.getAttribute('data-vis')||2,i=+sl.getAttribute('data-start')||0;
    var c=sl.querySelectorAll('.field .circ'),num=sl.querySelector('.field .n'),pages=cs.length-vis+1;
    function upd(){i=Math.max(0,Math.min(i,pages-1));var w=cs[0].offsetWidth+16;track.style.transform=MOB()?'':'translateX('+(-i*w)+'px)';
      cs.forEach(function(x,k){x.classList.toggle('out',k<i||k>=i+vis)});num.textContent=pad(i+1)+' / '+pad(pages);
      c[0].classList.toggle('off',i===0);c[1].classList.toggle('off',i>=pages-1)}
    function eq(){var t=document.querySelector('.tcard');if(!t)return;cs.forEach(function(x){x.style.minHeight=''});if(MOB())return;var h=Math.max(t.offsetHeight,cs[0].offsetHeight);cs.forEach(function(x){x.style.minHeight=h+'px'})}
    eq();addEventListener('load',eq);if(document.fonts)document.fonts.ready.then(eq);
    c[0].addEventListener('click',function(){i--;upd()});c[1].addEventListener('click',function(){i++;upd()});upd();
  });
  /* hero table card tabs */
  $$('[data-tbl]').forEach(function(c){
    var tabs=$$('.ttabs span',c),bs=$$('tbody',c);
    tabs.forEach(function(t){t.addEventListener('click',function(){
      if(t.classList.contains('on'))return;tabs.forEach(function(x){x.classList.remove('on')});t.classList.add('on');
      var k=+t.getAttribute('data-k'),cur=bs.filter(function(b){return !b.hidden})[0];
      function sw(){bs.forEach(function(b,i){b.hidden=i!==k;b.classList.add('fade')});requestAnimationFrame(function(){requestAnimationFrame(function(){bs[k].classList.remove('fade')})})}
      if(STATIC){bs.forEach(function(b,i){b.hidden=i!==k});return}
      cur.classList.add('fade');setTimeout(sw,200);
    })});
  });
  /* calendar tabs + paging */
  $$('[data-cal]').forEach(function(sec){
    var box=sec.querySelector('.crows'),rows=$$('.crow',box),ctl=sec.querySelector('.field'),num=ctl.querySelector('.n');
    var prev=ctl.querySelectorAll('.circ')[0],next=ctl.querySelectorAll('.circ')[1],f='all',p=0,per=2;
    function list(){return rows.filter(function(r){return f==='all'||r.getAttribute('data-t')===f})}
    function show(anim){
      var L=list(),pages=Math.max(1,Math.ceil(L.length/per));p=Math.max(0,Math.min(p,pages-1));
      function apply(){rows.forEach(function(r){r.hidden=true});L.slice(p*per,p*per+per).forEach(function(r){r.hidden=false});
        num.textContent=pad(p+1)+' / '+pad(pages);prev.classList.toggle('off',p===0);next.classList.toggle('off',p>=pages-1);box.classList.remove('fade')}
      if(anim&&!STATIC){box.classList.add('fade');setTimeout(apply,230)}else apply();
    }
    prev.addEventListener('click',function(){p--;show(true)});next.addEventListener('click',function(){p++;show(true)});
    $$('.tabs span',sec).forEach(function(t){t.addEventListener('click',function(){
      $$('.tabs span',sec).forEach(function(x){x.classList.remove('on')});t.classList.add('on');f=t.getAttribute('data-f');p=0;show(true)})});
    show(false);
  });

  /* mobile: section buttons after content + round arrows with counter under sliders */
  (function(){
    var AL='<svg viewBox="0 0 18 12"><path d="M18 6H2M7 1L2 6l5 5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
        AR='<svg viewBox="0 0 18 12"><path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>';
    var SL=[['.msv','.mcard'],['.sqv','.pc'],['.wrap>.sqt','.pc'],['.mlight .mrow','.slide'],['.news','.nbig,.nsm']],navs=[],done=false;
    function isMob(){return document.documentElement.classList.contains('mob')}
    function init(){if(done||!isMob())return;done=true;
      $$('.sec-head').forEach(function(h){
        var b=[].filter.call(h.children,function(c){return c.classList.contains('btn')})[0];if(!b)return;
        var sec=h.closest('section'),w=h.closest('.wrap');if(!sec||!w)return;
        var top=h;while(top.parentElement!==w)top=top.parentElement;
        var box=document.createElement('div');box.className='mmore';var cl=b.cloneNode(true);box.appendChild(cl);
        var hasMore=false,n=top.nextElementSibling;while(n){if(n.offsetHeight||n.children.length)hasMore=true;n=n.nextElementSibling}
        if(hasMore)w.appendChild(box);else{var ww=document.createElement('div');ww.className='wrap';ww.appendChild(box);sec.appendChild(ww)}
        b.classList.add('mob-hide');
      });
      SL.forEach(function(p){$$(p[0]).forEach(function(sc){attach(sc,p[1])})});
      document.addEventListener('click',function(){setTimeout(updAll,380)});
      addEventListener('resize',updAll);
    }
    function attach(sc,isel){
      var nw=document.createElement('div');nw.className='mnavw'+(sc.closest('.wrap')?'':' wrap');
      nw.innerHTML='<div class="field mnav"><span><span class="circ">'+AL+'</span></span><i></i><span class="n">01 / 01</span><i></i><span><span class="circ">'+AR+'</span></span></div>';
      sc.parentNode.insertBefore(nw,sc.nextSibling);
      var c=nw.querySelectorAll('.circ'),num=nw.querySelector('.n');
      function items(){return $$(isel,sc).filter(function(e){return e.offsetParent!==null&&e.getBoundingClientRect().width>0})}
      function cur(){var it=items(),r0=sc.getBoundingClientRect().left+parseFloat(getComputedStyle(sc).paddingLeft||0),best=0,bd=1e9;
        it.forEach(function(e,k){var d=Math.abs(e.getBoundingClientRect().left-r0);if(d<bd){bd=d;best=k}});
        if(sc.scrollLeft>=sc.scrollWidth-sc.clientWidth-2)best=it.length-1;return [best,it]}
      function upd(){var it=items();if(!it.length||sc.offsetParent===null||sc.scrollWidth<=sc.clientWidth+2){nw.style.display='none';return}
        nw.style.display='';var r=cur();num.textContent=pad(r[0]+1)+' / '+pad(r[1].length);
        c[0].classList.toggle('off',r[0]===0);c[1].classList.toggle('off',r[0]>=r[1].length-1)}
      function go(d){var r=cur(),k=Math.max(0,Math.min(r[1].length-1,r[0]+d)),e=r[1][k];if(!e)return;
        var x=sc.scrollLeft+e.getBoundingClientRect().left-sc.getBoundingClientRect().left-parseFloat(getComputedStyle(sc).paddingLeft||0);
        sc.scrollTo({left:x,behavior:STATIC?'auto':'smooth'})}
      c[0].addEventListener('click',function(e){e.stopPropagation();go(-1)});c[1].addEventListener('click',function(e){e.stopPropagation();go(1)});
      var t;sc.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(upd,60)},{passive:true});
      navs.push(upd);upd();setTimeout(upd,300);
    }
    function updAll(){navs.forEach(function(f){f()})}
    init();addEventListener('resize',init);addEventListener('load',updAll);
  })();

  /* mobile: fade edges on overflowing pill/tab rows */
  (function(){
    function chk(){$$('.tabs,.nfil,.anch').forEach(function(t){
      var mob=document.documentElement.classList.contains('mob'),o=mob&&t.scrollWidth>t.clientWidth+2;
      t.classList.toggle('ovf',o);if(!o){t.classList.remove('ovs','ove');return}
      var s=t.scrollLeft>2,e=t.scrollLeft>=t.scrollWidth-t.clientWidth-2;t.classList.toggle('ovs',s&&!e);t.classList.toggle('ove',e)})}
    $$('.tabs,.nfil,.anch').forEach(function(t){t.addEventListener('scroll',chk,{passive:true})});
    chk();addEventListener('resize',chk);addEventListener('load',chk);if(document.fonts)document.fonts.ready.then(chk);
  })();
})();
