package com.skillsphere.controller;

import com.skillsphere.dto.response.MessageResponse;
import com.skillsphere.model.Skill;
import com.skillsphere.model.User;
import com.skillsphere.repository.SkillRepository;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/skills")
@Transactional
public class SkillController {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/mine")
    public ResponseEntity<?> getMySkills() {
        UserDetailsImpl ud = getCurrentUser();
        List<Skill> skills = skillRepository.findByUsersId(ud.getId());
        return ResponseEntity.ok(skills);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addSkill(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "").trim();
        String category = body.getOrDefault("category", "General").trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Skill name is required"));
        }

        UserDetailsImpl ud = getCurrentUser();
        User user = userRepository.findById(ud.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Reuse existing skill or create new
        Skill skill = skillRepository.findByName(name)
                .orElseGet(() -> {
                    Skill s = new Skill();
                    s.setName(name);
                    s.setCategory(category);
                    return skillRepository.save(s);
                });

        // Link skill to user if not already linked
        if (!skill.getUsers().contains(user)) {
            skill.getUsers().add(user);
            skillRepository.save(skill);
        }

        return ResponseEntity.ok(new MessageResponse("Skill \"" + name + "\" added successfully"));
    }

    @DeleteMapping("/{skillId}")
    public ResponseEntity<?> removeSkill(@PathVariable Long skillId) {
        UserDetailsImpl ud = getCurrentUser();
        User user = userRepository.findById(ud.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill not found"));

        skill.getUsers().remove(user);
        skillRepository.save(skill);

        return ResponseEntity.ok(new MessageResponse("Skill removed"));
    }

    private UserDetailsImpl getCurrentUser() {
        return (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
