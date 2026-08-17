"""
Resume parsing — docs/01-technical-architecture.md §1.3 ("Resume parsing").

This is a regex/heuristic parser rather than a full spaCy NER pipeline, so the AI service
runs with no model downloads and works out of the box. Swapping in spaCy's NER (or a
fine-tuned resume-parsing model) is a drop-in replacement for `parse_resume_text()` below —
the return shape is what the rest of the system (Node's queues/processor.js) depends on,
not the extraction method.
"""
import re
from .skills_taxonomy import ALL_SKILLS

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}")
EXPERIENCE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", re.IGNORECASE)
DEGREE_RE = re.compile(
    r"(Bachelor(?:'s)?|Master(?:'s)?|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|B\.?Sc|M\.?Sc|MBA|Ph\.?D)"
    r"[^\n,.]{0,60}",
    re.IGNORECASE,
)
CERT_KEYWORDS = ["certified", "certification", "certificate"]


def extract_skills(text: str):
    lower = text.lower()
    found = []
    for skill, category in ALL_SKILLS.items():
        # Word-boundary match so "Go" doesn't match inside "Google", etc.
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"
        if re.search(pattern, lower):
            found.append({"name": skill, "category": category, "confidence": 0.85})
    return found


def extract_education(text: str):
    matches = DEGREE_RE.findall(text)
    education = []
    for m in DEGREE_RE.finditer(text):
        snippet = m.group(0).strip()
        year_match = re.search(r"(19|20)\d{2}", text[m.end(): m.end() + 40])
        education.append({
            "degree": snippet,
            "institution": None,  # left for a stronger NER pass to fill in
            "year": int(year_match.group(0)) if year_match else None,
        })
    return education[:5]


def extract_certifications(text: str):
    lines = text.split("\n")
    return [
        line.strip()
        for line in lines
        if any(kw in line.lower() for kw in CERT_KEYWORDS) and len(line.strip()) < 120
    ][:10]


def extract_experience_years(text: str):
    matches = [float(m) for m in EXPERIENCE_RE.findall(text)]
    return max(matches) if matches else 0


def guess_full_name(text: str):
    # Heuristic: the first non-empty line that looks like "First Last" and isn't an email/
    # phone/section header. A real NER model does this far more reliably.
    for line in text.split("\n")[:5]:
        stripped = line.strip()
        if not stripped or EMAIL_RE.search(stripped) or PHONE_RE.search(stripped):
            continue
        words = stripped.split()
        if 1 < len(words) <= 4 and all(w[0].isupper() for w in words if w[0].isalpha()):
            return stripped
    return None


def guess_current_title(text: str):
    common_titles = [
        "Software Engineer", "Senior Software Engineer", "Backend Engineer", "Frontend Engineer",
        "Full Stack Engineer", "Data Scientist", "Product Manager", "DevOps Engineer",
        "Machine Learning Engineer", "QA Engineer", "Engineering Manager",
    ]
    for title in common_titles:
        if title.lower() in text.lower():
            return title
    return None


def parse_resume_text(text: str) -> dict:
    if not text or not text.strip():
        return {
            "fullName": None, "email": None, "phone": None, "currentTitle": None,
            "totalExperienceYears": 0, "education": [], "certifications": [], "skills": [],
        }

    email_match = EMAIL_RE.search(text)
    phone_match = PHONE_RE.search(text)

    return {
        "fullName": guess_full_name(text),
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "currentTitle": guess_current_title(text),
        "totalExperienceYears": extract_experience_years(text),
        "education": extract_education(text),
        "certifications": extract_certifications(text),
        "skills": extract_skills(text),
    }
