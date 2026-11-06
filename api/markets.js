// Companion market API logic. Embedded in the deployed Cloudflare Worker.
// No keys or secrets. Prices never fall back to fabricated values.
const radarAssets=[
  {symbol:"USDT",name:"تتر"},
  {symbol:"BTC",name:"بیت‌کوین"},
  {symbol:"ETH",name:"اتریوم"},
  {symbol:"PAXG",name:"پکس گلد"},
  {symbol:"GRAM",name:"گرام"},
  {symbol:"XAUT",name:"طلای دیجیتال"}
];
const radarExchanges=[
  {id:"nobitex",name:"نوبیتکس"},
  {id:"wallex",name:"والکس"},
  {id:"bitpin",name:"بیت‌پین"}
];
const radarPositive=v=>{const n=Number(String(v??"").replace(/,/g,""));return Number.isFinite(n)&&n>0?n:null};
const radarLevelPrice=v=>radarPositive(Array.isArray(v)?v[0]:(v&&typeof v==="object")?(v.price??v[0]):v);
function radarOrderbook(raw){
  const book=raw?.result?.orderbook??raw?.result??raw?.data?.result??raw?.data??raw;
  if(!book||book.status==="failed"||book.success===false)return null;
  const a=(book.asks??book.ask??[]),b=(book.bids??book.bid??[]);
  const asks=Array.isArray(a)?a.map(radarLevelPrice).filter(Boolean):[];
  const bids=Array.isArray(b)?b.map(radarLevelPrice).filter(Boolean):[];
  const ask=asks.length?Math.min(...asks):null;
  const bid=bids.length?Math.max(...bids):null;
  return ask||bid?{ask,bid}:null;
}
async function radarGet(url){
  const res=await fetch(url,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(7000)});
  if(!res.ok)throw Error("HTTP "+res.status);
  return res.json();
}
async function radarMarketsHandler(){
  const wanted=radarAssets.map(a=>a.symbol).filter(s=>s!=="USDT");
  const quotes=new Map();
  const put=(exchange,symbol,kind,book,scale=1,url="")=>{
    if(!book)return;
    const key=exchange+":"+symbol;
    const existing=quotes.get(key)||{exchange,symbol,usdt:null,toman:null,usdtUrl:null,tomanUrl:null};
    const scaled={ask:book.ask?book.ask/scale:null,bid:book.bid?book.bid/scale:null,estimated:false};
    if(kind==="usdt"){existing.usdt=scaled;existing.usdtUrl=url;}
    else{existing.toman=scaled;existing.tomanUrl=url;}
    quotes.set(key,existing);
  };
  const jobs=[];
  // Nobitex provides the entire public order book in a single API request.
  jobs.push((async()=>{
    let all=null;
    try{
      const payload=await radarGet("https://apiv2.nobitex.ir/v3/orderbook/all");
      all=payload?.data??payload?.result??payload;
      if(!all?.USDTIRT)all=null;
    }catch(_){}
    const pairs=["USDTIRT",...wanted.flatMap(x=>[x+"USDT",x+"IRT"])];
    await Promise.all(pairs.map(async pair=>{
      let book=all?.[pair]||null;
      if(!book){try{book=await radarGet("https://apiv2.nobitex.ir/v3/orderbook/"+pair)}catch(_){return;}}
      const symbol=pair==="USDTIRT"?"USDT":pair.endsWith("USDT")?pair.slice(0,-4):pair.slice(0,-3);
      const kind=pair.endsWith("IRT")?"toman":"usdt";
      put("nobitex",symbol,kind,radarOrderbook(book),kind==="toman"?10:1,"https://apiv2.nobitex.ir/v3/orderbook/"+pair);
    }));
  })());
  // Check markets already exposed by Wallex and Bitpin. No additional exchanges.
  for(const symbol of ["USDT",...wanted]){
    const pairWallex=symbol==="USDT"?"USDTTMN":symbol+"USDT";
    const kindWallex=symbol==="USDT"?"toman":"usdt";
    jobs.push((async()=>{
      const url="https://api.wallex.ir/v1/depth?symbol="+pairWallex;
      try{put("wallex",symbol,kindWallex,radarOrderbook(await radarGet(url)),1,url)}catch(_){}
    })());
    const pairBitpin=symbol==="USDT"?"USDT_IRT":symbol+"_USDT";
    const kindBitpin=symbol==="USDT"?"toman":"usdt";
    jobs.push((async()=>{
      const url="https://api.bitpin.ir/api/v1/mth/orderbook/"+pairBitpin+"/";
      try{put("bitpin",symbol,kindBitpin,radarOrderbook(await radarGet(url)),1,url)}catch(_){}
    })());
  }
  await Promise.allSettled(jobs);
  const output=radarAssets.map(asset=>({
    symbol:asset.symbol,name:asset.name,
    quotes:radarExchanges.map(ex=>{
      const q=quotes.get(ex.id+":"+asset.symbol)||{};
      const tether=quotes.get(ex.id+":USDT")?.toman;
      let toman=q.toman??null;
      let conversion="direct";
      if(!toman&&asset.symbol!=="USDT"&&q.usdt?.ask&&tether?.ask){
        toman={ask:q.usdt.ask*tether.ask,bid:q.usdt.bid&&tether.bid?q.usdt.bid*tether.bid:null,estimated:true};
        conversion="calculated";
      }
      return {id:ex.id,name:ex.name,usdt:q.usdt??null,toman,
        tomanKind:toman?conversion:null,usdtUrl:q.usdtUrl??null,tomanUrl:q.tomanUrl??null,
        status:(asset.symbol==="USDT"?toman:q.usdt)?"ok":"unavailable"};
    })
  }));
  return Response.json({
    fetchedAt:new Date().toISOString(),assets:output,unit:"toman",
    note:"Estimated toman prices are USDT ask multiplied by the same exchange USDT/IRT ask; they are not directly executable IRT orders."
  },{headers:{"Access-Control-Allow-Origin":"*","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
