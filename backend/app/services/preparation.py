import json
from typing import Dict, Any, List
from app.ai.llm_service import llm_service, clean_json_response

def generate_heuristic_prep_gaps(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    matched_skills: List[str],
    missing_skills: List[str]
) -> Dict[str, Any]:
    strong_areas = matched_skills[:5] if matched_skills else ["Core Programming", "Problem Solving"]
    weak_areas = missing_skills[:4] if missing_skills else ["System Design", "Cloud Infrastructure"]
    missing_knowledge = [
        f"Production design patterns in {missing_skills[0]}" if missing_skills else "Microservices & Distributed Systems",
        f"Database indexing and query optimization in {parsed_job.get('title', 'Target Stack')}",
        "CI/CD deployment pipelines & container orchestration",
        "Behavioral STAR articulation and project impact metrics"
    ]

    p1 = matched_skills[0] if matched_skills else "Core Language / Framework"
    p2 = matched_skills[1] if len(matched_skills) > 1 else "REST APIs"
    m1 = missing_skills[0] if missing_skills else "System Design"
    m2 = missing_skills[1] if len(missing_skills) > 1 else "Cloud Architecture"

    plan = [
        {
            "day": 1,
            "title": f"Mastering Core Fundamentals ({p1})",
            "topics": [f"{p1} lifecycle & internals", "Asynchronous execution", "Memory & state optimization"],
            "tasks": [
                f"Review top 15 advanced interview questions on {p1}",
                "Write a live coding sample illustrating concurrency or memoization",
                "Prepare concise definitions for key architectural trade-offs"
            ],
            "completed": False
        },
        {
            "day": 2,
            "title": f"Deep Dive: {p2} & API Architecture",
            "topics": ["RESTful best practices", "Authentication (JWT/OAuth)", "Status codes & error contracts"],
            "tasks": [
                "Map out your project's authentication flow on a whiteboard",
                "Practice explaining rate limiting and token revocation",
                "Review middleware patterns and request validation"
            ],
            "completed": False
        },
        {
            "day": 3,
            "title": f"Bridging the Gap: {m1}",
            "topics": [f"{m1} core concepts", "Real-world production use-cases", "Common pitfalls & tooling"],
            "tasks": [
                f"Build a mini proof-of-concept integrating {m1}",
                f"Read official overview documentation for {m1}",
                "Draft your answer to: 'How would you quickly master this stack on the job?'"
            ],
            "completed": False
        },
        {
            "day": 4,
            "title": f"Infrastructure, Database & {m2}",
            "topics": ["SQL query optimization & indexing", "Docker containerization", "Caching with Redis"],
            "tasks": [
                "Explain EXPLAIN ANALYZE for slow database queries",
                "Containerize a multi-service web app with Docker Compose",
                "Design a simple caching layer with TTL expiration"
            ],
            "completed": False
        },
        {
            "day": 5,
            "title": "Project Walkthrough & Behavioral STAR Practice",
            "topics": ["Flagship project architecture", "Conflict resolution", "Overcoming tough bugs"],
            "tasks": [
                "Rehearse a 3-minute project walkthrough aloud without rambling",
                "Structure 3 behavioral stories using Situation-Task-Action-Result",
                "Conduct a self-recorded mock interview"
            ],
            "completed": False
        }
    ]

    return {
        "strong_areas": strong_areas,
        "weak_areas": weak_areas,
        "missing_knowledge": missing_knowledge,
        "preparation_plan": plan
    }

async def generate_preparation_analysis(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    matched_skills: List[str],
    missing_skills: List[str]
) -> Dict[str, Any]:
    """Generate interview preparation gaps and 5-day structured plan."""
    baseline = generate_heuristic_prep_gaps(parsed_resume, parsed_job, matched_skills, missing_skills)

    prompt = f"""
Candidate Skills: {parsed_resume.get('skills', [])}
Job Requirements: {parsed_job.get('required_skills', [])}
Matched Skills: {matched_skills}
Missing Skills: {missing_skills}

Generate interview readiness gaps and a 5-day structured preparation plan.
Return JSON matching schema:
{{
  "strong_areas": ["..."],
  "weak_areas": ["..."],
  "missing_knowledge": ["..."],
  "preparation_plan": [
    {{
      "day": 1,
      "title": "...",
      "topics": ["..."],
      "tasks": ["..."],
      "completed": false
    }}
  ]
}}
"""
    try:
        res = await llm_service.generate_completion(
            system_prompt="You are an elite tech career coach. Create an actionable 5-day study plan. Output JSON only.",
            user_prompt=prompt,
            temperature=0.2
        )
        if res:
            ai_plan = json.loads(clean_json_response(res))
            if ai_plan.get("preparation_plan") and len(ai_plan["preparation_plan"]) >= 3:
                return ai_plan
    except Exception as e:
        print(f"[preparation] LLM fallback: {e}")

    return baseline
