import mongoose from "mongoose";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { User } from "../src/models/User.js";
import { Organization } from "../src/models/Organization.js";
import { Job } from "../src/models/Job.js";
import { Candidate } from "../src/models/Candidate.js";
import { PipelineStage } from "../src/models/PipelineStage.js";
import { MatchScore } from "../src/models/MatchScore.js";
import { TalentPool } from "../src/models/TalentPool.js";

dotenv.config();

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Initialize Supabase Admin Client
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Ensure Demo User Exists in Supabase
    console.log("👤 Ensuring demo@itap.com exists in Supabase...");
    let supabaseUserId;
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    let demoUser = usersData.users.find(u => u.email === "demo@itap.com");
    if (!demoUser) {
      console.log("Creating new demo user in Supabase...");
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: "demo@itap.com",
        password: "demo@1234",
        email_confirm: true,
      });
      if (createError) throw createError;
      supabaseUserId = createData.user.id;
    } else {
      console.log("Demo user already exists in Supabase.");
      supabaseUserId = demoUser.id;
      // Ensure password is correct
      await supabase.auth.admin.updateUserById(supabaseUserId, { password: "demo@1234" });
    }

    // 2. Ensure Organization and Mongo User Exist
    console.log("🏢 Ensuring Demo Organization and User exist in MongoDB...");
    let organization = await Organization.findOne({ name: "Acme Corp" });
    if (!organization) {
      organization = await Organization.create({ name: "Acme Corp" });
    }
    const orgId = organization._id;

    let user = await User.findOne({ email: "demo@itap.com" });
    if (!user) {
      user = await User.create({
        supabaseUserId,
        organizationId: orgId,
        email: "demo@itap.com",
        fullName: "Demo Admin",
        role: "hr_admin",
      });
    } else {
      user.organizationId = orgId;
      await user.save();
    }

    console.log(`📌 Seeding data for Organization ID: ${orgId}`);

    // Clear existing demo data
    console.log("🗑️ Clearing existing jobs, candidates, pipelines, and matches...");
    await Job.deleteMany({ organizationId: orgId });
    await Candidate.deleteMany({ organizationId: orgId });
    await PipelineStage.deleteMany({ organizationId: orgId });
    await MatchScore.deleteMany({ jobId: { $exists: true } }); 

    // 3. Create Jobs (expanded 4x)
    console.log("📝 Creating Jobs...");
    const baseJobs = [
      { organizationId: orgId, title: "Senior Frontend Engineer", department: "Engineering", description: "Looking for an expert React developer.", requiredSkills: [{ name: "React", weight: 5, mustHave: true }, { name: "JavaScript", weight: 5, mustHave: true }], experienceMin: 5, experienceMax: 8, location: "Remote", employmentType: "full_time", status: "open", createdBy: user._id },
      { organizationId: orgId, title: "Product Manager", department: "Product", description: "Seeking a PM to lead our core features.", requiredSkills: [{ name: "Product Strategy", weight: 5, mustHave: true }], experienceMin: 3, experienceMax: 6, location: "New York, NY", employmentType: "full_time", status: "open", createdBy: user._id },
      { organizationId: orgId, title: "DevOps Engineer", department: "Infrastructure", description: "Help us scale.", requiredSkills: [{ name: "AWS", weight: 5, mustHave: true }], experienceMin: 4, experienceMax: 10, location: "San Francisco, CA", employmentType: "contract", status: "closed", createdBy: user._id },
      { organizationId: orgId, title: "Data Scientist", department: "Data", description: "Build our ML models.", requiredSkills: [{ name: "Python", weight: 5, mustHave: true }, { name: "Machine Learning", weight: 4, mustHave: true }], experienceMin: 3, experienceMax: 7, location: "London, UK", employmentType: "full_time", status: "open", createdBy: user._id },
      { organizationId: orgId, title: "UX Designer", department: "Design", description: "Design beautiful interfaces.", requiredSkills: [{ name: "Figma", weight: 5, mustHave: true }, { name: "UI Design", weight: 5, mustHave: true }], experienceMin: 2, experienceMax: 5, location: "Remote", employmentType: "full_time", status: "open", createdBy: user._id },
      { organizationId: orgId, title: "Backend Engineer", department: "Engineering", description: "Node.js expert needed.", requiredSkills: [{ name: "Node.js", weight: 5, mustHave: true }, { name: "MongoDB", weight: 4, mustHave: true }], experienceMin: 4, experienceMax: 9, location: "Berlin, DE", employmentType: "full_time", status: "open", createdBy: user._id },
    ];
    
    const expandedJobs = [];
    for(let i=1; i<=4; i++) {
      baseJobs.forEach(job => expandedJobs.push({ ...job, title: `${job.title} - Req ${i}` }));
    }
    const jobs = await Job.insertMany(expandedJobs);

    // 4. Create Candidates (expanded 4x)
    console.log("👥 Creating Candidates...");
    const baseCandidates = [
      { 
        organizationId: orgId, fullName: "Alice Smith", email: "alice@example.com", phone: "+1 234 567 8901", currentTitle: "Frontend Lead", totalExperienceYears: 6, 
        skills: [{ name: "React", confidence: 95 }, { name: "TypeScript", confidence: 90 }, { name: "GraphQL", confidence: 80 }, { name: "CSS/SASS", confidence: 85 }], 
        education: [{ degree: "B.S. Computer Science", institution: "Stanford University", year: 2018 }],
        certifications: ["AWS Certified Developer", "Meta Front-End Developer Professional"],
        timeline: [{ type: "applied", description: "Applied via career site", date: new Date("2023-10-01") }, { type: "interview", description: "Completed technical screen", date: new Date("2023-10-15") }],
        sourceType: "upload" 
      },
      { 
        organizationId: orgId, fullName: "Bob Johnson", email: "bob@example.com", phone: "+1 987 654 3210", currentTitle: "Software Engineer", totalExperienceYears: 3, 
        skills: [{ name: "JavaScript", confidence: 85 }, { name: "Node.js", confidence: 70 }, { name: "Express", confidence: 75 }], 
        education: [{ degree: "B.S. Software Engineering", institution: "University of Washington", year: 2021 }],
        certifications: ["Node.js Application Developer (JSNAD)"],
        timeline: [{ type: "referred", description: "Referred by internal employee", date: new Date("2023-11-05") }],
        sourceType: "referral" 
      },
      { 
        organizationId: orgId, fullName: "Charlie Brown", email: "charlie@example.com", phone: "+1 122 334 4556", currentTitle: "Senior Product Manager", totalExperienceYears: 7, 
        skills: [{ name: "Product Strategy", confidence: 95 }, { name: "Agile", confidence: 90 }, { name: "Jira", confidence: 85 }, { name: "Data Analytics", confidence: 75 }], 
        education: [{ degree: "MBA", institution: "Harvard Business School", year: 2019 }, { degree: "B.S. Economics", institution: "NYU", year: 2015 }],
        certifications: ["Certified Scrum Product Owner (CSPO)", "Pragmatic Institute Certified (PMC-III)"],
        sourceType: "upload" 
      },
      { 
        organizationId: orgId, fullName: "Diana Prince", email: "diana@example.com", phone: "+1 555 666 7777", currentTitle: "Cloud Architect", totalExperienceYears: 10, 
        skills: [{ name: "AWS", confidence: 98 }, { name: "Kubernetes", confidence: 90 }, { name: "Terraform", confidence: 85 }, { name: "Docker", confidence: 95 }], 
        education: [{ degree: "M.S. Computer Engineering", institution: "MIT", year: 2014 }],
        certifications: ["AWS Certified Solutions Architect - Professional", "CKA: Certified Kubernetes Administrator"],
        sourceType: "career_site" 
      },
      { 
        organizationId: orgId, fullName: "Eve Adams", email: "eve@example.com", phone: "+1 333 444 5555", currentTitle: "Data Scientist", totalExperienceYears: 4, 
        skills: [{ name: "Python", confidence: 95 }, { name: "Machine Learning", confidence: 85 }, { name: "SQL", confidence: 90 }, { name: "TensorFlow", confidence: 75 }], 
        education: [{ degree: "Ph.D. Statistics", institution: "UC Berkeley", year: 2022 }, { degree: "B.S. Mathematics", institution: "UCLA", year: 2017 }],
        certifications: ["Google Professional Data Engineer", "DeepLearning.AI TensorFlow Developer"],
        sourceType: "career_site" 
      },
      { 
        organizationId: orgId, fullName: "Frank Castle", email: "frank@example.com", phone: "+1 666 777 8888", currentTitle: "Senior UX Designer", totalExperienceYears: 8, 
        skills: [{ name: "Figma", confidence: 98 }, { name: "UI Design", confidence: 95 }, { name: "User Research", confidence: 85 }, { name: "Prototyping", confidence: 90 }], 
        education: [{ degree: "B.F.A. Interaction Design", institution: "Rhode Island School of Design", year: 2016 }],
        certifications: ["Nielsen Norman Group UX Certification", "Google UX Design Professional Certificate"],
        sourceType: "referral" 
      },
      { 
        organizationId: orgId, fullName: "Grace Hopper", email: "grace@example.com", phone: "+1 999 888 7777", currentTitle: "Backend Lead", totalExperienceYears: 12, 
        skills: [{ name: "Node.js", confidence: 95 }, { name: "MongoDB", confidence: 90 }, { name: "System Architecture", confidence: 85 }, { name: "Redis", confidence: 80 }], 
        education: [{ degree: "M.S. Computer Science", institution: "Carnegie Mellon University", year: 2012 }],
        certifications: ["MongoDB Certified Developer", "AWS Certified Developer - Associate"],
        sourceType: "upload" 
      },
      { 
        organizationId: orgId, fullName: "Hank Pym", email: "hank@example.com", phone: "+1 222 333 4444", currentTitle: "Junior Dev", totalExperienceYears: 1, 
        skills: [{ name: "Python", confidence: 60 }, { name: "Git", confidence: 70 }, { name: "HTML/CSS", confidence: 75 }], 
        education: [{ degree: "Coding Bootcamp", institution: "General Assembly", year: 2023 }],
        certifications: ["freeCodeCamp Responsive Web Design"],
        sourceType: "career_site" 
      },
      { 
        organizationId: orgId, fullName: "Isabel Diaz", email: "isabel@example.com", phone: "+1 777 888 9999", currentTitle: "Product Designer", totalExperienceYears: 3, 
        skills: [{ name: "Figma", confidence: 85 }, { name: "Wireframing", confidence: 80 }, { name: "CSS", confidence: 60 }], 
        education: [{ degree: "B.A. Graphic Design", institution: "Parsons School of Design", year: 2021 }],
        certifications: ["IBM Enterprise Design Thinking Practitioner"],
        sourceType: "referral" 
      },
    ];
    
    const expandedCandidates = [];
    for(let i=1; i<=4; i++) {
      baseCandidates.forEach(cand => expandedCandidates.push({ 
        ...cand, 
        fullName: `${cand.fullName} (Batch ${i})`,
        email: `batch${i}_${cand.email}` 
      }));
    }
    const candidates = await Candidate.insertMany(expandedCandidates);

    // 5 & 6. Create Pipeline Stages and Match Scores
    console.log("🔄 Creating Pipeline Stages & Match Scores...");
    const pipelineStagesToInsert = [];
    const matchScoresToInsert = [];
    const stages = ["applied", "screened", "shortlisted", "interviewing", "offer", "hired", "rejected"];

    jobs.forEach((job, jobIndex) => {
      // Pick 3 to 5 candidates for each job to simulate real pipeline density
      const numCandidates = 3 + (jobIndex % 3);
      for (let j = 0; j < numCandidates; j++) {
        const candIndex = (jobIndex * 2 + j) % candidates.length;
        const candidate = candidates[candIndex];
        
        pipelineStagesToInsert.push({
          organizationId: orgId,
          jobId: job._id,
          candidateId: candidate._id,
          stage: stages[(jobIndex + j) % stages.length],
          movedBy: user._id
        });

        const baseScore = 60 + ((jobIndex + j) % 40);
        matchScoresToInsert.push({
          organizationId: orgId,
          jobId: job._id,
          candidateId: candidate._id,
          overallScore: baseScore,
          breakdown: { skillsScore: Math.min(baseScore + 5, 100), experienceScore: Math.max(baseScore - 5, 0), educationScore: 0, domainScore: 0 },
          justification: `AI match based on required skills and experience.`
        });
      }
    });

    await PipelineStage.insertMany(pipelineStagesToInsert);
    await MatchScore.insertMany(matchScoresToInsert);

    // 7. Create Talent Pools
    console.log("🌊 Creating Talent Pools...");
    await TalentPool.deleteMany({ organizationId: orgId });
    await TalentPool.insertMany([
      { organizationId: orgId, name: "React Experts", query: "Senior frontend developers with React", parsedFilters: { skills: ["React", "TypeScript"] }, createdBy: user._id },
      { organizationId: orgId, name: "Cloud Architects", query: "AWS or Kubernetes experts", parsedFilters: { skills: ["AWS", "Kubernetes"] }, createdBy: user._id },
      { organizationId: orgId, name: "UX/UI Designers", query: "Designers who use Figma", parsedFilters: { skills: ["Figma", "UI Design"] }, createdBy: user._id },
      { organizationId: orgId, name: "Machine Learning", query: "Data scientists with ML experience", parsedFilters: { skills: ["Python", "Machine Learning"] }, createdBy: user._id }
    ]);

    console.log("🎉 Seeding complete! Check your application.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
