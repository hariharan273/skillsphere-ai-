package com.skillsphere.controller;

import com.skillsphere.model.Skill;
import com.skillsphere.model.User;
import com.skillsphere.model.Resume;
import com.skillsphere.repository.SkillRepository;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.repository.ResumeRepository;
import com.skillsphere.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@RestController
@RequestMapping("/api/resumes")
@Transactional
public class ResumeController {

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    // ─── Known Tech Skills ──────────────────────────────────────────────────────
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
        "Agile", "Scrum", "Jira"
    );

    // ─── Role → Required Skills ──────────────────────────────────────────────────
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
            Arrays.asList("Kotlin", "Java", "Android", "Git", "SQL", "Firebase", "REST", "Gradle", "Jetpack Compose"));
        ROLE_REQUIREMENTS.put("Cloud Engineer",
            Arrays.asList("AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes", "Linux", "Python", "CI/CD"));
        ROLE_REQUIREMENTS.put("ML Engineer",
            Arrays.asList("Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Docker", "Kubernetes", "SQL", "Spark"));
    }

    // ─── Upload & Analyze ────────────────────────────────────────────────────────
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        try {
            UserDetailsImpl ud = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User user = userRepository.findById(ud.getId()).orElseThrow(() -> new RuntimeException("User not found"));

            // 1. Save raw resume
            Resume resume = resumeRepository.findByUserId(user.getId()).orElse(new Resume());
            resume.setUser(user);
            resume.setFileName(file.getOriginalFilename());
            resume.setFileType(file.getContentType());
            resume.setData(file.getBytes());

            // 2. Extract plain text from file
            String rawText = extractText(file);
            resume.setParsedText(rawText);
            resumeRepository.save(resume);

            // 3. Extract skills present in resume
            Set<String> extractedSkills = extractSkills(rawText);

            // 4. Extract links present in resume
            List<String> extractedLinks = extractLinks(rawText);

            // 5. Extract projects from resume
            List<Map<String, Object>> projects = extractProjects(rawText, extractedSkills);

            // 6. Best role match + score + gap
            String bestRole = bestMatchRole(extractedSkills);
            List<String> roleRequired = ROLE_REQUIREMENTS.get(bestRole);
            List<String> missingSkills = roleRequired.stream()
                .filter(s -> extractedSkills.stream().noneMatch(e -> e.equalsIgnoreCase(s)))
                .collect(Collectors.toList());
            double score = roleRequired.isEmpty() ? 0 :
                Math.round(((double)(roleRequired.size() - missingSkills.size()) / roleRequired.size()) * 1000.0) / 10.0;

            // 7. Save extracted skills to user profile
            for (String skillName : extractedSkills) {
                Skill skill = skillRepository.findByName(skillName).orElseGet(() -> {
                    Skill s = new Skill();
                    s.setName(skillName);
                    s.setCategory("Extracted");
                    return skillRepository.save(s);
                });
                if (!skill.getUsers().contains(user)) {
                    skill.getUsers().add(user);
                    skillRepository.save(skill);
                }
            }

            // 8. Build learning roadmap from missing skills
            List<String> roadmap = buildRoadmap(missingSkills, bestRole);

            // 9. Build response
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("fileName", file.getOriginalFilename());
            result.put("extractedSkills", new ArrayList<>(extractedSkills));
            result.put("missingSkills", missingSkills);
            result.put("placementScore", score);
            result.put("bestMatchRole", bestRole);
            result.put("projects", projects);
            result.put("links", extractedLinks);
            result.put("learningRoadmap", roadmap);
            result.put("message", "Resume analyzed successfully");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // ─── Text Extraction ─────────────────────────────────────────────────────────

    private String extractText(MultipartFile file) throws IOException {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        byte[] bytes = file.getBytes();

        if (name.endsWith(".docx")) {
            return extractDocxText(bytes);
        } else {
            // PDF or TXT — scan raw bytes for ASCII text segments
            return extractRawText(bytes);
        }
    }

    /** Extract text from DOCX (ZIP of XML files) */
    private String extractDocxText(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                // word/document.xml contains the main body text
                if (entry.getName().startsWith("word/") && entry.getName().endsWith(".xml")) {
                    byte[] xmlBytes = zis.readAllBytes();
                    String xml = new String(xmlBytes, StandardCharsets.UTF_8);
                    // Strip XML tags, keep text
                    String text = xml.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ");
                    sb.append(text).append("\n");
                }
                zis.closeEntry();
            }
        } catch (Exception e) {
            // Fallback to raw
        }
        String result = sb.toString().trim();
        return result.isEmpty() ? extractRawText(bytes) : result;
    }

    /** Scan raw bytes for readable ASCII text (works for PDFs that embed plain text) */
    private String extractRawText(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        int run = 0;
        StringBuilder word = new StringBuilder();
        for (byte b : bytes) {
            char c = (char)(b & 0xFF);
            if ((c >= 32 && c < 127) || c == '\n' || c == '\r' || c == '\t') {
                word.append(c);
                run++;
            } else {
                if (run >= 4) {
                    sb.append(word).append(" ");
                }
                word.setLength(0);
                run = 0;
            }
        }
        if (run >= 4) sb.append(word);
        return sb.toString().replaceAll("\\s+", " ").trim();
    }

    // ─── Skill Extraction ────────────────────────────────────────────────────────

    private Set<String> extractSkills(String text) {
        Set<String> found = new LinkedHashSet<>();
        String lower = text.toLowerCase();
        for (String skill : ALL_SKILLS) {
            // Match whole-word, case-insensitive
            String pattern = "(?<![a-zA-Z0-9\\-\\.])" + Pattern.quote(skill.toLowerCase()) + "(?![a-zA-Z0-9\\-\\.])";
            if (Pattern.compile(pattern).matcher(lower).find()) {
                found.add(skill);
            }
        }
        return found;
    }

    // ─── Link Extraction ─────────────────────────────────────────────────────────

    private List<String> extractLinks(String text) {
        List<String> links = new ArrayList<>();
        // Match URLs
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
                // Normalize — add https:// if missing
                if (!url.startsWith("http")) url = "https://" + url;
                links.add(url);
            }
        }
        return links;
    }

    // ─── Project Extraction ──────────────────────────────────────────────────────

    private List<Map<String, Object>> extractProjects(String text, Set<String> allSkills) {
        List<Map<String, Object>> projects = new ArrayList<>();

        // Find project section — look for common headers
        Pattern sectionPattern = Pattern.compile(
            "(?i)(projects?|personal projects?|academic projects?|work projects?)[:\\s]*([\\s\\S]*?)(?=(?i)(experience|education|skills?|certif|languages?|awards?|interests?|references?|$))",
            Pattern.CASE_INSENSITIVE
        );
        Matcher sectionMatcher = sectionPattern.matcher(text);
        String projectSection = "";
        if (sectionMatcher.find()) {
            projectSection = sectionMatcher.group(2);
        }

        if (!projectSection.trim().isEmpty()) {
            // Split by bullet patterns, numbered items, or lines with ALL CAPS / Title Case
            String[] rawProjects = projectSection.split(
                "(?m)(?=^\\s*[•●▪▸►\\-\\*]|^\\s*\\d+[.)]\\s|^\\s*[A-Z][A-Za-z\\s]+[:\\|])"
            );
            for (String raw : rawProjects) {
                raw = raw.replaceAll("^[•●▪▸►\\-\\*\\d.)\s]+", "").trim();
                if (raw.length() < 10) continue;

                // First line = title
                String[] lines = raw.split("[\n\r]+");
                String title = lines[0].replaceAll("[:\\|].*", "").trim();
                if (title.length() < 3 || title.length() > 120) continue;

                StringBuilder desc = new StringBuilder();
                for (int i = 1; i < lines.length; i++) {
                    String l = lines[i].trim();
                    if (!l.isEmpty()) desc.append(l).append(" ");
                }

                // Extract tech used in this project snippet
                List<String> techUsed = new ArrayList<>();
                String lowerRaw = raw.toLowerCase();
                for (String skill : allSkills) {
                    if (lowerRaw.contains(skill.toLowerCase())) {
                        techUsed.add(skill);
                    }
                }

                // Extract links in this project snippet
                List<String> projLinks = extractLinks(raw);

                Map<String, Object> proj = new LinkedHashMap<>();
                proj.put("title", title);
                proj.put("description", desc.toString().trim());
                proj.put("techUsed", techUsed);
                proj.put("links", projLinks);
                projects.add(proj);

                if (projects.size() >= 8) break; // Cap at 8 projects
            }
        }

        return projects;
    }

    // ─── Role Matching ───────────────────────────────────────────────────────────

    private String bestMatchRole(Set<String> extractedSkills) {
        String best = "Software Engineer";
        int bestScore = 0;
        Set<String> lowerExtracted = extractedSkills.stream().map(String::toLowerCase).collect(Collectors.toSet());

        for (Map.Entry<String, List<String>> entry : ROLE_REQUIREMENTS.entrySet()) {
            long match = entry.getValue().stream()
                .filter(r -> lowerExtracted.contains(r.toLowerCase()))
                .count();
            if (match > bestScore) {
                bestScore = (int) match;
                best = entry.getKey();
            }
        }
        return best;
    }

    // ─── Roadmap Builder ─────────────────────────────────────────────────────────

    private List<String> buildRoadmap(List<String> missingSkills, String role) {
        List<String> roadmap = new ArrayList<>();
        Map<String, String> tips = new LinkedHashMap<>();
        tips.put("Docker", "Learn Docker containerization — build and run your first container image");
        tips.put("Kubernetes", "Explore Kubernetes — deploy a multi-container app on a local cluster (Minikube)");
        tips.put("AWS", "Get started with AWS — create EC2, S3, and Lambda from the console");
        tips.put("Azure", "Explore Microsoft Azure — complete the AZ-900 fundamentals course");
        tips.put("GCP", "Try Google Cloud Platform — deploy an app with Cloud Run");
        tips.put("Terraform", "Learn Infrastructure as Code with Terraform — provision cloud resources declaratively");
        tips.put("CI/CD", "Set up a CI/CD pipeline using GitHub Actions or Jenkins");
        tips.put("TypeScript", "Add TypeScript to your JavaScript projects for better type safety");
        tips.put("Machine Learning", "Start machine learning with Scikit-learn and build your first classifier");
        tips.put("TensorFlow", "Build a neural network with TensorFlow/Keras on a real dataset");
        tips.put("PyTorch", "Learn PyTorch for dynamic computation graphs and research-oriented ML");
        tips.put("GraphQL", "Replace REST with GraphQL — build a schema and test with Apollo");
        tips.put("Redis", "Add Redis caching to your backend to improve API response times");
        tips.put("PostgreSQL", "Master PostgreSQL — indexes, transactions, and advanced query optimization");
        tips.put("Kafka", "Learn Apache Kafka for event-driven, high-throughput data streaming");
        tips.put("Spark", "Explore Apache Spark for large-scale distributed data processing");
        tips.put("Next.js", "Build a production-grade app with Next.js including SSR and API routes");
        tips.put("Figma", "Learn Figma to design and prototype UIs before coding");
        tips.put("Microservices", "Refactor a monolith into microservices — practice inter-service communication");
        tips.put("Linux", "Strengthen Linux skills — file system, process management, shell scripting");
        tips.put("Bash", "Write Bash scripts to automate repetitive server-side tasks");

        for (String missing : missingSkills) {
            String tip = tips.get(missing);
            if (tip != null) {
                roadmap.add(tip);
            } else {
                roadmap.add("Study " + missing + " and apply it in a personal project to build hands-on experience");
            }
            if (roadmap.size() >= 6) break;
        }

        if (roadmap.isEmpty()) {
            roadmap.add("You have strong coverage for " + role + "! Focus on system design and portfolio projects.");
            roadmap.add("Consider contributing to open-source projects to build credibility.");
        }
        return roadmap;
    }
}
