from flask import Blueprint, request, jsonify
from config import get_db_connection
from services.llm_client import evaluate_answer
import os
import psycopg2
import secrets
import json
from datetime import datetime
from werkzeug.utils import secure_filename

from flask import current_app, send_from_directory  # if using application factory

# Ensure you have an UPLOAD_DIR configured or set a local default
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "recordings")
os.makedirs(UPLOAD_DIR, exist_ok=True)
test_bp = Blueprint("test", __name__)

# ============================================================
# ✅ Start Test Endpoint
# ============================================================
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
              AND content->>'type' IN ('mcq', 'coding', 'audio', 'video')
        """, (question_set_id,))
        rows = cursor.fetchall()

        questions_list = []

        for db_id, raw in rows:
            # ensure raw is a dict, not a string
            if isinstance(raw, str):
                raw_json = json.loads(raw)
            else:
                raw_json = raw

            q_type = raw_json.get("type")
            inner = raw_json.get("content", {}) or {}

            questions_list.append({
                # send BOTH db id and question_id so frontend is happy
                "id": db_id,   # <- React uses question.id
                "question_id": raw_json.get("question_id") or db_id,

                "type": q_type,
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
        # log full traceback in Flask console
        print("🔥 start_test error:", e, flush=True)
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ============================================================
# ✅ Save Violations API
# ============================================================
@test_bp.route("/test/save_violations", methods=["POST"])
def save_violations():
    data = request.get_json()

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
            candidate_id,
            question_set_id,
            tab_switches,
            inactivities,
            face_not_visible
        ))

        conn.commit()
        return jsonify({"message": "Violations updated"}), 200

    except Exception as e:
        print("🔥 ERROR saving violations:", e, flush=True)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
    
# -------------------------
# Upload audio route
# -------------------------
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

        # Save audio file
        ext = os.path.splitext(audio_file.filename)[1] or ".webm"
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe = secure_filename(f"{candidate_id}_{ts}{ext}")
        save_path = os.path.join(UPLOAD_DIR, safe)
        audio_file.save(save_path)
        audio_url = f"/{UPLOAD_DIR}/{safe}"

        conn = get_db_connection()
        cur = conn.cursor()

        # Insert or update audio_url & merge qa_data (keep existing qa_data if present)
        cur.execute("""
            INSERT INTO test_attempts (
                candidate_id, question_set_id,
                audio_url, qa_data
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                audio_url = COALESCE(EXCLUDED.audio_url, test_attempts.audio_url),
                qa_data = COALESCE(test_attempts.qa_data, '[]'::jsonb) || COALESCE(EXCLUDED.qa_data, '[]'::jsonb);
        """, (
            candidate_id,
            question_set_id,
            audio_url,
            json.dumps(qa_data)
        ))

        conn.commit()

        return jsonify({
            "status": "success",
            "candidate_id": candidate_id,
            "audio_url": audio_url
        }), 200

    except Exception as e:
        print("🔥 upload_audio error:", e, flush=True)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# -------------------------
# Upload video route
# -------------------------
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

        # Save video
        safe = secure_filename(video_file.filename)
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        final_name = f"{candidate_id}_{ts}_{safe}"
        save_path = os.path.join(UPLOAD_DIR, final_name)
        video_file.save(save_path)
        video_url = f"/{UPLOAD_DIR}/{final_name}"

        conn = get_db_connection()
        cur = conn.cursor()

        # Insert or update video_url & merge qa_data (keep existing qa_data if present)
        cur.execute("""
            INSERT INTO test_attempts (
                candidate_id, question_set_id,
                video_url, qa_data
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (candidate_id, question_set_id)
            DO UPDATE SET
                video_url = COALESCE(EXCLUDED.video_url, test_attempts.video_url),
                qa_data = COALESCE(test_attempts.qa_data, '[]'::jsonb) || COALESCE(EXCLUDED.qa_data, '[]'::jsonb);
        """, (
            candidate_id,
            question_set_id,
            video_url,
            json.dumps(qa_data)
        ))

        conn.commit()

        return jsonify({
            "status": "success",
            "candidate_id": candidate_id,
            "video_url": video_url
        }), 200

    except Exception as e:
        print("🔥 upload_video error:", e, flush=True)
        return jsonify({"error": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ============================================================
# ✅ Submit Section API
# ============================================================
@test_bp.route("/test/submit_section", methods=["POST"])
def submit_section():
    data = request.get_json()

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

        # Use COALESCE so existing results_data (if any) is preserved and new results are concatenated.
        # Also preserve existing video_url and audio_url unless the insert provides new ones (EXCLUDED).
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
            candidate_id,
            question_set_id,
            json.dumps(results_out)
        ))

        conn.commit()

        return jsonify({
            "message": "Section stored",
            "evaluations": results_out
        }), 200

    except Exception as e:
        print("🔥 submit_section error:", e, flush=True)
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
