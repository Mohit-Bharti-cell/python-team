# File: routes/questions.py
# Backend route handlers for question generation and finalization

from flask import Blueprint, request, jsonify
from services.generator import generate_questions
import traceback
from config import get_db_connection
from utils.ids import gen_uuid 
import datetime
import json

questions_bp = Blueprint("questions", __name__)

@questions_bp.route("/generate-test", methods=["POST"])
def generate_test():
    """Generate questions based on skill selections"""
    data = request.get_json()

    if not data or "skills" not in data:
        return jsonify({"error": "Invalid request, missing skills"}), 400

    try:
        questions = generate_questions(data)
        # Return questions array wrapped in response object
        return jsonify({
            "status": "success", 
            "questions": questions
        }), 200
    except Exception as e:
        print("Error generating test:", str(e))
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@questions_bp.route("/finalize-test", methods=["POST"])
def finalize_test():
    """Finalize test and store in database"""
    print("\n" + "="*50)
    print("BACKEND: FINALIZE TEST REQUEST RECEIVED")
    print("="*50)
    
    data = request.get_json()
    
    # Log received data structure
    if data:
        print(f"Received keys: {list(data.keys())}")
        print(f"Data type: {type(data)}")
    else:
        print("ERROR: No data received")
        return jsonify({"error": "No data received"}), 400
    
    # Validate required fields
    if "questions" not in data:
        print("ERROR: Missing 'questions' in request data")
        print(f"Received data: {json.dumps(data, indent=2)}")
        return jsonify({"error": "Invalid request, missing questions"}), 400
    
    questions = data["questions"]
    
    # Validate questions is a list
    if not isinstance(questions, list):
        print(f"ERROR: 'questions' is not a list, type: {type(questions)}")
        return jsonify({"error": "Questions must be an array"}), 400
    
    if len(questions) == 0:
        print("ERROR: Questions array is empty")
        return jsonify({"error": "Questions array is empty"}), 400
    
    print(f"Number of questions received: {len(questions)}")
    
    # Extract test metadata
    test_title = data.get("test_title", "Untitled Test")
    test_description = data.get("test_description", "")
    job_id = data.get("job_id")
    
    print(f"Test Title: {test_title}")
    print(f"Test Description: {test_description}")
    print(f"Job ID: {job_id}")
    
    # Log first question structure for debugging
    if questions:
        print("\nFirst question structure:")
        print(json.dumps(questions[0], indent=2))

    conn = None
    try:
        print("\nAttempting to connect to database...")
        conn = get_db_connection()
        cur = conn.cursor()
        print("✓ Database connection successful")

        # Generate unique question_set_id
        question_set_id = gen_uuid()
        print(f"Generated question_set_id: {question_set_id}")
        
        # Calculate total duration
        total_duration = sum(q.get("time_limit", 60) for q in questions)
        print(f"Calculated total duration: {total_duration} seconds")

        # Set timestamps
        created_at = datetime.datetime.utcnow()
        expiry_time = created_at + datetime.timedelta(hours=48)
        print(f"Created at: {created_at}")
        print(f"Expires at: {expiry_time}")

        # Insert into question_set table
        print("\nInserting into question_set table...")
        try:
            # Try with title and description columns
            cur.execute("""
                INSERT INTO question_set (id, job_id, title, description, duration, created_at, expiry_time)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (question_set_id, job_id, test_title, test_description, total_duration, created_at, expiry_time))
            print("✓ question_set inserted with title and description")
        except Exception as col_error:
            print(f"Warning: Could not insert with title/description: {col_error}")
            print("Attempting fallback insert without title/description...")
            conn.rollback()
            cur.execute("""
                INSERT INTO question_set (id, job_id, duration, created_at, expiry_time)
                VALUES (%s, %s, %s, %s, %s)
            """, (question_set_id, job_id, total_duration, created_at, expiry_time))
            print("✓ question_set inserted (basic format)")

        # Insert questions
        print(f"\nProcessing {len(questions)} questions...")
        for i, q in enumerate(questions, 1):
            print(f"\n--- Processing question {i}/{len(questions)} ---")
            
            # Validate question structure
            required_fields = ['type', 'skill', 'difficulty', 'content']
            missing_fields = [field for field in required_fields if field not in q]
            
            if missing_fields:
                error_msg = f"Question {i} missing required fields: {missing_fields}"
                print(f"ERROR: {error_msg}")
                print(f"Question data: {json.dumps(q, indent=2)}")
                raise ValueError(error_msg)
            
            # Validate content is a dict
            if not isinstance(q['content'], dict):
                error_msg = f"Question {i} content must be a dictionary, got {type(q['content'])}"
                print(f"ERROR: {error_msg}")
                raise ValueError(error_msg)
            
            print(f"  Type: {q['type']}")
            print(f"  Skill: {q['skill']}")
            print(f"  Difficulty: {q['difficulty']}")
            print(f"  Content keys: {list(q['content'].keys())}")
            
            # Get or generate question_id
            question_id = q.get("question_id", gen_uuid())
            print(f"  Question ID: {question_id}")
            
            try:
                cur.execute("""
                    INSERT INTO questions (
                        id, question_set_id, type, skill, difficulty,
                        content, time_limit, positive_marking, negative_marking, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    question_id,
                    question_set_id,
                    q["type"],
                    q["skill"], 
                    q["difficulty"],
                    json.dumps(q["content"]),
                    q.get("time_limit", 60),
                    q.get("positive_marking", 0),
                    q.get("negative_marking", 0),
                    created_at
                ))
                print(f"  ✓ Question {i} inserted successfully")
            except Exception as insert_error:
                print(f"  ERROR inserting question {i}: {str(insert_error)}")
                print(f"  Question data: {json.dumps(q, indent=2)}")
                raise

        print("\n" + "-"*50)
        print("Committing transaction...")
        conn.commit()
        cur.close()
        print("✓ Transaction committed successfully")

        print(f"\n{'='*50}")
        print(f"✓✓✓ SUCCESS ✓✓✓")
        print(f"Test '{test_title}' finalized")
        print(f"Question Set ID: {question_set_id}")
        print(f"Questions stored: {len(questions)}")
        print("="*50 + "\n")

        return jsonify({
            "status": "success",
            "question_set_id": question_set_id,
            "test_title": test_title,
            "expiry_time": expiry_time.isoformat(),
            "message": f"Test '{test_title}' finalized and stored successfully"
        }), 201

    except ValueError as ve:
        # Validation errors
        print(f"\n❌ VALIDATION ERROR: {str(ve)}")
        if conn:
            conn.rollback()
        return jsonify({
            "status": "error", 
            "message": str(ve),
            "error": "Validation failed"
        }), 400
        
    except Exception as e:
        # Database or other errors
        print(f"\n❌ ERROR: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        
        if conn:
            print("Rolling back transaction...")
            conn.rollback()
            
        return jsonify({
            "status": "error", 
            "message": str(e),
            "error": "Database operation failed"
        }), 500

    finally:
        if conn:
            print("Closing database connection...")
            conn.close()
        print("="*50 + "\n")