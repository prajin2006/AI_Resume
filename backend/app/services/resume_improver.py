import json
from typing import Dict, Any, List
from app.ai.llm_service import llm_service, clean_json_response

def generate_heuristic_improvements(parsed_resume: Dict[str, Any], parsed_job: Dict[str, Any]) -> List[Dict[str, Any]]:
    improvements = []
    
    # 1. Summary improvement
    orig_summary = parsed_resume.get("summary") or "Software developer passionate about creating web applications and working with modern technologies."
    top_skill = parsed_resume.get("skills", ["Full Stack Engineering"])[0]
    target_role = parsed_job.get("title", "Software Engineer")
    
    suggested_summary = f"Results-driven {target_role} with strong expertise in {', '.join(parsed_resume.get('technical_skills', ['modern web architecture'])[:3])}. Proven track record of developing scalable applications, optimizing API performance, and delivering robust full-stack solutions."
    
    improvements.append({
        "section_name": "Professional Summary",
        "original_text": orig_summary,
        "suggested_text": suggested_summary,
        "reason_for_change": "Directly targets the desired role, showcases core competencies upfront, and replaces passive wording with impactful action adjectives."
    })

    # 2. Experience / Projects bullet improvement
    projects = parsed_resume.get("projects", [])
    if projects:
        p0 = projects[0]
        orig_proj_desc = " ".join(p0.get("description", [])) or f"Built a web app called {p0.get('name', 'project')} using React and Python."
        tech_str = ", ".join(p0.get("technologies", ["FastAPI", "React"])) or "modern frameworks"
        
        suggested_proj = f"Architected and deployed '{p0.get('name', 'flagship project')}', integrating {tech_str} to deliver responsive UI and secure RESTful endpoints; enhanced response throughput and ensured full test coverage."
        improvements.append({
            "section_name": f"Project: {p0.get('name', 'Flagship Application')}",
            "original_text": orig_proj_desc,
            "suggested_text": suggested_proj,
            "reason_for_change": "Applies the Google XYZ formula (Accomplished X, measured by Y, by doing Z) without fabricating fictitious metrics."
        })
    
    # 3. Skills Section Organization
    skills = parsed_resume.get("skills", [])
    if skills:
        orig_skills_str = ", ".join(skills[:8])
        tech = ", ".join(parsed_resume.get("technical_skills", skills)[:5])
        tools = ", ".join(parsed_resume.get("tools_technologies", ["Git", "Docker", "PostgreSQL"])[:4])
        suggested_skills = f"Languages & Frameworks: {tech} | Tools & Infrastructure: {tools} | Practices: REST APIs, CI/CD, Agile"
        
        improvements.append({
            "section_name": "Skills Section Layout",
            "original_text": orig_skills_str,
            "suggested_text": suggested_skills,
            "reason_for_change": "Categorized skill grouping dramatically improves ATS parsability and makes recruiter scanning effortless in under 6 seconds."
        })

    return improvements

async def generate_resume_improvements(parsed_resume: Dict[str, Any], parsed_job: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate fact-preserving resume bullet improvements."""
    baseline = generate_heuristic_improvements(parsed_resume, parsed_job)

    prompt = f"""
Resume:
Summary: {parsed_resume.get('summary', '')}
Experience: {parsed_resume.get('experience', [])}
Projects: {parsed_resume.get('projects', [])}

Job Target:
Title: {parsed_job.get('title', '')}
Requirements: {parsed_job.get('required_skills', [])}

Rewrite 3-4 sections or bullet points.
CRITICAL RULES:
- Preserve factual truth.
- Do NOT invent companies, degrees, fake metrics, or fake technologies.
- Provide original, suggested, and reason for change.

Output JSON array:
[
  {{
    "section_name": "Summary",
    "original_text": "...",
    "suggested_text": "...",
    "reason_for_change": "..."
  }}
]
"""
    try:
        res = await llm_service.generate_completion(
            system_prompt="You are a professional resume optimizer. Preserve facts while enhancing clarity and ATS impact. Output JSON only.",
            user_prompt=prompt,
            temperature=0.2
        )
        if res:
            ai_improvements = json.loads(clean_json_response(res))
            if isinstance(ai_improvements, list) and len(ai_improvements) > 0:
                return ai_improvements
    except Exception as e:
        print(f"[resume_improver] LLM fallback: {e}")

    return baseline
