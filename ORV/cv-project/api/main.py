import sys
import json
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from model.face_auth import (
    check_access,
    clean_username,
    delete_user,
    enroll_user,
    list_users,
    read_metrics,
    train_model,
    verify_user,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
RESERVATIONS_FILE = DATA_DIR / "reservations.json"
LOCKER_IDS = [352, 358, 359, 529, 530, 537, 538, 539, 540, 541, 542]

app = FastAPI(
    title="Airbnb Smart Locker API",
    description="Sistem za odklep Airbnb pametne omarice z računalniškim vidom",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AccessResponse(BaseModel):
    allowed: bool
    username: str
    box_id: int
    reason: str
    auth: dict


class MessageResponse(BaseModel):
    success: bool
    message: str


def load_reservations():
    if not RESERVATIONS_FILE.exists():
        return []
    return json.loads(RESERVATIONS_FILE.read_text(encoding="utf-8"))


def save_reservations(reservations):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RESERVATIONS_FILE.write_text(json.dumps(reservations, ensure_ascii=False, indent=2), encoding="utf-8")


def create_or_get_reservation(username):
    username = clean_username(username)
    reservations = load_reservations()
    existing = next((item for item in reservations if item["username"] == username and item["status"] == "active"), None)
    if existing is not None:
        return existing
    locker_id = LOCKER_IDS[len(reservations) % len(LOCKER_IDS)]
    reservation = {
        "reservation_id": f"AIR-{len(reservations) + 1:04d}",
        "username": username,
        "guest_name": username.replace("_", " ").title(),
        "locker_id": locker_id,
        "property": "Airbnb Smart Stay",
        "status": "active"
    }
    reservations.append(reservation)
    save_reservations(reservations)
    return reservation


def get_reservation(reservation_id):
    reservation_id = reservation_id.strip().upper()
    return next((item for item in load_reservations() if item["reservation_id"].upper() == reservation_id), None)


def get_active_reservation_for_user(username):
    username = clean_username(username)
    return next((item for item in load_reservations() if item["username"] == username and item["status"] == "active"), None)


async def read_required_image(image):
    if image is None or image.filename is None or image.filename.strip() == "":
        raise HTTPException(status_code=400, detail="Slika je obvezna")
    allowed = {"image/jpeg", "image/png", "image/jpg"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Dovoljene so samo JPG in PNG slike")
    image_bytes = await image.read()
    if image_bytes is None or len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Slika je obvezna")
    return image_bytes


@app.post("/auth/enroll")
async def enroll(username: str = Form(...), image: Optional[UploadFile] = File(None)):
    image_bytes = await read_required_image(image)
    result = enroll_user(username, image_bytes)
    if not result.get("success"):
        status_code = 409 if result.get("code") == "USER_EXISTS" else 400
        raise HTTPException(status_code=status_code, detail=result.get("error", "Registracija ni uspela"))
    return result


@app.post("/auth/verify")
async def verify(username: str = Form(...), image: Optional[UploadFile] = File(None)):
    image_bytes = await read_required_image(image)
    result = verify_user(username, image_bytes)
    if result.get("error") and not result.get("authenticated"):
        return result
    return result


@app.post("/reservations/create")
async def create_reservation(username: str = Form(...), image: Optional[UploadFile] = File(None)):
    image_bytes = await read_required_image(image)
    enrollment = enroll_user(username, image_bytes)
    if not enrollment.get("success"):
        raise HTTPException(status_code=400, detail=enrollment.get("error", "Rezervacija ni uspela"))
    reservation = create_or_get_reservation(username)
    return {
        "success": True,
        "username": reservation["username"],
        "reservation": reservation,
        "enrollment": enrollment,
        "message": "Rezervacija je pripravljena in obrazni vzorec je shranjen"
    }


@app.get("/reservations/{reservation_id}")
def reservation(reservation_id: str):
    item = get_reservation(reservation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Rezervacija ne obstaja")
    return item


@app.post("/reservations/verify")
async def verify_reservation(username: str = Form(...), image: Optional[UploadFile] = File(None)):
    image_bytes = await read_required_image(image)
    auth = verify_user(username, image_bytes)
    reservation = get_active_reservation_for_user(username)
    message = "Gost je potrjen"
    if reservation is None:
        message = "Gost je potrjen, vendar aktivna rezervacija ni najdena"
    if not auth.get("authenticated"):
        message = auth.get("error", "Gost ni potrjen")
    return {
        **auth,
        "reservation": reservation,
        "message": message
    }


@app.post("/reservations/check-access")
async def reservation_access(
    username: str = Form(...),
    reservation_id: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    item = get_reservation(reservation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Rezervacija ne obstaja")
    username = clean_username(username)
    if item["username"] != username:
        return {
            "allowed": False,
            "username": username,
            "box_id": item["locker_id"],
            "reservation": item,
            "reason": "Rezervacija ne pripada temu gostu",
            "auth": {"authenticated": False, "confidence": 0.0}
        }
    image_bytes = await read_required_image(image)
    result = check_access(username, item["locker_id"], image_bytes)
    result["reservation"] = item
    return result


@app.post("/box/check-access", response_model=AccessResponse)
async def access(username: str = Form(...), box_id: int = Form(...), image: Optional[UploadFile] = File(None)):
    image_bytes = await read_required_image(image)
    return check_access(username, box_id, image_bytes)


@app.get("/users")
def users():
    all_users = list_users()
    return {"count": len(all_users), "users": all_users}


@app.delete("/users/{username}")
def remove(username: str):
    result = delete_user(username)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Uporabnik ne obstaja"))
    return result


@app.post("/model/retrain")
def retrain():
    return train_model()


@app.get("/model/metrics")
def metrics():
    return read_metrics()


@app.get("/", response_class=HTMLResponse)
def ui():
    return """
<!doctype html>
<html lang="sl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Airbnb Smart Locker</title>
<style>
:root{
    --bg:#07111f;
    --surface:#121c2b;
    --surface2:#0d1623;
    --text:#eef5ff;
    --muted:#9eafc5;
    --line:#26384f;
    --accent:#57a6ff;
    --accent2:#4ce0cf;
    --green:#42d47d;
    --red:#ff6878;
    --yellow:#ffd166;
}
*{box-sizing:border-box}
body{
    margin:0;
    font-family:Segoe UI,Arial,sans-serif;
    background:
        radial-gradient(circle at 18% -12%, rgba(87,166,255,.24), transparent 30%),
        radial-gradient(circle at 92% 8%, rgba(76,224,207,.13), transparent 28%),
        linear-gradient(135deg,#07111f 0%,#0d1b2d 58%,#07111f 100%);
    color:var(--text);
    min-height:100vh;
}
main{width:min(1160px,calc(100% - 34px));margin:auto;padding:34px 0 42px}
.header{
    border:1px solid rgba(111,139,174,.34);
    background:linear-gradient(135deg,rgba(87,166,255,.16),rgba(76,224,207,.07));
    border-radius:16px;
    padding:28px;
    margin-bottom:18px;
    box-shadow:0 22px 70px rgba(0,0,0,.22);
}
.badge{display:inline-block;padding:7px 11px;border-radius:999px;background:rgba(76,224,207,.12);border:1px solid rgba(76,224,207,.36);color:#d5fff9;font-weight:900;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
h1{font-size:42px;line-height:1.03;margin:15px 0 11px}
p{color:var(--muted);font-size:16px;line-height:1.6;margin:0;max-width:800px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.meta span{border:1px solid rgba(111,139,174,.36);background:rgba(13,22,35,.52);border-radius:999px;padding:6px 10px;color:#dbe9ff;font-size:12px;font-weight:800}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:linear-gradient(180deg,rgba(23,34,49,.98),rgba(16,25,38,.98));border:1px solid rgba(111,139,174,.28);border-radius:12px;padding:20px;box-shadow:0 18px 54px rgba(0,0,0,.25)}
.card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}
h2{margin:0;font-size:20px}.card small{display:block;color:var(--muted);margin-top:5px;line-height:1.35}
.mark{min-width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(87,166,255,.13);border:1px solid rgba(87,166,255,.32);color:#dcecff;font-size:13px;font-weight:900}
.card:nth-child(2) .mark{background:rgba(76,224,207,.12);border-color:rgba(76,224,207,.32)}
.card:nth-child(3) .mark{background:rgba(255,209,102,.10);border-color:rgba(255,209,102,.30)}
label{display:block;margin-top:13px;font-weight:800;font-size:12px;color:#e4edfb}
input{width:100%;margin-top:7px;padding:12px 13px;border-radius:9px;border:1px solid var(--line);background:var(--surface2);color:var(--text);outline:none;font-size:15px}
input:focus{border-color:rgba(76,224,207,.7);box-shadow:0 0 0 4px rgba(76,224,207,.10)}
input[type=file]{color:var(--muted);cursor:pointer}
.preview{min-height:150px;margin-top:14px;border-radius:12px;border:1px dashed #3a4d64;background:rgba(13,22,35,.86);display:grid;place-items:center;overflow:hidden;color:var(--muted);text-align:center;padding:12px}
.preview img{width:100%;height:176px;object-fit:contain;background:#07111f;border-radius:9px;display:block}
button{width:100%;margin-top:15px;padding:13px 15px;border:0;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#061120;font-weight:900;cursor:pointer;font-size:15px;box-shadow:0 12px 28px rgba(76,224,207,.14)}
button:hover{filter:saturate(1.1) brightness(1.03)}
.result{margin-top:14px;padding:14px;border-radius:12px;background:rgba(13,22,35,.9);border:1px solid var(--line);min-height:74px;color:var(--muted)}
.result-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.result-title{font-weight:900;color:var(--text)}
.result-badge{padding:7px 10px;border-radius:999px;font-size:11px;font-weight:900;color:#061120;background:var(--yellow)}
.good{background:var(--green)}.bad{background:var(--red);color:white}.info{background:var(--accent)}
.kv{display:grid;grid-template-columns:128px 1fr;gap:7px 12px;font-size:13px;line-height:1.35}.kv span:nth-child(odd){color:#8fa1b8}.kv span:nth-child(even){color:#eef5ff;font-weight:700}
.footer{color:var(--muted);font-size:12px;text-align:center;margin-top:22px}
@media(max-width:950px){.grid{grid-template-columns:1fr}h1{font-size:34px}.header{padding:24px}}
</style>
</head>
<body>
<main>
<section class="header">
    <span class="badge">ORV projekt</span>
    <h1>Airbnb Smart Locker</h1>
    <p>Gost ob rezervaciji shrani obrazni vzorec, sistem mu dodeli pametno omarico, ob prihodu pa z obrazno verifikacijo preveri rezervacijo in odklene dostop.</p>
    <div class="meta"><span>Rezervacija</span><span>YuNet + SFace</span><span>Smart locker API</span></div>
</section>
<section class="grid">
    <article class="card">
        <div class="card-head">
            <div><h2>Rezervacija gosta</h2><small>Shrani obraz in dodeli omarico.</small></div>
            <div class="mark">01</div>
        </div>
        <label>Ime gosta</label>
        <input id="enrollName" autocomplete="off" placeholder="Vnesi ime gosta">
        <label>Obrazna slika</label>
        <input id="enrollImage" type="file" accept="image/png,image/jpeg" capture="user">
        <div id="enrollPreview" class="preview">Predogled izbrane slike</div>
        <button onclick="enroll()">Ustvari rezervacijo</button>
        <div id="enrollOut" class="result">Podatki rezervacije se prikažejo tukaj.</div>
    </article>
    <article class="card">
        <div class="card-head">
            <div><h2>Preverjanje rezervacije</h2><small>Najdi rezervacijo potrjenega gosta.</small></div>
            <div class="mark">02</div>
        </div>
        <label>Ime gosta</label>
        <input id="verifyName" autocomplete="off" placeholder="Vnesi ime gosta">
        <label>Nova obrazna slika</label>
        <input id="verifyImage" type="file" accept="image/png,image/jpeg" capture="user">
        <div id="verifyPreview" class="preview">Predogled izbrane slike</div>
        <button onclick="verify()">Preveri rezervacijo</button>
        <div id="verifyOut" class="result">Rezervacija in omarica se prikažeta tukaj.</div>
    </article>
    <article class="card">
        <div class="card-head">
            <div><h2>Odklep omarice</h2><small>Preveri rezervacijo in obraz.</small></div>
            <div class="mark">03</div>
        </div>
        <label>Ime gosta</label>
        <input id="accessName" autocomplete="off" placeholder="Vnesi ime gosta">
        <label>ID rezervacije</label>
        <input id="reservationId" autocomplete="off" placeholder="npr. AIR-0001">
        <label>Obrazna slika</label>
        <input id="accessImage" type="file" accept="image/png,image/jpeg" capture="user">
        <div id="accessPreview" class="preview">Predogled izbrane slike</div>
        <button onclick="access()">Odkleni omarico</button>
        <div id="accessOut" class="result">Odločitev odklepa se prikaže tukaj.</div>
    </article>
</section>
<div class="footer">Airbnb Smart Locker · OpenCV SFace · FastAPI</div>
</main>
<script>
function filePreview(inputId, previewId){
    const input = document.getElementById(inputId)
    const preview = document.getElementById(previewId)
    input.addEventListener('change', () => {
        const file = input.files[0]
        if(!file){preview.textContent='Predogled izbrane slike';return}
        const reader = new FileReader()
        reader.onload = e => preview.innerHTML = `<img src="${e.target.result}" alt="predogled">`
        reader.readAsDataURL(file)
    })
}
filePreview('enrollImage','enrollPreview')
filePreview('verifyImage','verifyPreview')
filePreview('accessImage','accessPreview')
function esc(value){return String(value).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function valueOrDash(value){if(value === undefined || value === null || value === '') return '-'; return value}
function setLoading(outId, text){document.getElementById(outId).innerHTML = `<div class="result-top"><div class="result-title">${esc(text)}</div><span class="result-badge info">obdelujem</span></div>`}
function renderResult(outId, json, mode){
    const success = json.success === true || json.authenticated === true || json.allowed === true
    const failed = json.success === false || json.authenticated === false || json.allowed === false || json.error || json.detail
    const badgeClass = success ? 'good' : failed ? 'bad' : 'info'
    const badgeText = success ? 'USPEŠNO' : failed ? 'ZAVRNJENO' : 'INFO'
    let title = 'Rezultat'
    if(mode === 'enroll') title = success ? 'Rezervacija je pripravljena' : 'Rezervacija ni uspela'
    if(mode === 'verify') title = success ? 'Rezervacija je najdena' : 'Rezervacija ni potrjena'
    if(mode === 'access') title = success ? 'Omarica je odklenjena' : 'Odklep ni dovoljen'
    let rows = []
    if(mode === 'enroll') rows = [['gost',json.username],['rezervacija',json.reservation ? json.reservation.reservation_id : '-'],['omarica',json.reservation ? json.reservation.locker_id : '-'],['dodani vzorci',json.enrollment ? json.enrollment.added_samples : json.added_samples],['sporočilo',json.message || json.detail || json.error]]
    if(mode === 'verify') rows = [['gost',json.username],['status',success ? 'potrjeno' : 'ni potrjeno'],['rezervacija',json.reservation ? json.reservation.reservation_id : '-'],['omarica',json.reservation ? json.reservation.locker_id : '-'],['zaupanje',json.confidence],['sporočilo',json.message || json.error || json.detail || '-']]
    if(mode === 'access') rows = [['gost',json.username],['rezervacija',json.reservation ? json.reservation.reservation_id : '-'],['omarica',json.box_id],['razlog',json.reason],['zaupanje',json.auth ? json.auth.confidence : '-'],['status',success ? 'potrjeno' : 'ni potrjeno']]
    const htmlRows = rows.map(r => `<span>${esc(r[0])}</span><span>${esc(valueOrDash(r[1]))}</span>`).join('')
    document.getElementById(outId).innerHTML = `<div class="result-top"><div class="result-title">${esc(title)}</div><span class="result-badge ${badgeClass}">${badgeText}</span></div><div class="kv">${htmlRows}</div>`
}
function validateText(id, label){
    const value = document.getElementById(id).value.trim()
    if(!value){alert(label);return null}
    return value
}
async function sendForm(url, fields, fileInput, outId, mode){
    const file = document.getElementById(fileInput).files[0]
    if(!file){renderResult(outId,{detail:'Slika je obvezna'},mode);return}
    const data = new FormData()
    for(const key in fields){data.append(key, fields[key])}
    data.append('image', file)
    setLoading(outId, 'Slika se obdeluje')
    try{
        const response = await fetch(url,{method:'POST',body:data})
        const json = await response.json()
        renderResult(outId, json, mode)
    }catch(e){renderResult(outId,{error:e.toString()},mode)}
}
function enroll(){
    const username = validateText('enrollName','Vpiši ime gosta.')
    if(!username) return
    sendForm('/reservations/create',{username:username},'enrollImage','enrollOut','enroll')
}
function verify(){
    const username = validateText('verifyName','Vpiši ime gosta.')
    if(!username) return
    sendForm('/reservations/verify',{username:username},'verifyImage','verifyOut','verify')
}
function access(){
    const username = validateText('accessName','Vpiši ime gosta.')
    if(!username) return
    const reservationId = validateText('reservationId','Vpiši ID rezervacije.')
    if(!reservationId) return
    sendForm('/reservations/check-access',{username:username,reservation_id:reservationId},'accessImage','accessOut','access')
}
</script>
</body>
</html>
"""
