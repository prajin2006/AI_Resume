import json
from typing import Dict, Any, List
from app.ai.llm_service import llm_service, clean_json_response

def generate_heuristic_interview_questions(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    matched_skills: List[str],
    missing_skills: List[str]
) -> List[Dict[str, Any]]:
    questions = []
    projects = parsed_resume.get("projects", [])
    primary_skill = matched_skills[0] if matched_skills else "Full Stack Development"
    sec_skill = matched_skills[1] if len(matched_skills) > 1 else "REST APIs"
    missing_one = missing_skills[0] if missing_skills else "System Design"
    first_proj = projects[0].get("name", "Flagship Web Application") if projects else "Recent Software Project"

    # 1. Technical Question
    questions.append({
        "question": f"How do you manage state, asynchronous operations, and performance bottlenecks when building applications in {primary_skill}?",
        "category": "Technical",
        "difficulty": "Medium",
        "why_asked": f"The job explicitly requires {primary_skill}, and your resume highlights it as a core capability.",
        "what_expected": f"A structured explanation of component lifecycle, memory management, caching, and state predictability in {primary_skill}.",
        "preparation_tips": f"Review common architectural anti-patterns and performance profiling tools associated with {primary_skill}."
    })

    # 2. Project-Based Question
    questions.append({
        "question": f"Walk me through the end-to-end architecture of '{first_proj}'. What technical trade-offs did you make during database and API design?",
        "category": "Project",
        "difficulty": "Hard",
        "why_asked": f"'{first_proj}' is featured prominently on your resume as a key demonstration of your technical execution.",
        "what_expected": "Ability to justify database schema choices, authentication mechanics, scaling considerations, and handling failure modes.",
        "preparation_tips": "Prepare a 3-minute architectural overview highlighting: Problem -> Architecture diagram -> Difficult bug solved -> Measurable outcome."
    })

    # 3. Resume-Based Question
    questions.append({
        "question": f"Your resume highlights experience with {sec_skill}. Can you describe a challenging bug or performance bottleneck you diagnosed and resolved?",
        "category": "Resume-based",
        "difficulty": "Medium",
        "why_asked": "Interviewers test whether skills listed on your resume reflect deep hands-on troubleshooting experience.",
        "what_expected": "Clear methodical debugging approach (logging, profiling, root cause isolation, automated test prevention).",
        "preparation_tips": "Use the STAR method (Situation, Task, Action, Result) focusing 70% of time on the Action and Result."
    })

    # 4. Job-Specific / Gap Question
    questions.append({
        "question": f"This role heavily utilizes {missing_one}. How would you bridge your foundational knowledge to get up to speed quickly in production?",
        "category": "Job-specific",
        "difficulty": "Medium",
        "why_asked": f"{missing_one} is a job requirement not explicitly detailed in your resume, so the team wants to assess ramp-up agility.",
        "what_expected": "A pragmatic learning roadmap: mapping conceptual parallels from known tools, reading official docs, building a proof-of-concept.",
        "preparation_tips": f"Acknowledge where you stand honestly, cite similar technologies you mastered quickly, and summarize a quick weekend POC plan."
    })

    # 5. Behavioral Question
    questions.append({
        "question": "Tell me about a time when product requirements changed right before a deadline. How did you prioritize tasks and communicate with teammates?",
        "category": "Behavioral",
        "difficulty": "Easy",
        "why_asked": "Assesses agility, emotional intelligence, cross-functional communication, and engineering pragmatism under pressure.",
        "what_expected": "Demonstration of proactive scope negotiation, transparent stakeholder updates, and maintaining code quality under tight constraints.",
        "preparation_tips": "Structure your response with a calm, non-blaming tone emphasizing customer/business value."
    })

    # 6. Scenario-Based Question
    questions.append({
        "question": "Suppose your API suddenly experiences a 10x traffic spike and response latency jumps from 50ms to 4000ms. How do you triage and mitigate the issue in real time?",
        "category": "Scenario",
        "difficulty": "Hard",
        "why_asked": "Tests real-world production incident response, database indexing, caching strategies, and load shedding.",
        "what_expected": "Step 1: Check monitoring/metrics -> Step 2: Scale horizontally / apply rate limiting -> Step 3: Add Redis caching / database read replicas -> Step 4: Post-mortem.",
        "preparation_tips": "Familiarize yourself with standard web tier scaling patterns and observability metrics (CPU, RAM, DB connection pools)."
    })

    # 7. HR / Fit Question
    questions.append({
        "question": f"What specifically attracts you to this {parsed_job.get('title', 'Engineer')} opportunity at {parsed_job.get('company', 'our company')}, and where do you see your technical trajectory in the next 2-3 years?",
        "category": "HR",
        "difficulty": "Easy",
        "why_asked": "Verifies genuine company interest, cultural alignment, and career motivation.",
        "what_expected": "Specific mention of the company's product challenges or tech stack, aligned with personal growth goals.",
        "preparation_tips": f"Research {parsed_job.get('company', 'the company')}'s engineering mission and articulate 2 specific reasons why this exact role fits your growth."
    })

    return questions

async def generate_interview_questions(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    matched_skills: List[str],
    missing_skills: List[str]
) -> List[Dict[str, Any]]:
    """Generate tailored multi-category interview questions."""
    baseline = generate_heuristic_interview_questions(parsed_resume, parsed_job, matched_skills, missing_skills)

    prompt = f"""
Candidate:
Skills: {parsed_resume.get('skills', [])}
Projects: {parsed_resume.get('projects', [])}
Experience: {parsed_resume.get('experience', [])}

Job:
Title: {parsed_job.get('title', '')}
Required: {parsed_job.get('required_skills', [])}
Matched: {matched_skills}
Missing: {missing_skills}

Generate 7 personalized interview questions covering categories:
HR, Technical, Project, Resume-based, Job-specific, Behavioral, Scenario.
Difficulty: Easy, Medium, Hard.
For each provide: question, category, difficulty, why_asked, what_expected, preparation_tips.
Output valid JSON array:
[
  {{
    "question": "string",
    "category": "Technical",
    "difficulty": "Medium",
    "why_asked": "string",
    "what_expected": "string",
    "preparation_tips": "string"
  }}
]
"""
    try:
        res = await llm_service.generate_completion(
            system_prompt="You are an expert technical interviewer creating tailored interview preparation questions. Return JSON array only.",
            user_prompt=prompt,
            temperature=0.3
        )
        if res:
            ai_questions = json.loads(clean_json_response(res))
            if isinstance(ai_questions, list) and len(ai_questions) >= 5:
                return ai_questions
    except Exception as e:
        print(f"[interview_generator] LLM fallback: {e}")

    return baseline
