from typing import Dict, Any, List, Tuple
from app.services.job_analyzer import normalize_skill

# Partial skill similarity mapping (e.g. knowing React gives partial match for Next.js or Vue)
SIMILAR_SKILLS_GRAPH = {
    "React.js": ["Next.js", "Vue.js", "Angular", "Svelte", "Redux"],
    "Next.js": ["React.js", "TypeScript", "Node.js"],
    "Node.js": ["Express.js", "FastAPI", "Nest.js", "Backend"],
    "FastAPI": ["Flask", "Django", "Python", "REST APIs"],
    "Django": ["Flask", "FastAPI", "Python"],
    "PostgreSQL": ["MySQL", "SQL", "Database Design", "Redis", "SQLite"],
    "MySQL": ["PostgreSQL", "SQL", "MariaDB"],
    "MongoDB": ["NoSQL", "DynamoDB", "CouchDB"],
    "AWS": ["GCP", "Azure", "Cloud Deployment", "Docker"],
    "Docker": ["Kubernetes", "Containerization", "CI/CD"],
    "Kubernetes": ["Docker", "Terraform", "DevOps"],
    "Python": ["Django", "FastAPI", "Data Science", "Machine Learning"],
    "JavaScript": ["TypeScript", "React.js", "Node.js"]
}

def compare_skills(resume_skills: List[str], job_skills: List[str]) -> Tuple[List[str], List[str], List[str], List[str]]:
    """
    Compare resume skills against job skills.
    Returns: (matched, missing, partial, extra)
    """
    norm_resume = {normalize_skill(s).lower(): normalize_skill(s) for s in resume_skills}
    norm_job = {normalize_skill(s).lower(): normalize_skill(s) for s in job_skills}

    matched = []
    missing = []
    partial = []
    extra = []

    # Check job skills
    for j_low, j_canon in norm_job.items():
        if j_low in norm_resume:
            matched.append(j_canon)
        else:
            # Check for partial similarity
            is_partial = False
            similars = SIMILAR_SKILLS_GRAPH.get(j_canon, [])
            for sim in similars:
                if sim.lower() in norm_resume:
                    partial.append(f"{j_canon} (via {norm_resume[sim.lower()]})")
                    is_partial = True
                    break
            if not is_partial:
                missing.append(j_canon)

    # Extra skills present in resume but not requested
    for r_low, r_canon in norm_resume.items():
        if r_low not in norm_job:
            extra.append(r_canon)

    return matched, missing, partial, extra

