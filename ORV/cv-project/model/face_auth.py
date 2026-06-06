import json
import pickle
import re
import shutil
from pathlib import Path

import cv2
import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
USERS_DIR = DATA_DIR / "users"
MODEL_DIR = DATA_DIR / "model"
MODEL_FILE = MODEL_DIR / "descriptors.pkl"
LABELS_FILE = MODEL_DIR / "labels.json"
METRICS_FILE = MODEL_DIR / "metrics.json"
ASSETS_DIR = ROOT_DIR / "model" / "assets"
YUNET_FILE = ASSETS_DIR / "face_detection_yunet_2023mar.onnx"
SFACE_FILE = ASSETS_DIR / "face_recognition_sface_2021dec.onnx"
FACE_SIZE = (112, 112)
VERIFY_THRESHOLD = 0.56
TOP3_THRESHOLD = 0.64
CENTER_THRESHOLD = 0.68
MARGIN_THRESHOLD = 0.04
MIN_SHARPNESS = 18.0
MIN_CONTRAST = 18.0
ALLOWED_BOXES = {352, 358, 359, 529, 530, 537, 538, 539, 540, 541, 542}

for folder in [USERS_DIR, MODEL_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

haar_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
yunet_detector = None
sface_recognizer = None


def clean_username(username):
    username = username.strip().lower()
    username = re.sub(r"[^a-z0-9_\-]", "_", username)
    username = re.sub(r"_+", "_", username)
    return username[:40]


def read_image(image_bytes):
    if image_bytes is None or len(image_bytes) == 0:
        return None
    array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None or image.size == 0:
        return None
    return image


def image_from_file(path):
    image = cv2.imread(str(path))
    if image is None:
        return None
    return image


def require_sface_assets():
    missing = [str(path) for path in [YUNET_FILE, SFACE_FILE] if not path.exists()]
    if missing:
        raise RuntimeError("Manjkajo ONNX modeli za YuNet/SFace: " + ", ".join(missing))


def get_yunet_detector(width, height):
    global yunet_detector
    require_sface_assets()
    if yunet_detector is None:
        if hasattr(cv2, "FaceDetectorYN_create"):
            yunet_detector = cv2.FaceDetectorYN_create(str(YUNET_FILE), "", (width, height), 0.78, 0.3, 5000)
        else:
            yunet_detector = cv2.FaceDetectorYN.create(str(YUNET_FILE), "", (width, height), 0.78, 0.3, 5000)
    yunet_detector.setInputSize((width, height))
    return yunet_detector


def get_sface_recognizer():
    global sface_recognizer
    require_sface_assets()
    if sface_recognizer is None:
        if hasattr(cv2, "FaceRecognizerSF_create"):
            sface_recognizer = cv2.FaceRecognizerSF_create(str(SFACE_FILE), "")
        else:
            sface_recognizer = cv2.FaceRecognizerSF.create(str(SFACE_FILE), "")
    return sface_recognizer


def crop_face_with_haar(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    min_side = max(50, int(min(gray.shape[:2]) * 0.08))
    faces = haar_detector.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(min_side, min_side))
    if len(faces) == 0:
        return None, None
    x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    pad = int(max(w, h) * 0.18)
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(image.shape[1], x + w + pad)
    y2 = min(image.shape[0], y + h + pad)
    face = image[y1:y2, x1:x2]
    face = cv2.resize(face, FACE_SIZE)
    box = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    return face, box


def crop_face(image):
    try:
        height, width = image.shape[:2]
        detector = get_yunet_detector(width, height)
        _, faces = detector.detect(image)
        if faces is None or len(faces) == 0:
            return None, None
        face_row = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        aligned = get_sface_recognizer().alignCrop(image, face_row)
        aligned = cv2.resize(aligned, FACE_SIZE)
        x, y, w, h = face_row[:4]
        box = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        return aligned, box
    except Exception:
        return crop_face_with_haar(image)



def face_quality(face):
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY) if len(face.shape) == 3 else face
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    contrast = float(np.std(gray))
    ok = sharpness >= MIN_SHARPNESS and contrast >= MIN_CONTRAST
    return {
        "ok": bool(ok),
        "sharpness": round(sharpness, 2),
        "contrast": round(contrast, 2),
        "min_sharpness": MIN_SHARPNESS,
        "min_contrast": MIN_CONTRAST
    }


def rotate_image(image, angle):
    h, w = image.shape[:2]
    matrix = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    return cv2.warpAffine(image, matrix, (w, h), borderMode=cv2.BORDER_REFLECT)


def change_light(image, alpha, beta):
    return cv2.convertScaleAbs(image, alpha=alpha, beta=beta)


