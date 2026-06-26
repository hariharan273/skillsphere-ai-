package com.skillsphere.controller;

import com.skillsphere.dto.response.IntelligenceResponse;
import com.skillsphere.model.Profile;
import com.skillsphere.model.Resume;
import com.skillsphere.model.Skill;
import com.skillsphere.repository.ProfileRepository;
import com.skillsphere.repository.ResumeRepository;
import com.skillsphere.repository.SkillRepository;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.io.*;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/intelligence")
public class IntelligenceController {

    // ─── Role → Required Skills (must match ResumeController's list) ─────────────
    private static final Map<String, List<String>> ROLE_REQUIREMENTS = new LinkedHashMap<>();
    static {
        ROLE_REQUIREMENTS.put("Full Stack Developer",
            Arrays.asList("React", "Node.js", "JavaScript", "TypeScript", "HTML", "CSS", "MongoDB", "SQL", "Git", "REST", "Docker"));
        ROLE_REQUIREMENTS.put("Backend Developer",
            Arrays.asList("Java", "Spring Boot", "SQL", "MySQL", "PostgreSQL", "REST", "Docker", "Git", "Microservices", "Redis"));
        ROLE_REQUIREMENTS.put("Frontend Developer",
            Arrays.asList("React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Git", "Figma", "Next.js", "Vue"));
        ROLE_REQUIREMENTS.put("Data Scientist",
            Arrays.asList("Python", "Machine Learning", "Deep Learning", "Pandas", "NumPy", "TensorFlow", "SQL", "Spark", "R", "Hadoop"));
        ROLE_REQUIREMENTS.put("DevOps Engineer",
            Arrays.asList("Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "Jenkins", "Linux", "Bash", "Git", "Azure"));
        ROLE_REQUIREMENTS.put("Android Developer",
            Arrays.asList("Kotlin", "Java", "Git", "SQL", "REST", "Gradle"));
        ROLE_REQUIREMENTS.put("Cloud Engineer",
            Arrays.asList("AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes", "Linux", "Python", "CI/CD"));
        ROLE_REQUIREMENTS.put("ML Engineer",
            Arrays.asList("Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Docker", "Kubernetes", "SQL", "Spark"));
    }

    // ─── All trackable skills ─────────────────────────────────────────────────────
    private static final List<String> ALL_SKILLS = Arrays.asList(
        "Java", "Python", "JavaScript", "TypeScript", "Kotlin", "Go", "Rust", "Swift",
        "C", "C++", "C#", "Ruby", "PHP", "Scala", "R",
        "React", "Angular", "Vue", "Next.js", "Svelte", "jQuery",
        "Spring Boot", "Spring", "Django", "Flask", "FastAPI", "Express", "Node.js",
        "HTML", "CSS", "Sass", "Tailwind", "Bootstrap",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "SQLite", "Oracle",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Ansible",
        "Git", "GitHub", "GitLab", "Bitbucket", "CI/CD", "Jenkins",
        "REST", "GraphQL", "gRPC", "WebSocket", "Microservices",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
        "Hadoop", "Spark", "Kafka", "Elasticsearch",
        "Linux", "Bash", "PowerShell",
        "Figma", "Photoshop", "UI/UX",
        "Agile", "Scrum", "Jira", "Gradle"
    );

    // ─── Specific learning guidance per skill ─────────────────────────────────────
    private static final Map<String, String> SKILL_GUIDANCE = new LinkedHashMap<>();
    static {
        SKILL_GUIDANCE.put("Docker", "Learn Docker: containerize your existing projects — write a Dockerfile, build an image, and push to Docker Hub.");
        SKILL_GUIDANCE.put("Kubernetes", "Learn Kubernetes: deploy a multi-container app on Minikube locally. Practice Deployments, Services, and ConfigMaps.");
        SKILL_GUIDANCE.put("AWS", "Get hands-on with AWS Free Tier — set up EC2, S3, Lambda, and IAM. Target the AWS Cloud Practitioner certification.");
        SKILL_GUIDANCE.put("Azure", "Explore Microsoft Azure — complete the AZ-900 Fundamentals free course on Microsoft Learn.");
        SKILL_GUIDANCE.put("GCP", "Try Google Cloud Platform — deploy a containerized app using Cloud Run with a free-tier account.");
        SKILL_GUIDANCE.put("Terraform", "Learn Terraform: write IaC to provision cloud resources. Practice with a simple VPC + EC2 on AWS.");
        SKILL_GUIDANCE.put("CI/CD", "Set up a GitHub Actions pipeline for one of your projects — auto-build, test, and deploy on every commit.");
        SKILL_GUIDANCE.put("Jenkins", "Install Jenkins locally and build a pipeline for a Maven or Node.js project. Learn Jenkinsfile syntax.");
        SKILL_GUIDANCE.put("TypeScript", "Add TypeScript to your JavaScript projects. Start by typing a small React component — it catches bugs at compile time.");
        SKILL_GUIDANCE.put("Machine Learning", "Start ML with Scikit-learn: train a classifier on the Iris or Titanic dataset. Then explore Kaggle beginner competitions.");
        SKILL_GUIDANCE.put("TensorFlow", "Build a digit recognition model using TensorFlow/Keras on the MNIST dataset. Follow the official TensorFlow tutorials.");
        SKILL_GUIDANCE.put("PyTorch", "Learn PyTorch fundamentals: tensors, autograd, and a simple neural network. The fast.ai course is an excellent starting point.");
        SKILL_GUIDANCE.put("GraphQL", "Replace a REST endpoint with GraphQL using Apollo Server. Build a schema, resolvers, and test with GraphQL Playground.");
        SKILL_GUIDANCE.put("Redis", "Add Redis caching to your backend — cache a slow DB query and measure the response time improvement.");
        SKILL_GUIDANCE.put("PostgreSQL", "Master PostgreSQL: learn indexes, transactions, JSON columns, and EXPLAIN ANALYZE for query optimization.");
        SKILL_GUIDANCE.put("MySQL", "Strengthen MySQL skills: practice complex JOINs, stored procedures, and indexing strategies on a real dataset.");
        SKILL_GUIDANCE.put("MongoDB", "Build a Node.js + MongoDB REST API. Learn schema design, aggregation pipelines, and Atlas cloud deployment.");
        SKILL_GUIDANCE.put("Kafka", "Set up Apache Kafka locally: build a producer-consumer app. Understand topics, partitions, and consumer groups.");
        SKILL_GUIDANCE.put("Spark", "Run Apache Spark locally in Python: process a CSV dataset using DataFrames and practice SQL queries in Spark.");
        SKILL_GUIDANCE.put("Next.js", "Build a full-stack app with Next.js: use SSR for dynamic pages and API routes for your backend logic.");
        SKILL_GUIDANCE.put("Vue", "Build a CRUD app using Vue 3 and the Composition API. Compare it to React to understand the reactivity model.");
        SKILL_GUIDANCE.put("Figma", "Learn Figma basics: create wireframes and a component library for a personal project before coding it.");
        SKILL_GUIDANCE.put("Microservices", "Refactor a monolith: split it into 2–3 services communicating over REST or message queues. Deploy each in Docker.");
        SKILL_GUIDANCE.put("Linux", "Strengthen Linux skills: practice file system navigation, process management, cron jobs, and shell scripting.");
        SKILL_GUIDANCE.put("Bash", "Write Bash scripts to automate repetitive tasks — file processing, log monitoring, or CI steps.");
        SKILL_GUIDANCE.put("Kotlin", "Learn Kotlin: build a simple Android app or a Spring Boot Kotlin REST API to experience its concise syntax.");
        SKILL_GUIDANCE.put("Spring Boot", "Build a full REST API with Spring Boot: authentication with JWT, JPA for DB, and Swagger for API docs.");
        SKILL_GUIDANCE.put("React", "Deepen React skills: learn useContext, useReducer, and React Query for server state. Build a real-world project.");
        SKILL_GUIDANCE.put("Python", "Strengthen Python: build a CLI tool, REST API with FastAPI, or a data pipeline with Pandas and SQLAlchemy.");
        SKILL_GUIDANCE.put("SQL", "Practice advanced SQL: window functions, CTEs, subqueries, and query optimization on platforms like LeetCode or Mode Analytics.");
        SKILL_GUIDANCE.put("Git", "Deepen Git skills: learn rebase, cherry-pick, and stash. Practice resolving merge conflicts on a team project.");
        SKILL_GUIDANCE.put("REST", "Build a well-documented REST API following OpenAPI spec. Add versioning, pagination, and error handling best practices.");
        SKILL_GUIDANCE.put("Tailwind", "Add Tailwind CSS to a project: build a responsive UI using utility classes and learn to customize the config.");
        SKILL_GUIDANCE.put("Pandas", "Use Pandas to clean and analyze a real dataset from Kaggle. Practice groupby, merge, and pivot operations.");
        SKILL_GUIDANCE.put("NumPy", "Learn NumPy: practice array operations, broadcasting, and linear algebra — these underpin all ML libraries.");
        SKILL_GUIDANCE.put("Gradle", "Learn Gradle build scripts: configure tasks, manage dependencies, and set up a multi-module project.");
    }

    @Autowired private ProfileRepository profileRepository;
    @Autowired private SkillRepository skillRepository;
    @Autowired private ResumeRepository resumeRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        Long userId = userDetails.getId();

        // ── 1. Get skills saved to user (extracted during resume upload) ──
        List<String> savedSkillNames = skillRepository.findByUsersId(userId)
                .stream().map(Skill::getName).collect(Collectors.toList());
        Set<String> userSkills = new LinkedHashSet<>(savedSkillNames);

        // ── 2. If resume exists, re-parse its text to ensure freshest skills ──
        boolean hasResume = false;
        String resumeFileName = null;
        List<Map<String, Object>> resumeProjects = new ArrayList<>();
        List<String> resumeLinks = new ArrayList<>();

        Optional<Resume> resumeOpt = resumeRepository.findByUserId(userId);
        if (resumeOpt.isPresent() && resumeOpt.get().getParsedText() != null) {
            hasResume = true;
            Resume resume = resumeOpt.get();
            resumeFileName = resume.getFileName();
            String parsedText = resume.getParsedText();

            // Extract fresh skills from stored parsed text
            Set<String> freshSkills = extractSkillsFromText(parsedText);
            userSkills.addAll(freshSkills);

            // Extract projects from stored parsed text
            resumeProjects = extractProjects(parsedText, userSkills);

            // Extract links from stored parsed text
            resumeLinks = extractLinks(parsedText);
        }

        // ── 3. CGPA bonus ──
        double cgpaBonus = 0;
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isPresent() && profileOpt.get().getCgpa() != null) {
            double cgpa = profileOpt.get().getCgpa();
            cgpaBonus = cgpa >= 8.5 ? 5.0 : cgpa >= 7.5 ? 3.0 : cgpa >= 6.5 ? 1.0 : 0.0;
        }

        // ── 4. Score all roles against user's actual skills ──
        Set<String> lowerUserSkills = userSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());
        Map<String, Double> roleScores = new LinkedHashMap<>();
        String bestRole = "Full Stack Developer";
        double bestScore = 0;

