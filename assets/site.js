(function(){
  var bar=document.querySelector(".bar");
  var pb=document.querySelector(".bar .progress");
  function onScroll(){
    var h=document.documentElement;
    var max=h.scrollHeight-h.clientHeight;
    if(pb)pb.style.width=(max>0?(h.scrollTop/max)*100:0)+"%";
    if(bar)bar.classList.toggle("scrolled",h.scrollTop>8);
  }
  addEventListener("scroll",onScroll,{passive:true});
  onScroll();

  /* ヘッダーナビ：現在表示中のセクションをハイライト */
  var navLinks=[].slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var navTargets=navLinks.map(function(a){
    return document.getElementById(a.getAttribute("href").slice(1));
  });
  function markCurrent(){
    var best=-1;
    for(var i=0;i<navTargets.length;i++){
      var el=navTargets[i];
      if(el&&el.getBoundingClientRect().top<=90)best=i;
    }
    for(var j=0;j<navLinks.length;j++){
      navLinks[j].classList.toggle("cur",j===best);
    }
  }
  if(navLinks.length){
    addEventListener("scroll",markCurrent,{passive:true});
    addEventListener("resize",markCurrent,{passive:true});
    markCurrent();
  }

  /* メニュー：リンク選択・外側クリック・Escape で閉じる */
  var menu=document.querySelector(".menu");
  if(menu){
    document.addEventListener("click",function(e){
      if(!menu.hasAttribute("open"))return;
      var t=e.target;
      if(!menu.contains(t)||(t.closest&&t.closest(".menu-panel a"))){
        menu.removeAttribute("open");
      }
    });
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape")menu.removeAttribute("open");
    });
  }

  /* スクロールリビール：JS無効・reduced-motion環境では何もしない（常に表示） */
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  if(!("IntersectionObserver" in window))return;
  var sel=".sec-head,.feat,.card,.step,.tt-row,.statement,.chips,.sub-h,.note,.ind,.cmp,"+
    ".prize-hero,.qa,.ov-row,.contact,.crosslink";
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      var el=e.target;
      el.classList.add("on");
      io.unobserve(el);
      setTimeout(function(){
        el.classList.remove("rv","on");
        el.style.transitionDelay="";
      },900);
    });
  },{rootMargin:"0px 0px -8% 0px"});
  [].slice.call(document.querySelectorAll(sel)).forEach(function(el){
    var i=[].indexOf.call(el.parentNode.children,el);
    el.style.transitionDelay=Math.min(i*45,270)+"ms";
    el.classList.add("rv");
    io.observe(el);
  });
})();
