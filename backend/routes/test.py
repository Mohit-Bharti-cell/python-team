from flask import Blueprint, request, jsonify
from config import get_db_connection
from services.llm_client import evaluate_answer
import os
import psycopg2
import secrets
import json
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "recordings")
os.makedirs(UPLOAD_DIR, exist_ok=True)

test_bp = Blueprint("test", __name__)

# ==============================================
# Start Test
# ==============================================
@test_bp.route("/test/start/<question_set_id>", methods=["GET"])
def start_test(question_set_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, content
            FROM questions
            WHERE question_set_id = %s
        """, (uuid.UUID(question_set_id),))
        rows = cursor.fetchall()

        questions_list = []

        for qid, raw in rows:
            # qid may be UUID object
            qid_str = str(qid)
            raw_json = json.loads(raw) if isinstance(raw, str) else raw
            inner = raw_json.get("content", {})

            questions_list.append({
                "id": qid_str,
                "question_id": qid_str,
                "type": raw_json.get("type"),
                "skill": raw_json.get("skill"),
                "difficulty": raw_json.get("difficulty"),
                "time_limit": raw_json.get("time_limit"),
                "positive_marking": raw_json.get("positive_marking"),
                "negative_marking": raw_json.get("negative_marking"),
                "question": inner.get("question"),
                "options": inner.get("options"),
                "correct_answer": inner.get("correct_answer"),
                "prompt_text": inner.get("prompt_text"),
                "media_url": inner.get("media_url"),
                "rubric": inner.get("rubric"),
                "suggested_time_seconds": inner.get("suggested_time_seconds"),
            })

        return jsonify({
            "question_set_id": question_set_id,
            "questions": questions_list
        }), 200

    except Exception as e:
        print("🔥 start_test error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==============================================
# Save Violations
# ==============================================
@test_bp.route("/test/save_violations", methods=["POST"])
def save_violations():
    data = request.get_json() or {}

    candidate_id = data.get("candidate_id")
    question_set_id = data.get("question_set_id")
    tab_switches = data.get("tab_switches", 0)
    inactivities = data.get("inactivities", 0)
    face_not_visible = data.get("face_not_visible", 0)

    if not candidate_id or not question_set_id:
        return jsonify({"error": "candidate_id and question_set_id required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO test_attempts (
                candidate_id, question_set_id,
                tab_switches, inactivities, face_not_visible
            )
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                tab_switches = EXCLUDED.tab_switches,
                inactivities = EXCLUDED.inactivities,
                face_not_visible = EXCLUDED.face_not_visible;
        """, (
            uuid.UUID(candidate_id),
            uuid.UUID(question_set_id),
            tab_switches,
            inactivities,
            face_not_visible
        ))

        conn.commit()
        return jsonify({"message": "Violations updated"}), 200

    except Exception as e:
        print("🔥 ERROR saving violations:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==============================================
# Upload Audio
# ==============================================
@test_bp.route("/upload_audio", methods=["POST"])
def upload_audio():
    conn = None
    cur = None
    try:
        if "audio" not in request.files:
            return jsonify({"error": "audio file required"}), 400

        audio_file = request.files["audio"]
        if audio_file.filename == "":
            return jsonify({"error": "empty filename"}), 400

        candidate_id = request.form.get("candidate_id")
        question_set_id = request.form.get("question_set_id")
        qa_raw = request.form.get("qa_data") or "[]"

        try:
            qa_data = json.loads(qa_raw)
        except Exception:
            qa_data = []

        ext = os.path.splitext(audio_file.filename)[1] or ".webm"
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe = secure_filename(f"{candidate_id}_{ts}{ext}")
        save_path = os.path.join(UPLOAD_DIR, safe)
        audio_file.save(save_path)
        audio_url = f"/{UPLOAD_DIR}/{safe}"

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO test_attempts (
                candidate_id, question_set_id, audio_url, qa_data
            ) VALUES (%s, %s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                audio_url = COALESCE(EXCLUDED.audio_url, test_attempts.audio_url),
                qa_data = COALESCE(test_attempts.qa_data, '[]'::jsonb) || COALESCE(EXCLUDED.qa_data, '[]'::jsonb);
        """, (
            uuid.UUID(candidate_id),
            uuid.UUID(question_set_id),
            audio_url,
            json.dumps(qa_data)
        ))

        conn.commit()

        return jsonify({"status": "success", "audio_url": audio_url}), 200

    except Exception as e:
        print("🔥 upload_audio error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==============================================
# Upload Video
# ==============================================
@test_bp.route("/upload_video", methods=["POST"])
def upload_video():
    conn = None
    cur = None
    try:
        if "file" not in request.files:
            return jsonify({"error": "video file required"}), 400

        video_file = request.files["file"]
        if video_file.filename == "":
            return jsonify({"error": "empty filename"}), 400

        candidate_id = request.form.get("candidate_id")
        question_set_id = request.form.get("question_set_id")
        qa_raw = request.form.get("qa_data") or "[]"

        try:
            qa_data = json.loads(qa_raw)
        except Exception:
            qa_data = []

        safe = secure_filename(video_file.filename)
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        final_name = f"{candidate_id}_{ts}_{safe}"
        save_path = os.path.join(UPLOAD_DIR, final_name)
        video_file.save(save_path)
        video_url = f"/{UPLOAD_DIR}/{final_name}"

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO test_attempts (
                candidate_id, question_set_id, video_url, qa_data
            ) VALUES (%s, %s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                video_url = COALESCE(EXCLUDED.video_url, test_attempts.video_url),
                qa_data = COALESCE(test_attempts.qa_data, '[]'::jsonb) || COALESCE(EXCLUDED.qa_data, '[]'::jsonb);
        """, (
            uuid.UUID(candidate_id),
            uuid.UUID(question_set_id),
            video_url,
            json.dumps(qa_data)
        ))

        conn.commit()

        return jsonify({"status": "success", "video_url": video_url}), 200

    except Exception as e:
        print("🔥 upload_video error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==============================================
# Submit Section
# ==============================================
@test_bp.route("/test/submit_section", methods=["POST"])
def submit_section():
    data = request.get_json() or {}

    question_set_id = data.get("question_set_id")
    section_name = data.get("section_name")
    responses = data.get("responses", [])
    candidate_id = data.get("candidate_id")

    if not candidate_id or not question_set_id:
        return jsonify({"error": "candidate_id and question_set_id required"}), 400

    conn = None
    cursor = None
    try:
        results_out = []

        for r in responses:
            qid = r.get("question_id")
            qtype = r.get("question_type")
            qtext = r.get("question_text")
            correct = r.get("correct_answer")
            answer = r.get("candidate_answer")

            if qtype in ["mcq", "coding"]:
                try:
                    evaluation = evaluate_answer(
                        question_type=qtype,
                        question_text=qtext,
                        correct_answer=correct,
                        candidate_answer=answer,
                    )
                except Exception:
                    evaluation = {"score": 0, "feedback": "Evaluation failed", "is_correct": False}
            else:
                evaluation = {"score": None, "feedback": "Not evaluated", "is_correct": False}

            results_out.append({
                "question_id": qid,
                "candidate_answer": answer,
                "correct_answer": correct,
                "section_name": section_name,
                "score": evaluation.get("score"),
                "is_correct": evaluation.get("is_correct"),
                "feedback": evaluation.get("feedback")
            })

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO test_attempts (
                candidate_id, question_set_id, results_data
            )
            VALUES (%s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                results_data = COALESCE(test_attempts.results_data, '[]'::jsonb) || EXCLUDED.results_data,
                video_url = COALESCE(EXCLUDED.video_url, test_attempts.video_url),
                audio_url = COALESCE(EXCLUDED.audio_url, test_attempts.audio_url),
                qa_data = COALESCE(test_attempts.qa_data, '[]'::jsonb);
        """, (
            uuid.UUID(candidate_id),
            uuid.UUID(question_set_id),
            json.dumps(results_out)
        ))

        conn.commit()

        return jsonify({"message": "Section stored", "evaluations": results_out}), 200

    except Exception as e:
        print("🔥 submit_section error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# ==============================================
# Save Full Test Details (role, skills, exp, schedule)
# ==============================================
@test_bp.route("/test/save_details", methods=["POST"])
def save_test_details():
    data = request.get_json() or {}

    candidate_id = data.get("candidate_id") or str(uuid.uuid4())
    question_set_id = data.get("question_set_id") or str(uuid.uuid4())

    role_title = data.get("role_title")
    skills = data.get("skills")
    experience = data.get("experience")
    work_arrangement = data.get("work_arrangement")
    location = data.get("location")
    annual_compensation = data.get("annual_compensation")

    test_start = data.get("test_start")  # expect ISO8601 or postgres-parsable
    test_end = data.get("test_end")

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO candidate_test_details (
                candidate_id, question_set_id,
                role_title, skills, experience,
                work_arrangement, location, annual_compensation,
                test_start, test_end
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                role_title = EXCLUDED.role_title,
                skills = EXCLUDED.skills,
                experience = EXCLUDED.experience,
                work_arrangement = EXCLUDED.work_arrangement,
                location = EXCLUDED.location,
                annual_compensation = EXCLUDED.annual_compensation,
                test_start = EXCLUDED.test_start,
                test_end = EXCLUDED.test_end;
        """, (
            uuid.UUID(candidate_id),
            uuid.UUID(question_set_id),
            role_title, skills, experience,
            work_arrangement, location, annual_compensation,
            test_start, test_end
        ))

        conn.commit()
        return jsonify({"message": "Test details saved successfully", "candidate_id": candidate_id, "question_set_id": question_set_id}), 200

    except Exception as e:
        print("🔥 save_details error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==============================================
# Save Generated Questions
# ==============================================
@test_bp.route("/questions/save", methods=["POST"])
def save_generated_questions():
    data = request.get_json() or {}

    question_set_id = data.get("question_set_id") or str(uuid.uuid4())
    questions = data.get("questions", [])

    if not isinstance(questions, list):
        return jsonify({"error": "questions must be a list"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        for q in questions:
            qid = uuid.uuid4()
            # ensure content is stored under a consistent shape
            content = q.get("content") if isinstance(q, dict) else q
            # allow top-level fields like type/skill to be at root
            entry = {
                "type": q.get("type"),
                "skill": q.get("skill"),
                "difficulty": q.get("difficulty"),
                "time_limit": q.get("time_limit"),
                "positive_marking": q.get("positive_marking"),
                "negative_marking": q.get("negative_marking"),
                "content": content
            }

            cur.execute("""
                INSERT INTO questions (id, question_set_id, content)
                VALUES (%s, %s, %s)
            """, (
                qid,
                uuid.UUID(question_set_id),
                json.dumps(entry)
            ))

        conn.commit()
        return jsonify({"message": "Questions saved successfully", "question_set_id": question_set_id}), 200

    except Exception as e:
        print("🔥 Error saving questions:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur: cur.close()
        if conn: conn.close()

# ==============================================
# Optional: Create session - returns candidate_id & question_set_id
# ==============================================
@test_bp.route("/test/create_session", methods=["POST"])
def create_session():
    data = request.get_json() or {}
    candidate_id = data.get("candidate_id") or str(uuid.uuid4())
    question_set_id = data.get("question_set_id") or str(uuid.uuid4())

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # create a placeholder row in test_attempts so ON CONFLICT works later
        cur.execute("""
            INSERT INTO test_attempts (candidate_id, question_set_id)
            VALUES (%s, %s)
            ON CONFLICT (candidate_id, question_set_id) DO NOTHING
        """, (uuid.UUID(candidate_id), uuid.UUID(question_set_id)))
        conn.commit()

        return jsonify({"candidate_id": candidate_id, "question_set_id": question_set_id}), 200

    except Exception as e:
        print("🔥 create_session error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()