        for (Map.Entry<String, List<String>> entry : ROLE_REQUIREMENTS.entrySet()) {
            String role = entry.getKey();
            List<String> required = entry.getValue();
            long matched = required.stream()
                    .filter(r -> lowerUserSkills.contains(r.toLowerCase()))
                    .count();
            double score = Math.min(100, ((double) matched / required.size()) * 100 + cgpaBonus);
            score = Math.round(score * 10.0) / 10.0;
            roleScores.put(role, score);
            if (score > bestScore) {
                bestScore = score;
                bestRole = role;
            }
        }

        // ── 5. Matching & missing skills for best role ──
        List<String> required = ROLE_REQUIREMENTS.get(bestRole);
        List<String> matchingSkills = required.stream()
                .filter(r -> lowerUserSkills.contains(r.toLowerCase()))
                .collect(Collectors.toList());
        List<String> missingSkills = required.stream()
                .filter(r -> !lowerUserSkills.contains(r.toLowerCase()))
                .collect(Collectors.toList());

        double readiness = Math.round(bestScore * 10.0) / 10.0;
        double gap = Math.round((100 - readiness) * 10.0) / 10.0;

        // ── 6. Build specific, resume-aware learning roadmap ──
        List<String> roadmap = buildRoadmap(missingSkills, bestRole, resumeProjects, hasResume);