def calculate_ats_breakdown(
    raw_text: str,
    parsed_resume: Dict[str, Any],
    job_reqs: Dict[str, Any],
    matched_skills: List[str] = None,
    missing_skills: List[str] = None
) -> Dict[str, Any]:
    """
    Calculate transparent 100-point ATS Score Breakdown:
    - Contact Information: 5 pts
    - Professional Summary: 5 pts
    - Skills Section: 15 pts
    - Education: 10 pts
    - Experience: 15 pts
    - Projects: 10 pts
    - Keyword Match: 20 pts
    - Required Skill Match: 15 pts
    - ATS Readability & Structure: 5 pts
    Total: 100 points
    """
    contact = parsed_resume.get("contact", {})
    summary = parsed_resume.get("summary", "")
    skills = parsed_resume.get("skills", [])
    education = parsed_resume.get("education", [])
    experience = parsed_resume.get("experience", [])
    projects = parsed_resume.get("projects", [])
    raw_lower = raw_text.lower() if raw_text else ""

    # 1. Contact Info (5 pts)
    contact_score = 0.0
    if contact.get("name"): contact_score += 1.0
    if contact.get("email"): contact_score += 1.0
    if contact.get("phone"): contact_score += 1.0
    if contact.get("linkedin"): contact_score += 1.0
    if contact.get("location") or contact.get("github") or contact.get("portfolio"): contact_score += 1.0
    contact_score = round(min(5.0, contact_score), 1)

    # 2. Professional Summary (5 pts)
    summary_score = 0.0
    if summary and len(summary.strip()) > 30:
        summary_score = 5.0
    elif summary and len(summary.strip()) > 10:
        summary_score = 3.0
    summary_score = round(summary_score, 1)

    # 3. Skills Section (15 pts)
    skills_score = 0.0
    if len(skills) >= 10:
        skills_score = 15.0
    elif len(skills) >= 6:
        skills_score = 12.0
    elif len(skills) >= 3:
        skills_score = 8.0
    elif len(skills) > 0:
        skills_score = 5.0
    skills_score = round(skills_score, 1)

    # 4. Education (10 pts)
    education_score = 0.0
    if education and len(education) > 0:
        education_score = 10.0 if any(e.get("institution") or e.get("degree") for e in education) else 6.0
    education_score = round(education_score, 1)

    # 5. Experience (15 pts)
    experience_score = 0.0
    if experience and len(experience) >= 2:
        experience_score = 15.0
    elif experience and len(experience) == 1:
        experience_score = 11.0
    elif parsed_resume.get("total_years_experience", 0) > 0:
        experience_score = 8.0
    experience_score = round(experience_score, 1)

    # 6. Projects (10 pts)
    project_score = 0.0
    if projects and len(projects) >= 2:
        project_score = 10.0
    elif projects and len(projects) == 1:
        project_score = 7.0
    project_score = round(project_score, 1)

    # 7. Keyword Match (20 pts)
    keyword_score = 0.0
    job_keywords = job_reqs.get("keywords", [])
    if job_keywords:
        found_kw = sum(1 for kw in job_keywords if kw.lower() in raw_lower)
        keyword_score = round(min(20.0, (found_kw / len(job_keywords)) * 20.0), 1)
    else:
        # Fallback: check standard industry tech keywords
        common_keywords = ["design", "api", "database", "testing", "deploy", "git", "cloud", "agile", "architecture", "scale"]
        found_comm = sum(1 for kw in common_keywords if kw in raw_lower)
        keyword_score = round(min(20.0, (found_comm / len(common_keywords)) * 20.0), 1)

    # 8. Required Skill Match (15 pts)
    required_skill_score = 0.0
    req_skills = job_reqs.get("required_skills", [])
    if req_skills:
        if matched_skills is not None:
            m_count = len(matched_skills)
        else:
            m_count = sum(1 for rs in req_skills if rs.lower() in [s.lower() for s in skills])
        required_skill_score = round(min(15.0, (m_count / len(req_skills)) * 15.0), 1)
    else:
        required_skill_score = 12.0

    # 9. ATS Readability & Structure (5 pts)
    readability_score = 3.0
    action_verbs = ["developed", "built", "implemented", "designed", "optimized", "engineered", "created", "spearheaded"]
    if any(verb in raw_lower for verb in action_verbs):
        readability_score += 1.0
    if len(raw_text.split()) >= 120:
        readability_score += 1.0
    readability_score = round(min(5.0, readability_score), 1)

    total_ats = round(
        contact_score +
        summary_score +
        skills_score +
        education_score +
        experience_score +
        project_score +
        keyword_score +
        required_skill_score +
        readability_score,
        1
    )
    total_ats = min(99.0, max(20.0, total_ats))

    # Status determination
    if total_ats >= 90:
        status_label = "Excellent ATS Compatibility"
        explanation = "Your resume has exceptional ATS readability, well-structured section headings, and strong keyword alignment."
    elif total_ats >= 75:
        status_label = "Good ATS Compatibility"
        explanation = "Your resume has solid ATS formatting and covers most requirements, with minor keyword optimization opportunities."
    elif total_ats >= 60:
        status_label = "Moderate ATS Compatibility"
        explanation = "Your resume will parse in ATS systems, but adding missing skills and measurable bullets will significantly improve rankings."
    elif total_ats >= 40:
        status_label = "Needs Improvement"
        explanation = "Key resume sections or target keywords are missing, which may reduce your visibility in automated recruiter screens."
    else:
        status_label = "Low ATS Compatibility"
        explanation = "Critical contact information, experience details, or technical skills are absent. Review the breakdown to enhance structure."

    recommendations = []
    if keyword_score < 14.0:
        recommendations.append("Add relevant job keywords where they accurately represent your experience.")
    if project_score < 7.0:
        recommendations.append("Add relevant technical or personal projects to demonstrate practical skill execution.")
    if summary_score < 4.0:
        recommendations.append("Add a concise professional summary describing your core strengths and career focus.")
    if contact_score < 4.0:
        recommendations.append("Ensure your LinkedIn profile and location are listed in your contact header.")
    if not recommendations:
        recommendations.append("Maintain clean formatting and keep your tech stack synchronized with job requirements.")

    return {
        "score": total_ats,
        "status": status_label,
        "explanation": explanation,
        "recommendations": recommendations,
        "breakdown": {
            "contact_information": {"score": contact_score, "max": 5.0},
            "professional_summary": {"score": summary_score, "max": 5.0},
            "skills_section": {"score": skills_score, "max": 15.0},
            "education": {"score": education_score, "max": 10.0},
            "experience": {"score": experience_score, "max": 15.0},
            "projects": {"score": project_score, "max": 10.0},
            "keyword_match": {"score": keyword_score, "max": 20.0},
            "required_skill_match": {"score": required_skill_score, "max": 15.0},
            "ats_readability": {"score": readability_score, "max": 5.0}
        }
    }

