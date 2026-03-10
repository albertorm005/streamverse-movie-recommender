package com.tfg.recomendador.recomendador.repository;

import com.tfg.recomendador.recomendador.model.Pelicula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PeliculaRepository extends JpaRepository<Pelicula, Integer> {
}