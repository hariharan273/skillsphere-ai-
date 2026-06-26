package com.skillsphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IntelligenceResponse {
    private String primaryRecommendedRole;
    private double placementReadinessScore;
    private double skillGapPercentage;
    private List<String> matchingSkills;
    private List<String> missingSkills;
    private Map<String, Double> alternativeRolesAndScores;
    private List<String> learningRoadmap;
    // Resume-sourced enrichment
    private List<Map<String, Object>> resumeProjects;
    private List<String> resumeLinks;
    private String resumeFileName;
    private boolean hasResume;
}