def make_augmentations(face):
    images = [face]
    images.append(rotate_image(face, -5))
    images.append(rotate_image(face, 5))
    images.append(change_light(face, 1.0, -18))
    images.append(change_light(face, 1.0, 18))
    images.append(change_light(face, 1.12, 0))
    images.append(change_light(face, 0.88, 0))
    images.append(cv2.GaussianBlur(face, (3, 3), 0))
    return images


def lbp_image(gray):
    center = gray[1:-1, 1:-1]
    code = np.zeros(center.shape, dtype=np.uint8)
    code |= ((gray[:-2, :-2] >= center) << 7).astype(np.uint8)
    code |= ((gray[:-2, 1:-1] >= center) << 6).astype(np.uint8)
    code |= ((gray[:-2, 2:] >= center) << 5).astype(np.uint8)
    code |= ((gray[1:-1, 2:] >= center) << 4).astype(np.uint8)
    code |= ((gray[2:, 2:] >= center) << 3).astype(np.uint8)
    code |= ((gray[2:, 1:-1] >= center) << 2).astype(np.uint8)
    code |= ((gray[2:, :-2] >= center) << 1).astype(np.uint8)
    code |= (gray[1:-1, :-2] >= center).astype(np.uint8)
    return code


def histogram_grid(values, bins, value_range, grid=8, weights=None):
    parts = []
    rows = np.array_split(values, grid, axis=0)
    weight_rows = np.array_split(weights, grid, axis=0) if weights is not None else [None] * grid
    for row, weight_row in zip(rows, weight_rows):
        cols = np.array_split(row, grid, axis=1)
        weight_cols = np.array_split(weight_row, grid, axis=1) if weight_row is not None else [None] * grid
        for cell, weight_cell in zip(cols, weight_cols):
            hist, _ = np.histogram(
                cell.ravel(),
                bins=bins,
                range=value_range,
                weights=None if weight_cell is None else weight_cell.ravel()
            )
            hist = hist.astype(np.float32)
            hist = hist / (hist.sum() + 1e-7)
            parts.append(hist)
    return np.concatenate(parts)


def descriptor_from_face(face):
    if len(face.shape) == 2:
        face = cv2.cvtColor(face, cv2.COLOR_GRAY2BGR)
    face = cv2.resize(face, FACE_SIZE)
    feature = get_sface_recognizer().feature(face)
    feature = feature.flatten().astype(np.float32)
    return feature / (np.linalg.norm(feature) + 1e-7)


def chi_square(a, b):
    return float(0.5 * np.sum(((a - b) ** 2) / (a + b + 1e-7)))


def cosine_distance(a, b):
    return float(1.0 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-7))


def descriptor_distance(a, b):
    if not isinstance(a, dict) and not isinstance(b, dict):
        return cosine_distance(np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32))
    if isinstance(a, dict) != isinstance(b, dict):
        return 1.0
    lbp_distance = chi_square(a["lbp"], b["lbp"])
    hog_distance = chi_square(a["hog"], b["hog"])
    pixel_distance = cosine_distance(a["pixels"], b["pixels"])
    return float(0.45 * lbp_distance + 0.35 * hog_distance + 0.20 * pixel_distance)


def user_dirs():
    if not USERS_DIR.exists():
        return []
    return sorted([p for p in USERS_DIR.iterdir() if p.is_dir()])


def sample_paths_for_user(username):
    user_dir = USERS_DIR / username / "augmented"
    if not user_dir.exists():
        return []
    return sorted(list(user_dir.glob("*.jpg")))


def user_exists(username):
    username = clean_username(username)
    user_dir = USERS_DIR / username
    return user_dir.exists() and len(sample_paths_for_user(username)) > 0


def list_users():
    users = []
    for folder in user_dirs():
        users.append({"username": folder.name, "samples": len(sample_paths_for_user(folder.name))})
    return users


def load_model():
    if not MODEL_FILE.exists() or not LABELS_FILE.exists():
        return None
    with open(MODEL_FILE, "rb") as file:
        descriptors = pickle.load(file)
    with open(LABELS_FILE, "r", encoding="utf-8") as file:
        labels = json.load(file)
    return {"descriptors": descriptors, "labels": labels}


def model_uses_sface(model):
    if model is None or len(model.get("descriptors", [])) == 0:
        return False
    first = model["descriptors"][0]
    return not isinstance(first, dict) and np.asarray(first).size == 128


def save_model(descriptors, labels):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_FILE, "wb") as file:
        pickle.dump(descriptors, file)
    with open(LABELS_FILE, "w", encoding="utf-8") as file:
        json.dump(labels, file, ensure_ascii=False, indent=2)


def build_samples():
    samples = []
    for folder in user_dirs():
        username = folder.name
        for path in sample_paths_for_user(username):
            image = cv2.imread(str(path), cv2.IMREAD_COLOR)
            if image is not None:
                image = cv2.resize(image, FACE_SIZE)
                samples.append({"username": username, "path": str(path), "face": image})
    return samples


