"""
Small seed skills taxonomy used for extraction — docs/01-technical-architecture.md §1.3
("Skill Extraction Engine"). In production this is swapped for (or merged with) O*NET /
ESCO skills classifications, per docs/08-development-roadmap.md's suggested datasets.
Kept intentionally small and dependency-free here so resume parsing works out of the box
without downloading any external model.
"""

TECHNICAL_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "FastAPI", "Django", "Flask",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "GraphQL", "REST",
    "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD", "Git",
    "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Machine Learning",
    "Spark", "Hadoop", "Kafka", "Airflow",
]

CLOUD_SKILLS = ["AWS", "Azure", "GCP", "Google Cloud", "Supabase", "Vercel", "Cloudflare"]

SOFT_SKILLS = ["Leadership", "Communication", "Teamwork", "Mentoring", "Stakeholder Management", "Problem Solving"]

DOMAIN_SKILLS = ["Healthcare", "Fintech", "Banking", "E-commerce", "Manufacturing", "Insurance", "Logistics", "EdTech"]

ALL_SKILLS = {
    **{s: "technical" for s in TECHNICAL_SKILLS},
    **{s: "cloud" for s in CLOUD_SKILLS},
    **{s: "soft" for s in SOFT_SKILLS},
    **{s: "domain" for s in DOMAIN_SKILLS},
}
