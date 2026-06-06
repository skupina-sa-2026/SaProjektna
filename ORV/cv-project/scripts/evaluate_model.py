import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from model.face_auth import evaluate_model, read_metrics, train_model


def main():
    print(train_model())
    print(read_metrics())


if __name__ == "__main__":
    main()
