import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient, type Session} from '@supabase/supabase-js';
import './style.css';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const db=url&&key?createClient(url,key):null;
const categories=['Taxi / VTC','Transporte público','Gasolina / recarga','Peajes','Parking','Desayuno','Comida','Cena','Hotel','Otros'];
type Expense={id:string;expense_date:string;amount:number;category:string;city:string|null;merchant:string|null;status:string;image_path:string|null;client_id:string;clients:{name:string}|null};
type Client={id:string;name:string};
function App(){
 const [session,setSession]=useState<Session|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[clients,setClients]=useState<Client[]>([]),[expenses,setExpenses]=useState<Expense[]>([]),[file,setFile]=useState<File|null>(null),[clientName,setClientName]=useState(''),[date,setDate]=useState(new Date().toLocaleDateString('en-CA')),[amount,setAmount]=useState(''),[category,setCategory]=useState(categories[0]),[city,setCity]=useState(''),[merchant,setMerchant]=useState(''),[saving,setSaving]=useState(false),[filter,setFilter]=useState('all');
 const [desktop,setDesktop]=useState(window.matchMedia('(min-width: 800px)').matches);
 useEffect(()=>{const m=window.matchMedia('(min-width: 800px)');const fn=()=>setDesktop(m.matches);m.addEventListener('change',fn);return()=>m.removeEventListener('change',fn)},[]);
 useEffect(()=>{if(!db)return;db.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=db.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
 async function load(){if(!db||!session)return;const [c,e]=await Promise.all([db.from('clients').select('id,name').order('name'),db.from('expenses').select('id,expense_date,amount,category,city,merchant,status,image_path,client_id,clients(name)').order('expense_date',{ascending:false})]);if(c.error)setError(c.error.message);else setClients(c.data||[]);if(e.error)setError(e.error.message);else setExpenses((e.data||[]).map((x:any)=>({...x,clients:Array.isArray(x.clients)?x.clients[0]||null:x.clients})));}
 useEffect(()=>{if(session)void load()},[session]);
 async function login(e:React.FormEvent){e.preventDefault();if(!db)return;setError('');const {error}=await db.auth.signInWithPassword({email,password});if(error)setError(error.message)}
 async function save(e:React.FormEvent){e.preventDefault();if(!db||!session||!file)return;setSaving(true);setError('');setNotice('');let path:string|undefined;try{
  const name=clientName.trim();if(!name)throw Error('Indica el cliente.');
  let client=clients.find(c=>c.name.toLocaleLowerCase()===name.toLocaleLowerCase());
  if(!client){const {data,error}=await db.from('clients').insert({name,user_id:session.user.id}).select('id,name').single();if(error)throw error;client=data;}
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';path=`${session.user.id}/${crypto.randomUUID()}.${ext}`;
  const {error:upErr}=await db.storage.from('receipts').upload(path,file,{contentType:file.type,upsert:false});if(upErr)throw upErr;
  const {error:insertErr}=await db.from('expenses').insert({user_id:session.user.id,expense_date:date,amount:Number(amount),category,city:city||null,merchant:merchant||null,client_id:client.id,image_path:path});if(insertErr)throw insertErr;
  setFile(null);setAmount('');setClientName('');setCity('');setMerchant('');setNotice('Gasto guardado correctamente.');await load();
 }catch(err){if(path)await db.storage.from('receipts').remove([path]);setError(err instanceof Error?err.message:String(err))}finally{setSaving(false)}}
 async function removeExpense(e:Expense){if(!db||!desktop||!confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.'))return;setError('');const {error}=await db.from('expenses').delete().eq('id',e.id);if(error){setError(error.message);return;}if(e.image_path)await db.storage.from('receipts').remove([e.image_path]);await load()}
 async function viewImage(path:string){if(!db)return;const {data,error}=await db.storage.from('receipts').createSignedUrl(path,60);if(error)setError(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer')}
 if(!db)return <main><h1>Travel Expenses</h1><p>Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.</p></main>;
 if(!session)return <main className="login"><h1>Travel Expenses</h1><p>Acceso privado</p><form onSubmit={login}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Contraseña<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button>Entrar</button></form>{error&&<p className="error">{error}</p>}<p className="hint">El primer usuario se crea desde Supabase Authentication → Users.</p></main>;
 return <main><header><div><h1>Travel Expenses</h1><small>{session.user.email}</small></div><button className="secondary" onClick={()=>db.auth.signOut()}>Salir</button></header>{error&&<p className="error">{error}</p>}{notice&&<p className="success">{notice}</p>}
 <div className="layout"><section className="panel"><h2>Nuevo gasto</h2><p className="hint">Fase 1: introducción manual. La lectura IA se añadirá en la fase 2.</p><form onSubmit={save}>
 <label>Fotografía del ticket<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
 <div className="two"><label>Fecha<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label>Importe total (€)<input type="number" min="0" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label></div>
 <label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
 <div className="two"><label>Localidad<input value={city} onChange={e=>setCity(e.target.value)}/></label><label>Establecimiento<input value={merchant} onChange={e=>setMerchant(e.target.value)}/></label></div>
 <label>Cliente<input required list="clients" placeholder="Escribe o selecciona" value={clientName} onChange={e=>setClientName(e.target.value)}/><datalist id="clients">{clients.map(c=><option key={c.id} value={c.name}/>)}</datalist></label>
 <button disabled={saving||!file}>{saving?'Guardando...':'Guardar gasto'}</button></form></section>
 <section className="panel"><h2>{desktop?'Gestión de gastos':'Últimos gastos'}</h2>{desktop&&<label>Estado<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todos</option><option value="pending">Pendientes</option><option value="processed">Procesados</option></select></label>}
 <div className="expenses">{expenses.filter(e=>filter==='all'||!desktop||e.status===filter).map(e=><article key={e.id}><div><strong>{e.category} · {Number(e.amount).toFixed(2)} €</strong><p>{e.expense_date} · {e.clients?.name||'Sin cliente'}</p><small>{e.merchant||e.city||''} · {e.status==='pending'?'Pendiente':'Procesado'}</small></div><div className="actions">{e.image_path&&<button className="secondary" onClick={()=>viewImage(e.image_path!)}>Ticket</button>}{desktop&&e.status==='pending'&&<button className="danger" onClick={()=>removeExpense(e)}>Eliminar</button>}</div></article>)}{!expenses.length&&<p className="hint">Todavía no hay gastos.</p>}</div>
 {desktop&&<p className="hint">Edición, filtros avanzados, liquidaciones y archivado: próximas fases. No están implementados todavía.</p>}</section></div></main>
}
createRoot(document.getElementById('root')!).render(<App/>);
