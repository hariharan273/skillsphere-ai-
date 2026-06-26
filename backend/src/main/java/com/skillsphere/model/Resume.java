package com.skillsphere.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.Objects;

@Entity
@Table(name = "resumes")
@Getter
@Setter
@NoArgsConstructor
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    private String fileName;
    private String fileType;
    
    @Lob
    @Column(columnDefinition = "BLOB")
    private byte[] data;

    @Column(columnDefinition = "TEXT")
    private String parsedText; // Extracted text using resume parsing logic

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Resume resume = (Resume) o;
        return id != null && id.equals(resume.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
