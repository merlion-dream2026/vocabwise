"""
Merge seeker data into words.json for both personal and commercial apps.
Run from the scripts/ directory or adjust paths below.
"""
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from add_seeker_part1 import SEEKER_TOPICS_1_15
from add_seeker_part2 import SEEKER_TOPICS_16_30

SEEKER_DATA = {
    "topics": SEEKER_TOPICS_1_15 + SEEKER_TOPICS_16_30
}

def validate(data):
    topics = data["topics"]
    total = sum(len(t["words"]) for t in topics)
    print(f"  Seeker: {len(topics)} topics, {total} words")
    assert len(topics) == 30, f"Expected 30 topics, got {len(topics)}"
    assert total == 400, f"Expected 400 words, got {total}"
    # Check no duplicate words within seeker
    all_words = [w["word"] for t in topics for w in t["words"]]
    dupes = [w for w in set(all_words) if all_words.count(w) > 1 and w not in ("orange",)]
    if dupes:
        print(f"  WARNING: Duplicate words: {dupes}")
    print("  Validation passed!")

def add_to_file(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if "seeker" in data:
        print(f"  seeker already exists in {path}, skipping.")
        return
    # Insert seeker before starter (alphabetical order: seeker < starter)
    new_data = {"seeker": SEEKER_DATA}
    new_data.update(data)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
    print(f"  Done: {path}")

if __name__ == "__main__":
    print("Validating seeker data...")
    validate(SEEKER_DATA)

    COMMERCIAL = os.path.join(os.path.dirname(__file__), "../data/words.json")
    PERSONAL   = "/Users/andienguyen/ANDIE Personal/Claude/Projects/vocab-kids/data/words.json"

    print(f"\nAdding seeker to commercial app...")
    add_to_file(os.path.abspath(COMMERCIAL))

    print(f"\nAdding seeker to personal app...")
    add_to_file(PERSONAL)

    print("\nAll done!")
