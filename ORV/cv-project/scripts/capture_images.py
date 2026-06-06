import sys
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from model.face_auth import enroll_user


def main():
    if len(sys.argv) < 2:
        print("Uporaba: python scripts/capture_images.py uporabnik")
        return
    username = sys.argv[1]
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("Kamera ni dostopna")
        return
    saved = 0
    print("SPACE shrani sliko, ESC konča")
    while True:
        ok, frame = camera.read()
        if not ok:
            break
        cv2.putText(frame, f"{username} | shranjeno: {saved}", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imshow("Zajem podatkov", frame)
        key = cv2.waitKey(1)
        if key == 27:
            break
        if key == 32:
            ok, buffer = cv2.imencode(".jpg", frame)
            if ok:
                result = enroll_user(username, buffer.tobytes())
                print(result)
                if result.get("success"):
                    saved += 1
    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