def train_model():
    samples = build_samples()
    if len(samples) == 0:
        if MODEL_FILE.exists():
            MODEL_FILE.unlink()
        if LABELS_FILE.exists():
            LABELS_FILE.unlink()
        metrics = {"accuracy": None, "message": "Ni pripravljenih vzorcev za učenje"}
        METRICS_FILE.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
        return {"trained": False, "error": "Ni pripravljenih vzorcev za učenje"}
    descriptors = []
    labels = []
    for sample in samples:
        descriptors.append(descriptor_from_face(sample["face"]))
        labels.append(sample["username"])
    save_model(descriptors, labels)
    metrics = evaluate_model()
    return {"trained": True, "users": len(set(labels)), "samples": len(samples), "metrics": metrics}


def evaluate_model():
    samples = build_samples()
    if len(samples) < 4:
        metrics = {"accuracy": None, "message": "Za smiselno oceno dodaj več slik oziroma uporabnikov"}
        METRICS_FILE.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
        return metrics
    grouped = {}
    for sample in samples:
        grouped.setdefault(sample["username"], []).append(sample)
    train = []
    test = []
    for username, items in grouped.items():
        for index, item in enumerate(items):
            if index % 4 == 0 and len(items) > 4:
                test.append(item)
            else:
                train.append(item)
    if len(test) == 0:
        test = train[-max(1, len(train) // 5):]
        train = train[:-len(test)]
    if len(train) == 0 or len(test) == 0:
        metrics = {"accuracy": None, "message": "Premalo podatkov za delitev na učno in testno množico"}
        METRICS_FILE.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
        return metrics
    train_desc = [descriptor_from_face(item["face"]) for item in train]
    train_labels = [item["username"] for item in train]
    correct = 0
    distances = []
    for item in test:
        desc = descriptor_from_face(item["face"])
        result = verify_descriptor(item["username"], desc, train_desc, train_labels)
        distances.append(result["distance"])
        if result["authenticated"]:
            correct += 1
    accuracy = correct / len(test)
    metrics = {
        "accuracy": round(float(accuracy), 4),
        "test_samples": len(test),
        "train_samples": len(train),
        "average_distance": round(float(np.mean(distances)), 4),
        "threshold": VERIFY_THRESHOLD,
        "top3_threshold": TOP3_THRESHOLD,
        "center_threshold": CENTER_THRESHOLD
    }
    METRICS_FILE.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    return metrics


def user_scores(desc, descriptors, labels):
    grouped = {}
    for known_desc, label in zip(descriptors, labels):
        grouped.setdefault(label, []).append(descriptor_distance(desc, known_desc))
    scores = []
    for label, distances in grouped.items():
        distances = sorted(distances)
        top = distances[:min(3, len(distances))]
        center = float(np.mean(distances))
        scores.append({
            "username": label,
            "best": float(distances[0]),
            "top3": float(np.mean(top)),
            "center": center,
            "samples": len(distances)
        })
    return sorted(scores, key=lambda item: (item["top3"], item["best"]))


def verify_descriptor(username, desc, descriptors, labels):
    scores = user_scores(desc, descriptors, labels)
    if len(scores) == 0:
        return {"authenticated": False, "error": "Model nima vzorcev", "confidence": 0.0}
    best = scores[0]
    claimed = next((item for item in scores if item["username"] == username), None)
    if claimed is None:
        return {"authenticated": False, "error": "Uporabnik ni registriran", "confidence": 0.0}
    second = next((item for item in scores if item["username"] != claimed["username"]), None)
    margin_ok = True
    margin = None
    if second is not None:
        margin = float(second["top3"] - claimed["top3"])
        margin_ok = margin >= MARGIN_THRESHOLD
    authenticated = (
        best["username"] == username
        and claimed["best"] <= VERIFY_THRESHOLD
        and claimed["top3"] <= TOP3_THRESHOLD
        and claimed["center"] <= CENTER_THRESHOLD
        and margin_ok
    )
    confidence = 1.0 - (claimed["top3"] / TOP3_THRESHOLD)
    confidence = max(0.0, min(1.0, confidence))
    return {
        "authenticated": bool(authenticated),
        "username": username,
        "predicted_user": best["username"],
        "confidence": round(float(confidence), 4),
        "distance": round(float(claimed["top3"]), 4),
        "best_distance": round(float(claimed["best"]), 4),
        "center_distance": round(float(claimed["center"]), 4),
        "threshold": VERIFY_THRESHOLD,
        "top3_threshold": TOP3_THRESHOLD,
        "center_threshold": CENTER_THRESHOLD,
        "margin": None if margin is None else round(float(margin), 4),
        "samples_used": int(claimed["samples"])
    }


def save_user_samples(username, image, face):
    user_dir = USERS_DIR / username
    raw_dir = user_dir / "raw"
    augmented_dir = user_dir / "augmented"
    raw_dir.mkdir(parents=True, exist_ok=True)
    augmented_dir.mkdir(parents=True, exist_ok=True)
    count = len(list(augmented_dir.glob("*.jpg")))
    raw_path = raw_dir / f"raw_{count:03d}.jpg"
    cv2.imwrite(str(raw_path), image)
    augmented = make_augmentations(face)
    for index, sample in enumerate(augmented):
        path = augmented_dir / f"sample_{count + index:03d}.jpg"
        cv2.imwrite(str(path), sample)
    return len(augmented)


def enroll_user(username, image_bytes):
    username = clean_username(username)
    if len(username) < 2:
        return {"success": False, "error": "Uporabniško ime je prekratko"}
    existing_user = user_exists(username)
    image = read_image(image_bytes)
    if image is None:
        return {"success": False, "error": "Slika je obvezna oziroma ni veljavna"}
    face, box = crop_face(image)
    if face is None:
        return {"success": False, "error": "Na sliki ni bil zaznan obraz"}
    quality = face_quality(face)
    if not quality["ok"]:
        return {"success": False, "error": "Slika obraza je preveč zamegljena ali slaba", "quality": quality}
    if existing_user:
        model = load_model()
        if not model_uses_sface(model):
            train_model()
            model = load_model()
        if model is None or username not in model["labels"]:
            return {"success": False, "error": "Obstoječi uporabnik nima pripravljenega modela"}
        desc = descriptor_from_face(face)
        check = verify_descriptor(username, desc, model["descriptors"], model["labels"])
        if not check.get("authenticated"):
            return {
                "success": False,
                "error": "Nov vzorec ni dovolj podoben obstoječim vzorcem uporabnika",
                "verification": check,
                "quality": quality,
                "face_box": box
            }
    added = save_user_samples(username, image, face)
    train_result = train_model()
    message = "Nov vzorec je dodan in model je ponovno naučen" if existing_user else "Uporabnik je registriran in model je ponovno naučen"
    return {
        "success": True,
        "username": username,
        "added_samples": added,
        "face_box": box,
        "quality": quality,
        "model": train_result,
        "message": message
    }


def verify_user(username, image_bytes):
    username = clean_username(username)
    model = load_model()
    if not model_uses_sface(model):
        train_model()
        model = load_model()
    if model is None:
        return {"authenticated": False, "error": "Model še ni naučen", "confidence": 0.0}
    if username not in model["labels"]:
        return {"authenticated": False, "error": "Uporabnik ni registriran", "confidence": 0.0}
    image = read_image(image_bytes)
    if image is None:
        return {"authenticated": False, "error": "Slika je obvezna oziroma ni veljavna", "confidence": 0.0}
    face, box = crop_face(image)
    if face is None:
        return {"authenticated": False, "error": "Na sliki ni bil zaznan obraz", "confidence": 0.0}
    quality = face_quality(face)
    if not quality["ok"]:
        return {"authenticated": False, "error": "Slika obraza je preveč zamegljena ali slaba", "confidence": 0.0, "quality": quality}
    desc = descriptor_from_face(face)
    result = verify_descriptor(username, desc, model["descriptors"], model["labels"])
    result["face_box"] = box
    result["quality"] = quality
    if not result.get("authenticated") and not result.get("error"):
        result["error"] = "Obraz ni dovolj podoben registriranim vzorcem"
    return result


def check_access(username, box_id, image_bytes):
    result = verify_user(username, image_bytes)
    if not result.get("authenticated", False):
        return {
            "allowed": False,
            "username": clean_username(username),
            "box_id": box_id,
            "reason": result.get("error", "Obraz ni potrjen"),
            "auth": result
        }
    if box_id not in ALLOWED_BOXES:
        return {
            "allowed": False,
            "username": clean_username(username),
            "box_id": box_id,
            "reason": "Omarica ni na seznamu dovoljenih omaric",
            "auth": result
        }
    return {
        "allowed": True,
        "username": clean_username(username),
        "box_id": box_id,
        "reason": "Obraz je potrjen in omarica je dovoljena",
        "auth": result
    }


def delete_user(username):
    username = clean_username(username)
    user_dir = USERS_DIR / username
    if not user_dir.exists():
        return {"success": False, "error": "Uporabnik ne obstaja"}
    shutil.rmtree(user_dir)
    train_model()
    return {"success": True, "message": "Uporabnik je izbrisan"}


def read_metrics():
    if not METRICS_FILE.exists():
        return {"message": "Metrike še niso ustvarjene"}
    return json.loads(METRICS_FILE.read_text(encoding="utf-8"))