def calculate_ats_score(raw_text: str, parsed_resume: Dict[str, Any], job_reqs: Dict[str, Any], matched_skills: List[str] = None, missing_skills: List[str] = None) -> float:
    """Calculate single ATS score float."""
    breakdown = calculate_ats_breakdown(raw_text, parsed_resume, job_reqs, matched_skills, missing_skills)
    return breakdown["score"]

def calculate_match_scores(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    matched_skills: List[str],
    missing_skills: List[str],
    partial_skills: List[str],
    raw_resume_text: str
) -> Dict[str, Any]:
    """Calculate all granular match metrics."""
    # 1. Skill Match Score
    total_req_skills = len(matched_skills) + len(missing_skills) + len(partial_skills)
    if total_req_skills > 0:
        raw_skill_score = (len(matched_skills) * 1.0 + len(partial_skills) * 0.45) / total_req_skills * 100.0
    else:
        raw_skill_score = 75.0
    skill_match_score = round(min(98.0, max(15.0, raw_skill_score)), 1)

    # 2. Experience Match Score
    res_exp = parsed_resume.get("total_years_experience", 1.0)
    job_exp = parsed_job.get("experience_years_required", 2.0)
    if job_exp <= 0:
        exp_score = 90.0
    elif res_exp >= job_exp:
        exp_score = min(98.0, 85.0 + (res_exp - job_exp) * 3.0)
    else:
        exp_score = max(20.0, 80.0 - (job_exp - res_exp) * 20.0)
    experience_match_score = round(exp_score, 1)

    # 3. Project Relevance Score
    projects = parsed_resume.get("projects", [])
    if not projects:
        project_score = 45.0
    else:
        proj_matches = 0
        for p in projects:
            p_text = f"{p.get('name', '')} {' '.join(p.get('technologies', []))} {' '.join(p.get('description', []))}".lower()
            if any(m.lower() in p_text for m in matched_skills):
                proj_matches += 1
        project_score = min(95.0, 60.0 + proj_matches * 12.0)
    project_match_score = round(project_score, 1)

    # 4. Education Match Score
    education = parsed_resume.get("education", [])
    edu_score = 85.0 if education else 60.0
    education_match_score = round(edu_score, 1)

    # 5. Keyword Match Score
    keywords = parsed_job.get("keywords", [])
    if keywords:
        found_kw = sum(1 for kw in keywords if kw.lower() in raw_resume_text.lower())
        keyword_score = min(96.0, max(30.0, (found_kw / len(keywords)) * 100.0))
    else:
        keyword_score = skill_match_score
    keyword_match_score = round(keyword_score, 1)

    # 6. ATS Score Breakdown
    ats_data = calculate_ats_breakdown(raw_resume_text, parsed_resume, parsed_job, matched_skills, missing_skills)
    ats_score = ats_data["score"]

    # 7. Recruiter Score
    recruiter_score = round(
        skill_match_score * 0.40 +
        experience_match_score * 0.25 +
        project_match_score * 0.20 +
        education_match_score * 0.15,
        1
    )

    # 8. Overall Weighted Composite Score
    overall_score = round(
        skill_match_score * 0.35 +
        experience_match_score * 0.20 +
        project_match_score * 0.15 +
        ats_score * 0.15 +
        keyword_match_score * 0.15,
        1
    )

    return {
        "overall_score": overall_score,
        "ats_score": ats_score,
        "recruiter_score": recruiter_score,
        "skill_match_score": skill_match_score,
        "experience_match_score": experience_match_score,
        "project_match_score": project_match_score,
        "education_match_score": education_match_score,
        "keyword_match_score": keyword_match_score,
        "ats_breakdown": ats_data
    }
