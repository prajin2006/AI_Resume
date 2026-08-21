import json
from typing import Dict, Any, List, Optional
from app.ai.llm_service import llm_service
from app.ai.prompts import COPILOT_SYSTEM_PROMPT

def detect_copilot_action(user_message: str) -> Optional[str]:
    """Detect if user query matches an action intent."""
    msg = user_message.lower()
    if any(k in msg for k in ["analyze my resume", "run analysis", "full analysis"]):
        return "analyze"
    elif any(k in msg for k in ["interview question", "ask me question", "quiz me", "mock interview"]):
        return "interview"
    elif any(k in msg for k in ["missing skill", "skills missing", "what skills am i missing", "gap in skills"]):
        return "missing_skills"
    elif any(k in msg for k in ["rejection", "why could i be rejected", "rejection risk", "recruiter concern"]):
        return "rejection_risks"
    elif any(k in msg for k in ["preparation plan", "study plan", "how should i prepare", "7-day plan", "readiness"]):
        return "prep_plan"
    elif any(k in msg for k in ["improve summary", "rewrite", "improve my resume", "bullet point"]):
        return "rewrite"
    return None

async def generate_copilot_response(
    user_message: str,
    conversation_history: List[Dict[str, str]],
    resume_data: Optional[Dict[str, Any]] = None,
    job_data: Optional[Dict[str, Any]] = None,
    analysis_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate dynamic, context-aware AI Copilot response.
    Includes active resume, job, and analysis state.
    """
    action_type = detect_copilot_action(user_message)
    action_payload = {}

    # Build detailed context block
    context_lines = ["CURRENT CONTEXT:"]
    if resume_data:
        context_lines.append(f"- Candidate Name: {resume_data.get('contact', {}).get('name', 'Candidate')}")
        context_lines.append(f"- Resume Skills: {', '.join(resume_data.get('skills', [])[:12])}")
        context_lines.append(f"- Experience Years: {resume_data.get('total_years_experience', 0)}")
        projs = [p.get('name') for p in resume_data.get('projects', []) if p.get('name')]
        if projs:
            context_lines.append(f"- Projects: {', '.join(projs)}")
    else:
        context_lines.append("- Resume: No resume selected yet.")

    if job_data:
        context_lines.append(f"- Target Job: {job_data.get('title', 'Target Role')} at {job_data.get('company', 'Target Company')}")
        reqs = job_data.get('requirements', {})
        if reqs:
            context_lines.append(f"- Job Required Skills: {', '.join(reqs.get('required_skills', [])[:8])}")
            context_lines.append(f"- Job Preferred Skills: {', '.join(reqs.get('preferred_skills', [])[:5])}")
    else:
        context_lines.append("- Target Job: No job description selected yet.")

    if analysis_data:
        context_lines.append(f"- Overall Match Score: {analysis_data.get('overall_score', 0)}%")
        context_lines.append(f"- ATS Score: {analysis_data.get('ats_score', 0)}%")
        context_lines.append(f"- Matched Skills: {', '.join(analysis_data.get('matched_skills', []))}")
        context_lines.append(f"- Missing Skills: {', '.join(analysis_data.get('missing_skills', []))}")

    context_str = "\n".join(context_lines)

    # Format conversation history
    history_formatted = ""
    for item in conversation_history[-6:]:
        history_formatted += f"{item.get('role', 'user').capitalize()}: {item.get('message', '')}\n"

    user_prompt = f"""
{context_str}

CONVERSATION HISTORY:
{history_formatted}

User: {user_message}
AI Copilot:
"""

    # If LLM key is configured, query LLM
    response_text = ""
    try:
        response_text = await llm_service.generate_completion(
            system_prompt=COPILOT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3
        )
    except Exception as e:
        print(f"[copilot] LLM error: {e}")

    # Fallback to intelligent dynamic heuristics if LLM is offline or no response
    if not response_text:
        response_text = _generate_heuristic_copilot_response(user_message, resume_data, job_data, analysis_data, action_type)

    # Attach payload for rich UI rendering
    if action_type == "missing_skills" and analysis_data:
        action_payload = {"missing_skills": analysis_data.get("missing_skills", [])}
    elif action_type == "rejection_risks" and analysis_data:
        action_payload = {"rejection_risks": analysis_data.get("rejection_risks", [])}
    elif action_type == "analyze" and analysis_data:
        action_payload = {
            "overall_score": analysis_data.get("overall_score"),
            "ats_score": analysis_data.get("ats_score"),
            "skill_match_score": analysis_data.get("skill_match_score")
        }

    return {
        "message": response_text,
        "action_type": action_type,
        "action_payload": action_payload if action_payload else None
    }

def _generate_heuristic_copilot_response(
    user_message: str,
    resume_data: Optional[Dict[str, Any]],
    job_data: Optional[Dict[str, Any]],
    analysis_data: Optional[Dict[str, Any]],
    action_type: Optional[str]
) -> str:
    msg = user_message.lower()
    cand_name = resume_data.get("contact", {}).get("name") if resume_data else "there"
    job_title = job_data.get("title", "Target Role") if job_data else "your target job"
    missing = analysis_data.get("missing_skills", []) if analysis_data else []
    matched = analysis_data.get("matched_skills", []) if analysis_data else []
    score = analysis_data.get("overall_score", 0) if analysis_data else None

    if "low" in msg or "why" in msg and "score" in msg:
        if missing:
            return f"Based on your analysis for {job_title}, your match score reflects high alignment with {', '.join(matched[:3])}, but is pulled down primarily by missing requirements in {', '.join(missing[:3])}. Furthermore, highlighting production deployments and quantifying your project outcomes will directly boost your ATS and Recruiter scores."
        return f"Your overall score is currently {score}%. The most effective way to raise this is ensuring every core technical skill from the job description is represented in both your skills summary and project bullet points."

    elif "learn first" in msg or "which skill" in msg:
        if missing:
            return f"I recommend learning **{missing[0]}** first. It is classified as a mandatory requirement for {job_title} and closing this gap will provide the highest immediate ROI for your recruiter screening score."
        return "Focus on deepening your knowledge of core API design, database indexing, and containerization with Docker, as these are universally valued across technical screenings."

    elif "interview" in msg or action_type == "interview":
        top_skill = matched[0] if matched else "Full Stack Engineering"
        return f"Here is a high-priority technical question based on your resume:\n\n**Question:** *'Can you explain how you designed state management and API communication in your recent project using {top_skill}?'*\n\n**Interviewer Expectation:** Walk through architecture -> error handling -> performance optimization with concrete examples."

    elif "rejection" in msg or action_type == "rejection_risks":
        if missing:
            return f"The top estimated recruiter concern is the lack of visible experience in **{missing[0]}**, which is heavily emphasized in {job_title}. If you have built projects with this stack, adding a dedicated bullet point with a live demo link will mitigate this risk."
        return "Your profile is competitive! The main point of caution is ensuring you can speak in-depth to the architectural choices behind each project listed on your resume."

    elif "improve" in msg or action_type == "rewrite":
        return "To improve your resume immediately:\n1. Open your project descriptions with powerful action verbs (*Architected, Engineered, Optimized*).\n2. Apply the Google XYZ formula: *Accomplished [X] measured by [Y] by doing [Z]*.\n3. Add live deployment URLs and GitHub repository links for every major project."

    else:
        return f"Hello! I am your NextHire AI Copilot. I'm actively analyzing your resume and match for **{job_title}**. You can ask me anything about your ATS score, how to answer specific interview questions, what skills to study next, or how to rephrase your resume bullet points!"
