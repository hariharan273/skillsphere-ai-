package com.skillsphere.controller;

import com.skillsphere.dto.response.MessageResponse;
import com.skillsphere.model.Profile;
import com.skillsphere.repository.ProfileRepository;
import com.skillsphere.repository.UserRepository;
import com.skillsphere.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        Optional<Profile> profileOpt = profileRepository.findByUserId(userDetails.getId());
        if(profileOpt.isPresent()){
            return ResponseEntity.ok(profileOpt.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody Profile updatedProfile) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        Profile profile = profileRepository.findByUserId(userDetails.getId()).orElse(new Profile());
        profile.setUser(userRepository.findById(userDetails.getId()).get());
        profile.setBio(updatedProfile.getBio());
        profile.setCgpa(updatedProfile.getCgpa());
        profile.setDegree(updatedProfile.getDegree());
        profile.setMajor(updatedProfile.getMajor());
        profile.setUniversity(updatedProfile.getUniversity());
        profile.setGraduationYear(updatedProfile.getGraduationYear());

        profileRepository.save(profile);
        return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
    }
}
