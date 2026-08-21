import re
import json
from typing import Dict, Any, List, Set
from app.ai.llm_service import llm_service, clean_json_response
from app.ai.prompts import JOB_PARSING_SYSTEM_PROMPT
from app.services.resume_parser import TECH_SKILLS_DB, SOFT_SKILLS_DB

# Skill normalization canonical dictionary
CANONICAL_SKILL_MAP = {
    "react": "React.js",
    "react.js": "React.js",
    "reactjs": "React.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "express.js": "Express.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "docker": "Docker",
    "ci/cd": "CI/CD",
    "github actions": "GitHub Actions",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "graphql": "GraphQL",
    "redis": "Redis",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "microservices": "Microservices",
    "sql": "SQL"
}

def normalize_skill(skill: str) -> str:
    """Normalize a skill to its canonical title."""
    s_lower = skill.strip().lower()
    if s_lower in CANONICAL_SKILL_MAP:
        return CANONICAL_SKILL_MAP[s_lower]
    return skill.strip().title() if len(skill.strip()) > 3 else skill.strip().upper()

def extract_job_skills_deterministic(text: str) -> Dict[str, Any]:
    """Deterministically extract skills and experience requirements from job text."""
    text_lower = text.lower()
    required = []
    preferred = []
    technologies = []

    # Detect skills from taxonomy
    for skill in TECH_SKILLS_DB:
        pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill) + r'(?![a-zA-Z0-9])'
        if re.search(pattern, text_lower):
            canon = normalize_skill(skill)
            if canon not in technologies:
                technologies.append(canon)

    # Detect years of experience
    exp_years = 0.0
    exp_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)', text_lower)
    if exp_matches:
        try:
            exp_years = max(float(x) for x in exp_matches)
        except Exception:
            exp_years = 2.0

    # Classify required vs preferred
    lines = text.splitlines()
    is_preferred_section = False
    for line in lines:
        l_low = line.lower()
        if any(h in l_low for h in ["nice to have", "preferred", "bonus", "plus", "desirable"]):
            is_preferred_section = True
        elif any(h in l_low for h in ["required", "qualifications", "must have", "requirements", "responsibilities"]):
            is_preferred_section = False

        for tech in technologies:
            if tech.lower() in l_low:
                if is_preferred_section and tech not in preferred:
                    preferred.append(tech)
                elif not is_preferred_section and tech not in required:
                    required.append(tech)

    # If all ended up in one bucket, balance logically
    if not required and technologies:
        required = technologies[:max(1, int(len(technologies) * 0.7))]
        preferred = technologies[len(required):]

    # Education level heuristic
    edu_level = "Bachelor's Degree in Computer Science or related field"
    if "master" in text_lower or "ms " in text_lower or "ph.d" in text_lower or "phd" in text_lower:
        edu_level = "Master's or Ph.D. in Computer Science or related field"

    return {
        "required_skills": required,
        "preferred_skills": preferred,
        "technologies": technologies,
        "experience_years_required": exp_years,
        "education_level": edu_level,
        "responsibilities": [l.strip("-*• ") for l in lines if len(l.strip()) > 30 and ("responsible" in l.lower() or "build" in l.lower() or "develop" in l.lower() or "design" in l.lower())][:6],
        "certifications": [s for s in ["AWS Certified", "CKA", "Azure Solutions Architect"] if s.lower() in text_lower],
        "keywords": list(dict.fromkeys(technologies + [w.strip() for w in re.findall(r'\b[A-Za-z]{4,15}\b', text) if w.lower() in ["scalable", "distributed", "architecture", "performance", "optimization", "security", "collaborative", "agile", "fullstack", "backend", "frontend"]]))
    }

async def parse_job_description(title: str, company: str, description: str) -> Dict[str, Any]:
    """Parse and extract structured job requirements using deterministic rules and LLM."""
    base_data = extract_job_skills_deterministic(description)

    try:
        user_prompt = f"Job Title: {title}\nCompany: {company}\n\nJob Description:\n{description[:4000]}"
        llm_response = await llm_service.generate_completion(
            system_prompt=JOB_PARSING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1
        )
        if llm_response:
            cleaned = clean_json_response(llm_response)
            ai_data = json.loads(cleaned)
            if ai_data.get("required_skills"):
                base_data["required_skills"] = [normalize_skill(s) for s in ai_data["required_skills"]]
            if ai_data.get("preferred_skills"):
                base_data["preferred_skills"] = [normalize_skill(s) for s in ai_data["preferred_skills"]]
            if ai_data.get("technologies"):
                base_data["technologies"] = list(dict.fromkeys([normalize_skill(s) for s in ai_data["technologies"]] + base_data["technologies"]))
            if ai_data.get("experience_years_required") is not None:
                base_data["experience_years_required"] = float(ai_data["experience_years_required"])
            if ai_data.get("education_level"):
                base_data["education_level"] = ai_data["education_level"]
            if ai_data.get("responsibilities") and len(ai_data["responsibilities"]) > 0:
                base_data["responsibilities"] = ai_data["responsibilities"]
    except Exception as e:
        print(f"[job_analyzer] LLM fallback to deterministic: {e}")

    return base_data
