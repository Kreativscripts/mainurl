const form=document.getElementById('shortenForm'),
longUrlInput=document.getElementById('longUrl'),
resultDiv=document.getElementById('result'),
progress=document.getElementById('progress'),
animationContainer=document.getElementById('animation-container'),
finalResult=document.getElementById('final-result');

let processing=!1;
form.querySelector('button').disabled=!0;

async function loadData(){
    try{
        form.querySelector('button').disabled=!1;
        console.log("System ready - using TinyURL");
    }catch(e){
        console.error('Error loading data:',e);
        resultDiv.textContent='Failed to load system';
    }
}
loadData();

function failSystem(){
    document.querySelector('.container').style.transition='opacity 1s';
    document.querySelector('.container').style.opacity='0';
    setTimeout(()=>{
        document.body.innerHTML=`<div style="color:#fff;font-size:1.5rem;font-family:Georgia,serif;text-align:center;margin-top:30vh;">Something is off<span id="dots"></span></div>`;
        let dots=document.getElementById('dots'),count=0;
        const interval=setInterval(()=>{
            dots.textContent='.'.repeat(count%5);
            count++;
        },500);
        setTimeout(()=>{
            clearInterval(interval);
            window.location.href='https://www.youtube.com/watch?v=Vp3tET-hNRs';
        },4000);
    },1000);
}

function normalizeShortLink(link){
    if(!link) return null;
    link=String(link).trim();
    if(!/^https?:\/\//i.test(link)){
        link='https://'+link.replace(/^\/+/, '');
    }
    return link;
}

function buildMarkdown(longUrl, shortLink){
    let anchorText = longUrl.replace('://','_:_//');
    
    // Apply Roblox-specific formatting
    if(longUrl.includes("users")){
        anchorText = `__https_:_//www.roblox.com/users/2803279079/profile__`;
    } else if(longUrl.includes("communities")){
        anchorText = `https_:_//www.roblox.com/share/g/34684235`;
    } else if(longUrl.includes("privateServerLinkCode")){
        anchorText = `https_:_//www.roblox.com/share?code=6a7d9285532a37449251701c3e1a7544&type=Server`;
    }
    
    return `[${anchorText}](${shortLink})`;
}

function showAnimation(shortLink){
    document.querySelector('.container').style.opacity='0';
    setTimeout(()=>{
        document.querySelector('.container').style.display='none';
        animationContainer.style.display='block';

        setTimeout(()=>{
            const longUrl = longUrlInput.value.trim();
            const cleanedShort = normalizeShortLink(shortLink);
            if(!cleanedShort){ failSystem(); return; }
            
            // Build the markdown output with Roblox formatting
            const markdownOutput = buildMarkdown(longUrl, cleanedShort);

            finalResult.innerHTML = `
                <div class="link-box" style="display:flex;flex-direction:column;gap:12px;align-items:center;">
                    <div style="color:#fff;margin-bottom:10px;text-align:center;">
                        <small style="color:#ccc;">Via: TinyURL</small><br>
                        Shortened: <a href="${cleanedShort}" target="_blank" style="color:#fff;text-decoration:underline">${cleanedShort}</a>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;">
                        <button class="copy-btn glassy-btn" style="padding:8px 14px;border-radius:8px;border:none;cursor:pointer;">Copy Markdown</button>
                    </div>
                    <span class="copy-status" style="font-size:0.9rem;color:#ccc;display:none;">Copied!</span>
                    <div style="color:#ccc;font-size:0.8rem;text-align:center;">
                        Powered by TinyURL - Reliable URL Shortening
                    </div>
                </div>
            `;

            const copyBtn=finalResult.querySelector('.copy-btn');
            const statusTxt=finalResult.querySelector('.copy-status');

            copyBtn.addEventListener('click',async ()=>{
                try{
                    await navigator.clipboard.writeText(markdownOutput);
                    statusTxt.style.display='inline';
                    setTimeout(()=>{ statusTxt.style.display='none'; },1500);
                    
                    // Auto-close after successful copy
                    setTimeout(()=>{
                        animationContainer.style.display='none';
                        document.querySelector('.container').style.display='block';
                        setTimeout(()=>{
                            document.querySelector('.container').style.opacity='1';
                            longUrlInput.value='';
                            longUrlInput.focus();
                        },50);
                    },2000);
                }catch(e){
                    statusTxt.textContent='Copy failed';
                    statusTxt.style.display='inline';
                    setTimeout(()=>{ statusTxt.style.display='none'; statusTxt.textContent='Copied!'; },1500);
                }
            });
        },2000);
    },500);
}

async function tryTinyURL(longUrl) {
    try {
        const requestUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
        console.log(`Calling TinyURL: ${requestUrl}`);
        
        const res = await fetch(requestUrl, {
            method: 'GET',
            mode: 'cors'
        });

        if (!res.ok) {
            console.warn(`TinyURL returned status: ${res.status}`);
            return null;
        }

        const data = await res.text();
        console.log(`TinyURL response:`, data);

        const shortLink = data.trim();
        const normalizedLink = normalizeShortLink(shortLink);
        console.log(`TinyURL result:`, normalizedLink);
        
        return normalizedLink;
    } catch (e) {
        console.warn(`TinyURL failed:`, e);
        return null;
    }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (processing) { failSystem(); return; }
    processing = true;
    const longUrl = longUrlInput.value.trim();
    if (!longUrl) { processing = false; return; }

    try { new URL(longUrl); } catch (e) {
        resultDiv.textContent = "Please enter a valid URL (include http:// or https://)";
        processing = false; return;
    }

    resultDiv.textContent = '';
    progress.style.width = '0%';

    console.log(`Starting URL shortening for: ${longUrl}`);
    
    // Show immediate progress
    progress.style.width = '50%';
    
    const shortLink = await tryTinyURL(longUrl);
    
    if (shortLink) {
        progress.style.width = '100%';
        showAnimation(shortLink);
    } else {
        progress.style.width = '100%';
        resultDiv.innerHTML = `
            <div style="text-align:center;color:#fff;">
                <p>⚠️ TinyURL service is temporarily unavailable.</p>
                <p style="font-size:0.9rem;color:#ccc;">Please try again in a few moments.</p>
                <button onclick="location.reload()" class="glassy-btn" style="padding:8px 16px;margin-top:10px;border-radius:6px;border:none;cursor:pointer;">Try Again</button>
            </div>
        `;
    }
    
    processing = false;
});