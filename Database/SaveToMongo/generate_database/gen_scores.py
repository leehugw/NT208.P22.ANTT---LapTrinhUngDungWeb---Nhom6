import json
import random
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path
import re

def load_json_file(filename: str) -> List[Dict[str, Any]]:
    """Load data from a JSON file."""
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(filename: str, data: List[Dict[str, Any]]) -> None:
    """Save data to a JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_semester_num(semester_id: str) -> str:
    return semester_id[2] if semester_id and semester_id.startswith("HK") else None

def generate_scores(students: List[Dict], subjects: List[Dict], enrollments: List[Dict]) -> List[Dict]:
    scores = []
    student_lookup = {s["student_id"]: s for s in students}
    subject_lookup = {s["subject_id"]: s for s in subjects}
    
    for enrollment in enrollments:
        student_id = enrollment["student_id"]
        semester_id = enrollment["semester_id"]
        semester_num = extract_semester_num(semester_id)  # Tách số học kỳ
        student = student_lookup.get(student_id)
        
        if not student:
            continue
            
        for subject_id in enrollment["subject_ids"]:
            subject = subject_lookup.get(subject_id)
            if not subject:
                continue
                
            has_practice = subject["practice_credits"] > 0
            is_english = "ENG" in subject_id.upper()
            is_exempt = is_english and student.get("has_english_certificate", False)
            is_retaken = False

            # Random điểm (giữ nguyên logic cũ)
            score_qt = round(random.uniform(4.0, 10.0), 1) if random.random() > 0.05 else None
            score_gk = round(random.uniform(4.0, 10.0), 1) if random.random() > 0.05 else None
            score_th = round(random.uniform(4.0, 10.0), 1) if has_practice and random.random() > 0.05 else None
            score_ck = round(random.uniform(4.0, 10.0), 1) if random.random() > 0.05 else None
            
            # Xử lý điểm HP và status
            if is_exempt:
                score_hp = "Miễn"
                status = "Đậu"
            else:
                if None in [score_qt, score_gk, score_ck] or (has_practice and score_th is None):
                    status = "None"
                    score_hp = None
                else:
                    if has_practice:
                        avg = (score_qt * 0.2) + (score_gk * 0.3) + (score_th * 0.2) + (score_ck * 0.3)
                    else:
                        avg = (score_qt * 0.2) + (score_gk * 0.3) + (score_ck * 0.5)
                    status = "Đậu" if avg >= 5.0 else "Rớt"
                    score_hp = round(avg, 1) if status != "None" else None
            
            if isinstance(score_hp, (int, float)) and score_hp < 5.0 and status == "Rớt":
                is_retaken = True

            scores.append({
                "student_id": student_id,
                "subject_id": subject_id,
                "semester_id": semester_id,
                "score_QT": score_qt,
                "score_GK": score_gk,
                "score_TH": score_th,
                "score_CK": score_ck,
                "score_HP": score_hp,
                "semester_num": semester_num,
                "isRetaken": is_retaken,
                "status": status
            })
    
    return scores

def main():
    # Load data files
    students_path = Path(__file__).parent.parent / "Json" / "students.json"
    subjects_path = Path(__file__).parent.parent / "Json" / "subjects.json"
    enrollments_path = Path(__file__).parent.parent / "Json" / "enrollment.json"
    scores_path = Path(__file__).parent.parent / "Json" / "scores.json"

    students = load_json_file(students_path)
    subjects = load_json_file(subjects_path)
    enrollments = load_json_file(enrollments_path)

    # Generate scores
    scores = generate_scores(students, subjects, enrollments)
    
    # Save to file
    save_json_file(scores_path, scores)
    print(f"Generated {len(scores)} score records.")

if __name__ == "__main__":
    main()