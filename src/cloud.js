(function(){
  const cfg=()=>window.ORBIT_CONFIG||{};
  const configured=()=>Boolean(cfg().supabaseUrl&&cfg().supabaseAnonKey);
  // Supabase validates email domains even when confirmation is disabled.
  // Use this project's real domain as a private username namespace.
  const emailFor=username=>`${username}@movaacbofxvqrvahlkdl.supabase.co`;
  let session=null;
  async function request(path,{method="GET",body,token=session?.access_token,headers={}}={}){
    const c=cfg(),res=await fetch(`${c.supabaseUrl}${path}`,{method,headers:{apikey:c.supabaseAnonKey,"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{ }),...headers},body:body?JSON.stringify(body):undefined});
    const text=await res.text(),data=text?JSON.parse(text):null;
    if(!res.ok){const error=Error(data?.msg||data?.message||data?.error_description||"Cloud request failed");error.status=res.status;throw error;}
    return data;
  }
  async function authenticate(username,password,display){
    try{session=await request("/auth/v1/token?grant_type=password",{method:"POST",body:{email:emailFor(username),password},token:null})}
    catch(signInError){
      try{session=await request("/auth/v1/signup",{method:"POST",body:{email:emailFor(username),password,data:{display_name:display}},token:null})}
      catch(signUpError){
        const message=signUpError.message.toLowerCase();
        if(message.includes("rate limit"))throw Error("Supabase email confirmation is still enabled. Disable Confirm Email, then wait for the signup limit to reset.");
        throw Error(message.includes("registered")?"This name exists. Check the password.":signUpError.message);
      }
      if(!session?.access_token)throw Error("Disable email confirmation in Supabase Auth settings for username login.");
    }
    localStorage.setItem("orbit-cloud-session",JSON.stringify(session));
    return session.user;
  }
  async function refresh(){
    if(!session){try{session=JSON.parse(localStorage.getItem("orbit-cloud-session"))}catch{}}
    if(!session?.refresh_token)return false;
    const expires=(session.expires_at||0)*1000;
    if(expires>Date.now()+60000)return true;
    session=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:session.refresh_token},token:null});
    localStorage.setItem("orbit-cloud-session",JSON.stringify(session));return true;
  }
  async function load(){await refresh();let rows=await request(`/rest/v1/user_data?user_id=eq.${session.user.id}&select=state`);return rows?.[0]?.state||null}
  async function save(state){await refresh();return request("/rest/v1/user_data?on_conflict=user_id",{method:"POST",body:{user_id:session.user.id,state,updated_at:new Date().toISOString()},headers:{Prefer:"resolution=merge-duplicates,return=minimal"}})}
  async function logout(){if(session?.access_token)try{await request("/auth/v1/logout",{method:"POST"})}catch{}session=null;localStorage.removeItem("orbit-cloud-session")}
  async function restore(){
    try{return await refresh()?session.user:null;}
    catch(error){
      if(error.status===400||error.status===401||error.status===403){session=null;localStorage.removeItem("orbit-cloud-session");return null;}
      // Offline/transient failures should not sign someone out of their saved local profile.
      return session?.user||null;
    }
  }
  window.OrbitCloud={configured,authenticate,load,save,logout,restore};
})();
