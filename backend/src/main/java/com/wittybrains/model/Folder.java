package com.wittybrains.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;

@Entity
public class Folder {

    @Id
    @GenericGenerator(name = "uuid", strategy = "uuid2")
    private String id = java.util.UUID.randomUUID().toString();
    private String name;
    private String parentId;
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
