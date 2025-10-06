import uuid
from services.llm_client import generate_question

def generate_questions(payload):
    """
    Orchestrates question generation for each skill and type.
    """
    all_questions = []
    skills = payload.get("skills", [])
    global_settings = payload.get("global_settings", {"mcq_options": 4})

    for skill in skills:
        name = skill.get("name")
        difficulty = skill.get("difficulty", "medium")
        counts = skill.get("counts", {})

        for qtype, num in counts.items():
            for _ in range(num):
                q_data = generate_question(
                    skill=name,
                    difficulty=difficulty,
                    qtype=qtype,
                    options=global_settings.get("mcq_options", 4),
                )
                all_questions.append({
                    "question_id": str(uuid.uuid4()),
                    "skill": name,
                    "type": qtype,
                    "difficulty": difficulty,
                    "content": q_data
                })

    return all_questions
