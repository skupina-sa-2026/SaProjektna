import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from model.face_auth import enroll_user


def main():
    import_dir = ROOT / "data" / "import"
    if not import_dir.exists():
        print("Ustvari mapo data/import/uporabnik in vanjo dodaj JPG ali PNG slike")
        return
    total = 0
    success = 0
    for user_dir in sorted(import_dir.iterdir()):
        if not user_dir.is_dir():
            continue
        username = user_dir.name
        for path in sorted(list(user_dir.glob("*.jpg")) + list(user_dir.glob("*.png")) + list(user_dir.glob("*.jpeg"))):
            total += 1
            result = enroll_user(username, path.read_bytes())
            if result.get("success"):
                success += 1
            print(path.name, result)
    print({"skupaj": total, "uspesno": success})


if __name__ == "__main__":
    main()