        // ── 7. All role scores for chart ──
        Map<String, Double> allRoleScores = new LinkedHashMap<>();
        roleScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .forEach(e -> allRoleScores.put(e.getKey(), e.getValue()));

        IntelligenceResponse response = new IntelligenceResponse(
                bestRole, readiness, gap,
                matchingSkills, missingSkills,
                allRoleScores, roadmap,
                resumeProjects, resumeLinks,
                resumeFileName, hasResume
        );
        return ResponseEntity.ok(response);
    }

    // ─── Text parsing helpers (mirrors ResumeController) ─────────────────────────

    private Set<String> extractSkillsFromText(String text) {
        Set<String> found = new LinkedHashSet<>();
        String lower = text.toLowerCase();
        for (String skill : ALL_SKILLS) {
            String pattern = "(?<![a-zA-Z0-9\\-\\.])" + Pattern.quote(skill.toLowerCase()) + "(?![a-zA-Z0-9\\-\\.])";
            if (Pattern.compile(pattern).matcher(lower).find()) {
                found.add(skill);
            }
        }
        return found;
    }

    private List<String> extractLinks(String text) {
        List<String> links = new ArrayList<>();
        Pattern urlPattern = Pattern.compile(
            "(https?://[\\w\\-\\.]+(?:/[\\w\\-\\./\\?=%&#+]*)?|www\\.[\\w\\-\\.]+(?:/[\\w\\-\\./\\?=%&#+]*)?|github\\.com/[\\w\\-\\./@]+|linkedin\\.com/in/[\\w\\-]+)",
            Pattern.CASE_INSENSITIVE
        );
        Matcher m = urlPattern.matcher(text);
        Set<String> seen = new LinkedHashSet<>();
        while (m.find()) {
            String url = m.group().trim().replaceAll("[,;\\)\\]>]+$", "");
            if (!url.isEmpty() && !seen.contains(url)) {
                seen.add(url);
                if (!url.startsWith("http")) url = "https://" + url;
                links.add(url);
            }
        }
        return links;
    }

    private List<Map<String, Object>> extractProjects(String text, Set<String> allSkills) {
        List<Map<String, Object>> projects = new ArrayList<>();
        Pattern sectionPattern = Pattern.compile(
            "(?i)(projects?|personal projects?|academic projects?)[:\\s]*([\\s\\S]*?)(?=(?i)(experience|education|skills?|certif|languages?|awards?|interests?|references?|$))",
            Pattern.CASE_INSENSITIVE
        );
        Matcher sectionMatcher = sectionPattern.matcher(text);
        String projectSection = "";
        if (sectionMatcher.find()) projectSection = sectionMatcher.group(2);

        if (!projectSection.trim().isEmpty()) {
            String[] rawProjects = projectSection.split(
                "(?m)(?=^\\s*[•●▪▸►\\-\\*]|^\\s*\\d+[.)]\\s|^\\s*[A-Z][A-Za-z\\s]+[:\\|])"
            );
            for (String raw : rawProjects) {
                raw = raw.replaceAll("^[•●▪▸►\\-\\*\\d.)\\s]+", "").trim();
                if (raw.length() < 10) continue;
                String[] lines = raw.split("[\n\r]+");
                String title = lines[0].replaceAll("[:\\|].*", "").trim();
                if (title.length() < 3 || title.length() > 120) continue;

                StringBuilder desc = new StringBuilder();
                for (int i = 1; i < lines.length; i++) {
                    String l = lines[i].trim();
                    if (!l.isEmpty()) desc.append(l).append(" ");
                }

                List<String> techUsed = new ArrayList<>();
                String lowerRaw = raw.toLowerCase();
                for (String skill : allSkills) {
                    if (lowerRaw.contains(skill.toLowerCase())) techUsed.add(skill);
                }
                List<String> projLinks = extractLinks(raw);

                Map<String, Object> proj = new LinkedHashMap<>();
                proj.put("title", title);
                proj.put("description", desc.toString().trim());
                proj.put("techUsed", techUsed);
                proj.put("links", projLinks);
                projects.add(proj);
                if (projects.size() >= 8) break;
            }
        }
        return projects;
    }

    // ─── Specific, resume-aware roadmap ──────────────────────────────────────────

    private List<String> buildRoadmap(List<String> missingSkills, String role,
                                      List<Map<String, Object>> projects, boolean hasResume) {
        List<String> roadmap = new ArrayList<>();

        if (!hasResume) {
            roadmap.add("Upload your resume first — the AI will extract your real skills and generate a personalized plan.");
            roadmap.add("After uploading, come back here for a role-specific, skill-by-skill learning roadmap.");
            return roadmap;
        }

        // Add skill-specific guidance for each gap
        for (String skill : missingSkills) {
            String tip = SKILL_GUIDANCE.get(skill);
            if (tip != null) {
                roadmap.add(tip);
            } else {
                roadmap.add("Study " + skill + ": find a project-based course, build something small with it, and add it to your portfolio.");
            }
            if (roadmap.size() >= 6) break;
        }

        // If all skills covered
        if (roadmap.isEmpty()) {
            roadmap.add("You have full skill coverage for " + role + "! Focus on system design — practice designing scalable architectures on Excalidraw.");
            roadmap.add("Contribute to open-source projects on GitHub in your stack to build real-world credibility.");
            roadmap.add("Target advanced certifications relevant to " + role + " (e.g., AWS Solutions Architect, CKA for Kubernetes).");
        }

        // Append project-based tips based on what projects they have
        if (projects.isEmpty() && hasResume) {
            roadmap.add("No projects were detected in your resume — add at least 2–3 substantial projects with GitHub links to stand out to recruiters.");
        } else if (projects.size() < 3) {
            roadmap.add("Expand your portfolio: you have " + projects.size() + " project(s) detected. Aim for 3–5 with live demos and GitHub repos.");
        }

        return roadmap;
    }
}
