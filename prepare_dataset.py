import os
import shutil
import random
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

ROOT = Path(r"C:\Users\YUG\.cache\kagglehub\datasets\raj713335\smartathon\versions\1\dataset")

PRE_DIR = ROOT / "PRE_LABELLED_DATASET"
CUSTOM_DIR = ROOT / "CUSTOM_LABELLED_DATASET"

OUTPUT_DIR = Path(r"D:\civicAi\ai_dataset")

TRAIN_IMAGES = OUTPUT_DIR / "images" / "train"
VAL_IMAGES = OUTPUT_DIR / "images" / "val"

TRAIN_LABELS = OUTPUT_DIR / "labels" / "train"
VAL_LABELS = OUTPUT_DIR / "labels" / "val"


# ============================================================
# SETTINGS
# ============================================================

TRAIN_RATIO = 0.80
RANDOM_SEED = 42

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp"
}


# ============================================================
# CREATE OUTPUT DIRECTORIES
# ============================================================

for folder in [
    TRAIN_IMAGES,
    VAL_IMAGES,
    TRAIN_LABELS,
    VAL_LABELS
]:
    folder.mkdir(parents=True, exist_ok=True)


# ============================================================
# VALIDATE YOLO LABEL
# ============================================================

def valid_label(label_path):
    try:
        lines = label_path.read_text(
            encoding="utf-8",
            errors="ignore"
        ).splitlines()
    except Exception:
        return False

    if not lines:
        return False

    for line in lines:

        # Skip Kaggle corrupted response
        if "429: Too Many Requests" in line:
            return False

        parts = line.strip().split()

        # YOLO format:
        # class x_center y_center width height
        if len(parts) != 5:
            return False

        try:
            class_id = int(parts[0])

            x = float(parts[1])
            y = float(parts[2])
            w = float(parts[3])
            h = float(parts[4])

        except ValueError:
            return False

        # We have 11 classes: 0 - 10
        if class_id < 0 or class_id > 10:
            return False

        # YOLO coordinates must be between 0 and 1
        if not (0 <= x <= 1):
            return False

        if not (0 <= y <= 1):
            return False

        if not (0 < w <= 1):
            return False

        if not (0 < h <= 1):
            return False

    return True


# ============================================================
# FIND IMAGE + LABEL PAIRS
# ============================================================

def collect_pairs(dataset_dir, dataset_name):

    pairs = []

    print(f"\nScanning {dataset_name}...")

    for image_path in dataset_dir.rglob("*"):

        if not image_path.is_file():
            continue

        if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        label_path = image_path.with_suffix(".txt")

        # No label
        if not label_path.exists():
            print("SKIP - no label:", image_path.name)
            continue

        # Invalid label
        if not valid_label(label_path):
            print("SKIP - invalid label:", label_path.name)
            continue

        pairs.append((image_path, label_path, dataset_name))

    print(f"{dataset_name}: {len(pairs)} valid pairs")

    return pairs


# ============================================================
# COLLECT DATA
# ============================================================

pre_pairs = collect_pairs(
    PRE_DIR,
    "PRE"
)

custom_pairs = collect_pairs(
    CUSTOM_DIR,
    "CUSTOM"
)

all_pairs = pre_pairs + custom_pairs


print("\n======================================")
print("TOTAL VALID PAIRS:", len(all_pairs))
print("======================================")


# ============================================================
# SHUFFLE
# ============================================================

random.seed(RANDOM_SEED)
random.shuffle(all_pairs)


# ============================================================
# TRAIN / VALIDATION SPLIT
# ============================================================

split_index = int(len(all_pairs) * TRAIN_RATIO)

train_pairs = all_pairs[:split_index]
val_pairs = all_pairs[split_index:]


print("TRAIN:", len(train_pairs))
print("VAL  :", len(val_pairs))


# ============================================================
# COPY FILES
# ============================================================

def copy_pairs(pairs, image_output, label_output, split_name):

    copied = 0

    for image_path, label_path, dataset_name in pairs:

        # Create unique filename
        new_name = (
            f"{dataset_name}_"
            f"{image_path.parent.name}_"
            f"{image_path.stem}"
        )

        # GIF is converted later separately.
        # For now keep original extension.
        new_image_name = new_name + image_path.suffix.lower()

        destination_image = image_output / new_image_name
        destination_label = label_output / (new_name + ".txt")

        try:

            shutil.copy2(
                image_path,
                destination_image
            )

            shutil.copy2(
                label_path,
                destination_label
            )

            copied += 1

        except Exception as e:

            print(
                f"ERROR copying {image_path.name}: {e}"
            )

    print(f"{split_name}: copied {copied} pairs")


# ============================================================
# COPY TRAIN
# ============================================================

copy_pairs(
    train_pairs,
    TRAIN_IMAGES,
    TRAIN_LABELS,
    "TRAIN"
)


# ============================================================
# COPY VALIDATION
# ============================================================

copy_pairs(
    val_pairs,
    VAL_IMAGES,
    VAL_LABELS,
    "VAL"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

train_images = [
    f for f in TRAIN_IMAGES.iterdir()
    if f.is_file()
]

val_images = [
    f for f in VAL_IMAGES.iterdir()
    if f.is_file()
]

train_labels = [
    f for f in TRAIN_LABELS.iterdir()
    if f.is_file()
]

val_labels = [
    f for f in VAL_LABELS.iterdir()
    if f.is_file()
]


print("\n======================================")
print("DATASET PREPARATION COMPLETE")
print("======================================")

print("Train images :", len(train_images))
print("Train labels :", len(train_labels))
print("Val images   :", len(val_images))
print("Val labels   :", len(val_labels))

print("\nOutput:")
print(OUTPUT_DIR)