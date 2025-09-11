package com.wittybrains.repository;

import com.wittybrains.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FolderRepository extends JpaRepository<Folder, String> {
    List<Folder> findByParentId(String parentId);
    boolean existsByNameAndParentId(String name, String parentId);
}
