package com.tfg.recomendador.recomendador.repository;

import com.tfg.recomendador.recomendador.model.Opinion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OpinionRepository extends JpaRepository<Opinion, String> {
}