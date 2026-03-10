package com.tfg.recomendador.recomendador.repository;

import com.tfg.recomendador.recomendador.model.Preferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PreferenciaRepository extends JpaRepository<Preferencia, Long> {
    List<Preferencia> findByUsuarioIdUsuario(Integer usuarioId);
}