import requests
import json
from config import OPENROUTER_API_KEY, OPENROUTER_URL, OPENROUTER_MODEL

PROMPTS = {
    "mcq": (
        "Generate ONE multiple-choice question for skill '{skill}' "
        "with difficulty '{difficulty}'. Provide {options} answer options "
        "labeled A, B, C, D. Return JSON ONLY with keys: prompt, options (list), answer (single letter)."
    ),
    "coding": (
        "Generate ONE coding question for skill '{skill}' "
        "with difficulty '{difficulty}'. Return JSON ONLY with keys: prompt, input_spec, output_spec, examples (list)."
    ),
    "audio": (
        "Generate ONE interview question for skill '{skill}' "
        "with difficulty '{difficulty}'. The question should be short and clear. "
        "Return JSON ONLY with keys: prompt_text, expected_keywords (list), rubric (short)."
    ),
    "video": (
        "Generate ONE interview question for skill '{skill}' "
        "with difficulty '{difficulty}'. The question should be short and clear. "
        "Return JSON ONLY with keys: prompt_text, rubric (short), suggested_time_seconds."
    ),
}

def generate_question(skill: str, difficulty: str, qtype: str, options: int = 4):
    prompt_text = PROMPTS[qtype].format(skill=skill, difficulty=difficulty, options=options)

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful interview question generator."},
            {"role": "user", "content": prompt_text}
        ],
        "temperature": 0.3,
        "max_tokens": 600
    }

    resp = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    try:
        # Deepseek returns GPT-style response: choices[0].message.content
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception:
        # fallback if parsing fails
        return {"raw": content}
